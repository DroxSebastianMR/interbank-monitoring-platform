# Estados de datos, contratos y validación de Vista general

## Alcance

Se modifica Vista general y sus adaptadores mínimos de navegación, consultas y caché compartida. No se cambia la detección, apertura/resolución de incidentes, alertas o IA. No se crea una ruta de backend, una nueva lógica de autenticación ni una integración directa con servicios internos desde React.

## Estados de datos

| Estado | Comportamiento |
| --- | --- |
| Loading | Esqueleto inicial discreto de seis tarjetas y paneles. Las actualizaciones posteriores conservan caché; no vuelven a montar toda la vista ni recargan el documento. |
| Success | Se publican valores validados, con fuente, unidad, periodo y fechas reales cuando corresponden. |
| Empty | Una consulta válida devuelve cero filas/servicios/eventos para el filtro. Se indica ese alcance, sin convertir otros errores en una tabla vacía. Un conteo realmente medido de cero sigue siendo válido. |
| No data | La fuente no aporta observaciones, cobertura o instrumentación suficiente. Se muestra «—» o Sin datos; no se fabrica 0 %, 100 % ni 0 ms. |
| Stale | Se conservan datos útiles y hechos históricos. Se identifica desactualización y la fecha del último resumen válido. Los servicios e instancias no permanecen operativos por tener una respuesta antigua. |
| Partial failure | El aviso enumera la fuente afectada. Las fuentes válidas continúan funcionando y se permite reintentar todas las consultas autorizadas sin recargar. |
| Unauthorized | Se diferencia HTTP 401. La sesión sigue usando el interceptor y renovación existentes; si no se recupera, se ofrece iniciar sesión. No se muestra contenido almacenado con acceso denegado. |
| Forbidden | Se diferencia HTTP 403 del servidor, incluso si los permisos locales todavía estaban cacheados. No se interpreta como desconexión ni ausencia de filas. Se puede volver a consultar el acceso manualmente. |
| Backend disconnected | Un error de transporte o pausa de red marca las fuentes afectadas. El navegador notifica offline inmediatamente, sin esperar 10 s al siguiente polling. Se conserva el último total/conteo confirmado como lectura desactualizada y se retira la afirmación de operación actual. |
| Contract incompatible | HTTP 404 o respuesta con esquema incorrecto indica contrato de monitoreo no disponible. No se presenta como caída bancaria ni se transforma un payload antiguo en un resumen con ceros. |

Los datos almacenados de una fuente que recibe 401/403 se ocultan, aunque React Query conserve su caché interna. Esto es distinto de un fallo temporal de red, donde los datos históricos/catálogos todavía pueden ser útiles con una marca de antigüedad.

El aviso muestra fechas del servidor (`generatedAt`, fin del rango de métricas), no `Date.now()` como si fuera una lectura del backend. Los relojes locales solo calculan edad y vencimiento. Los estados operativos usan comprobaciones por servicio/componente con vigencia de 30 s, coherente con el contrato inspeccionado.

## Validación de contratos

`dashboard-contracts.ts` valida con Zod resumen, series y topología: fechas, valores finitos, unidades, ratios, límites de muestras y campos indispensables. No aplica defaults que oculten campos ausentes. Una disponibilidad con unidad ms, un contador negativo o el resumen legado `{ total, byStatus }` no pueden convertirse en datos actuales.

La aplicación utiliza únicamente el cliente Axios de Monitoring Backend para resumen, catálogo, incidentes, alertas, historia, instancias y métricas. El WebSocket existente también apunta al Monitoring Backend. Las referencias a Prometheus en el frontend son etiquetas de fuente recibidas del backend, no conexiones a Prometheus. No se añaden clientes de Redis, PostgreSQL ni accesos a interbank-app-backend desde esta vista.

### Diferencia real entre ramas de backend

Esta rama se creó desde `develop`, cuyo backend local sigue siendo anterior al dashboard importado desde `main` al iniciar el trabajo:

- `develop` ofrece `/analytics/summary` con `{ total, byStatus }` y un login de demostración que solo devuelve un token.
- El frontend existente usa autenticación de empleados/permisos y contratos `/dashboard/overview`, `/dashboard/metrics`, `/dashboard/topology`, catálogo enriquecido, historias y observabilidad de endpoints presentes en `main`.

El resumen legado no es una equivalencia segura: no tiene incidentes activos, frescura, cobertura ni metadatos suficientes. Convertirlo con ceros o crear un puente de autenticación de demostración produciría una integración ficticia o insegura. Actualizar ese backend completo implicaría cambiar más de 200 archivos, autenticación, persistencia y módulos operativos; excede una ampliación mínima y la restricción de no reescribir el sistema.

Por ello no se sobrescribe `monitoring-backend`. La integración real requiere ejecutar/desplegar una versión compatible del Monitoring Backend, con los contratos actuales y credenciales legítimas. Los límites de reconocimiento de alertas y de historia HTTP documentados en los bloques anteriores siguen pendientes del contrato del backend compatible. El frontend ahora expone una incompatibilidad en lugar de afirmar que está conectado correctamente.

## Actualización y rendimiento

