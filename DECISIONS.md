# DECISIONS

Este documento registra trade-offs (decisiones con pros/contras) tomados durante el desarrollo.

---

## 1) Auth con JWT propio (puerto `JwtServicePort`) en vez de `@nestjs/jwt`

**Decisión:** implementar `JwtServicePort` en dominio y una implementación concreta `JsonWebTokenService` (infra) usando `jsonwebtoken`.

**Por qué:**
- Mantener el dominio y los casos de uso independientes de Nest.
- Poder reemplazar el mecanismo de tokens sin tocar el core.

**Consecuencias / costo:**
- Hay más wiring manual que usando el módulo oficial de Nest.
- Se deben cuidar detalles como expiración, secret management y errores.

---

## 2) `TelegramChatId` como string (no number)

**Decisión:** representar `TelegramChatId` como `string` dentro del dominio.

**Por qué:**
- Los `chat_id` pueden ser números grandes (y también negativos). En JS/TS, `number` tiene limitaciones de precisión.
- Evita bugs difíciles al serializar/parsear.

**Consecuencias / costo:**
- Hay que convertir a string en algunas capas.
- Algunas validaciones se implementan manualmente (regex).

---

## 3) Relationship en dominio por ID, relación ORM sólo en infraestructura

**Decisión:** en dominio, `Message` referencia a `Conversation` vía `conversationId` (string). En infraestructura, se declara la relación ORM (`@ManyToOne`, `@OneToMany`) para FK y borrado en cascada.

**Por qué:**
- El dominio sigue limpio (sin colecciones pesadas, sin lazy-loading, sin acoplamientos a ORM).
- Infra puede asegurar integridad referencial en DB.

**Consecuencias / costo:**
- Hay que hacer consultas explícitas para obtener mensajes por conversación.
- No se aprovechan todas las features de navegación del ORM en el dominio (intencional).

---

## 4) Polling con `getUpdates` (implementado) en vez de Webhooks

**Decisión:** usar polling con `getUpdates`.

**Por qué:**
- Simplifica desarrollo local: no requiere exponer un endpoint público ni configurar certificados.
- Reduce fricción para el challenge.

**Consecuencias / costo:**
- Se debe manejar `offset`/idempotencia para no procesar updates duplicados.
- Mayor latencia potencial vs webhook.

**Implementación actual:**
- `TelegramPollingService` (infra) corre en background.
- Se habilita con `TELEGRAM_POLLING_ENABLED=true`.
- Interval configurable con `TELEGRAM_POLL_INTERVAL_MS` (ej. 2000ms).
- `SyncTelegramUpdatesUseCase` persiste conversaciones/mensajes.

---

## 6) Offset persistido + idempotencia “pro” por UNIQUE (`telegramUpdateId`)

**Decisión:** persistir el cursor (`lastUpdateId`) en DB y usar `telegramUpdateId` con constraint **UNIQUE** para que el consumo sea idempotente ante reintentos.

**Por qué:**
- El polling puede reintentarse o reiniciarse (crash/redeploy) y queremos evitar duplicar mensajes.
- Persistir `lastUpdateId` en `telegram_sync_state` permite retomar desde el último `update_id` procesado **entre reinicios** (sin depender de memoria RAM).
- Usar `offset = lastUpdateId + 1` hace que cada ejecución del cron pida **sólo updates nuevos**.
- El UNIQUE en `messages.telegramUpdateId` protege contra el caso “crash a mitad de batch” o “reintento” (si un `update_id` ya fue insertado, el adapter lo ignora como no-op).

**Qué guarda `telegram_sync_state` exactamente:**
- Una única fila (singleton, id = `bot`) con `lastUpdateId`.
- Ese valor representa “hasta qué `update_id` de Telegram ya consumimos”.

**Cómo se usa en el código:**
- `SyncTelegramUpdatesUseCase` lee `lastUpdateId`.
- Llama a Telegram con `getUpdates({ offset: lastUpdateId + 1 })`.
- Por cada update con texto:
	- upsert de `Conversation` por `telegramChatId`
	- insert idempotente de `Message` usando `telegramUpdateId = update_id`
- Actualiza `telegram_sync_state.lastUpdateId` para que el próximo polling arranque desde ahí.

**Consecuencias / costo:**
- Se agrega una columna extra y un constraint UNIQUE en la entidad `MessagePersistence`.
- El adapter debe manejar errores de constraint (Postgres `23505`) para tratar duplicados como “noop”.
- Queda la pregunta de diseño: usar `update_id` vs `message_id` como identificador (elegimos `update_id` por simplicidad del poller).

**Trade-off importante (consistencia):**
- Si avanzamos el cursor (`lastUpdateId`) antes de persistir el mensaje, reducimos duplicación pero existe riesgo de "saltar" un mensaje si el proceso cae entre ambos pasos.
- Alternativa (más safe): persistir el mensaje (idempotente) y recién después avanzar el cursor.

**Refactor aplicado (enero 2026): cursor “una sola vez por update”**
- Ajustamos `SyncTelegramUpdatesUseCase` para que el cursor se actualice **después** de intentar persistir el mensaje.
- Además, para evitar duplicación de código (y confusión), el `setLastUpdateId(...)` quedó centralizado para ejecutarse **una sola vez por update** (usando un `try/finally` dentro del loop).
- Esto mantiene los beneficios:
	- reintentos seguros (idempotencia por UNIQUE)
	- menos riesgo de pérdida (commit del cursor al final del procesamiento del update)
	- implementación más legible

- Para el challenge seguimos priorizando simplicidad + idempotencia por UNIQUE; el diseño puede ajustarse según el SLA deseado ("no perder" vs "no repetir").

## 5) Logging estructurado con Pino (`nestjs-pino`) en vez de logs simples

**Decisión:** usar `nestjs-pino` + un adapter `PinoLoggerService` que implementa el puerto `LoggerService`.

**Por qué:**
- Logs estructurados (JSON) y performance.
- Facilidad para redacción de secretos.
- Mantener uso de logs desde casos de uso vía puerto (hexagonal).

**Consecuencias / costo:**
- Configuración inicial más extensa que `console.log`.
- Se requiere disciplina para no loguear información sensible.

---

## 7) `telegram_sync_state` como estado técnico (no entidad de dominio)

**Decisión:** modelar el cursor de consumo de Telegram como un estado técnico persistido (`telegram_sync_state`) accedido vía puerto (`TelegramSyncStateRepository`) + DTO simple (`TelegramSyncState`), en vez de crear una entidad rica de dominio.

**Por qué:**
- `lastUpdateId` no representa un concepto del negocio (como `Conversation`, `Message`, `User`), sino un cursor operacional necesario por el mecanismo de polling/offset de Telegram.
- Mantiene el dominio enfocado en reglas del negocio y evita “contaminar” el core con detalles específicos del proveedor.
- Igual lo exponemos como puerto para que el caso de uso sea testeable y no dependa de TypeORM/DB.

**Consecuencias / costo:**
- La tabla existe y se persiste, pero no hay invariantes ricas en dominio (por ejemplo, no hay `Entity` con comportamiento).
- En escenarios más complejos (multi-bot, multi-instancia con locking/leases, auditoría, replay), probablemente convenga promover esto a un modelo más explícito (y agregar concurrencia/locking/validaciones como “el cursor nunca retrocede”).
