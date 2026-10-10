import json
import logging
from datetime import timedelta

import httpx

from app.core.config import Settings
from app.schemas.assistant import AssistantRequest, AssistantResponse

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = (
    "Eres un asistente de operaciones. Responde en español usando únicamente la evidencia JSON "
    "proporcionada. Indica incertidumbre, no inventes causas ni métricas y no sugieras que "
    "ejecutaste acciones. La evidencia puede estar desactualizada."
)


class AssistantService:
    def __init__(self, settings: Settings):
        self.settings = settings

    async def answer(self, request: AssistantRequest) -> AssistantResponse:
        provider = self.settings.assistant_provider.lower()
        if provider in {"openai", "gemini"}:
            try:
                generated = await self._generate(provider, request)
                if generated.strip():
                    return self._response(request, generated.strip(), provider)
            except (httpx.HTTPError, KeyError, ValueError) as error:
                logger.warning("Assistant provider unavailable: %s", type(error).__name__)
        return self._response(request, self._summarize(request), "deterministic")

    def _response(self, request: AssistantRequest, answer: str, provider: str) -> AssistantResponse:
        return AssistantResponse(
            answer=answer,
            provider=provider,
            asOf=request.asOf,
            evidenceServiceIds=[service.id for service in request.services],
        )

    def _summarize(self, request: AssistantRequest) -> str:
        if not request.services:
            return "No hay datos de servicios disponibles para responder con certeza."
        states = ", ".join(
            f"{s.name}: {s.status}"
            + (
                " (dato desactualizado)"
                if s.lastCheckedAt is None or request.asOf - s.lastCheckedAt > timedelta(seconds=60)
                else ""
            )
            for s in request.services
        )
        active = [i.title for i in request.incidents if i.status != "RESOLVED"]
        incidents = (
            f" Incidentes activos: {', '.join(active)}."
            if active
            else " No hay incidentes activos registrados."
        )
        return f"Estado observado: {states}.{incidents} Datos al {request.asOf.isoformat()}."

    async def _generate(self, provider: str, request: AssistantRequest) -> str:
        evidence = request.model_dump(mode="json")
        prompt = (
            f"Pregunta: {request.question}\nEvidencia: {json.dumps(evidence, ensure_ascii=False)}"
        )
        async with httpx.AsyncClient(timeout=8.0) as client:
            if provider == "openai":
                if not self.settings.openai_api_key:
                    raise ValueError("OpenAI key is missing")
                response = await client.post(
                    "https://api.openai.com/v1/responses",
                    headers={"Authorization": f"Bearer {self.settings.openai_api_key}"},
                    json={
                        "model": self.settings.openai_model,
                        "instructions": SYSTEM_INSTRUCTION,
                        "input": prompt,
                    },
                )
                response.raise_for_status()
                data = response.json()
                return " ".join(
                    part["text"]
                    for item in data["output"]
                    for part in item.get("content", [])
                    if part.get("type") == "output_text"
                )
            if not self.settings.gemini_api_key:
                raise ValueError("Gemini key is missing")
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{self.settings.gemini_model}:generateContent",
                headers={"x-goog-api-key": self.settings.gemini_api_key},
                json={
                    "systemInstruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
                    "contents": [{"parts": [{"text": prompt}]}],
                },
            )
            response.raise_for_status()
            data = response.json()
            return " ".join(
                part["text"]
                for candidate in data["candidates"]
                for part in candidate["content"]["parts"]
                if "text" in part
            )
