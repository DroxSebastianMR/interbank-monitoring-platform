# Monitoring Dashboard

Interfaz operacional React/Vite. Consume exclusivamente `monitoring-backend`; no accede a Supabase, Redis, IA ni Prometheus.

Copiar `.env.example` a `.env`, ejecutar `corepack enable`, `pnpm install` y `pnpm dev`. Build: `pnpm build`; tests: `pnpm test`; Docker: `docker build --build-arg VITE_API_URL=http://localhost:4000 -t monitoring-dashboard .`.

Incluye login visual, resumen, servicios y health funcionales; incidentes, alertas y analítica son vistas preparadas. `VITE_USE_MOCKS=true` activa datos temporales marcados explícitamente. En Docker, el navegador accede al backend por `http://localhost:4000`.
