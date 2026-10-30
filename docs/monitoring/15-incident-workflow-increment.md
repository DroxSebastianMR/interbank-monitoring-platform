# Incremento 2: atención y expediente de incidentes

Fecha: 30 de octubre de 2026.
Rama: `codex/feat-incident-workflow`, creada desde `origin/develop` (`214ded0`). El incremento 1 (`792dec9`) todavía no estaba integrado en develop; se incorporó por avance rápido como dependencia de esta rama, sin modificar develop ni duplicar el commit. No se realizó push ni merge a develop.

## Propósito

Convertir el registro de incidentes automáticos en un expediente que pueda atenderse. Se conserva la separación entre el estado técnico calculado por el motor y la atención realizada por el personal.

No se añadieron bibliotecas, motores genéricos de workflow ni otro bus de eventos. Se reutilizan NestJS, Prisma, permisos existentes, auditoría, eventos operativos y outbox; en frontend, React Query, router, cliente HTTP y componentes de formulario/Card existentes.

## Comportamiento

- Responsable activo con `incidents.read` e `incidents.manage`; asignación y reasignación con motivo.
- Reconocimiento registrado con actor y fecha, independiente de marcar una notificación como leída.
- Notas de investigación preservadas como eventos, sin sobrescribir evidencia técnica.
- Flujo de atención: Detectado -> En investigación -> Identificado / En recuperación. La recuperación confirmada lleva a Resuelto desde el motor; el cierre es una acción manual posterior.
- Reclasificación de severidad con motivo; se conserva el origen técnico. Una reclasificación explícita no se sobrescribe en cada sondeo.
- Severidad automática inicial basada en criticidad y condición técnica: indisponibilidad de un servicio de criticidad alta/crítica produce severidad crítica; para media/baja produce alta. Degradación produce alta o media respectivamente.
- Línea de tiempo por versión y tramo, con origen SYSTEM, OPERATOR o IMPORT. Cursor por versión, hasta 50 eventos por página.
- Cada cambio significativo aumenta versión. Las comprobaciones sin cambio actualizan evidencia/frescura sin invalidar formularios cada 10 s.

`status` conserva OPEN/RESOLVED para compatibilidad con conteos y consumidores existentes. `attentionState` representa el trabajo del operador y `technicalStatus` conserva la condición técnica registrada. Resuelto no significa cerrado.

## Reaparición y concurrencia

Existe como máximo un expediente sin cerrar por servicio. Si vuelve una afectación después de resolver pero antes de cerrar, se reutiliza el ID, aumenta el tramo, se vuelve a investigación y se requiere nuevo reconocimiento. El responsable y la historia se conservan. Después del cierre, una nueva afectación genera un expediente vinculado mediante previousIncidentId.

La sincronización técnica y las acciones manuales bloquean la misma fila de servicio dentro de una transacción breve. Se revalida el incidente después de obtener el bloqueo. Las actualizaciones manuales exigen expectedVersion y el índice parcial protege la unicidad del expediente sin cerrar. Una edición obsoleta produce 409.

Cada comando manual exige commandId UUID. Se conserva una huella del actor/contenido/versión y un recibo estable. Repetir el mismo comando devuelve el recibo sin duplicar notas ni auditoría; reutilizar la clave para contenido o actor diferente se rechaza. La interfaz conserva el comando en memoria ante resultado de red incierto y ofrece reintentar la misma operación. No promete recuperación de ese estado de formulario tras cerrar el navegador.

Evento de expediente, actualización y auditoría manual se confirman juntos. Los eventos de Socket.IO se publican después del commit; si se pierde el aviso, el sondeo HTTP permite consultar el estado persistido. No se cambió el worker de notificaciones ni se afirmó entrega push.

## Cierre y dependencia del siguiente incremento

El cierre requiere: estado Resuelto, responsable activo/habilitado, reconocimiento, evidencia de recuperación, comprobación reciente y saludable del servicio con su versión de configuración vigente, resumen y un aviso de recuperación verificado para el mismo tramo.

El publicador todavía no existe. Por eso el cierre permanece bloqueado con una explicación visible cuando falta ese aviso, aunque las demás condiciones estén completas. No se creó un booleano editable ni una acción para fingir que hubo publicación.

Contrato interno para el siguiente incremento: cuando el publicador compruebe visibilidad del aviso, debe registrar un IncidentEvent SYSTEM de tipo RECOVERY_PUBLISHED, con la occurrence vigente y payload `{ publicationId, visibleAt }`. Debe tomar el mismo bloqueo de servicio, validar la vigencia del tramo e incrementar la versión del incidente en la misma transacción. La hora visible debe corresponder a la recuperación actual y no estar en el futuro. No existe endpoint público para insertar ese evento ni un método de operador que permita falsificarlo.

