# AI_NOTES.md

Este proyecto se aceleró con asistencia de IA, pero **la arquitectura y las decisiones quedaron siempre controladas por el código y los tests** (no por “copiar y pegar”). La IA se usó como copiloto para iterar rápido, revisar errores de importaciones en los modulos de nest y documentar trade-offs y hacer/mantener actualizados los documentos ARCHITECTURE, DECISIONS y README.

## ¿En qué se usó IA?

- **Diseño por capas (Hexagonal):** generar propuestas de estructura (dominio / aplicación / infraestructura) y validar que los *imports* no rompieran la inversión de dependencias.
- **Implementación guiada por casos de uso:** a partir de cada requisito, se pidió a la IA que lo tradujera a 1 UC + puertos involucrados + errores de dominio.
- **Testing (unit + e2e):** completar specs  siguiendo AAA, crear dobles de prueba para puertos, y ajustar aserciones en base a invariantes del dominio.
- **Debugging rápido:** cuando aparecieron errores importaciones de y exportaciones de modulos de Nest, se usó IA para detectar la causa raíz y proponer una corrección mínima y sistemática.
- **Documentación:** ayuda para redactar `README.md`, `ARCHITECTURE.md` y `DECISIONS.md` , con foco en justificar trade-offs y describir el flujo.

## Estrategias de prompting que funcionaron

### 1) consultas de dudas puntuales sobre arquitectura hexagonal, para no romper con dicha arquitectura
Sobre todo en dudas sobre kafka y telegram client
Prompt típico:
- *“¿Cómo puedo implementar X sin que el dominio dependa de infraestructura Y?”*

### 2) Prompt por iteraciones cortas (no “big bang”)
En vez de pedir “implementá toda la feature”, se pedían pasos concretos:
- integrar en módulo
- agregar tests
- correr suite y arreglar fallos

### 3) AAA + naming explícito en tests
Prompt típico:
- *“Generá unit tests siguiendo Arrange-Act-Assert, 1 happy path + 1-2 edge cases, sin tocar infraestructura.”*

Esto dio tests que reflejan reglas del dominio y no detalles de TypeORM/Kafka/Telegram.


## Reglas prácticas que seguimos

- **La IA propone; los tests validan.** Ningún cambio se consideró “terminado” sin `npm test` verde.
- **Preferir cambios mínimos**, especialmente en infraestructura.

## Ejemplos de prompts usados (resumidos)

- *“Completá estos archivos de test vacíos en `test/application/**` siguiendo AAA y usando mocks de puertos.”*
- *“Documentá el trade-off de polling vs webhooks / kafka vs sync / IA con feature-flag.”*
-*“Tengo es error de importacion de Nest, como lo podemos solucionar”*
