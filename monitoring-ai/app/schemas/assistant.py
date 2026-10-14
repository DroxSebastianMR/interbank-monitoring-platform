from typing import Literal

from pydantic import AwareDatetime, BaseModel, Field


class ServiceEvidence(BaseModel):
    id: str
    name: str
    status: str
    lastCheckedAt: AwareDatetime | None = None
    latencyMs: float | None = None


class IncidentEvidence(BaseModel):
    id: str
    serviceId: str
    title: str
    status: str


class MetricEvidence(BaseModel):
    serviceId: str
    requestRate: float
    errorRate: float
    latencyP95Ms: float


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=1000)


class AssistantRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1000)
    asOf: AwareDatetime
    services: list[ServiceEvidence] = Field(max_length=100)
    incidents: list[IncidentEvidence] = Field(max_length=100)
    metrics: list[MetricEvidence] = Field(default_factory=list, max_length=100)
    history: list[HistoryMessage] = Field(default_factory=list, max_length=6)


class AssistantResponse(BaseModel):
    answer: str
    provider: Literal["deterministic", "openai", "gemini", "openrouter"]
    asOf: AwareDatetime
    evidenceServiceIds: list[str]
    model: str | None = None
    promptTokens: int | None = None
    completionTokens: int | None = None
