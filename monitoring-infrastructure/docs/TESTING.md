# Pruebas y demostración

## 1. Objetivo

Esta guía demuestra que el ecosistema arranca, balancea tráfico, detecta fallos y conserva disponible la plataforma de monitoreo.

## 2. Estado de contenedores

```powershell
docker compose ps
```

Se esperan `nginx`, `app-backend-1`, `app-backend-2`, `monitoring-backend`, `monitoring-ai`, `redis` y `monitoring-dashboard` saludables; Prometheus y Grafana deben estar ejecutándose.

## 3. Balanceo round robin

```powershell
1..6 | ForEach-Object {
  (Invoke-RestMethod http://localhost:8080/health).instance
}
```

El resultado debe alternar entre `app-backend-1` y `app-backend-2`.

## 4. Smoke test

```powershell
docker compose --profile tools run --rm k6 run /scripts/smoke.js
```

Resultado esperado: checks aprobados, tasa de error menor al 1 % y p95 menor a 1000 ms.

## 5. Fallo controlado de transferencias

```powershell
$body = @{ mode = 'DOWN' } | ConvertTo-Json
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8080/simulation/transfers/mode `
  -ContentType application/json `
  -Body $body
```

Espere el intervalo configurado y consulte:

```powershell
Invoke-RestMethod http://localhost:4000/monitored-services |
  Format-Table name,status,lastCheckedAt,latencyMs,message
```

Para restaurar:

```powershell
$body = @{ mode = 'NORMAL' } | ConvertTo-Json
Invoke-RestMethod -Method Post `
  -Uri http://localhost:8080/simulation/transfers/mode `
  -ContentType application/json -Body $body
```

Estados esperados: `UNAVAILABLE`, luego `RECOVERING` y finalmente `OPERATIONAL`.

## 6. Failover de instancia

```powershell
docker compose stop app-backend-1
1..5 | ForEach-Object { Invoke-RestMethod http://localhost:8080/health }
docker compose start app-backend-1
```

NGINX debe continuar sirviendo tráfico desde `app-backend-2`. Durante la prueba, `http://localhost:4000/health` y el dashboard deben seguir disponibles.

## 7. Pruebas automatizadas por repositorio

```powershell
# App Backend
cd interbank-app-backend
pnpm install
pnpm prisma:generate
pnpm build
pnpm test --runInBand

# Monitoring Backend
cd ..\monitoring-backend
pnpm install
pnpm prisma:generate
pnpm build
pnpm test --runInBand

# Dashboard
cd ..\monitoring-dashboard
pnpm install
pnpm build
pnpm test

# IA
cd ..\monitoring-ai
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pytest -q

# Mobile: validación TypeScript
cd ..\interbank-mobile
pnpm install
pnpm exec tsc --noEmit
```

## 8. Carga y estrés

```powershell
docker compose --profile tools run --rm k6 run /scripts/load.js
docker compose --profile tools run --rm k6 run /scripts/stress.js
docker compose --profile tools run --rm k6 run /scripts/failover.js
```

k6 solo genera tráfico. No inserta una fila por request en PostgreSQL.

## 9. Evidencia recomendada para la exposición

Capture o registre:

1. `docker compose ps` con servicios saludables.
2. Respuestas alternadas de NGINX.
3. Dashboard con tres servicios operacionales.
4. Cambio de Transfers a `DOWN`.
5. Dashboard mostrando indisponibilidad.
6. Recuperación a `OPERATIONAL`.
7. Prometheus/Grafana activos.
8. Resultado exitoso del smoke test.
