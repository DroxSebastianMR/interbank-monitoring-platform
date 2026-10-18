"""Validation shared by offline training/evaluation."""
from pathlib import Path

import numpy as np
import pandas as pd

from app.core.features import FEATURES


def read_dataset(path: Path, *, labelled: bool = False) -> pd.DataFrame:
    frame = pd.read_csv(path)
    required = [*FEATURES, "timestamp", "source"] + (["isIncident"] if labelled else [])
    if frame.empty or not set(required).issubset(frame.columns):
        raise ValueError(f"Dataset requires {required}")
    frame["timestamp"] = pd.to_datetime(frame["timestamp"], utc=True, errors="raise")
    if frame[required].isnull().any().any():
        raise ValueError("Missing observations are not zero values")
    if not frame["timestamp"].is_monotonic_increasing or frame["timestamp"].duplicated().any():
        raise ValueError("Observations must have strictly increasing timestamps")
    values = frame[FEATURES].to_numpy(dtype=float)
    if not np.isfinite(values).all() or (values < 0).any():
        raise ValueError("Features must be finite and nonnegative")
    if (frame[["errorRate", "timeoutRate"]] > 1).any().any():
        raise ValueError("Rate fractions must be in [0,1]")
    if not set(frame["source"]).issubset({"synthetic", "observed"}):
        raise ValueError("source must explicitly be synthetic or observed")
    if labelled and not set(frame["isIncident"]).issubset({0, 1}):
        raise ValueError("isIncident must be binary")
    return frame
