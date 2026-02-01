# ARCHITECTURE

## Contexto y objetivo
Este proyecto implementa una API para administrar conversaciones de Telegram aplicando **Arquitectura Hexagonal (Ports & Adapters)**.

Objetivos principales:
- Mantener el **dominio independiente** de frameworks, base de datos y servicios externos.
- Modelar el negocio alrededor de **Conversation** y **Message**.
- Exponer una API REST autenticada para administrar conversaciones.
- Preparar el terreno para integrar Telegram via polling (`getUpdates`) y envío (`sendMessage`).

✅ Estado actual: el proyecto ya incluye un **poller** que consume `getUpdates`, persiste mensajes entrantes y mantiene un **offset** persistido en Postgres.

✅ Estado actual (enero 2026): además, al persistir un mensaje entrante se publica un evento en **Kafka** (`message.received`) y un **consumer** reacciona al evento enviando un **auto-reply** (texto aleatorio) al chat.

---

## Estructura (capas)

### Dominio (`src/domain`)
Responsabilidad: reglas de negocio puras.

- **Entidades**:
  - `User`
  - `Conversation`
  - `Message`

- **Value Objects**:
  - `Email`, `Password`
  - `TelegramChatId`
  - `MessageContent`

- **Errores de dominio**:
  - `DomainError` como base
  - errores específicos (auth, conversation, etc.)

- **Puertos (interfaces)** (`src/domain/ports`):
  - `UserRepository`, `ConversationRepository`, `MessageRepository`
  - `PasswordHasher`, `JwtServicePort`
  - `ConfigurationService`
  - `LoggerService`
  - `TelegramClient` (integración con Telegram)
  - `TelegramSyncStateRepository` (persistencia del cursor/offset)

Regla clave: **el dominio no importa infraestructura**.

---

### Aplicación (`src/application`)
Responsabilidad: orquestación del negocio mediante casos de uso.

- Casos de uso existentes:
  - `RegisterUserUseCase`
  - `LoginUseCase`
  - `GetMeUseCase`
  - `ListConversationsUseCase`
  - `ListMessagesUseCase`
  - `SendMessageUseCase`
  - `SyncTelegramUpdatesUseCase`
  - `ReplyToMessageUseCase`

Características:
- Los casos de uso dependen de **puertos**
- No conocen TypeORM, controllers, ni Telegram.

---

### Infraestructura (`src/infrastructure`)
Responsabilidad: implementar detalles concretos y adaptadores.

- **Adapters de salida (driven)**:
  - Repositorios TypeORM:
    - `TypeOrmUserRepository`
    - `TypeOrmConversationRepository`
    - `TypeOrmMessageRepository`
  - `TypeOrmTelegramSyncStateRepository`
  - Auth (infra):
    - `BcryptPasswordHasher`
    - `JsonWebTokenService`
  - Config:
    - `NestConfigurationService`
  - Logging:
    - `PinoLoggerService` (adapter del puerto `LoggerService`)
  - Telegram:
    - `TelegramHttpClient` (adapter HTTP del puerto `TelegramClient`)

  - Kafka:
    - `KafkaMessageProducer` (producer KafkaJS del puerto `MessageProducer`)
    - `KafkaClientFactory` (factory centralizada para crear clientes KafkaJS con brokers + clientId)

- **Adapters de entrada (driving)**:
  - REST:
    - `AuthController`
    - `ConversationsController`
  - Guard:
    - `JwtAuthGuard`
  - Background processing:
    - `TelegramPollingService` (tarea programada que dispara sincronización)
  - `TelegramKafkaConsumerService` (consumer KafkaJS que procesa eventos del topic `telegram`)

---

## Wiring (Dependency Injection)

Se utiliza el contenedor de DI de NestJS, pero se **inyectan interfaces del dominio** (`USER_REPOSITORY`, etc.).

Ejemplos:
- `UserRepository` (puerto) → `TypeOrmUserRepository` (adapter)
- `JwtServicePort` (puerto) → `JsonWebTokenService` (adapter)
- `LoggerService` (puerto) → `PinoLoggerService` (adapter)

