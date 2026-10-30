# Incremento 1: consistencia del motor de monitoreo

Rama: `codex/fix-monitoring-state-consistency`, creada desde `develop` actualizado por avance rápido a `origin/develop` (`214ded0`). No se importaron módulos desde otra rama ni se modificó el diseño del dashboard.

## Problema y resultado

Antes, un score alto de IA podía producir degradación y abrir un incidente. Además, el p95 y las tasas de la ventana de sondas se reemplazaban con máximos del tráfico HTTP, y los fallos históricos podían dificultar reconocer una recuperación real.

Ahora las decisiones técnicas utilizan señales técnicas explícitas. El riesgo de IA se conserva como atributo independiente y no modifica el estado ni crea incidentes por sí solo. Las ventanas de sondas no se sobrescriben con tráfico HTTP. La evidencia de cada decisión conserva ambas fuentes y el perfil de reglas.

## Perfil inicial operational-v1

| Condición | Comportamiento |
| --- | --- |
| Sonda funcional válida y sin incumplimientos técnicos | Operativo, o acumulación de recuperación si venía de una afectación. |
| Primeras señales de fallo o lentitud | Confirmación pendiente; no abrir incidente nuevo. Si aún no existe una afectación confirmada, el read model responde NO_DATA con pendingConfirmation y último estado conocido. |
| Tres fallos consecutivos de sonda | No disponible. Un timeout o cuerpo funcional incorrecto no se considera saludable. |
| Incumplimiento sostenido | Degradado al reunir tres observaciones y al menos 20 s desde la primera señal. |
| Tres comprobaciones saludables consecutivas después de afectación | Recuperación confirmada; antes se mantiene RECOVERING. Una respuesta lenta no suma éxitos saludables. |
| Falta la señal HTTP necesaria para verificar recuperación de una afectación HTTP | No inferir recuperación de una sonda saludable: NO_DATA en lectura, último estado persistido conservado y sin resolver incidente. |
| Observación de más de 30 s, fecha inválida/futura o supervisión pausada | NO_DATA en lectura. No sobrescribir el último estado técnico ni resolver incidentes. |
| Score IA alto sin incumplimiento técnico | Riesgo alto independiente; estado operativo sin cambios por esa causa. |
| Error local inesperado del recolector o fallo de persistencia | No registrar un falso fallo bancario ni publicar estado en memoria antes de persistir. La observación anterior envejece. |

Se mantienen las rutas y los estados persistidos existentes; NO_DATA es una proyección de lectura, no una recuperación o caída artificial almacenada. La confirmación de indisponibilidad por tres fallos es independiente del temporizador de degradación. Una indisponibilidad confirmada no se rebaja por seguir observando respuestas no saludables.

Los parámetros son iniciales y requieren revisión de Datos/Calidad antes de la evaluación formal del SRS. No constituyen una calibración estadística validada ni implementan todas las reglas de alerta temprana propuestas, como CPU sostenida o tendencia de 120 s.

Variables: `LATENCY_THRESHOLD_MS`, `MAX_HEALTH_FAILURES`, `DEGRADATION_SAMPLES`, `DEGRADATION_DURATION_MS`, `RECOVERY_SAMPLES`, `OBSERVATION_MAX_AGE_MS`, `HTTP_ERROR_RATE_THRESHOLD`. Hay validación de rangos y de coherencia entre vigencia, intervalo y timeout. El Compose principal propaga estas variables con defaults. Todavía no existe edición de perfiles por servicio desde una pantalla; se registra el perfil efectivo usado en cada muestra.

## Fuentes y evidencia

`evaluation` añade metadatos opcionales a las respuestas de servicio y se persiste como JSON en MonitoredService y HealthCheck:

