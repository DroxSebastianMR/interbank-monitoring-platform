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


class AssistantRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1000)
    asOf: AwareDatetime
    services: list[ServiceEvidence] = Field(max_length=100)
    incidents: list[IncidentEvidence] = Field(max_length=100)


class AssistantResponse(BaseModel):
    answer: str
    provider: Literal["deterministic", "openai", "gemini"]
    asOf: AwareDatetime
    evidenceServiceIds: list[str]