## API privada

Se conserva `GET /incidents` como arreglo compatible, limitado a 100 expedientes; prioriza los pendientes de cierre, seguido del archivo más reciente. No es todavía el historial completo paginado del RF-39.

| Ruta | Permisos | Uso |
| --- | --- | --- |
| GET /incidents/:id | incidents.read | Expediente, participantes y condiciones de cierre |
| GET /incidents/:id/events?beforeVersion=N | incidents.read | Línea de tiempo con cursor estable |
| GET /incidents/assignees | incidents.read + incidents.manage | Hasta 100 responsables elegibles, sin correos ni credenciales |
| PATCH /incidents/:id/assignment | incidents.read + incidents.manage | Asignar/reasignar |
| POST /incidents/:id/acknowledgement | incidents.read + incidents.manage | Reconocer |
| POST /incidents/:id/notes | incidents.read + incidents.manage | Añadir nota |
| PATCH /incidents/:id/attention | incidents.read + incidents.manage | Cambiar atención autorizada |
| PATCH /incidents/:id/severity | incidents.read + incidents.manage | Reclasificar con justificación |
| POST /incidents/:id/closure | incidents.read + incidents.manage | Cerrar si cumple todas las condiciones |

Comandos: `{ expectedVersion, commandId, reason, ...datosDeLaAccion }`. El backend vuelve a comprobar que el actor está activo/habilitado y que el responsable elegido es elegible; ocultar botones no es el control de seguridad. Los identificadores de ruta se validan como UUID.

## Interfaz

Nueva ruta `/incidents/:id` dentro del layout existente, accesible desde el listado y desde las referencias de alertas cuando el usuario tiene permiso de incidentes. Conserva el contexto de query string al volver.

El listado muestra atención y responsable. El detalle presenta condición técnica registrada, severidad, fechas, tramos, expediente anterior relacionado, línea de tiempo, evidencia y formulario de acciones según permisos. No se rediseñaron los otros módulos.

La consulta de detalle se actualiza cada 10 s y responde a los eventos existentes. La línea de tiempo se invalida al cambiar la versión, sin añadir una conexión WebSocket por componente ni consultar historia en cada sondeo sin cambios. Un formulario cuya versión quedó obsoleta requiere revisión explícita. Fallos de actualización muestran los últimos datos como desactualizados y suspenden acciones; 401/403 no se muestran como un expediente vacío.

## Migración pendiente

`20261030120000_incident_workflow` agrega campos, enums y la tabla IncidentEvent, además de índices usados por búsquedas, deduplicación y línea de tiempo. Sustituye el índice de un incidente sin resolver por uno sin cerrar.

La migración también realiza un backfill: los registros históricos ya resueltos se archivan con legacyArchived, closedAt tomado del resolvedAt previo y una explicación explícita de que no acreditan cierre manual ni publicación. Se preservan sus IDs, evidencia y fechas originales; un evento IMPORT registra la incorporación sin reconstruir hechos inexistentes. Esto evita asignar retroactivamente el nuevo proceso a múltiples incidentes resueltos del mismo servicio.

No se aplicó la migración ni se abrió una conexión a una base. Debe revisarse el respaldo y el destino autorizado antes de ejecutar las migraciones pendientes del incremento 1 y 2, generar el cliente Prisma y desplegar esta versión. No arrancar el backend nuevo con el esquema anterior.

## Verificación preparada y límites

Se prepararon casos para transiciones y severidad, reintentos deduplicados, conflictos de versión, responsables/operadores deshabilitados, expedientes cerrados, reaparición antes y después del cierre, versiones estables en sondeos repetidos y condiciones de cierre/publicación/frescura. Se actualizó el script de integración de outbox para usar una observación persistida de un servicio desechable.

No se ejecutaron pruebas, compilaciones, lint, migraciones ni generación Prisma. No se iniciaron Docker, WSL ni servicios. La revisión realizada fue estática, de referencias y diferencias de código; no equivale a QA visual ni a validación de concurrencia real contra PostgreSQL.

Este incremento desarrolla RF-21 a RF-28 y RN-13 a RN-19. El cierre completo depende de RF-29 a RF-36 (publicación) del siguiente incremento. Continúan pendientes el ciclo independiente de alertas preventivas, filtrado/paginación global del historial, campañas de aceptación y medición de objetivos no funcionales.
