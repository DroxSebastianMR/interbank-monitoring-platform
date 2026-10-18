"""Local reproducible benchmark. Does not deploy a model or call banking services."""
import json
import tempfile
import time
from pathlib import Path

import numpy as np

from app.core.config import Settings
from app.schemas.prediction_request import PredictionRequest
from app.services.anomaly_service import AnomalyService
from training.evaluate import evaluate
from training.synthetic import generate
from training.train import train


def main() -> None:
    with tempfile.TemporaryDirectory(prefix="monitoring-ml-") as temporary:
        directory = Path(temporary)
        training, evaluation = generate(directory / "data")
        artifact = directory / "model.joblib"
        started = time.perf_counter()
        metadata = train(training, artifact)
        train_ms = (time.perf_counter() - started) * 1000
        result = evaluate(evaluation, artifact)
        service = AnomalyService(Settings(model_mode="isolation_forest", model_path=str(artifact)))
        sample = PredictionRequest(latency=2300, errorRate=0.4, timeoutRate=0.1, requestRate=120)
        service.predict(sample)
        durations = []
        for _ in range(200):
            started = time.perf_counter()
            service.predict(sample)
            durations.append((time.perf_counter() - started) * 1000)
        print(json.dumps({"mode": "synthetic-local-no-network", "training": metadata, "evaluation": result, "trainingMs": train_ms, "inferenceSamples": len(durations), "inferenceP50Ms": float(np.quantile(durations, .50)), "inferenceP95Ms": float(np.quantile(durations, .95)), "inferenceP99Ms": float(np.quantile(durations, .99))}, indent=2))


if __name__ == "__main__":
    main()
