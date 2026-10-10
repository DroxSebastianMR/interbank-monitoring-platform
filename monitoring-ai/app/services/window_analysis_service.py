from app.schemas.analysis import AnalyzeWindowRequest, AnalyzeWindowResponse
from app.schemas.prediction_request import PredictionRequest
from app.services.anomaly_service import AnomalyService


class WindowAnalysisService:
    def __init__(self, anomaly_service: AnomalyService):
        self.anomaly_service = anomaly_service

    def analyze(self, window: AnalyzeWindowRequest) -> AnalyzeWindowResponse:
        if window.sampleCount < 3:
            return AnalyzeWindowResponse(
                serviceId=window.serviceId,
                status="INSUFFICIENT_DATA",
                anomalyScore=0,
                riskLevel="LOW",
                modelMode="baseline",
                reasons=["Fewer than three observations in the window"],
            )
        prediction = self.anomaly_service.predict(
            PredictionRequest(
                latency=window.latencyP95Ms,
                errorRate=window.errorRate,
                timeoutRate=window.timeoutRate,
                requestRate=window.requestRate,
            )
        )
        reasons: list[str] = []
        if window.errorRate >= 0.1:
            reasons.append("High error rate")
        if window.timeoutRate >= 0.05:
            reasons.append("High timeout rate")
        if window.latencyP95Ms >= 1000:
            reasons.append("High p95 latency")
        if window.availability < 1:
            reasons.append("Health checks failed")
        return AnalyzeWindowResponse(
            serviceId=window.serviceId,
            status="OK",
            anomalyScore=prediction.anomalyScore,
            riskLevel=prediction.riskLevel,
            modelMode=prediction.modelMode,
            reasons=reasons,
        )
