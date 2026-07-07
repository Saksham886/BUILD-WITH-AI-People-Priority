"""Environment-driven settings for the Stage 2 aggregation service."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Embedding model (local sentence-transformers).
    model_name: str = "all-MiniLM-L6-v2"

    # DBSCAN tuning. eps is cosine distance; 0.6 reliably groups paraphrased /
    # code-switched (Hinglish) complaints with all-MiniLM-L6-v2 while keeping
    # genuinely-distinct incidents separate.
    dbscan_eps: float = 0.6
    dbscan_min_samples: int = 1

    # Persistence.
    db_path: str = "aggregation.db"

    # CORS: comma-separated origins.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
