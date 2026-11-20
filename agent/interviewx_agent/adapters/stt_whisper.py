"""faster-whisper STT adapter. Licence: MIT (faster-whisper); Whisper model weights — verify."""

from __future__ import annotations

import asyncio
import io
import logging
import wave

import numpy as np

from interviewx_agent.adapters.base import STTAdapter, UsageDelta

logger = logging.getLogger("interviewx.stt")


class FasterWhisperSTT(STTAdapter):
    def __init__(self, model_size: str = "base", device: str = "cpu") -> None:
        self.model_size = model_size
        self.device = device
        self._model = None

    def _load(self):
        if self._model is None:
            from faster_whisper import WhisperModel

            compute = "int8" if self.device == "cpu" else "float16"
            logger.info(
                "Loading faster-whisper model=%s device=%s", self.model_size, self.device
            )
            self._model = WhisperModel(
                self.model_size, device=self.device, compute_type=compute
            )
        return self._model

    async def transcribe(self, pcm16_mono: bytes, sample_rate: int) -> tuple[str, UsageDelta]:
        duration_s = len(pcm16_mono) / 2 / max(sample_rate, 1)

        def _run() -> str:
            model = self._load()
            # Write WAV in-memory for whisper
            buf = io.BytesIO()
            with wave.open(buf, "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(sample_rate)
                wf.writeframes(pcm16_mono)
            buf.seek(0)
            segments, _info = model.transcribe(buf, language="en", vad_filter=True)
            return " ".join(seg.text.strip() for seg in segments).strip()

        text = await asyncio.to_thread(_run)
        usage = UsageDelta(
            provider="faster-whisper",
            metric="stt_seconds",
            quantity=duration_s,
            unit="seconds",
            estimated_cost_usd=0.0,
            meta={"model": self.model_size},
        )
        return text, usage


class NumpyEnergyVAD:
    """Simple energy VAD for turn-taking when Silero is unavailable."""

    def __init__(self, threshold: float = 0.01, silence_ms: int = 900) -> None:
        self.threshold = threshold
        self.silence_ms = silence_ms

    def is_speech(self, pcm16: bytes) -> bool:
        if not pcm16:
            return False
        audio = np.frombuffer(pcm16, dtype=np.int16).astype(np.float32) / 32768.0
        if audio.size == 0:
            return False
        return float(np.sqrt(np.mean(audio**2))) >= self.threshold
