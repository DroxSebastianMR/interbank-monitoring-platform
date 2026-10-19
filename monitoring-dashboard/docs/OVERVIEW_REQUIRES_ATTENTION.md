# Bloque 5: Requiere atención

Se sustituye el contenido de `RecentSignals` en la columna lateral existente de la Vista general. No se crea otro panel, otra ruta ni una pantalla de detalle. Se conserva su posición junto a Estado por servicio en desktop y su ubicación posterior en móvil.

## Evidencias incluidas

1. Incidentes abiertos del registro `/incidents`, excluyendo registros con `resolvedAt` o estados `RESOLVED`, `RECOVERY` y `CLOSED`. El listado de los últimos 100 se complementa con la muestra de incidentes abiertos de `/dashboard/overview`; se deduplica por ID. Un registro resuelto conocido elimina ese ID de la muestra del resumen.
2. Afectaciones del monitoreo con evidencia en el resumen vigente: servicio habilitado con `NO_DATA` o una comprobación conocida vencida a los 30 s. No se considera una pausa configurada como problema. No se crea un incidente ni se asigna una severidad a esa evidencia. La acción lleva al servicio real.
3. Si existe un incidente del mismo servicio, la ausencia de sondas se añade como contexto de ese incidente, evitando otra entrada duplicada de monitoreo.

Se elimina la consulta `/dashboard/activity` de esta pantalla. Ese contrato mezcla actividad histórica, recuperaciones y eventos sin un estado actual verificable y no es una fuente válida para una cola de atención. Se mantienen los servicios y tipos compartidos de esa API para no alterar otros consumidores.

## Alertas y estado de atención

El modelo y el contrato actuales de Alert no tienen reconocimiento, prioridad ni estado resuelto de su incidente en la respuesta. No existe evidencia suficiente para mostrar una alerta como activa y sin reconocer. Por ello no se publican esas alertas en la cola y se explica la cobertura: «Alertas: reconocimiento no instrumentado; pendientes no verificables». No se sustituye este dato por `activeAlertsCount`, no se incluyen `RECOVERY` y no se simula una acción Ver alerta sobre un incidente.

El modelo de presentación contempla Incidente, Alerta y Monitoreo; cada elemento lleva su destino y permiso explícitos, de forma que un adaptador de alertas verificables pueda aportar la acción Ver alerta cuando exista el contrato. Actualmente no se fabrica ningún elemento Alerta.

El registro de incidentes aporta `status`. Se muestra Abierto, En atención o Reconocido únicamente si lo confirma ese campo; el resumen, que no incluye estado de atención, se etiqueta «Atención no informada». Estar abierto no implica estar sin reconocer.

## Orden, antigüedad y cobertura

El orden es severidad descendente (Crítica, Alta, Media, Baja, Sin clasificar), estado de atención (Pendiente, Abierto, En atención, Reconocido, Requiere revisión, No informado) y fecha relevante más antigua primero. Los IDs resuelven empates de forma estable. No se usan el riesgo IA ni el estado operativo para inventar criticidades.

La antigüedad de un incidente se mide desde `openedAt`. Para una sonda vencida, empieza cuando se supera el umbral de 30 s desde la última observación, no cuando se carga la pantalla. Sin fecha inicial verificable se muestra «Sin fecha». La fecha exacta se conserva en `time`, con zona Lima/PET. No se sustituye por la hora local de consulta.

La consulta de incidentes respeta `incidents.read`, usa caché por usuario/permisos y polling de 10 s, y participa de la actualización manual existente. No se consultan alertas cuyo reconocimiento no puede verificarse. Un error o una lectura vencida no se presenta como una cola vacía: se usa únicamente el resumen vigente como respaldo y se informa de las limitaciones.

La cantidad visible se etiqueta como elementos confirmados. Si el contador global del backend supera el número de incidentes conocidos, o falta una fuente vigente, se indica cobertura parcial. Si esa muestra no contiene elementos, se muestra «Sin elementos confirmados en la muestra disponible», en lugar de afirmar ausencia global de problemas. Con fuentes comprobables completas y sin entradas, se muestra «Sin elementos pendientes», dentro del alcance declarado del panel; la limitación de reconocimiento de alertas sigue visible.

El filtro de servicio de la URL se respeta. El periodo no oculta incidentes todavía abiertos cuya fecha inicial sea anterior al periodo seleccionado. No se truncan por fecha las afectaciones que siguen vigentes.

## Presentación y acciones

El panel conserva una altura compacta con desplazamiento interno y un máximo inicial de tres entradas. Cada una muestra tipo, servicio, descripción breve, severidad, antigüedad, estado de atención y enlace. Cuando hay más de tres, Ver todos muestra la cola conocida completa dentro del mismo panel sin resolver ni mutar registros. Con tres o menos hay acceso al listado de incidentes abiertos.

Ver incidente lleva a la ruta real `/incidents?status=active&reference=<id>` con los filtros de origen. Se añade la lectura de `reference` y `service` al historial existente para que el acceso abra la referencia seleccionada, no una lista sin filtrar. Los controles permiten quitar esa selección. El historial sigue limitado a sus últimos 100 registros; no se inventa un detalle para un ID ausente. Revisar monitoreo utiliza `/services/:id` con el contexto de retorno ya existente.

No hay botones de resolución automática ni mutaciones. Los enlaces se habilitan según permisos y tienen etiquetas accesibles. No se agregan eventos informativos ni recuperaciones a la lista.

No se ejecutaron pruebas, compilaciones ni la aplicación. Se mantuvo `fix/design-dashboard`. Los contratos se inspeccionaron en `main`; no se modifica el backend, como se documentó en los bloques previos.
