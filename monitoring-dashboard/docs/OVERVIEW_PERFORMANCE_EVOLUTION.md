# Bloque 6: Evolución del rendimiento

Se incorpora una sección debajo de Estado por servicio/Requiere atención y antes de infraestructura. Reutiliza PanelHeading, Select, PanelSkeleton, rutas y consultas del dashboard. No instala bibliotecas ni crea un dashboard alternativo.

## Fuentes disponibles y límites

`GET /dashboard/metrics?metric=latency&from=...&to=...&serviceId=...` ofrece muestras crudas de sondas persistidas, con timestamp y milisegundos; no son latencias HTTP bancarias. Se reutiliza la consulta de React Query que ya alimenta los indicadores y el panel de servicios.

El backend no publica historia HTTP para el rango solicitado: Endpoints solo ofrece una instantánea con una ventana de 120 s. Elegir Tasa de errores HTTP o Solicitudes por segundo muestra «No hay métricas de tráfico disponibles para este periodo», explica la ausencia de historia y ofrece el acceso a la ventana actual de Endpoints. No se convierten sondas en RPS, fallos de salud en 5xx ni snapshots acumulados localmente en historia. No hay números aleatorios, señales sintéticas ni nuevas consultas a rutas inventadas.

El selector separa métricas de unidades incompatibles. El gráfico disponible se identifica explícitamente como Latencia p95 de sondas, en ms. No pretende cubrir la integración histórica HTTP que falta en el backend.

## Agregación real y datos ausentes

Se calcula p95 por servicio y ventana con rango más próximo: `values[ceil(n * 0.95) - 1]`, a partir de observaciones reales, no del promedio de percentiles. Cada intervalo necesita al menos 20 muestras válidas, como criterio conservador de presentación ya usado en los indicadores, no como garantía estadística o SLO.

Los intervalos se alinean al reloj y se recortan al rango consultado: 5 min para periodos de 15 min y 1 h; 30 min para 6 h; 2 h para 24 h. El eje horizontal representa el tiempo y el punto se coloca en el centro del intervalo agregado. La selección y el tooltip muestran los extremos exactos. Los intervalos son `[inicio, fin)` para que una muestra de frontera no se duplique.

El adaptador valida fuente, métrica, unidad, fechas, servicio y valores finitos no negativos. No crea observaciones intermedias. Un intervalo vacío conserva `value: null`; uno con menos de 20 muestras tampoco recibe p95. La curva se divide en segmentos y nunca atraviesa un intervalo sin p95. Los puntos aislados permanecen visibles como observaciones agregadas sin conexiones ficticias.

El contrato puede truncar a las últimas 5.000 observaciones. Se informa de la historia parcial y se anula el p95 del intervalo que contiene el corte más antiguo, porque sus muestras podrían estar incompletas. Los intervalos anteriores permanecen vacíos; no se extrapolan. La tabla auxiliar identifica cantidad de muestras, ausencia, insuficiencia y respuesta parcial.

No se dibuja una curva cuando no hay intervalos publicables. Los errores, consultas pausadas y lecturas vencidas se distinguen de falta de instrumentación. No se publica una historia almacenada como si acabara de actualizarse.

## Gráfico, tooltip e incidentes

El gráfico SVG tiene eje temporal PET, eje numérico en ms, leyenda por servicio con color y patrón de línea, señalización de ausencia/insuficiencia y tabla textual de valores. El tooltip expone p95, ms, fuente, número de muestras y fecha/hora exactas del intervalo. Funciona con puntero y foco de teclado; Enter/Espacio seleccionan el intervalo y Escape descarta el tooltip. No se añade otra dependencia gráfica.

Los marcadores representan la apertura real de incidentes relacionados por identificador de servicio y timestamp dentro del rango. Se reutilizan el registro de incidentes y, como respaldo, los incidentes abiertos del resumen vigente. No se generan marcadores desde alertas preventivas ni se atribuye causalidad. Se muestran hasta 12 marcadores, con todas las referencias conocidas en una lista accesible. La cobertura está limitada a los últimos 100 incidentes del endpoint y la muestra del resumen; la ausencia de marcadores no certifica que nunca hubo incidentes.

El backend tiene reglas de latencia internas, pero esta respuesta no informa su configuración vigente. No se convierte el valor por defecto del código en una línea de umbral supuestamente validada. El panel dice «Umbral no disponible para esta fuente».

## Filtros y navegación

- Periodo y servicio siguen en la URL y cambian la consulta y el rango existentes.
- `performance` conserva la métrica seleccionada; los valores desconocidos se normalizan.
- Seleccionar un punto conserva `observationFrom`, `observationTo` y `observationService` en la URL. Cambiar periodo, servicio o métrica limpia el intervalo anterior.
- El acceso al detalle usa `/services/:id` y el contexto de retorno existente. La ficha filtra su historial al intervalo exacto seleccionado y ofrece quitar ese filtro. Conserva el límite real de los últimos 50 registros y lo informa: no promete historia completa de un intervalo antiguo.
- Regresar a Vista general conserva periodo, servicio, métrica e intervalo, incluso al recargar el detalle. La ventana general es relativa y sigue avanzando; el intervalo elegido conserva sus fechas absolutas, sin desplazarse al volver.
- Los accesos respetan `analytics.read`, `services.read` e `incidents.read`. No hay mutaciones, nuevas rutas ni ampliaciones del backend.

No se ejecutaron pruebas, compilaciones ni la aplicación, conforme a la indicación del usuario. Se mantuvo la rama `fix/design-dashboard`; los contratos se inspeccionaron en `main`, como se documentó en los bloques anteriores.
