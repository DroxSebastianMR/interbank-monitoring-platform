# Catálogo automático de endpoints por instancia

## Qué entrega

En el dashboard: **Monitoreo → Endpoints** (`/endpoints`). Requiere una sesión con `analytics.read`.

- Inventario automático de todas las operaciones declaradas en OpenAPI por el backend bancario: módulo/tag, método HTTP, ruta normalizada e instancia.
- Incluye rutas sin tráfico; no hay que crear un `MonitoredService` por cada endpoint.
- Filtros locales de instancia, módulo, método y búsqueda; 25 filas por página. Filtrar no dispara peticiones adicionales.
- Solicitudes por segundo, p95 aproximado en milisegundos, proporción de respuestas 5xx y tasa de respuestas 4xx por separado.
- Compara réplicas seleccionando una instancia o mostrando todas; no mezcla sus histogramas.
- Estados explícitos de scrape disponible, sin respuesta, antiguo o desconocido; tráfico observado, sin tráfico o calculando tasa.

Esta vista complementa, no reemplaza, las sondas de servicios ni el análisis de IA existente. No registra automáticamente incidentes por cada ruta y no ejecuta transferencias, pagos, préstamos ni otros comandos para probarlos.

## Conexión y descubrimiento

```text
Controllers Nest → documento OpenAPI en el arranque
                  → interbank_app_endpoint_info (inventario)
Peticiones reales → middleware al completar la respuesta
                  → contadores + histogramas por ruta declarada
                              ↓ scrape directo a cada réplica, cada 10 s
                         Prometheus
                              ↓ 8 consultas agrupadas, misma hora de evaluación
            monitoring-backend /endpoint-observability
                              ↓ JWT + analytics.read + caché de 5 s
                  Dashboard /endpoints (poll de 10 s)
```

Al agregar un controller/endpoint, basta con mantenerlo en OpenAPI y desplegar/reiniciar esa réplica. El siguiente scrape publica el inventario, incluso antes de recibir solicitudes. Las rutas excluidas intencionalmente de Swagger y rutas implícitas del framework (por ejemplo, assets Swagger o HEAD automático) no son operaciones declaradas del catálogo. No se descubren websockets ni tareas internas como si fueran HTTP.

Las **instancias** siguen siendo los targets configurados de Prometheus; agregar un servidor nuevo requiere un target o un mecanismo de service discovery. Lo automático en esta entrega es el descubrimiento de sus **endpoints**, no el aprovisionamiento de servidores.

El módulo se obtiene del primer tag OpenAPI; si no existe, se usa el primer segmento de la ruta. Mantener `@ApiTags` descriptivos evita módulos ambiguos. No hay una lista manual de módulos para este inventario.

## Contrato y seguridad

`GET /endpoint-observability`, documentado en Swagger del monitor:

- 200: `sourceState`, `generatedAt`, `lastSuccessAt`, `refreshIntervalMs`, `windowSeconds`, `instances[]`, `endpoints[]`.
- 401: sin token válido o sesión revocada.
- 403: sin `analytics.read`. El cliente también bloquea la página y su consulta; el control efectivo está en el servidor.
- Una caída del colector devuelve un estado explícito en el cuerpo, no datos saludables inventados. Puede conservar catálogo anterior durante 60 s, con números anulados. Después entrega inventario vacío y estado no disponible.
- `Cache-Control: no-store` en HTTP. La caché interna compartida contiene solo métricas operativas, nunca principal, credenciales ni respuestas bancarias; la autorización se ejecuta en cada petición.
- El navegador nunca recibe la URL interna de Prometheus ni envía PromQL, URLs de destino o tokens de infraestructura.
- La consulta al colector tiene timeout de 1,5 s, sin redirecciones, máximo 5 MB por respuesta y 10.000 muestras por vector. Un límite excedido es indisponibilidad, no truncamiento silencioso.
- NGINX bloquea `/metrics` público. Prometheus y los puertos de réplicas del override de desarrollo se publican solo en loopback; dentro de Docker se conserva el acceso de scraping.
- En despliegues reales, mantener la red de telemetría privada, restringir el acceso entre servicios, configurar TLS/autenticación del colector y conservar el gateway como entrada pública. El entorno de clase no implementa service mesh/mTLS.

No se publican DNIs, IDs de cuenta, correos, query strings, cuerpos, tokens ni contraseñas. Se usa la ruta **declarada**, por ejemplo `/accounts/{id}`, y cinco clases HTTP acotadas (`1xx`…`5xx`). Las rutas desconocidas no crean etiquetas nuevas. Las métricas agregadas previas de servicios se conservan para no romper la IA ni las gráficas actuales.

