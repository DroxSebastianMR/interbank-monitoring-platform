import asyncio

import httpx

from app.core.config import Settings, get_settings
from app.main import app


def request(method: str, path: str, **kwargs) -> httpx.Response:
    async def run() -> httpx.Response:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as client:
            return await client.request(method, path, **kwargs)

    return asyncio.run(run())


def test_health():
    assert request("GET", "/health").json()["status"] == "ok"


def test_baseline_prediction_is_explicit():
    response = request(
        "POST",
        "/predict",
        json={"latency": 850, "errorRate": 0.15, "timeoutRate": 0.07, "requestRate": 320},
    )
    assert response.status_code == 200
    assert response.json()["modelMode"] == "baseline"


def test_window_analysis_has_insufficient_data_state():
    response = request(
        "POST",
        "/v1/anomalies/analyze",
        json={
            "serviceId": "login",
            "windowStart": "2026-10-09T10:00:00Z",
            "windowEnd": "2026-10-09T10:01:00Z",
            "sampleCount": 2,
            "latencyP95Ms": 100,
            "errorRate": 0,
            "timeoutRate": 0,
            "requestRate": 0,
            "availability": 1,
        },
    )
    assert response.status_code == 200
    assert response.json()["status"] == "INSUFFICIENT_DATA"


def test_window_analysis_uses_baseline_without_trained_model():
    response = request(
        "POST",
        "/v1/anomalies/analyze",
        json={
            "serviceId": "transfers",
            "windowStart": "2026-10-09T10:00:00Z",
            "windowEnd": "2026-10-09T10:01:00Z",
            "sampleCount": 6,
            "latencyP95Ms": 2400,
            "errorRate": 0.8,
            "timeoutRate": 0.6,
            "requestRate": 10,
            "availability": 0.4,
        },
    )
    assert response.status_code == 200
    assert response.json()["status"] == "OK"
    assert response.json()["riskLevel"] == "HIGH"
    assert response.json()["modelMode"] == "baseline"


def test_assistant_fallback_uses_supplied_evidence():
    app.dependency_overrides[get_settings] = lambda: Settings(
        assistant_provider="none", ai_internal_token=None, _env_file=None
    )
    try:
        response = request(
            "POST",
            "/v1/assistant/answer",
            json={
                "question": "¿Cómo está login?",
                "asOf": "2026-10-09T10:00:00Z",
                "access": {"roles": ["VIEWER"], "permissions": ["assistant.ask", "services.read"]},
                "services": [
                    {
                        "id": "login",
                        "name": "Login",
                        "status": "OPERATIONAL",
                        "lastCheckedAt": "2026-10-09T09:59:50Z",
                        "latencyMs": 35,
                    }
                ],
                "incidents": [],
            },
        )
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["provider"] == "deterministic"
    assert "Login: OPERATIONAL" in response.json()["answer"]
