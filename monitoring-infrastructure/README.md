# Monitoring Infrastructure

Orquesta seis repositorios hermanos sin contener su código. Levanta el sistema bancario simulado detrás de NGINX y, de forma independiente, la plataforma de monitoreo.

## Documentación del proyecto

- [Arquitectura y decisiones técnicas](docs/ARCHITECTURE.md)
- [Instalación completa en Windows](docs/INSTALLATION-WINDOWS.md)
- [Plan de pruebas y demostración](docs/TESTING.md)
- [Guía de trabajo para el equipo](docs/TEAM-GUIDE.md)
- [Instalador automático de doble clic para Windows](scripts/windows/README.md)

## Requisitos y ubicación

Docker Desktop con Compose v2, WSL 2 en Windows y opcionalmente Node.js 20/Python 3.12 para ejecución fuera de Docker. La carpeta padre debe contener `interbank-mobile`, `interbank-app-backend`, `monitoring-backend`, `monitoring-ai`, `monitoring-dashboard` y `monitoring-infrastructure` al mismo nivel.

En Windows, una computadora nueva puede prepararse haciendo doble clic en `SETUP-WINDOWS.cmd`. El lanzador delega en la arquitectura modular de `scripts/windows/`.

## Configuración de Supabase

1. Usar dos proyectos Supabase independientes: uno para la aplicación bancaria y otro para el monitor. Así, una caída de la base bancaria no afecta a la persistencia del monitor.
2. Usar el schema `app` solamente en el proyecto bancario y `monitoring` solamente en el proyecto del monitor; conceder al usuario Prisma permisos para crear su schema si aún no existe.
3. Copiar `.env.example` a `.env`.
4. Colocar en `APP_DATABASE_URL` la URL del proyecto bancario y en `MONITORING_DATABASE_URL` la del proyecto del monitor; no versionar `.env`.
5. Aplicar las migraciones Prisma de cada backend únicamente a su proyecto correspondiente. En una base ya poblada, comprobar primero `prisma migrate status` y no volver a ejecutar el seed sin necesidad.

Para desarrollo offline futuro se puede añadir un archivo Compose adicional con dos instancias PostgreSQL independientes; PostgreSQL se excluye deliberadamente del Compose principal.

## Arranque y comprobación

### Desarrollo híbrido local (Supabase + Docker)

Si los backends y el dashboard corren directamente en Windows, use PostgreSQL de
Supabase, Redis y Prometheus en Docker. El archivo
[`prometheus/prometheus.local.yml`](prometheus/prometheus.local.yml) consulta
los endpoints locales mediante `host.docker.internal`; el archivo
`prometheus/prometheus.yml` permanece reservado para el Compose completo.

Configure `DATABASE_URL` y, en el backend bancario, `DIRECT_URL` en los `.env`
ignorados por Git. Use `schema=app` para Interbank y `schema=monitoring` para
el monitor, cada uno en su propio proyecto Supabase. En el `.env` del monitor, `APP_BACKEND_URL=http://localhost:3000`,
`AI_SERVICE_URL=http://localhost:8000` y
`PROMETHEUS_URL=http://localhost:9090`. No copie credenciales al repositorio.

El orden de arranque es Redis, Prometheus, backend bancario (3000), IA (8000),
monitor (4000) y dashboard (5173). Los backends usan `pnpm start:dev`, la IA
`python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000` y el
dashboard `pnpm dev`. En instalaciones nuevas, aplique las migraciones de cada
backend y ejecute el seed solo si necesita datos iniciales; no repita el seed
sobre la base bancaria existente. Pruebe `/health` en 3000, 8000 y 4000 y abra el
dashboard en `http://localhost:5173`.

No ejecute a la vez el Compose de desarrollo, que publica su propio Redis en
6379, y un contenedor Redis independiente publicado en ese mismo puerto.

### Demo local con dos instancias bancarias

Este montaje conserva los procesos de Redis, Prometheus, IA y dashboard ya
levantados. Compruebe que los `.env` del backend bancario y del monitor apuntan
a **proyectos Supabase diferentes** y que sus migraciones están al día. Los
seeds de historia son idempotentes y añaden registros identificables; no
alteran saldos ni contraseñas.

```powershell
cd interbank-app-backend
pnpm prisma:seed:demo-history       # 620 movimientos DEMO-HISTORY-*
cd ../monitoring-backend
pnpm prisma:seed:demo-history       # 720 sondas origin=DEMO y 6 incidentes resueltos
```

Inicie el backend bancario en dos terminales, con el mismo `.env` y Redis:

```powershell
cd interbank-app-backend
$env:APP_PORT='3000'; $env:INSTANCE_NAME='app-backend-1'; pnpm start:dev
```

```powershell
cd interbank-app-backend
$env:APP_PORT='3002'; $env:INSTANCE_NAME='app-backend-2'; pnpm start:dev
```

