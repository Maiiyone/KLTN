from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    chatbot_port: int = 8001
    database_url: str
    redis_url: str | None = None
    google_api_key: str | None = None
    gemini_model: str = "gemini-flash-latest"
    log_level: str = "INFO"
    qdrant_url: str | None = None
    qdrant_api_key: str | None = None
    qdrant_collection: str = "products"
    allowed_origins: str | list[str] = "*"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
