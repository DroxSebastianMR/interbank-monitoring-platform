# Monitoring Backend

Núcleo de la plataforma: observa servicios, analiza métricas, decide estados y ofrece la API al dashboard. Incidentes, alertas y notificaciones están separados para crecer sin mezclar responsabilidades.

## Stack y ejecución

NestJS 11, Prisma/PostgreSQL, Redis, BullMQ preparado, Axios, Swagger y Jest. Copiar `.env.example` a `.env`, completar `DATABASE_URL`/`JWT_SECRET`, ejecutar `corepack enable`, `pnpm install`, `pnpm prisma:generate`, `pnpm prisma:migrate`, `pnpm prisma:seed` y `pnpm start:dev`. Build: `pnpm build`. Tests: `pnpm test`. Docker: `docker build -t monitoring-backend .`.

El monitor corre cada `MONITOR_INTERVAL_MS` (10 s por defecto), con timeout `MONITOR_TIMEOUT_MS` (3 s). El estado reciente vive en memoria en esta fase; el esquema Prisma deja preparada la persistencia agregada en el schema PostgreSQL `monitoring`.

## Calidad de código

- `pnpm format`: aplica Prettier a todo el repositorio.
- `pnpm format:check`: comprueba el formato sin modificar archivos.
- `pnpm lint`: ejecuta ESLint.
- `pnpm lint:fix`: aplica correcciones automáticas seguras.
- `pnpm verify`: ejecuta formato, ESLint, tests y compilación.

## Swagger y CORS

Swagger UI está disponible en `http://localhost:4000/api/docs` y OpenAPI JSON
en `http://localhost:4000/api/docs-json`. `CORS_ORIGINS` define la lista de
orígenes web autorizados, separados por comas.

## Formato de logs

Utiliza el logger nativo de NestJS para mantener el mismo formato de DALI y del
Interbank App Backend: PID, fecha, nivel, contexto, mensaje y colores oficiales.
La variante compacta solo reduce el relleno previo a `LOG`.

## API

- `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- `GET /access-control/roles`, `GET /access-control/permissions`
- `PUT /access-control/employees/:employeeId/roles`
- `GET /health`, `GET /metrics`
- `GET /monitored-services`
- `POST /monitoring/run`, `POST /monitoring/:id/check`
- `GET /ai/health`, `POST /ai/predict`
- `GET /incidents`
- Swagger: `/api/docs`

Consume únicamente el App Backend/NGINX, Redis, PostgreSQL y `monitoring-ai`; el dashboard depende de esta API.

## Acceso interno

La autenticación pertenece al personal del centro de monitoreo, no a clientes de la app móvil. Los roles `ADMINISTRATOR`, `IT_ENGINEER`, `OPERATOR` y `AUDITOR` agrupan permisos granulares. El access token dura 15 minutos por defecto; el refresh token es opaco, se almacena únicamente como hash, rota en cada uso y queda revocado al cerrar sesión.

El seed es idempotente. Los catálogos de roles y permisos se crean siempre. Para crear o actualizar el administrador inicial se deben definir `DASHBOARD_ADMIN_EMPLOYEE_CODE`, `DASHBOARD_ADMIN_EMAIL` y `DASHBOARD_ADMIN_PASSWORD` en el entorno local; esas credenciales nunca se versionan.