## Métricas y frescura

| Métrica de la API | Uso |
| --- | --- |
| `interbank_app_endpoint_info{module,method,route}` | Inventario, valor 1 por operación. |
| `interbank_app_endpoint_requests_total{module,method,route,status_class}` | Contador inicializado en cero; tasa calculada en ventana de 2 min. |
| `interbank_app_endpoint_request_duration_seconds{module,method,route}` | Histograma con buckets desde 5 ms hasta 5 s, más `+Inf`. |
| `up{job="app-backend"}` | Si Prometheus pudo leer métricas de la instancia. No demuestra salud de la BD ni éxito funcional de cada endpoint. |
| `timestamp(up{job="app-backend"})` | Hora del scrape, no la hora de evaluación de la consulta. |

`/metrics` puede figurar en el inventario pero no cuenta su propio scraping como tráfico de usuarios. `/health` sí se mide: sus peticiones incluyen las sondas automáticas, no solo usuarios.

- `requestRateHz` significa solicitudes/segundo, **no velocidad de CPU ni tiempo de respuesta**.
- `latencyP95Ms` es un percentil aproximado del tiempo de servidor, no el viaje completo del navegador, y requiere tráfico y al menos dos muestras de contador.
- Sin tráfico: tasa cero si hay evidencia suficiente; p95 y porcentaje de errores sin denominador quedan en `null`, mostrados como `—`.
- Los contadores se reinician con el proceso y no son un conteo de transacciones bancarias diarias. `rate()` gestiona resets dentro de la ventana.
- Scrape de más de 35 s: estado antiguo, números ocultos. Una falla de scrape no permite afirmar por sí sola que la máquina esté apagada.
- Una réplica con `up=0` puede conservar el inventario conocido de la última hora usando el historial de Prometheus, sin reutilizar sus antiguas tasas como actuales. Al recuperar la réplica se usa el inventario vigente; las rutas eliminadas desaparecen.

**Una respuesta HTTP rápida no implica telemetría instantánea.** El pipeline mantiene scrape de 10 s, caché de 5 s y refresco visual de 10 s. Un cambio puede tardar aproximadamente hasta 25 s más duración del scrape/timeout/transporte. La detección subsegundo necesitaría otra estrategia y más carga; no se promete aquí. El timeout de scrape también afecta cuándo aparece `up=0`.

## Velocidad y costos

Las ocho consultas se ejecutan en paralelo, independientemente del número de rutas. Peticiones simultáneas comparten una sola actualización en curso; el resto usa caché de 5 s. No hay escritura SQL por scrape ni una petición por fila. La caché es de proceso: varias réplicas del monitor tendrían cada una su caché; antes de escalarlas, evaluar caché Redis distribuida y reglas de grabación de Prometheus según mediciones reales.

La cardinalidad sigue creciendo con endpoints × instancias × buckets/clases HTTP. No incluir valores dinámicos y vigilar las series almacenadas/retención al crecer. El límite de 10.000 muestras por vector no equivale a soporte ilimitado de endpoints.

### Benchmark reproducible sin credenciales

Desde `monitoring-backend`:

```powershell
pnpm build
pnpm benchmark:catalog
```

Simula 250 rutas × 2 instancias (500 filas), 25 ms de latencia por consulta Prometheus, 1.000 lecturas de caché con serialización JSON. Imprime p50/p95, payload y número de consultas. Es un benchmark del servicio en proceso, **no una medición de Docker, red, JWT, BD o navegador**.

Para medir el sistema real, con Docker ya reconstruido y un usuario de pruebas autorizado, define `MONITOR_BENCH_EMAIL` y `MONITOR_BENCH_PASSWORD` en tu terminal sin versionarlas y ejecuta:

```powershell
pnpm benchmark:dashboard
```

El script mide también `/endpoint-observability`, incluyendo lectura del cuerpo JSON. Hace login/logout y lecturas; no ejecuta operaciones bancarias. La muestra de login es una sola; no representa un percentil estadístico de autenticación. La latencia observada dependerá de hardware, red, Supabase, caché y carga.

## Activación manual con Docker

Desde la raíz del repositorio, con Docker Desktop iniciado y `.env` locales existentes:

