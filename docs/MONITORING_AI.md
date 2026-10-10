# Monitoreo e IA: contrato operativo

## Flujo

1. La app y k6 atraviesan NGINX hacia dos instancias del App Backend.
2. Ambas instancias exponen `/metrics`; Prometheus recoge contadores y un histograma de latencia cada 10 segundos.
3. Monitoring Backend consulta los health endpoints **a través de NGINX**. Conserva los últimos 60 segundos de comprobaciones por servicio.
4. A partir de tres comprobaciones combina la ventana sintética con tasa de solicitudes, errores HTTP 5xx y p95 de Prometheus, si están disponibles.
5. Envía la ventana a `POST /v1/anomalies/analyze` de Monitoring AI. El tiempo máximo de la llamada es 800 ms. Las reglas continúan si la IA o Prometheus no responden.
6. Detection y Service State deciden el estado. Incident sincroniza un incidente activo por servicio y registra alertas al abrir, escalar y resolver.
7. Dashboard consulta Monitoring Backend. `POST /assistant/ask` ofrece una explicación al personal autorizado; no participa en el ciclo automático.

El monitor sigue funcionando si el App Backend o NGINX fallan. El análisis Python y el proveedor conversacional no controlan NGINX ni abren incidentes directamente.

## Contratos

- `POST monitoring-ai/v1/anomalies/analyze`: ventana con `serviceId`, `windowStart`, `windowEnd`, `sampleCount`, `latencyP95Ms`, `errorRate`, `timeoutRate`, `requestRate`, `availability`.
- Respuesta: `status`, `anomalyScore`, `riskLevel`, `modelMode`, `reasons`. `INSUFFICIENT_DATA` significa que no hay tres observaciones todavía.
- `POST monitoring-backend/assistant/ask`: pregunta de un empleado con permiso `analytics.read`. El backend agrega datos permitidos y los entrega al servicio Python. La respuesta trae texto, proveedor, fecha de evidencia e identificadores de servicio.
- `GET monitoring-backend/incidents` y `GET /alerts`: evidencia persistida en PostgreSQL.

`anomalyScore` es una puntuación de anomalía, **no** una probabilidad de caída. El modo por defecto es `baseline`. Un modelo Isolation Forest solo se utiliza cuando existe un artefacto entrenado con rango de puntuación y se configura `MODEL_MODE=isolation_forest`.

## Datos y entrenamiento

- Los CSV de entrenamiento y evaluación se generan de las simulaciones y quedan fuera de Git.
- El CSV de entrenamiento contiene `latency`, `errorRate`, `timeoutRate`, `requestRate` de ventanas representativas.
- El CSV de evaluación, posterior en el tiempo y separado del entrenamiento, añade `isIncident` (`0` o `1`).
- `python -m training.train` genera `app/models/isolation_forest.joblib`.
- `python -m training.evaluate` informa precisión, recall, falsos positivos y falsos negativos. No habilitar el modelo por una simple ejecución exitosa: primero comparar esos resultados con el baseline en los escenarios k6.
- Solo cargar artefactos generados por el equipo; `joblib` no es un formato seguro para archivos no confiables.

## Configuración y despliegue

- Variables locales: ver `monitoring-ai/.env.example`, `monitoring-backend/.env.example` y `monitoring-infrastructure/.env.example`.
- En Compose, Monitoring AI es interno a la red; el override `docker-compose.dev.yml` expone el puerto 8000 solo para desarrollo.
- `ASSISTANT_PROVIDER=none` produce una respuesta determinista basada en evidencia y no requiere servicio externo. Para habilitar el proveedor, usar `openai` o `gemini` y su clave del lado servidor.
- Aplicar la migración Prisma de incidentes y alertas antes de arrancar el Monitoring Backend con esta rama.
- El estado reciente de las ventanas vive en memoria; los incidentes y alertas se persisten. El scheduler actual supone una sola instancia de Monitoring Backend. Antes de escalarlo horizontalmente hay que mover el disparo periódico a un scheduler/worker distribuido y probar idempotencia entre instancias.

## Pruebas de aceptación

1. Ejecutar los tests Python y NestJS y validar ambos builds.
2. En escenario normal: tres health checks sanos, estado `OPERATIONAL`, sin incidente.
3. Simular un fallo transitorio: `DEGRADED` sin declarar caída total de inmediato.
4. Simular fallos consecutivos: `UNAVAILABLE`, exactamente un incidente activo y alerta de apertura/escalamiento.
5. Parar una instancia del App Backend: NGINX debe mantener el camino de usuario mientras las métricas directas evidencian pérdida de capacidad.
6. Parar Monitoring AI: las reglas y estados deben seguir actualizándose.
7. Recuperar el servicio: estado `RECOVERING` y luego `OPERATIONAL`; incidente resuelto con alerta de recuperación.
8. Preguntar por el estado con proveedor desactivado: respuesta con datos y hora de observación. Si se activa un proveedor, probar su fallo y el fallback.

La llamada conversacional puede superar el tiempo de un ciclo de salud; por eso tiene un timeout separado y límite de peticiones. No debe usarse para decisiones automáticas ni recibir credenciales o datos bancarios personales.
