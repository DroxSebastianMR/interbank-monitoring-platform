"""Evaluation placeholder that requires labelled university-project data."""
from pathlib import Path
def evaluate(dataset: Path) -> None:
    if not dataset.exists():
        raise FileNotFoundError("Provide a labelled evaluation dataset before reporting model quality")
if __name__ == "__main__":
    evaluate(Path("datasets/evaluation.csv"))
