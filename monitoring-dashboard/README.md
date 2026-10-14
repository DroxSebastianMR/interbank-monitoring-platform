# Monitoring Dashboard

Interfaz operacional React/Vite. Consume exclusivamente `monitoring-backend`; no accede a Supabase, Redis, IA ni Prometheus.

Copiar `.env.example` a `.env`, ejecutar `corepack enable`, `pnpm install` y `pnpm dev`. Build: `pnpm build`; tests: `pnpm test`; Docker: `docker build --build-arg VITE_API_URL=http://localhost:4000 -t monitoring-dashboard .`.

El login, resumen y catálogo de servicios consumen el Monitoring Backend con sesión de empleado y permisos. Si la API está desconectada, se muestra un error: no se sustituyen los datos operativos por mocks. Incidentes, alertas y analítica conservan sus vistas preparatorias. En Docker, el navegador accede al backend por `http://localhost:4000`.

## Arquitectura del frontend

Sigue la distribución por features del [frontend SmartQueue](https://github.com/DroxSebastianMR/smartqueue-frontend/tree/main/smartqueue-frontend/src), adaptada al dominio del monitor:

```text
src/
  app/
    config/                 configuración del cliente
    providers/auth/         contexto, proveedor y hook de sesión
    router/                 constantes, guard y rutas públicas/protegidas
  features/
    auth/                   páginas, formulario, esquema, hook, servicio, tipos y sesión
    dashboard/              página, indicadores, hook, servicio y tipos
    services/               páginas, componentes, formulario, hook, servicio, tipos y filtros
    health/                 página y servicio
  infrastructure/api/       instancia Axios, interceptores y rutas HTTP
  layouts/operations/       shell con Outlet de React Router
  shared/components/       componentes sin lógica de dominio
  styles/                  estilo global existente
```

`@/` resuelve `src/` tanto en TypeScript como en Vite. React Query maneja datos del servidor; Zustand persiste **solo los filtros de presentación** del catálogo. La sesión de empleado se guarda en `sessionStorage` de la pestaña (no en `localStorage`) y se revalida con `/auth/me` al recargar. Axios adjunta el access token, rota el refresh token una vez por lote de respuestas 401 y expira la sesión cuando falla la renovación. Este almacenamiento de tokens en JavaScript exige evitar XSS; para un despliegue real sería preferible acordar cookies `HttpOnly` con el backend. Nunca se persisten datos bancarios ni telemetría operativa en Zustand.

La estructura replica responsabilidades, no la lógica del cine: el monitor no tiene registro público, clientes ni roles SmartQueue. Los permisos siguen siendo los emitidos por `monitoring-backend` y se verifican de nuevo en sus guards.
