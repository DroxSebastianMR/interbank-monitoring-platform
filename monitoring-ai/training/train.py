"""Train an Isolation Forest once a representative CSV dataset exists."""
from pathlib import Path
import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest

FEATURES = ["latency", "errorRate", "timeoutRate", "requestRate"]
def train(dataset: Path, output: Path) -> None:
    frame = pd.read_csv(dataset)
    model = IsolationForest(contamination="auto", random_state=42).fit(frame[FEATURES])
    output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, output)
if __name__ == "__main__":
    train(Path("datasets/training.csv"), Path("app/models/isolation_forest.joblib"))
