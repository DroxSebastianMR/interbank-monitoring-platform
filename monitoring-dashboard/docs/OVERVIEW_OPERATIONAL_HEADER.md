# Vista general — Bloque 1: encabezado operativo

## Alcance y base de trabajo

Rama `fix/design-dashboard`, creada desde `develop`. `main` estaba limpio al comenzar. `develop` todavía contenía la estructura inicial del dashboard; se incorporó exclusivamente la base confirmada de `monitoring-dashboard` desde `main` para trabajar sobre la consola existente. Esa incorporación es una dependencia de base, no un rediseño de los demás módulos. No se modificaron móvil, backend ni infraestructura.

La intervención funcional se limita al encabezado de Vista general y a conectar sus controles con las consultas existentes. No hay una segunda página, nuevas rutas ni librerías nuevas. Los bloques inferiores mantienen sus componentes y diseño. Los siguientes seis bloques del rediseño quedan fuera de esta entrega.

## Inspección previa

| Área           | Estado encontrado y decisión                                                                                                                                                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rutas          | React Router con rutas lazy; Vista general continúa en `/`. `ProtectedRoute` comprueba sesión. No se cambian URLs existentes.                                                                                                                                                      |
| Layout         | `OperationsLayout` contiene sidebar, barra superior y encabezado compartido. Se omite el encabezado compartido solo en `/` para que la página tenga un único h1 propio. Otras pantallas conservan su encabezado.                                                                   |
| Usuario        | Nombre y sesión ya aparecen en la barra superior. No se repiten en el bloque nuevo.                                                                                                                                                                                                |
| Sidebar        | Se conserva intacto. Sus contadores hardcodeados se identificaron como una deuda previa fuera de alcance.                                                                                                                                                                          |
| Resumen        | Se reutilizan `OperationsSummaryBanner`, `OverviewIndicators`, `NetworkSchedule`, `RecentSignals` e `InfrastructureTopology`. El antiguo botón Actualizar del banner se vuelve opcional para centralizar esa acción en el encabezado.                                              |
| API            | Axios autenticado con timeout de 5 s, interceptor de renovación de sesión y errores tipados. Se reutiliza; solo se agregan parámetros y señales de cancelación a las consultas de dashboard.                                                                                       |
| React Query    | Cuatro fuentes: overview, métricas, actividad y topología. Se conserva polling de 10 s, stale time de topología de 5 s y retry global de una vez. No se crea otro cliente ni una segunda conexión WebSocket.                                                                       |
| Tiempo real    | Una conexión de eventos en el layout y recuperación HTTP. El nuevo encabezado no agrega suscripciones.                                                                                                                                                                             |
| Caché          | Claves con identidad y permisos para evitar mezclar datos entre sesiones. Se conservan los prefijos `dashboard-overview`, `dashboard-metrics`, `dashboard-activity` y `dashboard-topology`, compatibles con las invalidaciones existentes.                                         |
| Permisos       | Resumen, actividad y topología requieren `dashboard.read`; series requieren además `analytics.read`. No se consultan fuentes sin permiso. La lista de servicios procede del overview autorizado, sin solicitar `services.read`.                                                    |
| Diseño         | Variables `--ops-*`, Outfit, botón existente y Select de Radix ya instalado. CSS localizado en el componente del encabezado. Sin nueva biblioteca ni tarjetas nuevas.                                                                                                              |
| Gráficos       | `NetworkSchedule` representa las últimas muestras de sondas con barras CSS, no tráfico HTTP. Se conservan representación y reglas previas; el nuevo periodo se envía a la serie de latencia. Sus muestras de respaldo y los demás indicadores quedan para los bloques posteriores. |
| Datos ausentes | Errores de red y ausencia de observaciones se distinguen. No se agrega telemetría, series, servicios o timestamps ficticios.                                                                                                                                                       |

## Contratos consultados y límite de integración

Se inspeccionaron los contratos implementados en `main`, en `monitoring-backend/src/modules/analytics`: `dashboard.controller.ts`, `dashboard-query.dto.ts` y `dashboard.service.ts`. Esa versión del backend ya es dependencia de la consola actual; la versión antigua de `develop` aún no contiene esos endpoints. Para usar esta Vista general se necesita ejecutar un Monitoring Backend compatible con esos contratos, sin que esta entrega modifique el backend.

