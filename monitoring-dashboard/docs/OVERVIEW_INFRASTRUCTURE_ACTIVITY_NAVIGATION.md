# Bloque 7 e integración de Vista general

Se mantiene `fix/design-dashboard`, con el layout, la sidebar y las rutas existentes. Infraestructura y Actividad reciente ocupan dos columnas debajo de Evolución del rendimiento; se apilan según el ancho. No se modifica el backend ni se instala una biblioteca de interfaz.

## Infraestructura

El diagrama de NGINX, clientes, rutas animadas y réplicas se sustituye por tres filas: NGINX, Backend instancia 01 y Backend instancia 02. Cada una incluye su estado comprobado, fecha/hora de observación en PET y explicación de la fuente o su ausencia.

La fuente es `/dashboard/topology`, ya consultada. NGINX requiere `telemetrySource: active-health-probe`; cada instancia requiere `telemetrySource: prometheus` y su propio `observedAt`. Se acepta únicamente una observación válida, no futura y de hasta 30 s. Una consulta fallida o pausada deja el estado como Sin datos. La última fecha independiente conocida puede permanecer visible, pero no se reutiliza como estado vigente.

No se leen las aristas configuradas para calcular salud. Una fecha o un estado sin la fuente independiente esperada no se usa como evidencia. No se produce un porcentaje global ni se extrapola la comprobación de NGINX a toda la aplicación.

El texto de redundancia se deriva solo de las dos instancias: observaciones operativas en ambas, redundancia reducida si una no está disponible, revisión del respaldo si hay degradación y redundancia no verificable cuando faltan datos. Dos observaciones operativas no certifican conmutación; ese límite es visible.

No hay una ruta de infraestructura ni una ficha de NGINX en el router actual. **Ver infraestructura** reutiliza `/endpoints` como destino técnico disponible y se indica en la interfaz: «Acceso a métricas de instancias. Vista integral de infraestructura pendiente». Cada instancia utiliza `/endpoints?instance=app-backend-1|app-backend-2`. El filtro existente se conecta a ese parámetro de URL y puede cambiarse o quitarse; una instancia sin inventario no se presenta como saludable. Los accesos requieren `analytics.read`. NGINX no tiene un botón inactivo o una ficha inventada.

## Actividad histórica

Actividad reciente permanece separada de Requiere atención tanto en el modelo como en las consultas y la presentación. Muestra hasta cinco registros inicialmente, en orden descendente de fecha, con fecha, servicio, tipo, descripción, estado del evento y enlace a su referencia. La ampliación local muestra todos los registros disponibles y existen accesos a los historiales persistidos.

Fuentes reutilizadas:

- `/incidents`: aperturas por `openedAt` y recuperaciones confirmadas solo cuando coinciden `status: RESOLVED` y `resolvedAt`.
- `/alerts`: únicamente escaladas `ESCALATED` como alertas importantes. `OPENED` no duplica la apertura del incidente; `RECOVERY` no se trata como recuperación confirmada sin el registro resuelto. La actividad de una alerta no implica entrega de notificación ni falta de reconocimiento.
- `/monitored-services/:id/state-history`: cambios persistidos por servicio. No se reconstruyen transiciones comparando snapshots ni se fabrican eventos en el frontend.

Una alerta obtiene su servicio de la relación con el incidente cuando ese registro está disponible. Si no lo está, se muestra Servicio no informado; no se adivina el servicio a partir del texto. Con un filtro por servicio, esas alertas sin asociación verificable no se incluyen.

Las fechas se filtran por el periodo y el servicio seleccionados. Una apertura puede quedar fuera del periodo y su recuperación dentro: se muestra esa recuperación con la fecha real de resolución. Eso no afecta la bandeja de pendientes, que sigue mostrando incidentes aún abiertos aunque sean antiguos.

El registro de incidentes existente está limitado a 100 filas, alertas a 100 y cambios de estado a 50 por servicio. Los límites son visibles; las rutas de historial son las disponibles, sin prometer acceso a filas que el backend no entrega. Una paginación completa del historial persistido requiere ampliar ese contrato, fuera del alcance de la Vista general.

Las consultas adicionales están habilitadas según `incidents.read`, `alerts.read` y `services.read`, con caché por usuario/permisos y polling de 10 s. Se reutiliza la consulta de incidentes del bloque de atención. Los errores no borran hechos históricos ya recibidos ni se interpretan como ausencia de eventos; se indica actualización parcial. Un registro histórico abierto se etiqueta como Apertura registrada, sin afirmar su estado de atención actual.