Esto permite:
- tests unitarios con stubs/mocks de puertos
- reemplazar infraestructura sin tocar dominio

### Wiring de Kafka (event-driven)

- `KafkaModule` (infra): registra y exporta lo genérico de Kafka.
  - `KafkaClientFactory` (creación de cliente KafkaJS)
  - `KafkaMessageProducer` (implementación del puerto `MessageProducer`)

- `TelegramConsumersModule` (feature): registra el consumer y el ruteo por evento.
  - `TelegramKafkaConsumerService` (loop de consumo)
  - `MessageReceivedHandler` (handler del evento)
  - `ReplyToMessageUseCase` (caso de uso que envía un reply a Telegram)

---

## Persistencia y relación Conversation ↔ Message

- Modelo lógico: **Conversation 1 → N Message**.
- En infraestructura se declara explícitamente la relación con TypeORM:
  - `ConversationPersistence` `@OneToMany(messages)`
  - `MessagePersistence` `@ManyToOne(conversation)` con FK `conversationId` y `onDelete: 'CASCADE'`

En dominio, la relación se representa mediante:
- `Message.conversationId`

### Mensajes salientes (OUT)

Además de persistir mensajes entrantes (`IN`) desde Telegram, la API permite enviar mensajes manualmente a una conversación existente.

- Endpoint REST: `POST /conversations/:id/messages`
- Caso de uso: `SendMessageUseCase`
  - valida que la conversación exista
  - valida que el texto no esté vacío
  - envía el mensaje a Telegram (`TelegramClient.sendMessage`)
  - persiste un `Message` con `direction = OUT`

### Idempotencia para mensajes entrantes de Telegram

Para soportar reintentos y evitar duplicados (por crash/restart del poller), la persistencia de mensajes implementa idempotencia:

- `Message` incluye opcionalmente `telegramUpdateId`.
- `MessagePersistence.telegramUpdateId` tiene un **constraint UNIQUE**.
- El adapter `TypeOrmMessageRepository.saveFromTelegramUpdate(...)` intenta insertar y, si falla por unique violation, retorna `undefined`.

Nota: `telegramUpdateId` aplica solo a mensajes entrantes (`IN`). Para mensajes salientes (`OUT`) el campo queda vacío y se persiste como `NULL`.

Esto permite reprocesar updates sin duplicar mensajes.

---

## Persistencia del offset (Telegram sync state)

Para el polling con `getUpdates`, se persiste el cursor en DB:

- Tabla `telegram_sync_state` con un único registro (`id = "bot"`).
- Campo `lastUpdateId` (bigint): último `update_id` procesado.

En la siguiente ejecución, se llama a Telegram con:
- `offset = lastUpdateId + 1`

---

## Background processing (polling)

El módulo `TelegramModule` registra:

- `TelegramPollingService`: corre periódicamente y, si `TELEGRAM_POLLING_ENABLED=true`, ejecuta el caso de uso.
- throttling configurable con `TELEGRAM_POLL_INTERVAL_MS` (ej. 2000ms).
- logs por tick (`telegram.poll.tick`) y por error (`telegram.poll.error`) vía el puerto `LoggerService`.

---

## Event-driven con Kafka (producer + consumer)

### Publicación de eventos

Cuando el poller insertó un mensaje nuevo (direction = `IN`), el caso de uso `SyncTelegramUpdatesUseCase` publica un evento:

- Evento: `MessageReceivedEvent` (topic `telegram`, `eventName = message.received`)
- Producer: `KafkaMessageProducer`

El mensaje enviado a Kafka tiene el envelope:

- `{ eventName: string, payload: object }`

### Consumo de eventos

El servicio `TelegramKafkaConsumerService`:

- se conecta a Kafka y se subscribe al topic `telegram`
- parsea el envelope JSON
- rutea por `eventName`
  - `message.received` → `MessageReceivedHandler`

El handler delega a `ReplyToMessageUseCase`, que responde al chat vía `TelegramClient.sendMessage(...)` con un texto aleatorio.

### Configuración

Variables relevantes:

