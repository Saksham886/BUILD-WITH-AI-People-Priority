from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY")
    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    llm_provider: str = Field(default="groq", alias="LLM_PROVIDER")
    app_name: str = "Grievance Letter Generator"

    @field_validator("llm_provider")
    @classmethod
    def validate_provider(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"groq", "gemini"}:
            raise ValueError("LLM_PROVIDER must be either 'groq' or 'gemini'")
        return normalized


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
