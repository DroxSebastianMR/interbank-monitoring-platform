"""Train an Isolation Forest once a representative CSV dataset exists."""

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

from app.core.features import FEATURES


def train(dataset: Path, output: Path) -> None:
    frame = pd.read_csv(dataset)
    if frame.empty or frame[FEATURES].isnull().any().any():
        raise ValueError("Training data must contain non-null feature rows")
    model = IsolationForest(contamination="auto", random_state=42).fit(frame[FEATURES])
    scores = -model.score_samples(frame[FEATURES])
    score_min, score_max = np.quantile(scores, [0.05, 0.95])
    if score_max <= score_min:
        raise ValueError("Training data does not provide a usable score range")
    output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "score_min": score_min, "score_max": score_max}, output)


if __name__ == "__main__":
    train(Path("datasets/training.csv"), Path("app/models/isolation_forest.joblib"))
