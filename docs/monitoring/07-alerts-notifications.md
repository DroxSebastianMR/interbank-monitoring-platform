# Incidentes y entrega durable

Con `MONITORING_DELIVERY_ENABLED=true`, incidente/alerta y evento outbox se escriben en la misma transacción PostgreSQL. La cola se activa solo después de aplicar `20261018190000_operational_delivery`.

Publicador cada2s, lotes25, jobId=eventId, reintentos5 con backoff exponencial, concurrencia2. `OperationalOutbox` queda pendiente si Redis no está disponible; tras60s puede volver a intentarse encolar. La entrega deduplica mediante UNIQUE(employeeId,eventId). No hay montos ni datos de cuentas en jobs.

Destinatarios: empleados ACTIVE con **ambos** `incidents.read` y `notifications.read`. Lectura requiere esos permisos actuales. `GET /notifications` devuelve exclusivamente bandeja propia, últimos100. `PATCH /notifications/:id/read` comprueba pertenencia y es idempotente.

Esta es una **bandeja interna**, NO push Expo ni comprobante de entrega al dispositivo. La app móvil bancaria no recibió acceso a alertas internas. Pendientes: preferencias, tokens de empleados, recibos Expo, canal push dedicado, UI de bandeja, dead-letter/reintento administrativo con auditoría, métricas workers y política de retención outbox. Los trabajos fallidos conservan estado; no se reintentan infinitamente.

Desactivado por defecto para no romper instalaciones sin migración. Al estar desactivado responde503 en vez de fingir una bandeja vacía. Las tablas nuevas son aditivas; rollback de aplicación: desactivar flag y conservar datos.

Referencia: [trabajos idempotentes BullMQ](https://docs.bullmq.io/patterns/idempotent-jobs).
