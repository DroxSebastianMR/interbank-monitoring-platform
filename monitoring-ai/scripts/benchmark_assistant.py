"""Measure the deterministic assistant API without an external model or database."""

import asyncio
import logging
import statistics
import time

import httpx

from app.main import app


PAYLOAD = {
    "question": "¿Cómo está el servicio login?",
    "asOf": "2026-10-14T10:00:00Z",
    "services": [{"id": "login", "name": "Login", "status": "OPERATIONAL", "lastCheckedAt": "2026-10-14T09:59:50Z", "latencyMs": 40}],
    "incidents": [],
}


async def main() -> None:
    logging.getLogger("httpx").setLevel(logging.WARNING)
    samples: list[float] = []
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        for _ in range(100):
            started = time.perf_counter()
            response = await client.post("/v1/assistant/answer", json=PAYLOAD)
            response.raise_for_status()
            samples.append((time.perf_counter() - started) * 1000)
    ordered = sorted(samples)
    print({"requests": len(samples), "p50_ms": round(statistics.median(samples), 2), "p95_ms": round(ordered[94], 2), "provider": "deterministic", "scope": "in-process ASGI, no network/OpenRouter"})


if __name__ == "__main__":
    asyncio.run(main())
