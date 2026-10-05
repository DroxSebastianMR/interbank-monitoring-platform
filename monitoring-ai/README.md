# Monitoring AI

Servicio FastAPI de señal de anomalías. Devuelve riesgo; **no** decide caídas, incidentes ni cambios de NGINX. Hasta disponer de datos representativos usa un baseline heurístico explícito (`modelMode=baseline`).

## Ejecutar

Python 3.12: `python -m venv .venv`, activar el entorno, `pip install -r requirements.txt`, copiar `.env.example` a `.env` y ejecutar `uvicorn app.main:app --reload`. Tests: `pytest`. Docker: `docker build -t monitoring-ai .`.

Endpoints: `GET /health`, `POST /predict`, OpenAPI en `/docs`. El payload contiene `latency`, `errorRate`, `timeoutRate` y `requestRate`.

`training/train.py` prepara Isolation Forest, separado de la inferencia. Solo debe activarse `MODEL_MODE=isolation_forest` después de crear y evaluar un modelo real en `app/models/`.