```powershell
docker compose --env-file monitoring-infrastructure/.env -f monitoring-infrastructure/docker-compose.yml up -d --build app-backend-1 app-backend-2 monitoring-backend monitoring-dashboard
docker compose --env-file monitoring-infrastructure/.env -f monitoring-infrastructure/docker-compose.yml up -d prometheus
docker compose --env-file monitoring-infrastructure/.env -f monitoring-infrastructure/docker-compose.yml restart nginx prometheus
```

Si ya usas `docker-compose.dev.yml`, conserva también ese `-f` en **todos** los comandos; sus puertos de réplicas ahora quedan restringidos a `127.0.0.1`. La app móvil debe seguir entrando por NGINX, no por esos puertos privados.

**No hay cambios de Prisma ni migraciones de BD en esta funcionalidad.** El inventario es metadato de código; las series temporales pertenecen a Prometheus.

### Comprobación

1. Abre el dashboard y entra con un empleado con `analytics.read`; abre **Monitoreo → Endpoints**.
2. Espera un ciclo de scraping y verifica ambas instancias, módulos y métodos. “Sin tráfico” es normal antes de usar la app.
3. Realiza lecturas o flujos normales en la app a través de NGINX. No uses transferencias de prueba solo para llenar métricas. Espera al menos dos scrapes para tasas.
4. Filtra una instancia, después la otra; compara p95 y solicitudes/s. Una instancia puede tener más tráfico que la otra.
5. En una prueba controlada, detén únicamente la réplica 2. Debe conservar su catálogo reciente con “Sin respuesta al scrape” y métricas `—`; la primera puede seguir disponible. Luego vuelve a iniciarla.
6. Sin `analytics.read`, el enlace no aparece y el endpoint devuelve 403. Sin sesión, 401.
7. Agrega un endpoint documentado y reconstruye la réplica: aparece tras el scrape sin insertar una fila en BD. Elimina el endpoint y reconstruye: desaparece del inventario vigente.
8. Comprueba que NGINX responde 404 a `/metrics`; Prometheus debe seguir raspando directamente las réplicas por su red interna.

## Referencias de diseño

- [Instrumentación y cardinalidad — Prometheus](https://prometheus.io/docs/practices/instrumentation/): contadores inicializados, etiquetas acotadas y medición antes de optimizar.
- [Histogramas y percentiles — Prometheus](https://prometheus.io/docs/practices/histograms/): histogramas por instancia y percentiles calculados sobre tasas, sin promediar percentiles entre réplicas.

## Límites de la validación local

Las pruebas automatizadas verifican middleware HTTP real con Nest, privacidad de etiquetas, catálogo, agrupación por réplica, caché concurrente, frescura, errores del colector, JWT/permisos y componentes React. No sustituyen una prueba con las imágenes desplegadas y tráfico real. Los resultados concretos de la ejecución se registran por separado al terminar la verificación.

### Resultados del 18/10/2026

- Backend bancario: 26 suites, 94 pruebas aprobadas; build y ESLint sin errores.
- Backend monitor: 27 suites, 79 pruebas aprobadas; build, ESLint y formato del módulo aprobados.
- Dashboard: 8 archivos de prueba, 20 pruebas aprobadas; build aprobado; ESLint sin errores, con tres advertencias preexistentes de Fast Refresh en componentes UI compartidos.
- OpenAPI leído desde la API encendida detrás de NGINX: **77 operaciones declaradas, 77 descubiertas**, en 12 módulos/tags. Se pasó el documento al registrador nuevo en un proceso de prueba; no se ejecutaron las operaciones bancarias.
- Las ocho consultas se ejecutaron contra el Prometheus local activo: HTTP 200 / `success` en todas; dos targets en `up`. Las métricas nuevas todavía no estaban publicadas por las imágenes antiguas (vectores vacíos), por lo que queda pendiente reconstruir para validar el recorrido completo con tráfico real.
- Benchmark sintético, 500 filas: primera carga **33,983 ms** con upstream simulado de 25 ms; caché + serialización p50 **0,306 ms**, p95 **0,626 ms**, payload **145.421 bytes** y ocho consultas upstream para las 1.001 lecturas. No extrapolar estos números a latencia HTTP/JWT/Supabase o a un SLA.
- No se modificaron bases de datos, credenciales ni imágenes Docker. No se aplicaron migraciones.
- La inspección visual en navegador no pudo ejecutarse: el control de navegador local está desactivado en esta sesión. Se ejecutaron pruebas React/DOM y compilación; no se afirma una validación visual en dispositivos. Los dos procesos temporales de preview se detuvieron y su archivo ficticio se retiró.
