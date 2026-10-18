from typing import Literal

from pydantic import AwareDatetime, BaseModel, Field, model_validator


class AnalyzeWindowRequest(BaseModel):
    serviceId: str = Field(min_length=1, max_length=100)
    windowStart: AwareDatetime
    windowEnd: AwareDatetime
    sampleCount: int = Field(ge=0)
    latencyP95Ms: float = Field(ge=0)
    errorRate: float = Field(ge=0, le=1)
    timeoutRate: float = Field(ge=0, le=1)
    requestRate: float = Field(ge=0)
    availability: float = Field(ge=0, le=1)

    @model_validator(mode="after")
    def valid_window(self) -> "AnalyzeWindowRequest":
        if self.windowStart >= self.windowEnd:
            raise ValueError("windowStart must be before windowEnd")
        return self


class AnalyzeWindowResponse(BaseModel):
    serviceId: str
    status: Literal["OK", "INSUFFICIENT_DATA"]
    anomalyScore: float = Field(ge=0, le=1)
    riskLevel: Literal["LOW", "MEDIUM", "HIGH"]
    modelMode: Literal["baseline", "isolation_forest"]
    reasons: list[str]
    modelVersion: str = "baseline-v1"
    scoreMeaning: str = "relative-anomaly-not-outage-probability"
    featureNames: list[str] = Field(default_factory=list)
