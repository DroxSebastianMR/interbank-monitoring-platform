# Arquitectura de Monitoring-System

Diagramas elaborados a partir de `origin/main` en el commit `51fb80f` (10 de octubre de 2026). Cada vista tiene una versión PNG para presentación y una SVG editable de 1800 × 1080.

| Vista | Alcance |
| --- | --- |
| `01-arquitectura-global` | App móvil, NGINX, dos instancias del backend bancario, PostgreSQL/Supabase (`app` y `monitoring`), Redis, Prometheus, Grafana, dashboard, backend de monitoreo y servicio de IA. |
| `02-backend-monitoreo` | Entradas, muestreo cada 10 segundos, ventana de métricas, análisis, decisión de estado, incidentes, persistencia y asistente bajo permiso. |
| `03-servicio-ia` | Dos rutas FastAPI: análisis técnico automático y consultas puntuales; baseline actual, proveedor LLM opcional y entrenamiento offline aún no activo. |

Los diagramas distinguen estado implementado de capacidades previstas. La señal de IA **no** equivale a probabilidad de caída ni a detección de fraude; el estado operacional final lo decide `monitoring-backend`. BullMQ figura solo como infraestructura prevista: no hay trabajadores de colas activos en el código de `main` analizado.

El SVG se puede regenerar con `generate.py` usando Python 3; no requiere paquetes externos.
