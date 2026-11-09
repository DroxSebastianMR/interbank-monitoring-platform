# Ampliación de la API de notificaciones

Rama: `fix/notifications-inbox-api`, creada desde develop (`ca928bb`).
Se amplía el módulo existente; no se modifica el dashboard ni la cola de entrega.

## Contratos

Las rutas siguen usando JWT y ambos permisos `notifications.read` e
`incidents.read`. Todas las consultas se limitan al empleado de la sesión; no
aceptan employeeId desde el cliente. Se conserva MONITORING_DELIVERY_ENABLED:
si está deshabilitado, las nuevas rutas también responden 503.

### GET /notifications/unread-count

```json
{ "unreadCount": 140 }
```

Cuenta directamente todos los registros propios con readAt null. No depende de
las últimas 100 filas ni del número de incidentes activos. Una recuperación
también puede generar una notificación sin leer; no se confunde con una alerta
operativa pendiente de reconocimiento. Los fallos de la base no se convierten en
cero. El conteo corresponde al instante de la consulta y puede cambiar antes de
recibir una página o marcar un elemento como leído.

### GET /notifications/inbox?limit=20&cursor=UUID

Responde `{ items, nextCursor }`. limit es entero entre 1 y 50, con 20 por defecto.
cursor es opcional y debe ser el nextCursor de la respuesta anterior. Un cursor
inexistente o ajeno devuelve el mismo 400, sin revelar su propietario.

Cada item contiene id, incidentId, eventType, createdAt, readAt e incident. El
resumen incident incluye id, serviceKey, title, status, severity y attentionState.
Es el estado actual del expediente, no una reconstrucción histórica del evento.
No se exponen evidencias técnicas, notas, propietarios ni credenciales. Si falta
el incidente, se conserva la notificación con incident null.

Se ordena por createdAt e id descendentes, con una frontera estricta por ambos
campos. Esto resuelve empates de fecha y evita desplazar las páginas cuando llegan
notificaciones nuevas o se marca alguna como leída. No constituye un snapshot de
toda la bandeja: las novedades se consultan volviendo a la primera página. Si se
elimina la notificación usada como cursor, el cliente debe reiniciar la consulta.

Se consulta un registro adicional para determinar nextCursor. Los incidentes de
la página se buscan en un único lote, con IDs sin duplicar. No hay una consulta
por notificación ni se crean relaciones/FK sobre referencias históricas.

## Compatibilidad y persistencia

GET /notifications conserva su arreglo de hasta 100 filas y PATCH
/notifications/:id/read conserva su comportamiento idempotente. No se añaden
acciones masivas ni se altera la generación/destinatarios de notificaciones.

La migración `20261109120000_notification_inbox_indexes` añade un índice para
employeeId/readAt y reemplaza el índice employeeId/createdAt por uno con id como
desempate. Conserva las columnas iniciales que utiliza el listado anterior. No
crea tablas, no actualiza datos y no borra notificaciones.

La migración queda preparada, sin aplicar. Planificar su ejecución según el tamaño
de la tabla: CREATE INDEX normal puede bloquear escrituras durante su creación.
La API funciona sin estos índices nuevos, aunque el coste aumenta con el volumen.

## Verificación y alcance

Se prepararon casos unitarios para aislamiento por empleado, conteo superior a
100, paginación con empates, búsqueda agrupada, cursor ajeno, referencias ausentes,
límites de consulta, bandeja vacía y diferencia entre ausencia de datos y error.
No se ejecutaron pruebas, compilaciones ni migraciones, respetando la preferencia
vigente. La revisión realizada es estática.

Esta rama contiene únicamente la API y sus índices. Las correcciones del entorno
local/Supabase permanecen en `codex/fix-local-development-environment` y requieren
su propia integración; no se copiaron a este cambio desde develop. El siguiente
paso de producto es consumir estas rutas desde la campana y el panel de la bandeja.
