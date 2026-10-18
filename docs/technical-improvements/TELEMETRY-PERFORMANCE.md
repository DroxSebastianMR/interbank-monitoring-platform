# Plan de telemetría y rendimiento

## Qué significaba “Sin telemetría”

La topología conocía que Nginx y las dos réplicas estaban configurados, pero no recibía una observación reciente que demostrara su estado. Por eso `NO_DATA` nunca debía interpretarse como “caído”. Era una ausencia de evidencia.

La vista ahora distingue cuatro estados:

| Estado | Color | Significado |
| --- | --- | --- |
| `OPERATIONAL` | Verde | Hay una observación reciente y la instancia responde dentro de los umbrales. |
| `DEGRADED` | Ámbar | Responde, pero el p95 supera el umbral o la tasa de error llega al 5 %. |
| `UNAVAILABLE` | Rojo | La sonda falla o Prometheus informa `up = 0`. |
| `NO_DATA` | Gris | No existe una muestra o tiene más de 30 segundos; no confirma una caída. |

## Implementación realizada

El endpoint `GET /dashboard/topology` combina dos fuentes:

- **Nginx:** sonda activa a través de `APP_BACKEND_URL/health`, con timeout de 800 ms.
- **Réplicas:** Prometheus consulta `up`, solicitudes por segundo, errores 5xx y latencia p95 por etiqueta `instance`.

El dashboard actualiza esta vista cada 10 segundos. Cada nodo muestra, cuando existe información:

- estado y color;
- fuente de telemetría;
- antigüedad de la muestra;
- latencia de la sonda o p95;
- solicitudes por segundo;
- porcentaje de errores.

Cuando no hay tráfico de usuarios, `0 req/s` es un resultado correcto y el p95 puede no existir. No debe inventarse una latencia a partir de una ventana sin observaciones.

## Qué significa “hertz” aquí

Se manejan dos frecuencias diferentes:

1. **Frecuencia de muestreo:** una actualización cada 10 segundos equivale a `1 / 10 = 0.1 Hz`.
2. **Frecuencia de tráfico:** una solicitud por segundo equivale numéricamente a `1 Hz`; en el producto se presenta como `req/s` para evitar confundirla con CPU o señales físicas.

La frecuencia de muestreo no debe aumentar sin necesidad. Consultar cada segundo multiplicaría el trabajo del dashboard y Prometheus sin que este laboratorio genere tráfico suficiente para justificarlo. Diez segundos permite observar una caída rápido y mantiene bajo el costo.

## Rendimiento medido

Se añadió `pnpm benchmark:dashboard`, que inicia sesión, mide diez veces las lecturas principales y cierra la sesión. La prueba local contra el backend en el puerto 4001 produjo:

| Endpoint | p50 anterior | p50 optimizado | p95 optimizado |
| --- | ---: | ---: | ---: |
| `GET /auth/me` | 1115.62 ms | 7.97 ms | 14.28 ms |
| `GET /dashboard/overview` | 1932.85 ms | 376.53 ms | 1522.79 ms |
| `GET /dashboard/metrics` | 1336.74 ms | 363.88 ms | 543.42 ms |
| `GET /dashboard/activity` | 1769.61 ms | 345.13 ms | 674.09 ms |
| `GET /dashboard/topology` | 1214.50 ms | 18.20 ms | 26.99 ms |

El cuello de botella transversal era consultar Supabase para reconstruir el empleado, roles y permisos en cada petición autenticada. Se incorporó un caché Redis de principal por sesión con TTL de 30 segundos y estas garantías:

- PostgreSQL continúa siendo la fuente de verdad.
- Una ausencia o caída de Redis vuelve automáticamente a PostgreSQL.
- Login y refresh cargan el principal en caché.
- Logout, cierre de todas las sesiones, cambio de contraseña, cambio de estado y cambio de roles invalidan las entradas correspondientes.
- Si una invalidación de Redis falla, el valor deja de ser válido como máximo en 30 segundos.

El login continúa alrededor de 3.18 s en esta prueba porque verifica `scrypt` y persiste sesión, auditoría y estado del empleado en Supabase. No se debe eliminar la derivación criptográfica ni responder antes de persistir la sesión. La siguiente optimización debe medir por separado consulta de empleado, `scrypt` y transacción de sesión, y desplegar API y PostgreSQL en regiones cercanas antes de cambiar la seguridad.

## Metodología de mejora

Cada cambio técnico debe pasar por la misma ficha y no empezar únicamente porque una tecnología sea popular:

1. **Problema observable:** comportamiento que afecta al usuario o la operación.
2. **Evidencia base:** métrica, traza, log o prueba reproducible antes del cambio.
3. **Hipótesis:** causa probable y resultado esperado.
4. **Cambio mínimo vertical:** backend, contrato, frontend y observación necesarios para comprobarla.
5. **Criterio de aceptación:** umbral cuantificable, prueba funcional y condición de seguridad.
6. **Comparación:** misma carga y entorno antes/después; registrar p50, p95 y errores.
7. **Despliegue y reversión:** activar gradualmente cuando corresponda y conservar una forma segura de volver atrás.
8. **Documentación:** decisión, límites conocidos y siguiente experimento.

Esta metodología conecta los videos con el proyecto:

- el endurecimiento se valida mediante superficie de puertos y pruebas de acceso;
- las colas se justifican midiendo cuánto trabajo secundario bloquea una petición;
- la prevención de SQL inseguro se valida con revisión automática y pruebas maliciosas;
- la observabilidad demuestra si cada cambio mejoró realmente el sistema.

## Próximas fases

### P0 — cerrar el circuito actual

- Añadir una prueba de integración autenticada para `/dashboard/topology`.
- Generar tráfico de laboratorio controlado para comprobar `req/s`, p95 y error rate.
- Mostrar un estado vacío explícito cuando no hubo solicitudes en la ventana.
- Guardar los resultados del benchmark como artefactos de CI.

### P1 — cuatro señales de oro

- **Latencia:** p50/p95/p99 separando respuestas exitosas y fallidas.
- **Tráfico:** solicitudes por segundo por ruta, servicio e instancia.
- **Errores:** porcentaje 4xx/5xx y fallos de dependencias.
- **Saturación:** CPU, memoria, event loop y pool de conexiones.

### P2 — trazabilidad distribuida

- Incorporar OpenTelemetry en Nginx/API/IA cuando el flujo base esté estable.
- Propagar `traceId` y `requestId`.
- Correlacionar logs, métricas y trazas sin guardar datos bancarios sensibles.
- Mostrar la ruta completa de una solicitud lenta para saber si el tiempo se consumió en Nginx, NestJS, Supabase, Redis o IA.

## Fuentes técnicas

- Prometheus, configuración de `scrape_interval`: https://prometheus.io/docs/prometheus/latest/configuration/configuration/
- Prometheus, histogramas y `histogram_quantile`: https://prometheus.io/docs/practices/histograms/
- Google SRE, cuatro señales de oro: https://sre.google/sre-book/monitoring-distributed-systems/
- OpenTelemetry, señales de observabilidad: https://opentelemetry.io/docs/concepts/signals/
