
# Telegram Conversations (Backend Hexagonal)

Backend en **NestJS** siguiendo **Arquitectura Hexagonal** (dominio + casos de uso + adaptadores de infraestructura).

Qué hace:
- Consume mensajes de Telegram por polling vía `getUpdates` (cursor persistido en Postgres).
- Persiste conversaciones y mensajes.
- Publica eventos `message.received` en **Kafka** (topic `telegram`).
- Consume esos eventos y envía un **auto-reply** a Telegram (texto aleatorio).
- Expone una API REST (JWT) para listar conversaciones/mensajes y **enviar un mensaje a una conversación existente**.

## Requisitos

- Node.js 
- Docker + Docker Compose

## Inicio rápido

1) Levantar dependencias (Postgres + Kafka + Kafka UI):

- Ver `docker-compose.yml`.

2) Crear un archivo `.env` (o exportar variables de entorno) con al menos:

### Telegram

- `TELEGRAM_BOT_TOKEN` (requerido)

### Base de datos

- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`

### Kafka

- `KAFKA_BROKERS`
	- Si corrés la app en tu máquina (host), usá el listener del host (normalmente `localhost:9094`).
	- Si corrés la app dentro de Docker, usá el listener interno (normalmente `kafka:29092`).
- `KAFKA_CONSUMER_ENABLED` (`true|false`) para habilitar/deshabilitar el consumer de auto-reply.
- `KAFKA_CONSUMER_GROUP_ID` (opcional; un default razonable está bien).
- `SERVICE_NAME` (opcional; se usa para `clientId` de Kafka/identificación en logs).

3) Instalar dependencias:

- `npm install`

4) Ejecutar la app:

- `npm run start:dev`

## Cómo funciona

### Ingesta desde Telegram (polling)

El poller llama periódicamente a `getUpdates`, usando un cursor (`lastUpdateId`) persistido en Postgres.

Idempotencia:
- Los mensajes se guardan con un constraint **UNIQUE** sobre `telegramUpdateId`.
- Updates duplicados se ignoran de forma segura.

### Flujo event-driven (Kafka)

Cuando se persiste un mensaje nuevo, la app publica un evento:

- Topic: `telegram`
- `eventName`: `message.received`

El consumer de Kafka escucha ese topic y manda una respuesta automática (random) a Telegram.

## API REST

Swagger está generado en `docs/swagger.json`.

Los endpoints autenticados están protegidos con JWT.

### Listar conversaciones

- `GET /conversations?limit=...&offset=...`

### Listar mensajes de una conversación

- `GET /conversations/:id/messages?limit=...&offset=...`

### Enviar un mensaje a una conversación existente

- `POST /conversations/:id/messages`
- Body:
	- `text: string`
- Response:
	- `{ id: string }` (id del mensaje)

Notas:
- La conversación debe existir previamente (se crea al recibir al menos un mensaje de Telegram).
- El mensaje se envía usando `sendMessage` de Telegram y se persiste como mensaje saliente.

## Tests

- `npm test`

## Kafka UI local

Kafka UI viene incluido en `docker-compose.yml`.
Sirve para inspeccionar el topic `telegram` y verificar los eventos.

### Crear el topic (primera vez)

Dependiendo de la imagen/config de Kafka, puede que el topic no se autocree. Si al levantar por primera vez ves errores de “unknown topic or partition” o simplemente no aparece en Kafka UI, crealo manualmente.

Ejemplo (desde la carpeta del repo):

```zsh
docker compose exec kafka kafka-topics \
	--bootstrap-server kafka:29092 \
	--create \
	--if-not-exists \
	--topic telegram \
	--partitions 1 \
	--replication-factor 1
```

## Documentación

- `ARCHITECTURE.md`: overview de arquitectura
- `DECISIONS.md`: decisiones y trade-offs

