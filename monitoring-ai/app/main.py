from fastapi import FastAPI

from app.api.routes.analysis import router as analysis_router
from app.api.routes.assistant import router as assistant_router
from app.api.routes.health import router as health_router
from app.api.routes.prediction import router as prediction_router
from app.core.logging import configure_logging

configure_logging()
app = FastAPI(
    title="Monitoring AI",
    version="0.1.0",
    description="Anomaly risk signal; final service state is decided by monitoring-backend.",
)
app.include_router(health_router)
app.include_router(prediction_router)
app.include_router(analysis_router)
app.include_router(assistant_router)
