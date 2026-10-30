# Incremento 3: página pública y comunicaciones de servicio

Fecha: 30 de octubre de 2026.

Rama: `codex/feat-public-service-status`, creada desde `origin/develop` (`214ded0`). Se incorporaron por avance rápido los incrementos 1 (`792dec9`) y 2 (`b5ab7bc`), todavía no integrados en develop. No se modificó develop ni se realizó push.

## Qué significa página independiente

La página tiene entrada HTML/React propia, sin layout de empleados, AuthProvider, tokens ni cliente HTTP privado. Puede desplegarse como contenedor estático separado del dashboard y del banco simulado. No depende del login bancario para abrirse. Reutiliza React, React Query y los componentes existentes; no introduce otra aplicación ni librería de UI.

La fuente sigue siendo Monitoring Backend y su base de datos. Independencia de presentación no equivale a tolerancia a la caída del host o de toda la plataforma: si el monitor no responde, se informa que no puede comprobarse el estado y los últimos datos quedan identificados como históricos. Un despliegue en infraestructura independiente requiere configuración operacional posterior.

El catálogo público es explícito: Inicio de sesión, Consulta de saldo y Transferencias ficticias. Registrar un endpoint interno no lo publica automáticamente. La respuesta pública selecciona únicamente campos permitidos: no incluye cuentas, empleados, notas internas, endpoints, errores técnicos ni puntuaciones de riesgo.

## Publicación y recuperación

- Los cambios técnicos confirmados producen avisos iniciales, actualizaciones y recuperaciones. El riesgo por sí solo no cambia el estado operativo.
- La creación del aviso se confirma en la misma transacción que la transición del incidente. La tabla persistente conserva pendientes e intentos ante reinicios o fallos; no necesita otro broker.
- Cada servicio tiene secuencias monotónicas. Antes de publicar se revalidan configuración, tramo del incidente y condición reciente. Un mensaje antiguo no sobrescribe una condición más nueva.
- El worker revisa pendientes cada 5 segundos, con lotes de hasta 20 y reintentos con espera creciente hasta 60 segundos. Reconcilia cada 10 segundos y prepara seguimientos cada 5 minutos mientras continúa una afectación. Son intervalos de ejecución, no una garantía de entrega/SLA.
- Los textos son plantillas versionadas (`laboratory-status-v1`), sin ETA inventada ni confirmación de una operación bancaria particular.
- Un aviso preventivo requiere autorización explícita de un operador habilitado, motivo interno, riesgo alto reciente y ausencia de afectación confirmada/actualización pendiente. Expira a los 5 minutos y no declara una caída. El backend vuelve a comprobar las condiciones al publicar.

Tras publicar una recuperación, el worker consulta la misma proyección de lectura pública utilizada por la API. Revalida el tramo y recuperación reciente, y registra `RECOVERY_PUBLISHED` con `{ publicationId, visibleAt }` en el expediente. Esto completa la dependencia del cierre del incremento 2; las demás condiciones de cierre siguen siendo obligatorias.

`visibleAt` acredita disponibilidad en el modelo de lectura de la API. No es una sonda HTTP externa, prueba de que NGINX sea accesible, recepción push ni constancia de lectura de un usuario. La comprobación de red/despliegue queda pendiente de validación operacional.

## API e interfaz

| Ruta | Acceso | Propósito |
| --- | --- | --- |
| GET /public/status | Público, solo lectura | Estado actual, frescura y último aviso |
| GET /public/status/history?service=login&cursor=UUID | Público, solo lectura | Historial paginado, 20 avisos por página |
| GET /public/status/notices/:id | Público, solo lectura | Aviso publicado por identificador público |
| GET /status-publications?incidentId=UUID | incidents.read | Intentos del expediente, hasta 100 recientes |
| POST /status-publications/:id/retry | incidents.read + notifications.manage | Adelantar un pendiente, sin duplicarlo |
| POST /status-publications/preventive | services.read + notifications.manage | Autorizar plantilla preventiva |

Los GET públicos tienen límite de 120 solicitudes/minuto por IP, sin credenciales y sin caché de estado. CORS público se limita a estas respuestas. Los comandos conservan JWT, permisos y auditoría existentes. La autorización preventiva usa commandId idempotente.

La página consulta estado cada 10 segundos, valida contratos y distingue carga, ausencia de datos, error y desconexión. El envejecimiento local impide mantener un estado operativo después de vencer las observaciones. Conserva filtro de servicio/aviso en URL y ofrece historial real, sin porcentajes o gráficos simulados.

En el expediente privado se reutilizan Card y React Query para consultar comunicaciones y adelantar reintentos autorizados. En el detalle de servicio se reutiliza Dialog para la autorización preventiva. No se rediseñaron los demás módulos.

## Activación pendiente

La funcionalidad queda apagada por defecto mediante `PUBLIC_STATUS_ENABLED=false`. Las plantillas requieren revisión antes de habilitar publicación. No se editaron secretos ni archivos .env reales.

Antes de arrancar, revisar la conexión de destino y aplicar las migraciones pendientes de los tres incrementos, incluida `20261030180000_public_service_status`, y regenerar Prisma Client según el procedimiento del backend. Esto es necesario para que el código reconozca los modelos nuevos. Revisar/resguardar el destino antes de migrar; no se ejecutó ninguna migración en este incremento.

Después de esa preparación, establecer `PUBLIC_STATUS_ENABLED=true` en la configuración del backend. Para despliegue local opcional, el comando siguiente se documenta, **no se ejecutó**:

```powershell
# Desde monitoring-infrastructure, con la configuración revisada.
docker compose --profile public-status up -d --build
```

El perfil añade la página estática en `http://localhost:5174/status`, ligada a loopback. No tiene depends_on del banco ni del monitor: puede mostrar desconexión aunque ellos no arranquen. `PUBLIC_STATUS_API_URL` configura el Monitoring Backend consultado desde el navegador; debe ser una URL accesible al visitante, no el nombre DNS interno de Docker.

El target Docker `public-status` usa `build:status` y empaqueta solamente la entrada pública. El target predeterminado del dashboard conserva el dashboard privado y permite `/status`. En Vite de desarrollo se usa `/status.html`. `VITE_PUBLIC_STATUS_API_URL` configura la API pública y `VITE_PUBLIC_STATUS_URL` el destino de los enlaces privados hacia la página. Estas variables se fijan al compilar; no contienen credenciales.

## Validación y siguientes pasos

Se prepararon casos unitarios para plantillas, deduplicación, secuencias, ejecución compartida del worker y recuperación sin observaciones frescas. No se ejecutaron pruebas, compilación, lint, generación de Prisma, Docker ni servicios, conforme a la restricción vigente. La revisión de cambios y whitespace es estática; no sustituye validación funcional.

Queda validar contra PostgreSQL y navegador: caída/recuperación, reaparición del incidente, reinicio del publicador, reintentos, permisos, aviso preventivo vencido, ausencia de datos y caída del monitor. También comprobar CORS, enlace público y cierre del expediente en el despliegue real.

Este incremento conecta detección confirmada -> atención del incidente -> comunicación pública -> evidencia de recuperación para cierre. No implementa entrega a móviles/SMS, medición de recepción externa ni alta disponibilidad de infraestructura. La consolidación de evidencia SRS/EDT y las campañas de aceptación continúan después de validar estos flujos.
