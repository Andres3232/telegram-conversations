# Ejercicio – Backend Developer: Arquitectura Hexagonal (versión 2026)

Desarrollar una **API que integre el servicio de mensajería de Telegram** aplicando **Arquitectura Hexagonal (Ports & Adapters)**.
El foco está en la **separación de responsabilidades, independencia del dominio respecto a la infraestructura, y uso estratégico de herramientas de Inteligencia Artificial** para acelerar y estructurar el desarrollo.

---

## Objetivo

La aplicación debe recibir un mensaje desde Telegram, procesarlo y enviar una **respuesta aleatoria**.
Además, debe permitir **administrar las conversaciones** desde un panel autenticado (login simple con email y contraseña).

**El diseño debe garantizar que el núcleo de negocio (dominio) sea completamente independiente de frameworks, bases de datos y servicios externos.**

---

## Requisitos funcionales

- Registro de usuarios con email y contraseña para administrar las conversaciones.
- Middleware de autenticación (token, sesión o JWT).
- Listado de conversaciones con mensajes asociados.
- Posibilidad de enviar mensajes a contactos que hayan iniciado una conversación.
- Recepción de mensajes mediante tarea programada (polling con `getUpdates` de Telegram).
- Respuesta automática con texto aleatorio o configurable.

---

## Requisitos de arquitectura (Hexagonal)

### Estructura del proyecto

Se espera una organización clara que refleje la separación entre dominio, aplicación e infraestructura. **La estructura de carpetas queda a criterio del candidato.**

### Principios obligatorios

1. **Inversión de dependencias**
   - El dominio define interfaces (puertos), la infraestructura las implementa (adaptadores).
   - Ninguna clase del dominio debe importar código de infraestructura.

2. **Puertos y adaptadores**
   - **Puertos de entrada (driving):** Definen cómo el mundo exterior interactúa con la aplicación (ej: casos de uso).
   - **Puertos de salida (driven):** Definen qué necesita la aplicación del mundo exterior (ej: repositorios, servicios externos).
   - **Adaptadores:** Implementaciones concretas de los puertos.

3. **Casos de uso explícitos**
   - Cada operación de negocio debe estar encapsulada en un caso de uso con una única responsabilidad.
   - Ejemplos: `RegisterUserUseCase`, `SendMessageUseCase`, `ListConversationsUseCase`.

4. **Entidades y objetos de valor**
   - Las entidades del dominio deben encapsular reglas de negocio.
   - Usar objetos de valor para conceptos como `Email`, `MessageContent`, `TelegramChatId`.

5. **Testeabilidad**
   - El dominio debe poder testearse sin necesidad de base de datos ni servicios externos.
   - Usar dobles de prueba (mocks/stubs) para los puertos de salida.

---

## Requisitos técnicos

- **No se requiere frontend.** El ejercicio se enfoca exclusivamente en el backend.
- Inyección de dependencias (manual o con contenedor).
- Gestión de base de datos mediante repositorios (el ORM es un detalle de implementación).
- Tarea programada o proceso en segundo plano que se ejecute periódicamente para sincronización con Telegram.

> **Nota sobre integración con Telegram:** Se recomienda usar el método `getUpdates` de la API de Telegram (polling) ya que no requiere exponer URLs públicas y simplifica el desarrollo local. Si preferís usar webhooks, también es válido.
- Logs de actividad y manejo de errores mediante excepciones de dominio.
- Repositorio con instrucciones de instalación y ejecución (`README.md` claro).

---

## Entregable obligatorio: Documentación de API

Se debe entregar **obligatoriamente** una de las siguientes opciones:

1. **Colección de Postman** (`.json`) con todos los endpoints documentados y ejemplos de request/response.
2. **Swagger/OpenAPI** integrado en la aplicación (endpoint `/docs` o `/swagger`).

La documentación debe incluir:
- Todos los endpoints disponibles.
- Método HTTP, ruta y descripción.
- Headers requeridos (autenticación).
- Body de request con ejemplos.
- Responses esperados (éxito y errores).

---

## Criterios de evaluación

1. **Aplicación de arquitectura hexagonal**
   - Correcta separación entre dominio, aplicación e infraestructura.
   - Uso apropiado de puertos y adaptadores.
   - Independencia del dominio respecto a frameworks y librerías externas.

2. **Calidad del código**
   - Claridad, modularidad y aplicación de principios SOLID.
   - Naming consistente y código autoexplicativo.

3. **Diseño de endpoints**
   - Naming, consistencia REST, manejo de errores y paginación.

4. **Gestión de datos**
   - Integridad, relaciones y uso correcto de transacciones.

5. **Uso de Inteligencia Artificial**
   - Utilización de herramientas de IA para:
     - Redacción del código mediante prompting claro y estructurado.
     - Generación de tests o documentación.
     - Explicación de decisiones técnicas.

6. **Estrategia de prompting**
   - Estructuración de los prompts por capas, casos de uso o validaciones.
   - Ajustes y revisiones aplicadas al output del modelo.

7. **Testing**
   - Tests unitarios del dominio y casos de uso.
   - Tests de integración para adaptadores.

---

## Bonus (valor agregado)

- **Uso de TDD (Test-Driven Development)**
  Implementar funcionalidades guiadas por tests antes del código productivo.

- **Event-driven dentro del dominio**
  Uso de eventos de dominio para desacoplar operaciones (ej: `MessageReceivedEvent`).

- **CQRS simplificado**
  Separación de operaciones de lectura y escritura a nivel de casos de uso.

- **Despliegue online** (Render, Railway, Vercel, etc.).

- **Respuesta dinámica generada por IA** (en lugar de aleatoria).

- Archivo `ARCHITECTURE.md` explicando las decisiones de diseño y cómo se aplicó la arquitectura hexagonal.

- Archivo `PROMPT_LOG.md` o `AI_NOTES.md` explicando cómo se usó la IA y qué estrategias de prompting se aplicaron.

- Archivo de rules utilizadas.

---

## Entregable obligatorio

### Documento de decisiones técnicas

Incluir un archivo `DECISIONS.md` donde se justifiquen **al menos 3 trade-offs** realizados durante el desarrollo. Ejemplos:

- *"Elegí X en lugar de Y porque..."*
- *"Decidí no implementar Z porque..."*
- *"Opté por esta estructura de datos porque..."*

Este documento es clave para evaluar el criterio técnico y la capacidad de argumentar decisiones.
