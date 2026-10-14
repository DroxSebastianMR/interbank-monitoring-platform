# Estado de endpoints del monitor

Esta lista distingue **rutas ya registradas por Nest/Swagger** de funcionalidades propuestas. El contador de operaciones implementadas aparece al iniciar `pnpm start:docs` y el detalle exacto está en `/api/docs-json`. Swagger no crea ni simula las rutas pendientes.

## Implementadas y documentadas (48 operaciones)

| Área | Cantidad | Rutas |
| --- | ---: | --- |
| Auth | 8 | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `GET /auth/sessions`, `DELETE /auth/sessions/:sessionId`, `POST /auth/logout-all`, `POST /auth/change-password` |
| Access control | 11 | `GET/POST /access-control/roles`, `GET/PUT/DELETE /access-control/roles/:roleId`, `GET /access-control/permissions`, `GET/POST /access-control/employees`, `GET /access-control/employees/:employeeId`, `PUT /access-control/employees/:employeeId/status`, `PUT /access-control/employees/:employeeId/roles` |
| IA | 2 | `GET /ai/health`, `POST /ai/predict` |
| Monitoreo | 2 | `POST /monitoring/run`, `POST /monitoring/:id/check` |
| Salud y telemetría | 2 | `GET /health`, `GET /metrics` |
| Servicios | 13 | `GET/POST /monitored-services`, `POST /monitored-services/validate-target`, `GET/PATCH /monitored-services/:id`, `GET /monitored-services/:id/state`, `GET /monitored-services/:id/metrics`, `GET /monitored-services/:id/instances`, `GET /monitored-services/:id/checks`, `GET /monitored-services/:id/state-history`, `GET /monitored-services/:id/config-history`, `POST /monitored-services/:id/pause`, `POST /monitored-services/:id/resume` |
| Dashboard | 4 | `GET /dashboard/overview`, `GET /dashboard/metrics`, `GET /dashboard/activity`, `GET /dashboard/topology` |
| Incidentes | 1 | `GET /incidents` |
| Alertas | 1 | `GET /alerts` |
| Notificaciones | 1 | `GET /notifications` |
| Analítica | 1 | `GET /analytics/summary` |
| Auditoría | 1 | `GET /audit` |
| Asistente | 1 | `POST /assistant/ask` |

**Implementado no significa respaldado por todas las fuentes.** El catálogo, las sondas, las transiciones y los conteos se han conectado a PostgreSQL mediante la migración `20261013110000_operational_services`, todavía sin aplicar en un entorno real. Las series del dashboard proceden de sondas persistidas, no del tráfico HTTP; `errorRate` se devuelve como `null`. La topología y las instancias están configuradas, pero su salud individual se marca `NO_DATA` mientras no haya instrumentación. `validate-target` verifica la forma de una ruta relativa permitida, pero todavía no ejecuta una prueba activa del destino. El modo `start:docs` solo permite visualizar OpenAPI y devuelve 503 a las rutas operativas; no sirve como prueba de integración.

## Pendientes propuestos (no aparecen en Swagger)

| Prioridad | Área | Contrato candidato | Dependencia antes de implementarlo |
| --- | --- | --- | --- |
| Alta | Servicios | Prueba activa del destino e instrumentación de instancias | Acceso al laboratorio y política de destinos permitidos |
| Alta | Incidentes | Detalle, acuse, asignación, resolución e historial | Modelo de estados, actor y auditoría |
| Alta | Alertas | Acuse, silenciamiento temporal y reglas | Política de alertas y persistencia |
| Media | Métricas | Series temporales de CPU, memoria, errores, latencia p95 y disponibilidad | Instrumentación/exportadores y retención |
| Media | Transacciones | Conteos y tasas agregadas por día/servicio | Métricas agregadas del backend móvil; no datos individuales |
| Media | Logs | Consulta filtrada y correlación por solicitud/incidente | Ingesta estructurada y control de datos sensibles |
| Media | Notificaciones | Destinos, pruebas y estados de entrega | Canal real y cola persistente |
| Baja | Reportes | Resúmenes exportables de disponibilidad e incidentes | Métricas históricas confiables |

Para el mapa de ventanas y la matriz de roles, ver [ACCESS_AND_DASHBOARD.md](ACCESS_AND_DASHBOARD.md).
