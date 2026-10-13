# Monitoring Backend

Núcleo de la plataforma: observa servicios, analiza métricas, decide estados y ofrece la API al dashboard. Incidentes, alertas y notificaciones están separados para crecer sin mezclar responsabilidades.

## Stack y ejecución

NestJS 11, Prisma/PostgreSQL, Redis, BullMQ preparado, Axios, Swagger y Jest. Copiar `.env.example` a `.env`, completar `DATABASE_URL`/`JWT_SECRET`, ejecutar `corepack enable`, `pnpm install`, `pnpm prisma:generate`, `pnpm prisma:migrate`, `pnpm prisma:seed` y `pnpm start:dev`. Build: `pnpm build`. Tests: `pnpm test`. Docker: `docker build -t monitoring-backend .`.

Para **inspeccionar Swagger sin base de datos, Redis ni `.env`**, ejecutar `pnpm start:docs` desde esta carpeta y abrir `http://localhost:4000/api/docs`. Este modo se liga solo a `127.0.0.1`, no ejecuta sondeos y devuelve 503 en todas las rutas operativas. Muestra el contador de endpoints reales al iniciar; la lista de implementados y pendientes está en [docs/ENDPOINT_STATUS.md](docs/ENDPOINT_STATUS.md). Si el puerto 4000 está ocupado, definir `MONITORING_PORT` antes de iniciar.

El monitor corre cada `MONITOR_INTERVAL_MS` (10 s por defecto), con timeout `MONITOR_TIMEOUT_MS` (3 s). El estado reciente vive en memoria en esta fase; el esquema Prisma deja preparada la persistencia agregada en el schema PostgreSQL `monitoring`.

## Arquitectura de módulos

`src/modules/index.ts` registra las funcionalidades en `AppModule`. Cada módulo tiene su propio `index.ts` y mantiene el módulo NestJS en su raíz; los adaptadores HTTP viven en `controllers/`, la lógica en `services/`, los accesos a datos en `repositories/` cuando hacen falta y los contratos en `dto/`, `interfaces/` o `types/`. Los imports internos usan `@/`, igual que el backend móvil. La configuración está separada en `config/application`, `authentication`, `environment`, `cors`, `swagger`, `validation` e integraciones; Prisma vive en `common/prisma`, y los errores globales en `common/filters` y `common/errors`. `ai-integration` concentra el cliente HTTP tipado de FastAPI y sus límites de tiempo; `monitoring` orquesta chequeos y evita repetir un chequeo que ya está en curso para el mismo servicio.

`GET /metrics` expone contadores e histogramas Prometheus por método y patrón de ruta. Esto permite consultar tiempos p95 por endpoint sin incluir IDs, parámetros ni datos del usuario como etiquetas. El benchmark CLI mide esos tiempos desde el cliente y complementa la telemetría del servidor.

La rama de IA añade ventanas de 60 s, métricas de tráfico de Prometheus, análisis Python con fallback a reglas, incidentes y alertas persistidos. Aplicar las migraciones Prisma antes de ejecutar la API. El asistente protegido por `analytics.read` se consulta en `POST /assistant/ask`. Ver `../docs/MONITORING_AI.md`.

## Calidad de código

- `pnpm format`: aplica Prettier a todo el repositorio.
- `pnpm format:check`: comprueba el formato sin modificar archivos.
- `pnpm lint`: ejecuta ESLint.
- `pnpm lint:fix`: aplica correcciones automáticas seguras.
- `pnpm verify`: ejecuta formato, ESLint, tests y compilación.
- `pnpm benchmark:endpoints`: mide p50/p95 de las rutas publicadas en OpenAPI contra un servidor real. Por defecto solo prueba GET y la predicción sin escritura; cada ruta omitida aparece con su motivo. Se necesitan los demás servicios activos para medir sus latencias reales.

Para el benchmark: `MONITOR_BENCH_URL` (por defecto `http://127.0.0.1:4000`), `MONITOR_BENCH_SAMPLES` (1–100) y `MONITOR_BENCH_ACCESS_TOKEN` para rutas protegidas. Las rutas que crean sesiones, cambian roles o disparan chequeos se omiten salvo `MONITOR_BENCH_INCLUDE_WRITES=1`; usa ese modo únicamente contra un entorno de pruebas. Login requiere `MONITOR_BENCH_EMAIL` y `MONITOR_BENCH_PASSWORD`; la asignación de roles requiere además `MONITOR_BENCH_EMPLOYEE_ID` y `MONITOR_BENCH_ROLE_CODES`. El benchmark no imprime contraseñas ni tokens.

## Swagger y CORS

Swagger UI está disponible en `http://localhost:4000/api/docs` y OpenAPI JSON
en `http://localhost:4000/api/docs-json`. `CORS_ORIGINS` define la lista de
orígenes web autorizados, separados por comas.

## Formato de logs

Utiliza el logger nativo de NestJS para mantener el mismo formato de DALI y del
Interbank App Backend: PID, fecha, nivel, contexto, mensaje y colores oficiales.
La variante compacta solo reduce el relleno previo a `LOG`.

## API

- Autenticación y permisos: ver [docs/ACCESS_AND_DASHBOARD.md](docs/ACCESS_AND_DASHBOARD.md).
- `GET /health`, `GET /metrics`
- `GET /monitored-services`
- `POST /monitoring/run`, `POST /monitoring/:id/check`
- `GET /ai/health`, `POST /ai/predict`
- `GET /incidents`
- Swagger: `/api/docs`

Consume únicamente el App Backend/NGINX, Redis, PostgreSQL y `monitoring-ai`; el dashboard depende de esta API.

## Acceso interno

La autenticación pertenece al personal del centro de monitoreo, no a clientes de la app móvil. Los roles `ADMINISTRATOR`, `IT_ENGINEER`, `OPERATOR`, `SECURITY_ANALYST`, `AUDITOR` y `VIEWER` agrupan permisos granulares. El access token dura 15 minutos por defecto; el refresh token es opaco, se almacena únicamente como hash, rota en cada uso y queda revocado al cerrar sesión.

El seed es idempotente. Los catálogos de roles y permisos se crean siempre. Para **crear por primera vez** el administrador inicial se deben definir `DASHBOARD_ADMIN_EMPLOYEE_CODE`, `DASHBOARD_ADMIN_EMAIL` y `DASHBOARD_ADMIN_PASSWORD` en el entorno local; ejecutar de nuevo el seed no restablece su clave ni reactiva una cuenta deshabilitada. Esas credenciales nunca se versionan.
