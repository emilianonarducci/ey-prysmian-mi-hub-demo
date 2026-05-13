import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "mi_hub"

    ANTHROPIC_API_KEY: str = ""
    LLM_MODEL_PRIMARY: str = "claude-sonnet-4-6"
    LLM_MODEL_FALLBACK: str = "claude-haiku-4-5"
    EMBEDDING_MODEL: str = "voyage-3-large"
    DEMO_MODE: str = "cache_first"
    LOG_LEVEL: str = "INFO"

    @property
    def database_url(self) -> str:
        # Render injects DATABASE_URL — prefer it when present
        url = os.getenv("DATABASE_URL")
        if url:
            # Render gives `postgres://` — SQLAlchemy 2 wants `postgresql+psycopg://`
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+psycopg://", 1)
            elif url.startswith("postgresql://") and "+psycopg" not in url:
                url = url.replace("postgresql://", "postgresql+psycopg://", 1)
            return url
        return (
            f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()
