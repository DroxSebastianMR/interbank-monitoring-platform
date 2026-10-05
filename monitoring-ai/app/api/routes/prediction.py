from fastapi import APIRouter, Depends
from app.api.dependencies.anomaly import get_anomaly_service
from app.schemas.prediction_request import PredictionRequest
from app.schemas.prediction_response import PredictionResponse
from app.services.anomaly_service import AnomalyService
router = APIRouter(tags=["prediction"])
@router.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest, service: AnomalyService = Depends(get_anomaly_service)) -> PredictionResponse:
    return service.predict(payload)
