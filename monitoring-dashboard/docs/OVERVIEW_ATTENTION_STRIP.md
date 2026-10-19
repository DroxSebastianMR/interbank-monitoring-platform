# Vista general: estado y atención

Se reutiliza `OperationsSummaryBanner` en su ubicación actual. Su presentación pasa de un panel de 184 px mínimos a una franja con icono, mensaje único y acción contextual. Los indicadores, gráficos, filtros y navegación no cambian.

## Fuente y prioridad

La fuente es la consulta existente `GET /dashboard/overview`. No hay solicitudes ni dependencias nuevas. El resumen continúa siendo global, independiente del filtro de servicio.

1. Consulta fallida o pausada sin conexión: no se puede comprobar el estado actual; reintentar con el mecanismo de actualización existente. También cubre el primer acceso sin datos.
2. Servicio no disponible con observación vigente: nombre del servicio y estado; ver incidente si existe uno abierto asociado, o revisar servicio si todavía no existe un incidente confirmado.
3. Servicio degradado o recuperándose con observación vigente: revisar servicio.
4. Observación ausente, inválida, vencida, supervisión desactivada o resumen incompleto: revisar monitoreo. No declarar operación saludable.
5. Servicios operativos con incidentes aún abiertos: mostrar el número de incidentes y acceso al historial.
6. Todos los servicios operativos, observaciones vigentes y fuente de incidentes disponible sin incidentes abiertos: mensaje operativo con cantidad real de servicios.

Dentro de una condición se prioriza el servicio asociado al incidente de mayor severidad, después el más antiguo. No se modifican los arrays del caché.

La vigencia se comprueba por servicio con `lastCheckedAt`, `monitoringEnabled` y `status`, usando los 30 segundos del backend. Un temporizador local vuelve a evaluar el vencimiento cada segundo, incluso si cesa el polling. Las fechas futuras no se consideran observaciones vigentes. El cliente y el servidor deben tener sus relojes sincronizados.

`recentIncidents` procede de registros con `resolvedAt: null` y está limitado a cinco elementos; `activeIncidentsCount` es el contador total. Si una caída no tiene un incidente asociado en esa muestra, se ofrece el detalle del servicio en vez de inventar una referencia. El historial usa la ruta existente `/incidents`; no se introduce una ruta ficticia a un incidente concreto.

`DEGRADED` no demuestra por sí solo lentitud: la clasificación del backend también considera fallos parciales de sondas, errores, timeouts y riesgo de anomalía. El contrato del resumen no incluye la causa ni el umbral configurado, por lo que se usa «presenta degradación» en lugar de atribuir una causa no confirmada. `RECOVERING` tiene un mensaje propio. No se usan alertas para confirmar incidentes ni para declarar una caída.

Los mensajes incluyen texto e icono, no dependen únicamente del color. La franja anuncia cambios mediante una región de estado accesible y conserva el foco. En móvil la acción pasa a la siguiente línea. No se ejecutaron pruebas, compilaciones ni la aplicación, siguiendo la indicación del usuario.

Los contratos consultados pertenecen al backend actual de `main`, como se detalla en `OVERVIEW_OPERATIONAL_HEADER.md`; no se modifica el backend de esta rama.
