# Inventario y métricas

La base `feature/endpoint-observability` registra operaciones desde OpenAPI durante el arranque de la API bancaria. `endpoint_info` inicializa rutas sin tráfico. Solo rutas declaradas normalizadas entran en etiquetas; IDs de clientes/cuentas y query strings no se usan.

Contratos conservados:

- `GET /endpoint-observability`: snapshot, permiso `analytics.read`.
- Nuevo `GET /endpoint-observability/snapshot`: añade cursor `{streamId, sequence}` para eventos; mismo permiso y `Cache-Control: no-store`.
- `/metrics` de la API: contadores, histogramas y métricas de proceso existentes, más concurrencia y conexiones abortadas.

El monitor incorpora `operationId` SHA-256 truncado de aplicación + método + ruta, aplicación, versión de ruta explícita o `unversioned`, política `OBSERVE_ONLY`, p50/p95/p99. El ID no cambia al cambiar de instancia. No se deduce autorización para administrar una ruta nueva.

Diez consultas agrupadas a Prometheus, no diez por endpoint. Caché/singleflight 5 s. Scrape de app 5 s, ventana de tasas 2 minutos. Valores desconocidos son `null`, no cero. Una instancia que publica métricas no demuestra que cada endpoint financiero funcione. Las conexiones abortadas no equivalen automáticamente a timeouts.

Pendiente: criticidad aprobada por operación, trazas OpenTelemetry, recursos por instancia en UI, métricas de esperas/pool PostgreSQL, heartbeat separado y prueba de tiempo fallo→detección. No se promete detección subsegundo.
