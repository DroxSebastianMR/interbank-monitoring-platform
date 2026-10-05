from typing import Literal
from pydantic import BaseModel, Field
class PredictionResponse(BaseModel):
    anomaly: bool
    anomalyScore: float = Field(ge=0, le=1)
    riskLevel: Literal["LOW", "MEDIUM", "HIGH"]
    modelMode: Literal["baseline", "isolation_forest"]
