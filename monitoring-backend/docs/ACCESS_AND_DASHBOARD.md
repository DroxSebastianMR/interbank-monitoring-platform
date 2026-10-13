# Acceso del centro de monitoreo y navegación prevista

## Criterio de seguridad

La identidad es un **empleado**, no un cliente bancario. No hay registro público: un administrador provisiona empleados. Los permisos se definen en código y se siembran en PostgreSQL; los administradores pueden crear roles personalizados combinando esos permisos, pero no inventar permisos ejecutables desde una petición HTTP. Los roles de sistema son inmutables. El guard valida permisos en cada ruta protegida y niega por defecto una ruta sin declaración. Las sesiones y los cambios de acceso se verifican contra PostgreSQL para que revocaciones y desactivaciones sean inmediatas. Redis cachea solo el catálogo de roles/permisos durante 60 s; si falla, se consulta PostgreSQL.

La consulta de sesión hace una lectura indexada por `id`/`employeeId` y carga roles/permisos en la misma consulta. Es intencionado no cachear esta decisión de seguridad, porque una sesión revocada no debe conservar acceso por un TTL. Prisma usa un único cliente con pool, no uno por petición. Para Supabase, configurar la URL de **conexión directa** si el servidor dispone de IPv6, o la URL del **pooler en modo sesión** si necesita IPv4. Ajustar `connection_limit` en la cadena solo tras medir concurrencia y límites reales. Las migraciones deben usar conexión directa. Nunca poner `DATABASE_URL` en el frontend.

## Roles iniciales

| Rol                | Responsabilidad                          | Escritura autorizada                    |
| ------------------ | ---------------------------------------- | --------------------------------------- |
| `ADMINISTRATOR`    | Gobierno del monitor, empleados y acceso | Roles, empleados, servicios, incidentes |
| `IT_ENGINEER`      | Diagnóstico técnico y recuperación       | Servicios e incidentes                  |
| `OPERATOR`         | Guardia operacional y triage             | Incidentes y notificaciones             |
| `SECURITY_ANALYST` | Investigación de eventos de seguridad    | Ninguna en esta fase                    |
| `AUDITOR`          | Evidencia, trazabilidad y conformidad    | Ninguna                                 |
| `VIEWER`           | Consulta operativa                       | Ninguna                                 |

Roles adicionales se crean con `POST /access-control/roles`. Un permiso como `access-control.manage` debe tratarse como sensible; solo un administrador puede asignarlo. Mantener separación entre quien administra acceso y quien audita cuando se asignan roles a personas reales.

## API de identidad y acceso

Swagger: `/api/docs`. En la sección **Auth**: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/logout-all`, `POST /auth/change-password`, `GET /auth/me`, `GET /auth/sessions`, `DELETE /auth/sessions/:sessionId`. No hay `register` público ni recuperación por correo: el aprovisionamiento y recuperación deben ser internos.

En **Access control**: `GET /access-control/permissions`, `GET /access-control/roles`, `GET /access-control/roles/:roleId`, `POST /access-control/roles`, `PUT /access-control/roles/:roleId`, `DELETE /access-control/roles/:roleId`, `GET /access-control/employees`, `GET /access-control/employees/:employeeId`, `POST /access-control/employees`, `PUT /access-control/employees/:employeeId/status`, `PUT /access-control/employees/:employeeId/roles`. `GET /audit` expone los eventos recientes a quien tenga `audit.read`.

Flujo de prueba: migrar PostgreSQL, sembrar los catálogos y el primer administrador, iniciar sesión, copiar el access token en **Authorize** de Swagger, probar `GET /auth/me`, crear un rol personalizado con códigos existentes de `GET /access-control/permissions`, crear un empleado y asignarle el rol. Verificar que el empleado recibe `403` en un endpoint sin su permiso, que sus sesiones quedan inutilizadas tras desactivarlo y que no se puede eliminar el último administrador activo.

## Mapa de páginas del dashboard (siguiente fase, no implementadas aquí)

| Página                   | Datos y acciones                                                          | Permiso principal                            |
| ------------------------ | ------------------------------------------------------------------------- | -------------------------------------------- |
| Resumen                  | Estado de servicios, incidentes activos, latencia p95 y tasa de errores   | `dashboard.read`                             |
| Servicios                | Salud, chequeos, disponibilidad y configuración                           | `services.read` / `services.manage`          |
| Incidentes               | Línea de tiempo, severidad, evidencias y resolución                       | `incidents.read` / `incidents.manage`        |
| Alertas y notificaciones | Alertas activas, canales y entregas                                       | `alerts.read` / `notifications.manage`       |
| Métricas                 | CPU, memoria, tráfico, tasa de errores, p95; gráficos históricos          | `analytics.read`                             |
| Transacciones agregadas  | Conteos y tasas por ventana; **sin exponer datos bancarios individuales** | `transactions.read`                          |
| Logs y auditoría         | Logs correlacionados y cambios administrativos                            | `logs.read` / `audit.read`                   |
| Seguridad                | Eventos relevantes, bloqueos y sesiones                                   | `security.read`                              |
| Asistente IA             | Consultas sobre el estado del monitor con fuentes autorizadas             | `analytics.read`                             |
| Administración           | Empleados, roles, permisos y accesos                                      | `employees.manage` / `access-control.manage` |

Las páginas de CPU/memoria, logs y transacciones requieren fuentes instrumentadas y endpoints de lectura propios. Un código de permiso no implica que esos datos ya existan. Las métricas de negocio deben ser agregadas, minimizadas y no mezclarse con el detector de anomalías de disponibilidad.

## Referencias de diseño

- [NIST SP 800-53: mínimo privilegio y separación de funciones](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf)
- [OWASP Authorization Cheat Sheet: negar por defecto y validar acceso](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [Grafana RBAC: acciones, ámbitos y roles personalizados](https://grafana.com/docs/grafana/latest/administration/roles-and-permissions/access-control/)
- [Datadog: permisos sensibles y roles personalizados](https://docs.datadoghq.com/account_management/rbac/permissions/)
- [OpenTelemetry: métricas, logs y trazas](https://opentelemetry.io/docs/concepts/observability-primer/)
- [Supabase: conexiones directas y pooler](https://supabase.com/docs/guides/database/connecting-to-postgres/)
