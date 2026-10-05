from pydantic import BaseModel, Field
class PredictionRequest(BaseModel):
    latency: float = Field(ge=0)
    errorRate: float = Field(ge=0, le=1)
    timeoutRate: float = Field(ge=0, le=1)
    requestRate: float = Field(ge=0)
