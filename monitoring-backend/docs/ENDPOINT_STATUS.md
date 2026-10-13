# Estado de endpoints del monitor

Esta lista distingue **rutas ya registradas por Nest/Swagger** de funcionalidades propuestas. El contador de operaciones implementadas aparece al iniciar `pnpm start:docs` y el detalle exacto está en `/api/docs-json`. Swagger no crea ni simula las rutas pendientes.

## Implementadas y documentadas (32 operaciones)

| Área | Cantidad | Rutas |
| --- | ---: | --- |
| Auth | 8 | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `GET /auth/sessions`, `DELETE /auth/sessions/:sessionId`, `POST /auth/logout-all`, `POST /auth/change-password` |
| Access control | 11 | `GET/POST /access-control/roles`, `GET/PUT/DELETE /access-control/roles/:roleId`, `GET /access-control/permissions`, `GET/POST /access-control/employees`, `GET /access-control/employees/:employeeId`, `PUT /access-control/employees/:employeeId/status`, `PUT /access-control/employees/:employeeId/roles` |
| IA | 2 | `GET /ai/health`, `POST /ai/predict` |
| Monitoreo | 2 | `POST /monitoring/run`, `POST /monitoring/:id/check` |
| Salud y telemetría | 2 | `GET /health`, `GET /metrics` |
| Servicios | 1 | `GET /monitored-services` |
| Incidentes | 1 | `GET /incidents` |
| Alertas | 1 | `GET /alerts` |
| Notificaciones | 1 | `GET /notifications` |
| Analítica | 1 | `GET /analytics/summary` |
| Auditoría | 1 | `GET /audit` |
| Asistente | 1 | `POST /assistant/ask` |

**Implementado no significa respaldado por datos reales en todos los casos.** En esta etapa, algunos servicios devuelven estado en memoria o una lista vacía. El modo `start:docs` solo permite visualizar OpenAPI y devuelve 503 a las rutas operativas; no debe usarse para probar lógica de negocio.

## Pendientes propuestos (no aparecen en Swagger)

| Prioridad | Área | Contrato candidato | Dependencia antes de implementarlo |
| --- | --- | --- | --- |
| Alta | Servicios | Detalle y administración de servicios | Persistir catálogo y validar endpoints seguros |
| Alta | Incidentes | Detalle, acuse, asignación, resolución e historial | Modelo de estados, actor y auditoría |
| Alta | Alertas | Acuse, silenciamiento temporal y reglas | Política de alertas y persistencia |
| Media | Métricas | Series temporales de CPU, memoria, errores, latencia p95 y disponibilidad | Instrumentación/exportadores y retención |
| Media | Transacciones | Conteos y tasas agregadas por día/servicio | Métricas agregadas del backend móvil; no datos individuales |
| Media | Logs | Consulta filtrada y correlación por solicitud/incidente | Ingesta estructurada y control de datos sensibles |
| Media | Notificaciones | Destinos, pruebas y estados de entrega | Canal real y cola persistente |
| Baja | Reportes | Resúmenes exportables de disponibilidad e incidentes | Métricas históricas confiables |

Para el mapa de ventanas y la matriz de roles, ver [ACCESS_AND_DASHBOARD.md](ACCESS_AND_DASHBOARD.md).
