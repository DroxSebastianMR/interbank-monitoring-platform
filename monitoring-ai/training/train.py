"""Versioned Isolation Forest with chronological fit/calibration separation."""
import argparse
import hashlib
from pathlib import Path

import joblib
import numpy as np
import sklearn
from sklearn.ensemble import IsolationForest

from app.core.features import FEATURES
from training.dataset import read_dataset


def train(dataset: Path, output: Path) -> dict:
    frame = read_dataset(dataset)
    if len(frame) < 200:
        raise ValueError("At least 200 ordered observations are required for this baseline")
    if output.exists():
        raise ValueError("Refusing to overwrite a model version; choose a new output path")
    cutoff = int(len(frame) * 0.8)
    fit, calibration = frame.iloc[:cutoff], frame.iloc[cutoff:]
    model = IsolationForest(n_estimators=100, contamination="auto", random_state=42, n_jobs=1)
    model.fit(fit[FEATURES].to_numpy(dtype=float))
    scores = -model.score_samples(calibration[FEATURES].to_numpy(dtype=float))
    low, threshold = np.quantile(scores, [0.5, 0.99])
    if threshold <= low:
        raise ValueError("Calibration has no usable score range")
    # Normalized 0.7 corresponds to calibration percentile 99; NOT a probability.
    high = low + (threshold - low) / 0.7
    digest = hashlib.sha256(dataset.read_bytes()).hexdigest()
    metadata = {
        "schemaVersion": 1, "modelVersion": f"if-v1-{digest[:16]}",
        "datasetSha256": digest, "sklearnVersion": sklearn.__version__,
        "features": FEATURES, "source": sorted(frame["source"].unique().tolist()),
        "fitSamples": len(fit), "calibrationSamples": len(calibration),
        "fitEnd": fit["timestamp"].max().isoformat(),
        "trainingEnd": frame["timestamp"].max().isoformat(),
        "scoreMeaning": "relative-anomaly-not-outage-probability", "threshold": 0.7,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "score_min": float(low), "score_max": float(high), "metadata": metadata}, output)
    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", type=Path, default=Path("datasets/training.csv"))
    parser.add_argument("--output", type=Path, default=Path("app/models/isolation_forest.joblib"))
    args = parser.parse_args()
    print(train(args.dataset, args.output))
