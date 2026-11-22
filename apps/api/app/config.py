"""Application settings loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache
from typing import Self

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

JWT_PLACEHOLDER_SECRETS = frozenset(
    {
        "CHANGE_ME_TO_A_LONG_RANDOM_SECRET",
        "CHANGE_ME",
        "changeme",
        "secret",
        "jwt-secret",
    }
)
JWT_MIN_SECRET_LENGTH = 32


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    app_name: str = Field(default="InterviewX API", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")
    cors_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        alias="CORS_ORIGINS",
    )
    database_url: str = Field(
        default="postgresql+psycopg://interviewx:CHANGE_ME@127.0.0.1:5432/interviewx",
        alias="DATABASE_URL",
    )
    jwt_secret_key: str = Field(
        default="CHANGE_ME_TO_A_LONG_RANDOM_SECRET",
        alias="JWT_SECRET_KEY",
    )
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=60 * 24,
        alias="ACCESS_TOKEN_EXPIRE_MINUTES",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def validate_security_settings(self) -> Self:
        if self.access_token_expire_minutes <= 0:
            raise ValueError(
                "ACCESS_TOKEN_EXPIRE_MINUTES must be a positive integer.",
            )

        secret = self.jwt_secret_key.strip()
        if len(secret) < JWT_MIN_SECRET_LENGTH:
            raise ValueError(
                f"JWT_SECRET_KEY must be at least {JWT_MIN_SECRET_LENGTH} characters. "
                "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(48))\"",
            )

        lowered = secret.lower()
        is_placeholder = (
            secret in JWT_PLACEHOLDER_SECRETS
            or lowered in JWT_PLACEHOLDER_SECRETS
            or lowered.startswith("change_me")
            or "change_me" in lowered
        )
        if is_placeholder and self.app_env.lower() != "test":
            raise ValueError(
                "JWT_SECRET_KEY must not use a placeholder value outside the test "
                "environment. Generate a strong secret with: "
                'python -c "import secrets; print(secrets.token_urlsafe(48))"',
            )

        object.__setattr__(self, "jwt_secret_key", secret)
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