- Se conserva React Query. Las consultas autorizadas de esta vista mantienen polling de 10 s, sin recargar la página.
- Endpoints comparte la misma clave/caché que su módulo. Solo el observador de Vista general usa 10 s para el objetivo de visibilidad; el módulo Endpoints conserva su intervalo por defecto de 30 s. No se crea otra consulta por tarjeta ni por instante del gráfico.
- 10 s de sondeo y timeout de 5 s permiten aspirar a hasta 15 s desde datos ya procesados en respuestas satisfactorias. No es una garantía ante caída de red, reintentos, falta de procesamiento o instrumentación; no se afirma haber medido ese SLA contra el backend real.
- No se repiten automáticamente 401/403, contratos incompatibles o 404 en los queries de dashboard. Las demás incidencias tienen como máximo un reintento automático, además del control manual.
- Las consultas en curso se reutilizan al actualizar manualmente. La caché permanece disponible en los refetches; los filtros no mezclan valores de otra clave de periodo/servicio.
- Las acciones existentes de Servicios invalidan también catálogo, historia, métricas y topología relacionados del dashboard. Los eventos de incidentes invalidan las claves de dashboard del usuario y permisos actuales sin cancelar una petición ya en curso. No se cambia la lógica de esas acciones o eventos.
- Los esqueletos y el giro de actualización respetan `prefers-reduced-motion`; no se incorpora una animación de tráfico permanente.

## Comprobaciones realizadas y límites

El apartado 14 de la última solicitud se interpretó como autorización para comprobar escenarios, después de las instrucciones anteriores de no ejecutar pruebas. Se instalaron las dependencias del dashboard desde su lockfile, sin modificar el manifiesto ni ejecutar scripts de instalación.

Se ejecutaron:

- 20 pruebas de escenarios y contratos en `tests/overview/operational-scenarios.test.ts`.
- 7 pruebas del componente real DashboardPage con respuestas Axios controladas en `tests/overview/dashboard-ui.test.tsx`.
- 2 pruebas existentes de traducción operacional.
- Una verificación TypeScript sin emisión (`tsc --noEmit`) que pasó tras corregir el acceso a una fecha en la rama sin datos.

Resultado actualizado el 18 de octubre de 2026, con autorización explícita del usuario solo para esta validación: **29 pruebas aprobadas y comprobación TypeScript sin emisión aprobada**, incluidos los últimos ajustes de permisos, caché, invalidación y esqueletos. No se ejecutó una compilación de producción ni se desplegó código.

| Escenario | Evidencia | Alcance pendiente |
| --- | --- | --- |
| A: todos operativos | Mensaje factual y render de siete secciones/seis indicadores. | Revisión visual con datos reales. |
| B: degradado | Clasificación prioritaria y enlace al servicio real. | Motivo específico si el contrato lo publica. |
| C: incidente abierto | Inclusión en atención, prioridad y enlace con referencia. | Verificación con registro real autenticado. |
| D: históricos | Resueltos excluidos de atención y recuperación incluida en histórico. | Historial completo requiere paginación del backend. |
| E: métricas ausentes | Ausencia, una muestra aislada, truncamiento y unidad incompatible no producen un KPI válido; cero medido sí se acepta. | Series HTTP históricas y reconocimiento de alertas no están instrumentados. |
| F: desconexión | La prueba del componente conserva el último total, muestra desactualización, retira el mensaje operativo y habilita reintento. | Caída/reconexión contra backend real. |
| G: filtros | La URL con 6 h y Consulta de saldo produce los parámetros reales de rango/servicio; HTTP sin historia muestra el mensaje explícito. | Cambios interactivos de selectores en navegador. |
| H: navegación | Los enlaces generados conservan selección y utilizan rutas/referencias existentes. | Recorrido completo por clic y regreso en navegador. |
| I: responsive | CSS y contenedores revisados para grid adaptable y overflow local. | No se ha verificado visualmente desktop, tablet y móvil. |
| J: accesibilidad | Pruebas consultan roles/nombres accesibles; existen enlaces nativos, foco visible, estados escritos, tooltip con teclado y reducción de movimiento. | No se afirma auditoría WCAG completa; falta recorrido visual y teclado en navegador. |

### Límite de revisión visual

Se preparó `tests/overview/fixture.html`, aislada de la entrada de producción, con la advertencia visible «PRUEBA CONTROLADA · sin conexión a un backend real». Utiliza los componentes y rutas reales con respuestas de prueba deterministas; no representa una integración viva ni se distribuye desde la entrada de producción.

El primer intento fue rechazado por revisión automática debido a la instrucción anterior de no ejecutar pruebas. El usuario autorizó después la validación solo por esta vez. Con esa autorización se repitieron las 29 pruebas y TypeScript correctamente. Al abrir la fixture local, el navegador devolvió `net::ERR_CONNECTION_TIMED_OUT`; una comprobación HTTP local también fue bloqueada por permisos de acceso al socket de Windows. Por ello no se afirma una validación visual ni de navegación en navegador: desktop, tablet, móvil y teclado siguen pendientes. El servidor temporal de Vite se cerró al terminar. La integración contra un Monitoring Backend real compatible tampoco se ha validado. La autorización excepcional no cambia la preferencia para trabajos futuros.