## Matriz de navegación e interacción

| Interacción                    | Destino o comportamiento                                                                                | Límite explícito                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Servicios                      | `/services`                                                                                             | Permiso `services.read`.                                                                                           |
| Incidentes abiertos            | `/incidents?status=active`                                                                              | El listado disponible tiene límite de 100.                                                                         |
| Alertas pendientes             | `/alerts?status=pending`                                                                                | El destino explica que no existe reconocimiento instrumentado; no simula una bandeja.                              |
| Latencia / disponibilidad      | Detalle de muestras en el diálogo existente                                                             | Sondas persistidas, periodo y servicio reales.                                                                     |
| Error rate                     | `/endpoints`                                                                                            | Ventana actual de HTTP, no historia del periodo.                                                                   |
| Fila de servicio               | `/services/:id`                                                                                         | Conserva filtros y contexto de retorno.                                                                            |
| Atención: incidente            | `/incidents?status=active&reference=:id`                                                                | Referencia seleccionada en el historial real.                                                                      |
| Atención: alerta               | Adaptador preparado, sin entradas fabricadas                                                            | Falta contrato para confirmar reconocimiento y vigencia.                                                           |
| Afectación de monitoreo        | `/services/:id`                                                                                         | No crea un incidente por ausencia de telemetría.                                                                   |
| Instancia                      | `/endpoints?instance=:id`                                                                               | Métricas técnicas; no existe ficha integral de infraestructura.                                                    |
| Evento: incidente/recuperación | `/incidents?reference=:id`                                                                              | Incluye registros resueltos, sin filtro de activos.                                                                |
| Evento: alerta importante      | `/alerts?reference=:id`                                                                                 | Selecciona el registro real de alerta.                                                                             |
| Evento: cambio de estado       | `/services/:id?stateReference=:id#state-event-:id`                                                      | Resalta y enfoca una vez el cambio persistido si está entre los disponibles; informa si falta.                     |
| Actualizar                     | Refetch de resumen, métricas, incidentes, alertas, cambios, catálogo, topología y Endpoints autorizados | Feedback parcial o completo, sin recargar. Se permite actualizar durante polling, reutilizando consultas en curso. |
| Periodo                        | Cambia el rango de métricas y el filtro temporal del histórico                                          | Los contadores actuales, atención e infraestructura no se convierten en históricos.                                |
| Servicio                       | Actualiza consultas y filtra paneles compatibles                                                        | La infraestructura sigue siendo global.                                                                            |
| Selección de intervalo         | URL y detalle del servicio con fechas absolutas                                                         | La ficha limita el historial a sus últimas observaciones disponibles.                                              |

Los enlaces conservan la URL de contexto. El retorno de la ficha mantiene periodo, servicio, métrica e intervalo; elimina la referencia exclusiva del cambio de estado para evitar aplicarla accidentalmente a otro servicio.

## Texto y diseño

Se normalizan Resumen operativo, Estado por servicio, Actividad reciente, Infraestructura, Inicio de sesión, Consulta de saldo y Transferencias. La microcopy diferencia observación, estado actual, estado histórico y atención. No se añaden afirmaciones de predicción de caída ni calibración del riesgo.

Se conservan fondo claro, acento verde, tipografía y sidebar. Los nuevos bloques usan bordes suaves, jerarquía de títulos y texto secundario legible, sin glass, pulsos de tráfico ni animaciones decorativas. El icono de actualización gira solo durante una actualización manual.

Se eliminan los mínimos rígidos del grid que podían provocar desbordamiento horizontal de toda la Vista general. Las columnas usan `minmax(0, ...)`, los paneles se apilan al reducir el ancho y las tablas/gráficos conservan desplazamiento local. Los datos críticos no se cortan mediante elipsis globales. Las regiones desplazables, enlaces, controles y referencias seleccionadas mantienen acceso por teclado y foco visible.

No se ejecutaron pruebas, compilaciones ni la aplicación, por instrucción del usuario. La revisión consistió en lectura de rutas/contratos y edición de código; no se afirma una validación visual o de ejecución. Los contratos actuales se inspeccionaron en `main`, como se indicó en los bloques anteriores.
