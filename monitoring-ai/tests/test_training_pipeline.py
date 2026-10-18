from pathlib import Path

import pandas as pd
import pytest

from app.core.config import Settings
from app.schemas.prediction_request import PredictionRequest
from app.services.anomaly_service import AnomalyService
from training.evaluate import evaluate
from training.synthetic import generate
from training.train import train


def test_real_training_temporal_evaluation_and_inference(tmp_path: Path):
    training, evaluation = generate(tmp_path / "data")
    model = tmp_path / "model-v1.joblib"
    metadata = train(training, model)
    result = evaluate(evaluation, model)
    assert metadata["source"] == ["synthetic"]
    assert result["samples"] == 1200
    assert 0 <= result["precision"] <= 1
    assert 0 <= result["recall"] <= 1
    service = AnomalyService(Settings(model_mode="isolation_forest", model_path=str(model)))
    prediction = service.predict(PredictionRequest(latency=2500, errorRate=0.7, timeoutRate=0.2, requestRate=100))
    assert prediction.modelMode == "isolation_forest"
    assert prediction.modelVersion == metadata["modelVersion"]
    assert prediction.scoreMeaning == "relative-anomaly-not-outage-probability"
    with pytest.raises(ValueError, match="strictly after"):
        evaluate(training, model)
    with pytest.raises(ValueError, match="overwrite"):
        train(training, model)


def test_invalid_features_are_rejected(tmp_path: Path):
    training, _ = generate(tmp_path / "data")
    frame = pd.read_csv(training)
    frame.loc[0, "latency"] = float("inf")
    frame.to_csv(training, index=False)
    with pytest.raises(ValueError, match="finite"):
        train(training, tmp_path / "bad.joblib")