- `schemaVersion`, `serviceVersion`, perfil y parámetros efectivos.
- `observedAt`: fin de la sonda, sin renovarlo artificialmente después del análisis IA.
- `probe`: duración, resultado funcional, timeout y ventana real de sondas, con fracaso de sondas separado de errores HTTP.
- `http`: tasa de solicitudes, proporción HTTP 5xx y p95 del histograma de tráfico, con ventana de 60 s y `queriedAt`. El momento de consulta no se presenta como un heartbeat independiente de instrumentación.
- `risk`: resultado de IA o ausencia explícita de evaluación, y procedencia `probe-window-with-http-rate`.
- Motivos, contador de degradaciones, `firstSignalAt`, `confirmedAt`, `lastConfirmedStatus`, confirmación pendiente y suficiencia de la señal técnica para recuperación.

La composición de features de IA usa latencia/error/timeout de la ventana de sondas y tasa HTTP real cuando existe, sin mutar la ventana original. No se envía un cero inventado de tráfico cuando no hay esa fuente: se conserva riesgo no evaluable por insuficiencia. El score sigue sin ser probabilidad de caída ni prueba de precisión del modelo.

En Prometheus, una tasa o percentil ausente es null. El asistente mantiene su contrato anterior enviando únicamente conjuntos completos de métricas, y usa la misma proyección de frescura para no afirmar estados operativos vencidos.

La evidencia se guarda junto con la observación y el cambio de estado en la transacción existente. El estado en memoria se publica después del commit. El registro usa la versión vigente y supervisión activa para rechazar una comprobación que quedó obsoleta frente a un cambio/pausa. El próximo incremento puede reutilizar esta evidencia en el expediente del incidente.

## Secuencias, pausas y reinicios

Los contadores de confirmación se reconstruyen desde la evaluación persistida cuando la observación es reciente y coincide el perfil y la versión de servicio. Se reinician frente a una brecha de observaciones, cambio de perfil/versión o pausa/reanudación. La comparación de parámetros no depende del orden de claves de JSONB.

Esto no implementa todavía deduplicación distribuida por turno/origen ni un lock entre múltiples procesos de monitor. Se conserva la protección local contra comprobaciones solapadas. La ventana de IA se reconstruye en memoria y necesita nuevas muestras después de reiniciar.

## Migración y activación pendiente

Se preparó `20261029120000_operational_evidence`, que agrega dos columnas JSONB anulables. No se ejecutó ni se conectó a ninguna base. No elimina ni reescribe registros anteriores.

Antes de iniciar esta versión contra una base autorizada, generar el cliente Prisma y aplicar las migraciones pendientes:

```powershell
cd monitoring-backend
pnpm prisma:generate
pnpm prisma:migrate
```

No arrancar el backend nuevo sobre el esquema anterior: necesita esas columnas. La ejecución debe realizarse en el entorno elegido explícitamente, sin asumir que un `.env` apunta al laboratorio local. Docker y WSL permanecen apagados durante esta implementación.

## Verificación preparada, no ejecutada

- Se actualizó el caso anterior que esperaba incidentes tras fallos transitorios no confirmados.
- Se añadieron casos para riesgo IA alto sin degradación, degradación por duración y muestras, recuperación sin contaminación por fallos históricos, caducidad sin resolver incidentes, reinicio de secuencia tras una brecha, separación de latencias, error de persistencia y ausencia de HTTP durante recuperación.
- Se revisaron referencias y diferencias de código. No se ejecutaron tests, compilación, lint, generación Prisma ni migraciones. No se afirma que esos casos hayan pasado.

## Relación con el cierre del monitor

Este incremento prepara RF-09/10/12-16/18-21 y RN-07/08/09/10: las afectaciones que llegan a Incidentes tienen criterio de confirmación y evidencia reproducible. No completa asignación, reconocimiento, cierre manual, alertas preventivas independientes, comunicación pública, campañas ni medición de objetivos no funcionales.

Siguiente incremento recomendado: implementar la atención del incidente (responsable, reconocimiento, notas, versión esperada y transiciones), manteniendo el estado técnico exclusivamente bajo control del motor.