- `KAFKA_BROKERS`: brokers Kafka (por ejemplo `localhost:9094` en host o `kafka:29092` dentro de docker compose)
- `KAFKA_CONSUMER_GROUP_ID`: group id del consumer
- `KAFKA_CONSUMER_ENABLED`: feature flag (`false` para deshabilitar el consumer)

---

## Manejo de errores

- Los errores esperables del negocio son `DomainError`.
- `ExceptionFilter` los traduce a HTTP 400 (por ahora) conservando:
  - `errorCode`
  - `message`
  - `data`

Ejemplos:
- `ConversationNotFoundError` → `CONVERSATION_NOT_FOUND`
- `ConversationMessageTextRequiredError` → `CONVERSATION_MESSAGE_TEXT_REQUIRED`

Esto mantiene:
- dominio consistente
- traducción a protocolo HTTP concentrada en infraestructura

---

## Observabilidad (logging)

- Logging estructurado con `nestjs-pino`.
- `PinoLoggerService` implementa el puerto de dominio `LoggerService`.
- Se redaccionan secretos (`authorization`, `cookie`, `password`, etc.).

---

## API docs (Swagger)

- Swagger está habilitado en `/api`.
- Tags principales:
  - `Auth`
  - `Conversations`

---

## Trade-offs intencionales
Los trade-offs se documentan en `DECISIONS.md`.

---

## Principios SOLID (dónde se aplican)

Esta arquitectura (Hexagonal) facilita aplicar SOLID en la práctica; abajo se listan ejemplos concretos del proyecto.

### S — Single Responsibility (Responsabilidad Única)

- **Dominio**: entidades/VOs modelan reglas (no infraestructura).
  - Ej.: `Message`, `Conversation`, VOs como `Email`, etc.
- **Aplicación**: los casos de uso orquestan un flujo de negocio puntual.
  - Ej.: `SyncTelegramUpdatesUseCase` sincroniza updates y publica evento; `ReplyToMessageUseCase` solo se encarga de responder.
- **Infraestructura**: cada adapter implementa *un* detalle técnico.
  - Ej.: `TelegramHttpClient` encapsula HTTP hacia Telegram; `KafkaMessageProducer` encapsula publicación a Kafka; repos TypeORM encapsulan persistencia.

### O — Open/Closed (Abierto/Cerrado)

El core (dominio + aplicación) está **cerrado a cambios** ante variaciones técnicas y **abierto a extensión** agregando nuevos adapters o handlers.

- Para cambiar persistencia, se crea otra implementación de `MessageRepository` / `ConversationRepository` sin tocar los casos de uso.
- Para sumar un nuevo evento Kafka, se agrega un handler y se registra en el ruteo del consumer sin reescribir el dominio.

### L — Liskov Substitution (Sustitución de Liskov)

Los casos de uso dependen de **contratos (puertos)**. Cualquier implementación que respete el contrato puede sustituirse sin romper el flujo.

- Ej.: `TelegramClient` puede ser `TelegramHttpClient` (real) o un fake/in-memory en tests.
- Ej.: `LoggerService` puede ser `PinoLoggerService` u otra implementación que mantenga el mismo comportamiento observable (mismos métodos y semántica).

### I — Interface Segregation (Segregación de interfaces)

Los puertos están divididos por propósito para evitar “interfaces gordas” y minimizar dependencias.

- Ej.: repos separados (`UserRepository`, `ConversationRepository`, `MessageRepository`) en vez de un “Repository” único.
- Ej.: capacidades específicas (`TelegramClient`, `MessageProducer`, `TelegramSyncStateRepository`) en lugar de un adapter “IntegrationsService” monolítico.

### D — Dependency Inversion (Inversión de dependencias)

El core define **abstracciones** (puertos) y la infraestructura aporta **implementaciones**, inyectadas por DI.

- Los casos de uso están en `src/application` y dependen de interfaces de `src/domain/ports`.
- El wiring en módulos de Nest conecta tokens (por ejemplo `MESSAGE_REPOSITORY`, `TELEGRAM_CLIENT`, etc.) a implementaciones concretas (TypeORM/HTTP/Kafka).

Resultado:
- dominio y aplicación no “conocen” NestJS/TypeORM/Kafka/Telegram
- reemplazo de infraestructura sin cambiar lógica de negocio
