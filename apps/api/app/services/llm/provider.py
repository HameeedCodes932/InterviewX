"""OpenAI-compatible chat completions client (Groq and similar providers)."""

from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx

from app.config import Settings

logger = logging.getLogger(__name__)

# Cap completion size for interviewer replies (plain text, one question).
DEFAULT_MAX_TOKENS = 350
DEFAULT_TEMPERATURE = 0.6


class LlmProviderError(Exception):
    """Mapped provider / configuration failure."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass(frozen=True)
class LlmCompletionResult:
    content: str
    model: str


def _chat_completions_url(base_url: str) -> str:
    cleaned = base_url.rstrip("/")
    if cleaned.endswith("/chat/completions"):
        return cleaned
    return f"{cleaned}/chat/completions"


def complete_chat(
    *,
    settings: Settings,
    messages: list[dict[str, str]],
    max_tokens: int = DEFAULT_MAX_TOKENS,
    temperature: float = DEFAULT_TEMPERATURE,
) -> LlmCompletionResult:
    """Call an OpenAI-compatible chat completions endpoint.

    Never logs API keys or Authorization header values.
    """
    api_key = (settings.llm_api_key or "").strip()
    model = (settings.llm_model or "").strip()
    base_url = (settings.llm_base_url or "").strip()
    timeout = float(settings.llm_timeout_seconds or 0)

    if not api_key:
        raise LlmProviderError(
            "not_configured",
            "AI interviewer is not configured. Set LLM_API_KEY on the API server.",
        )
    if not model:
        raise LlmProviderError(
            "not_configured",
            "AI interviewer is not configured. Set LLM_MODEL on the API server.",
        )
    if not base_url:
        raise LlmProviderError(
            "not_configured",
            "AI interviewer is not configured. Set LLM_BASE_URL on the API server.",
        )
    if timeout <= 0:
        raise LlmProviderError(
            "not_configured",
            "LLM_TIMEOUT_SECONDS must be a positive number.",
        )

    url = _chat_completions_url(base_url)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.post(url, headers=headers, json=payload)
    except httpx.TimeoutException as exc:
        logger.warning("LLM request timed out (provider=%s)", settings.llm_provider)
        raise LlmProviderError(
            "timeout",
            "The AI interviewer took too long to respond. Please try again.",
        ) from exc
    except httpx.RequestError as exc:
        logger.warning(
            "LLM request failed (provider=%s, error=%s)",
            settings.llm_provider,
            type(exc).__name__,
        )
        raise LlmProviderError(
            "unavailable",
            "The AI interviewer is temporarily unavailable. Please try again.",
        ) from exc

    if response.status_code in {401, 403}:
        logger.warning(
            "LLM authentication failed (provider=%s, status=%s)",
            settings.llm_provider,
            response.status_code,
        )
        raise LlmProviderError(
            "auth",
            "AI interviewer authentication failed. Check LLM_API_KEY on the API server.",
        )
    if response.status_code == 429:
        raise LlmProviderError(
            "rate_limited",
            "The AI interviewer is rate-limited right now. Please wait and try again.",
        )
    if response.status_code >= 500:
        logger.warning(
            "LLM provider error (provider=%s, status=%s)",
            settings.llm_provider,
            response.status_code,
        )
        raise LlmProviderError(
            "unavailable",
            "The AI interviewer is temporarily unavailable. Please try again.",
        )
    if response.status_code >= 400:
        logger.warning(
            "LLM request rejected (provider=%s, status=%s)",
            settings.llm_provider,
            response.status_code,
        )
        raise LlmProviderError(
            "invalid_response",
            "The AI interviewer could not process this request. Please try again.",
        )

    try:
        body = response.json()
    except ValueError as exc:
        raise LlmProviderError(
            "invalid_response",
            "The AI interviewer returned an invalid response. Please try again.",
        ) from exc

    choices = body.get("choices") if isinstance(body, dict) else None
    if not isinstance(choices, list) or not choices:
        raise LlmProviderError(
            "invalid_response",
            "The AI interviewer returned an empty response. Please try again.",
        )

    message = choices[0].get("message") if isinstance(choices[0], dict) else None
    content = message.get("content") if isinstance(message, dict) else None
    if not isinstance(content, str) or not content.strip():
        raise LlmProviderError(
            "invalid_response",
            "The AI interviewer returned an empty response. Please try again.",
        )

    used_model = body.get("model") if isinstance(body, dict) else None
    return LlmCompletionResult(
        content=content.strip(),
        model=str(used_model or model),
    )
