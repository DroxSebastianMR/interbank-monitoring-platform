# Bloque 4: Estado por servicio

Se reemplaza el contenido del panel `NetworkSchedule`, conservando su ubicación principal en la Vista general, el layout y el componente `PanelHeading`. Se eliminan las barras normalizadas por el máximo de cada fila, las observaciones simuladas de respaldo y las etiquetas de tendencia obtenidas de diferencias arbitrarias.

## Columnas y fuentes

- **Nombre:** Inicio de sesión, Consulta de saldo y Transferencias ficticias para los identificadores reales `login`, `balance` y `transfers`. Los nombres de servicios adicionales vienen del backend. Se respeta el filtro de servicio y no se inventan filas si el backend no informa un servicio.
- **Estado operativo:** procede de `/dashboard/overview`, sin combinarlo con el riesgo del catálogo. Las observaciones ausentes, inválidas, futuras, vencidas a los 30 s, pausadas o con consulta fallida se muestran como Sin datos. Los cuatro estados visibles son Operativo, Degradado, No disponible y Sin datos. `RECOVERING` se presenta como Degradado con la aclaración «Recuperación en observación».
- **Última latencia:** duración de la última sonda, en ms, solo con estado/observación vigente y valor finito no negativo. Nunca se rellena con cero ni se confunde con el p95 del periodo o con tráfico bancario HTTP.
- **Riesgo observado:** `riskLevel` del catálogo `/monitored-services`, que requiere `services.read`. Se obtiene en una sola consulta para el panel, con polling de 10 s, caché por usuario/permisos y actualización manual. No muta el estado, el tono ni la latencia. Falta de permiso, error o ausencia de análisis son explícitos. El backend no informa un timestamp propio del análisis: se indica «Análisis sin fecha propia», sin atribuirle la fecha de la última sonda. La frescura de la lectura del catálogo no garantiza la del análisis.
- **Última comprobación:** timestamp real, fecha y hora con segundos, zona Lima/PET, conservado en un elemento `time`. Un registro antiguo se mantiene visible como último registro y se advierte que no confirma el estado actual.
- **Detalle:** ruta real `/services/:id`, sin replicar la ficha dentro de Resumen.

La tabla se presenta inmediatamente aunque las métricas históricas o el catálogo de riesgo estén cargando. Esas fuentes no bloquean los estados recibidos del resumen. El panel conserva una tabla semántica, cabecera visible, estado escrito e icono; la región desplazable tiene foco para navegar en pantallas estrechas.

## Historial y tendencia

Se reutiliza la serie de sondas de latencia del periodo y servicio seleccionados. La tendencia es desplegable y solo se monta al abrirla. Se validan fuente, unidad, rango, timestamps y valores finitos no negativos. No se crean gráficos con menos de dos timestamps diferentes, ni con respuestas fallidas, ausentes o vencidas.

Cada servicio tiene su propia curva con eje vertical numérico en ms (base cero) y eje horizontal proporcional a timestamps reales. Las escalas verticales son independientes y están etiquetadas: no deben interpretarse como una comparación visual entre servicios. Se omiten conexiones sobre huecos superiores al 10 % del periodo, con un mínimo de 30 s. Los puntos aislados se conservan. Una respuesta truncada se identifica como parcial. Hay una tabla accesible con todos los timestamps y valores de la curva, sin generar muestras intermedias.

## Navegación y contexto

El enlace del nombre, el acceso Ver y el clic en el resto de la fila llevan a la misma ruta. Los enlaces nativos mantienen teclado, apertura en otra pestaña y modificadores. El clic en la fila no interfiere con enlaces ni selección de texto. Sin `services.read` no se habilita navegación al detalle.

Se conservan los parámetros de la URL de Resumen y se añade `from=overview`. La ficha utiliza el periodo recibido como filtro inicial del historial, incluyendo ahora 15 min y 6 h. El botón existente de regresar lleva a Vista general con sus parámetros originales; en accesos desde Servicios mantiene el comportamiento anterior. La URL conserva el contexto incluso después de recargar.

La ficha existente ya muestra observaciones, latencias, cambios de estado y referencias de configuración. Solo se añade el periodo inicial y la referencia real `ServiceCheck.id` a su diálogo de observación. No se duplica la ficha ni se modifica su arquitectura. El historial de comprobaciones sigue limitado por el backend a sus últimos 50 registros por defecto: seleccionar un periodo filtra esos registros disponibles, no garantiza cobertura completa de ese periodo.

El frontend usa el estado operativo que publica el backend como autoridad; no reclasifica servicios por `riskLevel`. La política interna de clasificación del backend permanece fuera de este cambio de la Vista general.

No se ejecutaron pruebas, compilaciones ni la aplicación. Se mantuvo la rama `fix/design-dashboard` y no se modificó el backend. Los contratos se consultaron en `main`, según el contexto documentado en `OVERVIEW_OPERATIONAL_HEADER.md`.
