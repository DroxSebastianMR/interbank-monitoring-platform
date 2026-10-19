# Monitoring Infrastructure

Orquesta seis repositorios hermanos sin contener su código. Levanta el sistema bancario simulado detrás de NGINX y, de forma independiente, la plataforma de monitoreo.

## Documentación del proyecto

- [Ejecutar el dashboard actual en un laboratorio Docker local](docs/DASHBOARD-LOCAL.md)
- [Arquitectura y decisiones técnicas](docs/ARCHITECTURE.md)
- [Instalación completa en Windows](docs/INSTALLATION-WINDOWS.md)
- [Plan de pruebas y demostración](docs/TESTING.md)
- [Guía de trabajo para el equipo](docs/TEAM-GUIDE.md)
- [Instalador automático de doble clic para Windows](scripts/windows/README.md)

## Requisitos y ubicación

Docker Desktop con Compose v2, WSL 2 en Windows y opcionalmente Node.js 20/Python 3.12 para ejecución fuera de Docker. La carpeta padre debe contener `interbank-mobile`, `interbank-app-backend`, `monitoring-backend`, `monitoring-ai`, `monitoring-dashboard` y `monitoring-infrastructure` al mismo nivel.

En Windows, una computadora nueva puede prepararse haciendo doble clic en `SETUP-WINDOWS.cmd`. El lanzador delega en la arquitectura modular de `scripts/windows/`.

## Configuración de Supabase

1. Crear un proyecto Supabase y conservar PostgreSQL como único servicio utilizado.
2. Crear los schemas `app` y `monitoring` o conceder al usuario Prisma permisos para crearlos.
3. Copiar `.env.example` a `.env`.
4. Colocar la cadena pooler/directa apropiada en `APP_DATABASE_URL` y `MONITORING_DATABASE_URL`; no versionar `.env`.
5. Desde cada backend, ejecutar las migraciones Prisma cuando se creen para el entorno. En esta fase el arranque y el flujo de health no requieren consultar la base.

Para desarrollo offline futuro se puede añadir un archivo Compose adicional con `postgres:17-alpine`, dos schemas y URLs internas; PostgreSQL se excluye deliberadamente del Compose principal.

## Arranque y comprobación

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
