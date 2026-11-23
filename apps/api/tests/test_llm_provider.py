"""LLM provider client unit tests (httpx mocked)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import httpx
import pytest

from app.config import Settings
from app.services.llm.provider import LlmProviderError, complete_chat


def _settings(**overrides) -> Settings:
    base = {
        "APP_ENV": "test",
        "JWT_SECRET_KEY": "test-secret-key-not-for-production-123456",
        "LLM_API_KEY": "test-key",
        "LLM_BASE_URL": "https://api.groq.com/openai/v1",
        "LLM_MODEL": "llama-3.3-70b-versatile",
        "LLM_TIMEOUT_SECONDS": "10",
    }
    base.update(overrides)
    return Settings(_env_file=None, **base)


def test_missing_api_key_raises_not_configured() -> None:
    settings = _settings(LLM_API_KEY="")
    with pytest.raises(LlmProviderError) as exc:
        complete_chat(settings=settings, messages=[{"role": "user", "content": "hi"}])
    assert exc.value.code == "not_configured"


def test_timeout_maps_to_provider_error() -> None:
    settings = _settings()
    mock_client = MagicMock()
    mock_client.__enter__.return_value = mock_client
    mock_client.__exit__.return_value = False
    mock_client.post.side_effect = httpx.TimeoutException("slow")

    with patch("app.services.llm.provider.httpx.Client", return_value=mock_client):
        with pytest.raises(LlmProviderError) as exc:
            complete_chat(
                settings=settings,
                messages=[{"role": "user", "content": "hi"}],
            )
    assert exc.value.code == "timeout"


def test_rate_limit_status_maps() -> None:
    settings = _settings()
    response = MagicMock()
    response.status_code = 429
    mock_client = MagicMock()
    mock_client.__enter__.return_value = mock_client
    mock_client.__exit__.return_value = False
    mock_client.post.return_value = response

    with patch("app.services.llm.provider.httpx.Client", return_value=mock_client):
        with pytest.raises(LlmProviderError) as exc:
            complete_chat(
                settings=settings,
                messages=[{"role": "user", "content": "hi"}],
            )
    assert exc.value.code == "rate_limited"


def test_successful_completion_parses_content() -> None:
    settings = _settings()
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = {
        "model": "llama-3.3-70b-versatile",
        "choices": [{"message": {"role": "assistant", "content": " Next question? "}}],
    }
    mock_client = MagicMock()
    mock_client.__enter__.return_value = mock_client
    mock_client.__exit__.return_value = False
    mock_client.post.return_value = response

    with patch("app.services.llm.provider.httpx.Client", return_value=mock_client):
        result = complete_chat(
            settings=settings,
            messages=[{"role": "user", "content": "hi"}],
        )
    assert result.content == "Next question?"
    assert result.model == "llama-3.3-70b-versatile"
