"""JWT configuration validation tests."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.config import Settings, get_settings


@pytest.fixture()
def isolated_settings_env(monkeypatch: pytest.MonkeyPatch):
    """Prevent process/.env values from masking explicit Settings() kwargs."""
    for key in (
        "APP_ENV",
        "JWT_SECRET_KEY",
        "JWT_ALGORITHM",
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "DATABASE_URL",
        "APP_NAME",
        "API_V1_PREFIX",
        "CORS_ORIGINS",
    ):
        monkeypatch.delenv(key, raising=False)


def test_valid_test_configuration_loads() -> None:
    settings = get_settings()
    assert settings.app_env == "test"
    assert len(settings.jwt_secret_key) >= 32
    assert settings.access_token_expire_minutes > 0


def test_placeholder_secret_rejected_outside_test(isolated_settings_env) -> None:
    with pytest.raises(ValidationError) as exc:
        Settings(
            _env_file=None,
            app_env="development",
            jwt_secret_key="CHANGE_ME_TO_A_LONG_RANDOM_SECRET",
            access_token_expire_minutes=60,
        )
    assert "placeholder" in str(exc.value).lower()


def test_short_secret_rejected(isolated_settings_env) -> None:
    with pytest.raises(ValidationError) as exc:
        Settings(
            _env_file=None,
            app_env="development",
            jwt_secret_key="too-short-secret-value",
            access_token_expire_minutes=60,
        )
    assert "32 characters" in str(exc.value)


def test_non_positive_expiry_rejected(isolated_settings_env) -> None:
    with pytest.raises(ValidationError) as exc:
        Settings(
            _env_file=None,
            app_env="test",
            jwt_secret_key="test-secret-key-not-for-production",
            access_token_expire_minutes=0,
        )
    assert "positive" in str(exc.value).lower()


def test_strong_secret_accepted_in_development(isolated_settings_env) -> None:
    settings = Settings(
        _env_file=None,
        app_env="development",
        jwt_secret_key="dev-only-strong-secret-key-32chars-min!!",
        access_token_expire_minutes=30,
    )
    assert settings.app_env == "development"
    assert settings.access_token_expire_minutes == 30


def test_placeholder_allowed_only_in_test_env(isolated_settings_env) -> None:
    settings = Settings(
        _env_file=None,
        app_env="test",
        jwt_secret_key="CHANGE_ME_TO_A_LONG_RANDOM_SECRET",
        access_token_expire_minutes=15,
    )
    assert settings.app_env == "test"
