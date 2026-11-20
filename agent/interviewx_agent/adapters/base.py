from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class UsageDelta:
    provider: str
    metric: str
    quantity: float
    unit: str = "count"
    estimated_cost_usd: float = 0.0
    meta: dict | None = None


class LLMAdapter(ABC):
    @abstractmethod
    async def complete(self, messages: list[dict[str, str]]) -> tuple[str, UsageDelta]:
        raise NotImplementedError


class STTAdapter(ABC):
    @abstractmethod
    async def transcribe(self, pcm16_mono: bytes, sample_rate: int) -> tuple[str, UsageDelta]:
        raise NotImplementedError


class TTSAdapter(ABC):
    @abstractmethod
    async def synthesize(
        self, text: str, *, voice_profile: str
    ) -> tuple[bytes, int, UsageDelta]:
        """Return (pcm16_mono, sample_rate, usage)."""
        raise NotImplementedError
