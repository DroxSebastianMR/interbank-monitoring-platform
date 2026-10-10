from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies.anomaly import get_anomaly_service
from app.schemas.analysis import AnalyzeWindowRequest, AnalyzeWindowResponse
from app.services.anomaly_service import AnomalyService
from app.services.window_analysis_service import WindowAnalysisService

router = APIRouter(prefix="/v1/anomalies", tags=["anomalies"])


@router.post("/analyze", response_model=AnalyzeWindowResponse)
def analyze_window(
    payload: AnalyzeWindowRequest,
    anomaly_service: Annotated[AnomalyService, Depends(get_anomaly_service)],
) -> AnalyzeWindowResponse:
    return WindowAnalysisService(anomaly_service).analyze(payload)
