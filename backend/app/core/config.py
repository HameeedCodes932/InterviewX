from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = (
        "postgresql+psycopg://interviewx:interviewx@localhost:5432/interviewx"
    )
    secret_key: str = "dev-only-change-me-interviewx-secret-key-32chars"
    access_token_expire_minutes: int = 60 * 24 * 7
    algorithm: str = "HS256"
    cors_origins: str = "http://localhost:3000"

    smtp_enabled: bool = False
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@interviewx.local"
    password_reset_base_url: str = "http://localhost:3000/reset-password"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