Desde la raíz del repositorio, levante el proxy local en un puerto distinto
al dashboard. Si `interbank-demo-nginx` ya existe, use ese contenedor en vez de
crear otro con el mismo nombre.

```powershell
$config=(Resolve-Path 'monitoring-infrastructure/nginx/local/app-backend.conf').Path
docker run -d --name interbank-demo-nginx --restart unless-stopped -p 127.0.0.1:8080:80 -v "${config}:/etc/nginx/conf.d/default.conf:ro" nginx:1.27-alpine
```

Configure `APP_BACKEND_URL=http://localhost:8080` en el `.env` ignorado del
monitor y reinicie **solo** su proceso `pnpm start:dev` para cargar el cambio.
En `monitoring-dashboard/.env`, mantenga `VITE_API_URL=http://localhost:4000`.
El dashboard se abre en `http://localhost:5173`; la API balanceada y su
Swagger están en `http://localhost:8080` y `http://localhost:8080/api/docs`.
El resumen del dashboard muestra sondas, incidentes y estado operacional;
los 620 movimientos se consultan desde la app bancaria, no representan
tráfico HTTP real ni cambian los saldos. La etiqueta `DEMO` permite retirar
posteriormente esos datos sin borrar registros ordinarios.

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
./scripts/health-check.sh
```

En PowerShell use `Copy-Item .env.example .env` y consulte los mismos endpoints con `Invoke-WebRequest`. Detener: `docker compose down`. Reconstruir: `docker compose up -d --build`. `scripts/reset.sh` elimina volúmenes locales de Redis/Grafana/Prometheus y requiere intención explícita.

En Windows, el flujo recomendado completo es:

```powershell
cd monitoring-infrastructure
Copy-Item .env.example .env
docker compose up -d --build
docker compose ps
Invoke-RestMethod http://localhost:8080/health
Invoke-RestMethod http://localhost:4000/monitored-services
```

## URLs y puertos

| Componente | URL host | Puerto interno |
|---|---|---|
| NGINX / App API | http://localhost:8080 | 80 |
| Monitoring Backend / Swagger | http://localhost:4000 / http://localhost:4000/api/docs | 4000 |
| Monitoring AI / OpenAPI | http://localhost:8000 / http://localhost:8000/docs | 8000 |
| Dashboard | http://localhost:5173 | 80 |
| Prometheus | http://localhost:9090 | 9090 |
| Grafana | http://localhost:3001 | 3000 |

Redis no se publica en el Compose base. En desarrollo: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d`, que expone Redis 6379 y los backends en 3000/3002.

## Balanceo y failover

Ejecute varias veces `curl http://localhost:8080/health`; el campo `instance` alterna entre `app-backend-1` y `app-backend-2`. Para probar failover:

```bash
docker compose --profile tools run --rm k6 run /scripts/failover.js
docker compose stop app-backend-1
curl http://localhost:8080/health
docker compose start app-backend-1
```

NGINX usa round robin. El Monitoring Backend consulta directamente una instancia supervisada y no está detrás del NGINX del sistema que puede fallar; por ello sigue disponible durante la interrupción.

## k6

Smoke: `docker compose --profile tools run --rm k6 run /scripts/smoke.js`. Sustituya el archivo por `load.js`, `stress.js` o `failover.js`. k6 solo genera tráfico; no escribe requests en PostgreSQL.

## Grafana y observabilidad

Prometheus recopila `/metrics` del Monitoring Backend cada 10 segundos. Grafana provisiona Prometheus y un dashboard técnico mínimo. El Monitoring Dashboard es la vista operacional y no sustituye a Grafana.

## Cloudflare Tunnel (futuro)

`cloudflared tunnel --url http://localhost:8080` puede exponer NGINX temporalmente, o una ruta configurada en un túnel administrado. No se debe exponer PostgreSQL, Redis, Docker ni Supabase a través del túnel. Añadir autenticación y políticas de acceso antes de cualquier exposición pública.

## Troubleshooting

- Variables ausentes: revise `.env`; los backends fallan temprano con un mensaje de validación.
- Builds Node: el proyecto usa `pnpm-lock.yaml`; Docker instala con la versión de pnpm fijada en los Dockerfiles.
- Logs: ambos backends NestJS usan el logger nativo para mantener el mismo formato visual que DALI.
- Supabase: valide SSL, usuario, pooler y permisos de schema; el flujo health usa almacenamiento reciente aunque la persistencia aún no esté migrada.
- Dashboard sin datos: revise CORS y `http://localhost:4000/health`.
- Redis: `docker compose logs redis monitoring-backend`.
- Estado completo: `docker compose ps` y `docker compose logs --tail=100 <service>`.
- Error de WSL/virtualización: ejecute `scripts/enable-docker-prerequisites.ps1` como administrador y reinicie Windows.
