# Arquitectura objetivo y decisiones

Actualización: 18-10-2026. Evolución incremental, no reemplazo de los backends.

```mermaid
flowchart LR
  Mobile[App bancaria] --> NGINX
  NGINX --> API1[API bancaria 1]
  NGINX --> API2[API bancaria 2]
  API1 --> AppDB[(PostgreSQL app)]
  API2 --> AppDB
  Prometheus --> API1
  Prometheus --> API2
  Dashboard -->|HTTP autorizado + Socket.IO| Monitor
  Monitor --> Prometheus
  Monitor -->|agregados, token interno| API1
  Monitor --> MonitorDB[(PostgreSQL monitor)]
  Monitor --> AI[FastAPI baseline / IsolationForest]
  MonitorDB --> Outbox
  Outbox --> BullMQ
  BullMQ --> Inbox[Bandeja privada de empleados]
  Watchdog[Proceso externo] -->|GET health| Monitor
```

La app y el monitor conservan bases separadas. El monitor recibe agregados, no credenciales PostgreSQL de la app. La analítica usa una URL interna fija; no acepta destinos desde solicitudes. NGINX bloquea `/internal/` y `/metrics` públicamente.

Los eventos de métricas son efímeros: secuencia + snapshot recuperan pérdidas. Incidentes y notificaciones son persistentes. Un único backend del monitor publica eventos en esta versión; para réplicas del monitor falta distribución y coordinación de recolección. No introducir Kafka/Kubernetes para ocultar esa limitación.

El modelo no ejecuta comandos, no cambia saldos y no ordena failover. El control por ruta queda pendiente de un adaptador NGINX probado. No se añadieron botones de control sin implementación efectiva.
