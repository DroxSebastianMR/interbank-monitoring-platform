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
            artifact = joblib.load(model_path)
            if (
                isinstance(artifact, dict)
                and {"model", "score_min", "score_max"} <= artifact.keys()
            ):
                self.model = artifact

    def predict(self, request: PredictionRequest) -> PredictionResponse:
        if self.model is not None:
            features = np.array(
                [[request.latency, request.errorRate, request.timeoutRate, request.requestRate]]
            )
            raw_score = float(-self.model["model"].score_samples(features)[0])
            low = float(self.model["score_min"])
            high = float(self.model["score_max"])
            score = max(0.0, min(1.0, (raw_score - low) / max(high - low, 1e-9)))
            mode = "isolation_forest"
        else:
            latency_risk = min(request.latency / 2000, 1)
            score = min(
                1.0, latency_risk * 0.35 + request.errorRate * 0.35 + request.timeoutRate * 0.3
            )
            mode = "baseline"
        risk = "HIGH" if score >= 0.7 else "MEDIUM" if score >= 0.35 else "LOW"
        return PredictionResponse(
            anomaly=score >= 0.7, anomalyScore=round(score, 4), riskLevel=risk, modelMode=mode
        )
