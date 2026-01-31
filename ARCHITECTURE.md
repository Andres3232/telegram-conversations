# ARCHITECTURE

## Contexto y objetivo
Este proyecto implementa una API para administrar conversaciones de Telegram aplicando **Arquitectura Hexagonal (Ports & Adapters)**.

Objetivos principales:
- Mantener el **dominio independiente** de frameworks, base de datos y servicios externos.
- Modelar el negocio alrededor de **Conversation** y **Message**.
- Exponer una API REST autenticada para administrar conversaciones.
- Preparar el terreno para integrar Telegram via polling (`getUpdates`) y envío (`sendMessage`).

✅ Estado actual: el proyecto ya incluye un **poller** que consume `getUpdates`, persiste mensajes entrantes y mantiene un **offset** persistido en Postgres.

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
  - `SyncTelegramUpdatesUseCase`

Características:
- Los casos de uso dependen de **puertos** (interfaces del dominio) inyectados por tokens.
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

- **Adapters de entrada (driving)**:
  - REST:
    - `AuthController`
    - `ConversationsController`
  - Guard:
    - `JwtAuthGuard`
  - Background processing:
    - `TelegramPollingService` (tarea programada que dispara sincronización)

---

## Wiring (Dependency Injection)

Se utiliza el contenedor de DI de NestJS, pero se **inyectan interfaces del dominio** usando tokens (`USER_REPOSITORY`, etc.).

Ejemplos:
- `UserRepository` (puerto) → `TypeOrmUserRepository` (adapter)
- `JwtServicePort` (puerto) → `JsonWebTokenService` (adapter)
- `LoggerService` (puerto) → `PinoLoggerService` (adapter)

Esto permite:
- tests unitarios con stubs/mocks de puertos
- reemplazar infraestructura sin tocar dominio

---

## Persistencia y relación Conversation ↔ Message

- Modelo lógico: **Conversation 1 → N Message**.
- En infraestructura se declara explícitamente la relación con TypeORM:
  - `ConversationPersistence` `@OneToMany(messages)`
  - `MessagePersistence` `@ManyToOne(conversation)` con FK `conversationId` y `onDelete: 'CASCADE'`

En dominio, la relación se representa mediante:
- `Message.conversationId`

### Idempotencia para mensajes entrantes de Telegram

Para soportar reintentos y evitar duplicados (por crash/restart del poller), la persistencia de mensajes implementa idempotencia:

- `Message` incluye opcionalmente `telegramUpdateId`.
- `MessagePersistence.telegramUpdateId` tiene un **constraint UNIQUE**.
- El adapter `TypeOrmMessageRepository.saveFromTelegramUpdate(...)` intenta insertar y, si falla por unique violation, retorna `undefined`.

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

## Manejo de errores

- Los errores esperables del negocio son `DomainError`.
- `ExceptionFilter` los traduce a HTTP 400 (por ahora) conservando:
  - `errorCode`
  - `message`
  - `data`

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

## Próximos pasos (Telegram y background processing)

### Integración Telegram (polling)
Implementado:
- Puerto `TelegramClient` (dominio)
  - `getUpdates(offset, limit, timeoutSeconds)`
  - `sendMessage(chatId, text)`
- Puerto `TelegramSyncStateRepository` (dominio)
  - persistencia del offset / cursor `lastUpdateId`
- Caso de uso `SyncTelegramUpdatesUseCase` (application)
  - consume updates
  - upsert de `Conversation` por `telegramChatId`
  - insert idempotente de `Message` con `telegramUpdateId`
  - avanza `lastUpdateId` incrementalmente
- Driving adapter `TelegramPollingService` (infra)
  - se habilita con `TELEGRAM_POLLING_ENABLED=true`
  - interval configurable `TELEGRAM_POLL_INTERVAL_MS`

### Event-driven / Kafka (bonus)
Una evolución posible:
- publicar evento `MessageReceivedEvent` al persistir un mensaje entrante
- handler que genere respuesta automática
- transporte Kafka como detail de infraestructura

---

## Trade-offs intencionales
Los trade-offs se documentan en `DECISIONS.md`.
