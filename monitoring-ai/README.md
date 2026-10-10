# Monitoring AI

Servicio FastAPI de señal de anomalías. Devuelve riesgo; **no** decide caídas, incidentes ni cambios de NGINX. Hasta disponer de datos representativos usa un baseline heurístico explícito (`modelMode=baseline`).

## Ejecutar

Python 3.12: `python -m venv .venv`, activar el entorno, `pip install -r requirements.txt`, copiar `.env.example` a `.env` y ejecutar `uvicorn app.main:app --reload`. Tests: `pytest`. Docker: `docker build -t monitoring-ai .`.

Endpoints: `GET /health`, `POST /predict` (compatibilidad), `POST /v1/anomalies/analyze` y `POST /v1/assistant/answer`; OpenAPI en `/docs`. El análisis acepta ventanas agregadas. El asistente consume únicamente evidencia preparada por Monitoring Backend.

`training/train.py` prepara Isolation Forest, separado de la inferencia. Solo debe activarse `MODEL_MODE=isolation_forest` después de crear y evaluar un modelo real en `app/models/`.

El proveedor conversacional es opcional: `ASSISTANT_PROVIDER=none` responde con un resumen determinista; `openai` y `gemini` requieren una clave del servidor. Guía de integración y límites: `../docs/MONITORING_AI.md`.
