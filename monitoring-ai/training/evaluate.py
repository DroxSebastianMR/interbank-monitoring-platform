"""Evaluate strictly later observations; load ONLY trusted, locally trained joblib files."""
import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import precision_score, recall_score

from app.core.features import FEATURES
from training.dataset import read_dataset


def evaluate(dataset: Path, artifact_path: Path) -> dict:
    frame = read_dataset(dataset, labelled=True)
    artifact = joblib.load(artifact_path)
    metadata = artifact.get("metadata", {})
    if metadata.get("features") != FEATURES or not metadata.get("trainingEnd"):
        raise ValueError("Evaluation requires a versioned artifact with temporal provenance")
    if frame["timestamp"].min() <= pd.Timestamp(metadata["trainingEnd"]):
        raise ValueError("Evaluation must be strictly after fit AND calibration data")
    scores = -artifact["model"].score_samples(frame[FEATURES].to_numpy(dtype=float))
    span = max(float(artifact["score_max"] - artifact["score_min"]), 1e-9)
    predicted = np.clip((scores - artifact["score_min"]) / span, 0, 1) >= 0.7
    actual = frame["isIncident"].astype(bool)
    false_positives = int((predicted & ~actual).sum())
    return {
        "modelVersion": metadata["modelVersion"], "source": sorted(frame["source"].unique().tolist()),
        "samples": len(frame), "precision": float(precision_score(actual, predicted, zero_division=0)),
        "recall": float(recall_score(actual, predicted, zero_division=0)),
        "falsePositives": false_positives, "falseNegatives": int((~predicted & actual).sum()),
        "falsePositiveRate": false_positives / max(int((~actual).sum()), 1),
        "evaluationStart": frame["timestamp"].min().isoformat(),
        "evaluationEnd": frame["timestamp"].max().isoformat(),
        "limitation": "Synthetic benchmarks do not validate production accuracy or outage prediction",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", type=Path, default=Path("datasets/evaluation.csv"))
    parser.add_argument("--model", type=Path, default=Path("app/models/isolation_forest.joblib"))
    args = parser.parse_args()
    print(json.dumps(evaluate(args.dataset, args.model), indent=2))