| Fuente                    | Contrato disponible                                                         | Alcance real del control                                                                                                                                             |
| ------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /dashboard/overview` | Sin filtros; snapshot global; agregados de sondas calculados sobre una hora | No se recalculan indicadores al cambiar periodo o servicio.                                                                                                          |
| `GET /dashboard/metrics`  | `metric`, `serviceId`, `from`, `to`; máximo 24 h                            | Periodo 15 min, 1 h, 6 h o 24 h y servicio aplicados en el servidor. La ventana relativa avanza en cada consulta, sin crear nuevas claves de caché por cada segundo. |
| `GET /dashboard/activity` | Últimos 20 eventos por defecto; no admite periodo ni servicio               | El servicio se aplica localmente sobre esos eventos recientes. No representa todo el historial de ese servicio.                                                      |
| `GET /dashboard/topology` | Snapshot global sin filtros                                                 | Permanece global. No se simula una topología por servicio.                                                                                                           |

El encabezado explica este alcance junto a los filtros. Para filtros globales uniformes en los siguientes bloques sería necesario ampliar esos contratos; no se simulan agregados filtrando porcentajes ya calculados.

## Encabezado implementado

- Título: **Resumen operativo**.
- Subtítulo: **Estado de los servicios bancarios supervisados.**
- Contexto de los servicios simulados: **Entorno: Laboratorio**. No representa un selector de despliegues ni infiere producción a partir de conectividad.
- Última actualización: únicamente `overview.generatedAt` recibido del servidor, con fecha, segundos y zona PET (UTC−5). Sin respuesta válida se muestra “Sin actualización recibida”. No se sustituye por la hora del render, la del clic ni `dataUpdatedAt` de la caché.
- Frescura: usa `lastObservationAt`, `dataFreshness` y antigüedad de las observaciones. Un timer local actualiza solo la etiqueta de antigüedad, nunca la fecha de actualización ni los datos. La falta de observaciones no se convierte en un estado saludable.
- Periodo y servicio: permanecen en la URL (`?period=6h&service=transfers`), con navegación atrás/adelante y enlaces compartibles. Se preservan los parámetros ajenos. Los valores inválidos se normalizan; un servicio válido pero ausente se mantiene visible como no disponible, con opción de restablecer, sin sustituirlo silenciosamente por todos.
- Actualizar: vuelve a consultar las fuentes autorizadas, conserva filtros y datos visibles y no recarga la aplicación. Ofrece estado en curso, éxito, fallo o actualización parcial, incluyendo desconexión. No cancela una consulta activa para duplicarla.
- Carga/error: el encabezado permanece visible. Las consultas fallidas con resumen en caché conservan ese resumen y muestran una advertencia; si nunca hubo datos se presenta el error existente con reintento.

## Accesibilidad

Un solo h1 para Vista general; labels visibles asociados a los selects; controles de teclado del Select existente; fechas mediante `<time>`; feedback manual con `role=status`, `aria-live=polite` y `aria-atomic`; iconos decorativos ocultos a lectores; estados expresados en texto además de color; disposición adaptable a pantallas estrechas y animación detenida con reducción de movimiento. No se anuncia cada tick de polling como una actualización manual.

## Referencias de diseño

- [IBM Carbon: visualización de datos](https://www.carbondesignsystem.com/building-blocks/data-visualization/overview): jerarquía y comunicación de información operacional.
- [Grafana: buenas prácticas](https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/best-practices/): contexto temporal y frecuencia de refresco apropiada.
- [Google SRE: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/): distinguir latencia, tráfico, errores y saturación; una sonda no representa tráfico real.
- [Nielsen Norman Group: jerarquía visual](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/): título, contexto y controles ordenados para lectura rápida.
- [WCAG 2.2: mensajes de estado](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html): feedback de actualización sin mover el foco.
- [PatternFly: skeleton](https://www.patternfly.org/components/skeleton) y [estados vacíos](https://www.patternfly.org/components/empty-state): carga, vacío y error diferenciados.

## Validación

Inspección de código y contratos; no se ejecutaron pruebas, compilaciones ni servidores, siguiendo la indicación vigente del usuario. La base incorporada desde `main` conserva sus dependencias y lockfile; no se instalaron paquetes ni se cambiaron versiones para implementar este bloque.
