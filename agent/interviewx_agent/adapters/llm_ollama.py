"""Ollama LLM adapter (OpenAI-compatible /api/chat). Licence: model-specific (verify weights)."""

from __future__ import annotations

import logging

import httpx

from interviewx_agent.adapters.base import LLMAdapter, UsageDelta

logger = logging.getLogger("interviewx.llm")


class OllamaLLM(LLMAdapter):
    def __init__(self, base_url: str, model: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def complete(self, messages: list[dict[str, str]]) -> tuple[str, UsageDelta]:
        async with httpx.AsyncClient(timeout=180.0) as client:
            res = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "stream": False,
                    "messages": messages,
                    "options": {"temperature": 0.6},
                },
            )
            res.raise_for_status()
            data = res.json()
            text = (data.get("message") or {}).get("content") or ""
            eval_count = float(data.get("eval_count") or 0)
            prompt_count = float(data.get("prompt_eval_count") or 0)
            usage = UsageDelta(
                provider="ollama",
                metric="llm_tokens",
                quantity=eval_count + prompt_count,
                unit="tokens",
                estimated_cost_usd=0.0,
                meta={
                    "model": self.model,
                    "prompt_tokens": prompt_count,
                    "completion_tokens": eval_count,
                },
            )
            return text.strip(), usage
