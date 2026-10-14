import logging

from app.core.config import get_settings


def configure_logging() -> None:
    logging.basicConfig(
        level=get_settings().log_level.upper(),
        format='{"timestamp":"%(asctime)s","level":"%(levelname)s","service":"monitoring-ai","message":"%(message)s"}',
    )
