from pathlib import Path
import joblib
import numpy as np
from app.core.config import Settings
from app.schemas.prediction_request import PredictionRequest
from app.schemas.prediction_response import PredictionResponse

class AnomalyService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.model = None
        model_path = Path(settings.model_path)
        if settings.model_mode == "isolation_forest" and model_path.exists():
            self.model = joblib.load(model_path)

    def predict(self, request: PredictionRequest) -> PredictionResponse:
        if self.model is not None:
            features = np.array([[request.latency, request.errorRate, request.timeoutRate, request.requestRate]])
            raw_score = float(-self.model.score_samples(features)[0])
            score = max(0.0, min(1.0, raw_score))
            mode = "isolation_forest"
        else:
            latency_risk = min(request.latency / 2000, 1)
            score = min(1.0, latency_risk * .35 + request.errorRate * .35 + request.timeoutRate * .3)
            mode = "baseline"
        risk = "HIGH" if score >= .7 else "MEDIUM" if score >= .35 else "LOW"
        return PredictionResponse(anomaly=score >= .7, anomalyScore=round(score, 4), riskLevel=risk, modelMode=mode)
