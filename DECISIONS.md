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

## 5) Offset persistido + idempotencia “pro” por UNIQUE (`telegramUpdateId`)

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

## 6) Logging estructurado con Pino (`nestjs-pino`) en vez de logs simples

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

---

## 8) Publicar `MessageReceivedEvent` por Kafka al persistir mensajes entrantes

**Decisión:** cuando `SyncTelegramUpdatesUseCase` detecta e inserta un mensaje entrante (direction = `IN`), publica un evento `MessageReceivedEvent` usando el puerto `MessageProducer` y una implementación concreta con Kafka (`KafkaMessageProducer`).

**Por qué (motivo de diseño):**
- El caso de uso de sincronización tiene una responsabilidad clara: **consumir updates y persistir el estado** (conversaciones/mensajes + cursor/offset). La lógica “qué hacemos después de recibir un mensaje” (auto-reply, moderación, métricas, notificaciones, etc.) es una preocupación distinta.
- Kafka nos da un mecanismo estándar para **desacoplar** productores y consumidores:
	- el poller/use-case puede seguir funcionando aunque el consumidor esté caído
	- podemos agregar nuevos consumidores sin tocar el core (por ejemplo: auto-reply, analytics, auditoría)
	- habilita escalado independiente (polling/persistencia vs procesamiento posterior)
	- facilita “event-driven” como bonus del challenge sin meter side-effects en el mismo flujo

**Por qué NO dejar “todo en el mismo caso de uso”:**
- Mezcla responsabilidades: “persistir” + “decidir/ejecutar reacciones”. Eso ensucia el caso de uso y lo vuelve más difícil de mantener.
- Acopla el core a side-effects (responder a Telegram, llamar otros servicios), complicando tests y aumentando la probabilidad de fallas parciales.
- Dificulta extender: cada nueva reacción implicaría editar el mismo caso de uso, aumentando el riesgo de regresiones.

**Consecuencias / costo:**
- Requiere infraestructura adicional (Kafka broker en local/producción) y configuración (`KAFKA_BROKERS`, `KAFKA_CONSUMER_GROUP_ID`).
- Aparece el problema clásico de “publish vs commit”: si insertamos el mensaje pero falla la publicación, el evento no se emite. (Para producción, esto se suele resolver con Outbox/CDC; para el challenge aceptamos el trade-off por simplicidad.)
- Los consumidores deben ser idempotentes o tolerantes a reintentos/delivery-at-least-once.

**Implementación actual:**
- Evento: `src/domain/events/message-received.event.ts` (topic: `telegram`, eventName: `message.received`).
- Producer (infra): `src/infrastructure/kafka/kafka-message.producer.ts`.
- Wiring: `src/infrastructure/kafka/kafka.module.ts` exporta el token `MESSAGE_PRODUCER`.
- Publicación: `src/application/use-cases/telegram/sync-telegram-updates.use-case.ts` publica el evento sólo cuando el insert es nuevo (`inserted` existe).

**Trade-off adicional (cursor/offset vs publish):**
- En `SyncTelegramUpdatesUseCase` actualizamos el cursor (`telegram_sync_state.lastUpdateId`) en un `finally` por cada update, incluso si falla el `producer.send(...)`.
- Esto prioriza **no bloquear el polling** y evitar quedar “pegados” reintentando el mismo update indefinidamente.
- Costo: ante fallo de Kafka (o del publish), podemos **perder el evento** de ese mensaje porque el cursor avanza y el update no se re-procesa.
- Mitigación actual: el mensaje **ya queda persistido en DB**, así que se puede re-empaquetar/republicar luego (manual o con un job). La solución “pro” sería implementar Outbox (DB) + publisher (reintentos) para garantizar entrega.

**Mejora futura (idempotencia en el consumer):**
- Sin idempotencia, Kafka puede re-entregar el mismo evento (rebalance, retry, restart) y el bot podría **responder dos veces**.
- Una solución simple es implementar un registro técnico `processed_events` con una clave única (por ejemplo `telegramUpdateId` o un `eventId`) para que el handler sea idempotente.

## 9) `TelegramConsumersModule` separado de `KafkaModule` (feature wiring vs infraestructura)

**Decisión:** mantener `TelegramConsumersModule` como módulo propio (feature) que importa `KafkaModule` y `TelegramModule`, en vez de configurar el consumer dentro de `KafkaModule`.

**Por qué:**
- `KafkaModule` es infraestructura genérica: expone “cómo conectarse a Kafka” (por ejemplo `KafkaClientFactory`) y un producer (`KafkaMessageProducer`).
- El consumer de Telegram es una “feature”: combina Kafka + handlers + casos de uso + Telegram client (`ReplyToMessageUseCase`). Si lo metemos en `KafkaModule`, Kafka quedaría acoplado al dominio/feature de Telegram.
- Escalabilidad de diseño: mañana pueden existir otros consumidores (otros tópicos/eventos) y conviene tener módulos por feature (`PaymentsConsumersModule`, `NotificationsConsumersModule`, etc.) sin convertir `KafkaModule` en un “god module”.

**Consecuencias / costo:**
- Hay más archivos/módulos (más wiring explícito).
- Algunas dependencias transversales como logging/config pueden necesitar importarse también en el feature-module (limitación de Nest DI si no son módulos globales).

**Trade-off:**
- **Pro (separado):** mejor boundary, menos acoplamiento, más fácil apagar/encender features (importando o no el módulo).
- **Contra (separado):** más boilerplate.
- **Pro (todo en KafkaModule):** menos boilerplate inicial.
- **Contra (todo en KafkaModule):** riesgo de mezclar infraestructura con features y que el módulo de Kafka termine dependiendo de Telegram/casos de uso.