# Pipeline ML y límites

`monitoring-ai/training/` incluye validación, generación offline reproducible, entrenamiento, calibración cronológica, evaluación posterior y benchmark. No sustituye el endpoint baseline existente.

Dataset requiere timestamp UTC estrictamente creciente, source `observed`/`synthetic`, features finitas no negativas; tasas entre 0 y 1. Features conservadas: latency, errorRate, timeoutRate, requestRate. No se agregaron features sin fuente real.

Entrenamiento: primeras 80% de filas, IsolationForest 100 árboles seed42, n_jobs1. Calibración: últimas20%, umbral correspondiente al percentil99 de esa ventana. Evaluación exige comenzar después de fit **y** calibración. Rechaza sobreescribir artefactos. Metadata: hash dataset, versión modelo/sklearn, features, origen y fechas. Cargar joblib solo desde rutas administradas; nunca aceptar modelos subidos por usuarios (joblib puede ejecutar código).

Comandos desde monitoring-ai, venv existente:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m training.benchmark
.\.venv\Scripts\python.exe -m training.synthetic --output datasets/experiment-001
.\.venv\Scripts\python.exe -m training.train --dataset datasets/experiment-001/training.csv --output app/models/experiment-001.joblib
.\.venv\Scripts\python.exe -m training.evaluate --dataset datasets/experiment-001/evaluation.csv --model app/models/experiment-001.joblib
```

Benchmark sintético local: 1920 fit,480 calibración,1200 evaluación (400 anomalías). Precisión95.45%, recall36.75%,7 FP,253 FN, FPR0.875%. Inferencia200 repeticiones: p50 2.888ms,p95 5.132ms,p99 7.779ms; entrenamiento128.713ms. No incluye HTTP/red/Docker. No prueba precisión con tráfico real.

**No promover este modelo a recuperación automática:** recall insuficiente. Producción/demo conserva baseline. Falta recolector histórico, escenarios Redis/IA/instancia, selección por endpoint, evaluación en incidentes reales, registro durable de predicciones/drift y aprobación de promoción. Puntuación relativa, no probabilidad calibrada de caída.
