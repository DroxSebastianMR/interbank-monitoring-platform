# Interbank App Backend

Backend bancario **simulado** que sirve como sistema supervisado. Expone autenticación, saldo, transferencias, health y modos de falla controlada. No procesa operaciones financieras reales.

## Tecnologías y arquitectura

NestJS 11, TypeScript estricto, Prisma/PostgreSQL, Swagger, class-validator y Jest. El código está separado en `src/modules`, la persistencia en `prisma/` y las pruebas E2E en `test/`.

La organización toma como referencia el patrón del backend DALI:

- `src/common`: piezas transversales reutilizables (Prisma, errores y filtros).
- `src/config`: configuración tipada separada en `application`, `environment`, `cors`, `swagger` y `validation`, con constantes reutilizables y una API pública única.
- `src/modules`: funcionalidades de negocio aisladas. Cada módulo contiene su `*.module.ts`, `index.ts`, `controllers`, `services` y, cuando corresponde, `dto`.
- `src/app.module.ts`: composición mínima de configuración, infraestructura y `FEATURE_MODULES`.
- `src/main.ts`: arranque HTTP, seguridad, CORS, validación, filtro global, Swagger y mensaje final.

Los imports internos usan el alias `@/`, por ejemplo
`@/modules/auth/services/auth.service`. `tsconfig-paths` lo resuelve en desarrollo y
Jest; después de compilar, `tsc-alias` convierte los alias para que
`node dist/main.js` funcione sin dependencias especiales de ejecución.

La explicación completa y la guía para crear módulos están en
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
El diseño del primer ingreso y la sesión rápida está documentado en
[`docs/AUTHENTICATION.md`](docs/AUTHENTICATION.md).
La estrategia de conexiones está en [`docs/DATABASE.md`](docs/DATABASE.md) y la
diferencia entre specs, mocks, seed y E2E en [`docs/TESTING.md`](docs/TESTING.md).
El contrato del menú, cuentas y operaciones está en
[`docs/HOME_BANKING.md`](docs/HOME_BANKING.md).
El modelo de cuentas, catálogos, tarjetas y CCI simulado está en
[`docs/ACCOUNTS.md`](docs/ACCOUNTS.md).

## Configuración y ejecución

1. Copiar `.env.example` a `.env` y configurar `DATABASE_URL`, `DIRECT_URL` y un `JWT_SECRET` de al menos 32 caracteres.
2. `corepack enable`
3. `pnpm install`
4. `pnpm prisma:generate`
5. `pnpm start:dev`

Al terminar el arranque se imprimen las direcciones de API, Swagger, OpenAPI y
los orígenes CORS habilitados. Build de producción: `pnpm build`. Ejecución del
build: `pnpm start:prod`. Tests: `pnpm test`. Docker:
`docker build -t interbank-app-backend .`.

## Calidad de código

- `pnpm format`: aplica Prettier a todo el repositorio.
- `pnpm format:check`: comprueba el formato sin modificar archivos.
- `pnpm lint`: ejecuta ESLint.
- `pnpm lint:fix`: corrige automáticamente problemas compatibles con ESLint.
- `pnpm verify`: ejecuta formato, ESLint, tests y compilación.

## Swagger y CORS

Swagger UI está disponible en `http://localhost:3000/api/docs` y el contrato
OpenAPI JSON en `http://localhost:3000/api/docs-json`. La variable
`CORS_ORIGINS` contiene una lista separada por comas de orígenes permitidos.
No se recomienda usar `*` fuera de pruebas locales.

## Formato de logs

El backend utiliza directamente el logger nativo de NestJS, igual que el backend
DALI de referencia. Durante el arranque se muestran el PID, la fecha, el nivel,
el contexto y cada ruta registrada con los colores propios de Nest. No requiere
`LOG_PRETTY`. `CompactConsoleLogger` conserva ese formato y reduce únicamente el
relleno horizontal previo al nivel `LOG` para aprovechar mejor la terminal.

### Desarrollo local independiente

El archivo `.env` es obligatorio y no se versiona. En PowerShell se prepara con
`if (!(Test-Path .env)) { Copy-Item .env.example .env }`; en Git Bash, con
`[ -f .env ] || cp .env.example .env`. Después se deben reemplazar los valores
de ejemplo. `JWT_SECRET` debe tener al menos 32 caracteres.

Para probar el arranque y los endpoints simulados antes de conectar Supabase,
`DATABASE_URL` y `DIRECT_URL` pueden apuntar temporalmente a PostgreSQL local. Estas URLs no crean
la base ni sustituyen la configuración real: cualquier flujo que consulte Prisma
requerirá una instancia PostgreSQL disponible. La secuencia de verificación es:

```powershell
pnpm prisma:generate
pnpm test --runInBand
pnpm build
pnpm start:dev
```

En otra terminal:

```powershell
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:3000/simulation
```

## Endpoints

- `GET /health`
- `GET /auth/health`, `GET /accounts/health`, `GET /transfers/health`
- `POST /auth/login`: primer ingreso con DNI, correo, contraseña y dispositivo.
- `POST /auth/device-login`: autenticación posterior desde un dispositivo registrado.
- `GET /home`: menú principal autenticado con saldos PEN/USD y movimientos.
- `GET /accounts`, `GET /accounts/:id/balance` y `GET /accounts/:id/transactions`.
- `POST /transfers`: transferencia simulada y atómica entre cuentas de igual moneda.
- Pago de servicios completo: catálogo por rubros/empresas/convenios, consulta de recibos, pago idempotente, constancia, historial y pagos frecuentes. Consulte [`docs/SERVICE-PAYMENTS.md`](docs/SERVICE-PAYMENTS.md).
- `GET /accounts/:id/balance`
- `POST /transfers`
- `GET /simulation` y `POST /simulation/:service/mode` (solo desarrollo o `SIMULATION_ENABLED=true`)
- Swagger: `/api/docs`

`monitoring-infrastructure` crea dos contenedores de esta misma imagen y NGINX distribuye solicitudes entre ambos. `monitoring-backend` observa sus endpoints de salud.
