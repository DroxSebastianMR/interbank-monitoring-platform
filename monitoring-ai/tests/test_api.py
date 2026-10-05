from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)
def test_health():
    assert client.get("/health").json()["status"] == "ok"
def test_baseline_prediction_is_explicit():
    response = client.post("/predict", json={"latency": 850, "errorRate": .15, "timeoutRate": .07, "requestRate": 320})
    assert response.status_code == 200
    assert response.json()["modelMode"] == "baseline"
