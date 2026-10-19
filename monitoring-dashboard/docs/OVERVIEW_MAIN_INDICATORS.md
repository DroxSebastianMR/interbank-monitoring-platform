# Bloque 3: indicadores principales

Se mantienen exactamente seis tarjetas, en el lugar de los indicadores anteriores. Se reutilizan `ServiceKpiCard` y `ServiceKpiGrid`, con ranuras opcionales para contenido y acciones. Los estilos neutros se limitan a `.overview-kpis`: no cambian las tarjetas del detalle de Servicios. No hay nuevas bibliotecas ni endpoints de backend.

## Contratos y presentación

| Tarjeta             | Fuente                                                                 | Alcance y acción                                                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Servicios           | `/dashboard/overview`                                                  | Total global y desglose actual; recuperándose se incluye en degradados. Abrir `/services`.                                                                                                                                  |
| Incidentes abiertos | `activeIncidentsCount`, `sources.incidents` y `recentIncidents`        | Total activo, separado de los históricos resueltos. La severidad se etiqueta como «Mayor visible» si la muestra de incidentes no contiene todo el total. Abrir `/incidents?status=active`.                                  |
| Disponibilidad      | `/dashboard/metrics?metric=availability&from=...&to=...&serviceId=...` | Ratio de sondas alcanzables sobre sondas observadas. El periodo y el servicio vienen de los filtros de la URL. Acción: detalle accesible con periodo real, fuente y cobertura por servicio.                                 |
| Latencia p95        | La serie existente de `/dashboard/metrics?metric=latency`              | Percentil por rango más próximo de muestras crudas, en ms, para el mismo periodo y selección. Es latencia de sondas, no de solicitudes bancarias. Acción: detalle de muestras.                                              |
| Errores HTTP 5xx    | `/endpoints/snapshot`, reutilizando `useEndpoints`                     | Tasas HTTP de Prometheus: suma de tasas 5xx dividida entre suma de tasas de solicitudes, y 4xx separado. Usa la ventana real `windowSeconds` (actualmente 120 s), global, no el periodo seleccionado. Acción: `/endpoints`. |
| Alertas pendientes  | Capacidad ausente en el contrato actual                                | «—», reconocimiento no instrumentado y prioridad no disponible. No se usa `activeAlertsCount` como cantidad pendiente. Acción: `/alerts?status=pending`, que explica la limitación y permite abrir el historial.            |

## Suficiencia y valores ausentes

Disponibilidad y p95 solo se publican cuando cada servicio seleccionado tiene al menos 20 muestras válidas, cubre al menos el 80 % de la extensión temporal del intervalo y no contiene huecos mayores al 10 % del intervalo (con tolerancia mínima de 30 s). La respuesta debe estar completa (`truncated: false`). Son criterios conservadores de presentación, documentados en `indicator-metrics.ts`; no un SLO contractual ni una estimación de confianza estadística. La extensión temporal no se presenta como porcentaje de sondeos esperados, porque el contrato no proporciona su cadencia histórica.

Las muestras se filtran por servicio, intervalo, valores finitos y unidad/fuente conocida. El cálculo global agrupa muestras y por tanto pondera por número de observaciones, no por servicio ni por tiempo. No se promedian percentiles. Sin observaciones o cobertura suficiente se muestra «—», no cero ni 100 %. Una muestra truncada nunca se usa para afirmar disponibilidad del periodo completo. El límite del backend es de 5.000 observaciones; periodos largos pueden quedar sin valor publicable y el motivo permanece visible.

Las consultas erróneas, pausadas o con una ventana de cálculo vencida no publican el último valor como actual. Los estados de servicios se vuelven a evaluar según sus observaciones a 30 s; las lecturas del resumen expiran también a 30 s. Los relojes del servidor y el cliente deben estar sincronizados. Los cálculos de sondas se memorizan y no se repiten con cada tick local.

Para HTTP se descartan endpoints con telemetría ausente, vencida o sin tasas válidas. Si existe tráfico medido se calcula el ratio ponderado por tasa de solicitudes; no se promedian porcentajes de rutas. Una cobertura parcial se etiqueta con el número de endpoints medidos sobre instrumentados. Si no existe tráfico o instrumentación no se muestra 0 %: se indica la causa. `overview.errorRate` permanece sin usar: su contrato es `null`/`NOT_INSTRUMENTED` y no separa 4xx/5xx. Los fallos de sondas nunca se convierten en errores HTTP.

## Navegación, permisos y alcance

Se añade únicamente la lectura de los parámetros `status=active` y `status=pending` al destino compartido de los enlaces, sin rediseñar esas pantallas. El filtro activo usa `resolvedAt === null` dentro de los últimos 100 registros que ofrece el contrato; se informa que el contador global puede incluir incidentes más antiguos. Sin parámetro se conserva el historial existente.

Para pendientes de alertas, el contrato y el modelo `Alert` no exponen reconocimiento, prioridad ni una relación con estado resuelto en la respuesta de `/alerts`. Por ello el destino no realiza una consulta que podría presentar alertas recuperadas o históricas como pendientes. Muestra una explicación y acceso al historial; obtener un conteo real requiere ampliar el backend y su modelo, fuera de este ajuste visual. No se inventan estados ni se modifica el backend.

Se conservan permisos de las rutas reales: `services.read`, `incidents.read`, `alerts.read` y `analytics.read` para Endpoints y métricas. La consulta adicional de disponibilidad usa React Query, filtros, cancelación, caché por usuario/permisos y polling de 10 s, como latencia. Endpoints reutiliza su caché y polling existentes de 30 s. La actualización manual incluye ambas fuentes nuevas y su feedback.

Las tarjetas exponen el número, unidad, fuente y notas en texto; la acción queda alineada al pie. El detalle usa el diálogo existente con control de foco, teclado y cierre. Los estados desconocidos son explícitos y no dependen del color. La cabecera aclara qué filtros aplican a cada fuente.

No se ejecutaron pruebas, compilaciones ni la aplicación, siguiendo la instrucción del usuario. Se realizaron lectura de contratos y edición de código. Los contratos del backend se inspeccionaron en `main`, como se explica en `OVERVIEW_OPERATIONAL_HEADER.md`.
