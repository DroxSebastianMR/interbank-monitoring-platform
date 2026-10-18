# Eventos operativos

Namespace Socket.IO `/operations`, transporte WebSocket, token en `handshake.auth.token`. No usar token en URL. Origin debe pertenecer a CORS_ORIGINS exactos. El servidor verifica firma, sesión y permisos; revalida sesión contra PostgreSQL cada 15 s y antes de transmitir si corresponde. La caché HTTP ya no renueva TTL por cada lectura.

Envelope v1: eventId, eventType, channel, streamId por proceso, sequence por canal, timestamp, correlationId, payload. La correlación actual identifica el evento, no una traza HTTP distribuida.

| Canal | Permiso | Eventos |
|---|---|---|
| endpoints | analytics.read | metrics.updated, resync.required |
| incidents | incidents.read | incident.created, incident.updated |

Un cliente no selecciona permisos ni salas arbitrarias. Límite 200 sesiones, payload entrante 8 KiB, cola de transmisión acotada. Saturación desconecta y obliga a resincronizar. Eventos grandes (>100 cambios) indican resync; no envían datasets completos por WebSocket.

Frontend: una conexión por layout, validación Zod, snapshot inicial, deltas por clave instancia+método+ruta, descarte de duplicados, resync por saltos y reinicio. HTTP de respaldo cada 30 s detecta también un último evento perdido. Limpieza de listeners al desmontar. Tokens se obtienen del almacenamiento de sesión existente.

No hay entrega exactamente una vez del socket. Incidentes se emiten después de commit; la bandeja durable usa outbox, no el socket. Pendiente Redis adapter si se replica el monitor, métricas del gateway y pruebas de carga con 200 clientes.

Referencias: [middlewares Socket.IO](https://socket.io/docs/v4/middlewares/), [garantías de entrega](https://socket.io/docs/v4/delivery-guarantees/).
