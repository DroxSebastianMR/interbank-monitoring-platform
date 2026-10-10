from functools import lru_cache

from app.core.config import get_settings
from app.services.anomaly_service import AnomalyService


@lru_cache
def get_anomaly_service() -> AnomalyService:
    return AnomalyService(get_settings())
