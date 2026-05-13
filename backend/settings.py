from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str

    ANTHROPIC_API_KEY: str = ""
    LLM_MODEL_PRIMARY: str = "claude-sonnet-4-6"
    LLM_MODEL_FALLBACK: str = "claude-haiku-4-5"
    EMBEDDING_MODEL: str = "voyage-3-large"
    DEMO_MODE: str = "cache_first"
    LOG_LEVEL: str = "INFO"

    @property
    def database_url(self) -> str:
        return (f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}")

settings = Settings()
