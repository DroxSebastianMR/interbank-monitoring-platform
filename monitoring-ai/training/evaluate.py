"""Evaluate a trained model on a separate, chronologically later labelled CSV."""

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import precision_score, recall_score

from app.core.features import FEATURES


def evaluate(dataset: Path, artifact_path: Path) -> dict[str, float | int]:
    frame = pd.read_csv(dataset)
    required = [*FEATURES, "isIncident"]
    if (
        frame.empty
        or not set(required).issubset(frame.columns)
        or frame[required].isnull().any().any()
    ):
        raise ValueError("Evaluation CSV requires non-null features and isIncident labels")
    if not set(frame["isIncident"].unique()).issubset({0, 1}):
        raise ValueError("isIncident must contain only 0 and 1")
    artifact = joblib.load(artifact_path)
    scores = -artifact["model"].score_samples(frame[FEATURES])
    span = max(float(artifact["score_max"] - artifact["score_min"]), 1e-9)
    normalized = np.clip((scores - artifact["score_min"]) / span, 0, 1)
    predicted = normalized >= 0.7
    actual = frame["isIncident"].astype(bool)
    return {
        "samples": len(frame),
        "precision": float(precision_score(actual, predicted, zero_division=0)),
        "recall": float(recall_score(actual, predicted, zero_division=0)),
        "falsePositives": int((predicted & ~actual).sum()),
        "falseNegatives": int((~predicted & actual).sum()),
    }


if __name__ == "__main__":
    result = evaluate(Path("datasets/evaluation.csv"), Path("app/models/isolation_forest.joblib"))
    print(json.dumps(result, indent=2))
