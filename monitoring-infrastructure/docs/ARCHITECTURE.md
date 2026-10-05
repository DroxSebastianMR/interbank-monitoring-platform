# Arquitectura de la plataforma

## 1. Objetivo

El producto es una plataforma que observa servicios digitales, identifica degradaciones o indisponibilidad y presenta su estado operacional. La aplicación bancaria es un sistema simulado utilizado para producir tráfico y fallos controlados; no es una aplicación financiera real.

## 2. Separación fundamental

```text
SISTEMA SUPERVISADO

interbank-mobile / k6
          |
          v
        NGINX
       /     \
app-backend-1 app-backend-2


PLATAFORMA DE MONITOREO

Monitoring Backend ---> Redis
       |                  |
       +--> Monitoring AI |
       |                  |
       +--> PostgreSQL <--+
       |
       +--> Monitoring Dashboard

Prometheus ---> Grafana
```

El Monitoring Backend no está detrás del NGINX del sistema bancario. Si NGINX o ambas instancias bancarias fallan, la plataforma de monitoreo debe seguir disponible para registrar y mostrar el problema.

## 3. Repositorios

| Repositorio | Responsabilidad | Tecnología |
|---|---|---|
| `interbank-mobile` | Cliente bancario simulado | React Native, Expo, TypeScript |
| `interbank-app-backend` | Servicios bancarios simulados y fallos controlados | NestJS, Prisma |
| `monitoring-backend` | Observación, reglas, estado y API operacional | NestJS, Redis, Prisma, BullMQ preparado |
| `monitoring-ai` | Señal de anomalía/riesgo | FastAPI, scikit-learn preparado |
| `monitoring-dashboard` | Vista operacional del equipo | React, Vite, TanStack Query |
| `monitoring-infrastructure` | Orquestación y observabilidad técnica | Docker Compose, NGINX, Redis, Prometheus, Grafana, k6 |

Cada carpeta posee su propio `.git`. No existe un monorepo ni un repositorio Git padre.

## 4. Flujo vertical implementado

1. `MonitoringService` ejecuta comprobaciones cada `MONITOR_INTERVAL_MS`.
2. Consulta `/auth/health`, `/accounts/health` y `/transfers/health` del App Backend.
3. Mide latencia, disponibilidad y fallos consecutivos.
4. `DetectionService` aplica reglas configurables.
5. `ServiceStateService` decide `OPERATIONAL`, `DEGRADED`, `UNAVAILABLE` o `RECOVERING`.
6. `MonitoredServicesService` conserva el último estado en memoria.
7. `GET /monitored-services` entrega el estado al dashboard.
8. TanStack Query actualiza la interfaz cada diez segundos.

## 5. Responsabilidades internas

- **Monitoring:** observa y recopila señales.
- **Detection:** interpreta señales y produce severidad/razones.
- **Service State:** decide el estado operacional final.
- **Incidents:** administrará el ciclo de vida de incidentes.
- **AI Integration:** solicita una señal de riesgo; no decide caídas.
- **Metrics:** expone telemetría agregada para Prometheus.

Esta separación evita que la IA cree incidentes directamente o que una falla del sistema supervisado derribe la plataforma.

## 6. Persistencia

- PostgreSQL/Supabase: datos durables, historial, servicios e incidentes.
- Redis: cache, estado reciente, colas y deduplicación futura.
- Memoria: último snapshot de servicios durante esta primera entrega.

Los schemas Prisma `app` y `monitoring` separan lógicamente ambos dominios incluso si comparten un proyecto Supabase.

## 7. IA

`monitoring-ai` ejecuta actualmente un baseline determinista y responde `modelMode=baseline`. La carpeta `training/` prepara Isolation Forest, pero no se declara un modelo entrenado hasta disponer de un dataset representativo y una evaluación real.

## 8. Alcance actual y siguiente etapa

Funcional ahora: health checks, balanceo, modos de falla, reglas, estados, API, dashboard, señal baseline, Redis, Swagger, Prometheus/Grafana base y k6.

Preparado para evolución: persistencia de métricas agregadas, migraciones Supabase, workers BullMQ, ciclo completo de incidentes, alertas, notificaciones, autenticación productiva y entrenamiento/evaluación del modelo.
