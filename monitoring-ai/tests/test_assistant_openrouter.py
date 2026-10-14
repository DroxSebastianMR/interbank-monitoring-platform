import asyncio

import httpx

from app.core.config import Settings
from app.core.config import get_settings
from app.main import app
from app.schemas.assistant import AssistantRequest, HistoryMessage
from app.services.assistant_service import AssistantService, OUT_OF_SCOPE


def evidence(question: str) -> AssistantRequest:
    return AssistantRequest.model_validate({
        "question": question,
        "asOf": "2026-10-14T10:00:00Z",
        "services": [{"id": "login", "name": "Login", "status": "DEGRADED", "lastCheckedAt": "2026-10-14T09:59:50Z"}],
        "incidents": [],
        "metrics": [{"serviceId": "login", "requestRate": 10, "errorRate": 0.2, "latencyP95Ms": 800}],
    })


def test_rejects_unrelated_question_before_provider_call():
    result = asyncio.run(AssistantService(Settings(
        assistant_provider="openrouter", openrouter_api_key="test-key"
    )).answer(evidence("¿Cuál es la capital de Francia?")))
    assert result.answer == OUT_OF_SCOPE
    assert result.provider == "deterministic"
    assert result.evidenceServiceIds == []


def test_unrelated_question_does_not_inherit_previous_monitoring_scope():
    request = evidence("¿Cuál es la capital de Francia?")
    request.history = [HistoryMessage(role="user", content="¿Cómo está login?")]
    result = asyncio.run(AssistantService(Settings(assistant_provider="none")).answer(request))
    assert result.answer == OUT_OF_SCOPE


def test_openrouter_receives_bounded_context_and_validates_ids(monkeypatch):
    captured = {}

    class FakeClient:
        def __init__(self, **kwargs):
            captured["timeout"] = kwargs["timeout"]

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            return None

        async def post(self, url, **kwargs):
            captured["url"] = url
            captured["payload"] = kwargs["json"]
            return httpx.Response(200, json={
                "model": "openai/gpt-4.1-mini",
                "choices": [{"message": {"content": '{"inScope":true,"answer":"Login degradado a las 10:00.","evidenceServiceIds":["login","invented"]}'}}],
                "usage": {"prompt_tokens": 100, "completion_tokens": 20},
            }, request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx, "AsyncClient", FakeClient)
    result = asyncio.run(AssistantService(Settings(
        assistant_provider="openrouter", openrouter_api_key="test-key"
    )).answer(evidence("¿Cómo está el servicio login de cliente@example.com?")))
    assert result.provider == "openrouter"
    assert result.evidenceServiceIds == ["login"]
    assert result.promptTokens == 100
    assert captured["payload"]["provider"]["zdr"] is True
    assert captured["payload"]["response_format"]["type"] == "json_schema"
    assert "cliente@example.com" not in str(captured["payload"])
    assert captured["url"].endswith("/chat/completions")


def test_missing_key_falls_back_without_leaking():
    result = asyncio.run(AssistantService(Settings(
        assistant_provider="openrouter", openrouter_api_key=None
    )).answer(evidence("¿Cómo está login?")))
    assert result.provider == "deterministic"
    assert "DEGRADED" in result.answer


def test_model_out_of_scope_decision_uses_fixed_refusal(monkeypatch):
    class FakeClient:
        def __init__(self, **_):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            return None

        async def post(self, url, **_):
            return httpx.Response(200, json={
                "choices": [{"message": {"content": '{"inScope":false,"answer":"Respuesta indebida","evidenceServiceIds":["login"]}'}}],
            }, request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx, "AsyncClient", FakeClient)
    result = asyncio.run(AssistantService(Settings(
        assistant_provider="openrouter", openrouter_api_key="test-key"
    )).answer(evidence("¿Cómo está login y cuál es el resultado del fútbol?")))
    assert result.answer == OUT_OF_SCOPE
    assert result.evidenceServiceIds == []


def test_internal_route_requires_token_when_openrouter_is_enabled():
    app.dependency_overrides[get_settings] = lambda: Settings(
        assistant_provider="openrouter", openrouter_api_key="test-key",
        ai_internal_token="a" * 32,
    )

    async def invoke():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            return await client.post("/v1/assistant/answer", json=evidence("¿Cómo está login?").model_dump(mode="json"))

    try:
        result = asyncio.run(invoke())
        assert result.status_code == 401
    finally:
        app.dependency_overrides.clear()
