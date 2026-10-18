"""Reproducible OFFLINE telemetry, not financial transactions or historical evidence."""
import argparse
from pathlib import Path

import numpy as np
import pandas as pd


def generate(directory: Path, seed: int = 42) -> tuple[Path, Path]:
    rng = np.random.default_rng(seed)
    count = 3600
    frame = pd.DataFrame({
        "timestamp": pd.date_range("2026-01-01", periods=count, freq="5s", tz="UTC"),
        "latency": np.maximum(rng.normal(100, 12, count), 1),
        "errorRate": rng.uniform(0, 0.01, count),
        "timeoutRate": rng.uniform(0, 0.005, count),
        "requestRate": np.maximum(rng.normal(80, 12, count), 1),
        "source": "synthetic", "isIncident": 0, "scenario": "nominal",
    })
    for index, scenario in enumerate(["latency-growth", "http-5xx", "timeouts", "saturation"]):
        rows = np.arange(2600 + index * 150, 2700 + index * 150)
        frame.loc[rows, ["isIncident", "scenario"]] = [1, scenario]
        if scenario == "latency-growth":
            frame.loc[rows, "latency"] = np.linspace(500, 4000, len(rows))
        elif scenario == "http-5xx":
            frame.loc[rows, "errorRate"] = rng.uniform(0.3, 0.9, len(rows))
        elif scenario == "timeouts":
            frame.loc[rows, "timeoutRate"] = rng.uniform(0.3, 0.9, len(rows))
        else:
            frame.loc[rows, ["latency", "requestRate"]] = [2200, 500]
    directory.mkdir(parents=True, exist_ok=True)
    training, evaluation = directory / "training.csv", directory / "evaluation.csv"
    if training.exists() or evaluation.exists():
        raise ValueError("Use a new dataset directory; existing evidence is never overwritten")
    frame.iloc[:2400].to_csv(training, index=False)
    frame.iloc[2400:].to_csv(evaluation, index=False)
    return training, evaluation


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    print(generate(args.output))
