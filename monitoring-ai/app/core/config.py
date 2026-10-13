from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ai_port: int = 8000
    model_mode: Literal["baseline", "isolation_forest"] = "baseline"
    model_path: str = "app/models/isolation_forest.joblib"
    log_level: str = "INFO"
    assistant_provider: Literal["none", "openai", "gemini"] = "none"
    openai_api_key: str | None = None
    openai_model: str = "gpt-4.1-mini"
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
