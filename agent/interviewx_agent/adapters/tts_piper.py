"""Piper TTS adapter.

Licence: Piper is MIT; individual voice ONNX files have their own licences —
verify before shipping. Prefer the `piper` Python package (`piper-tts`);
falls back to the `piper` CLI, then short silence if neither works.
"""

from __future__ import annotations

import asyncio
import logging
import os
import shutil
import subprocess
import tempfile
import wave
from pathlib import Path

from interviewx_agent.adapters.base import TTSAdapter, UsageDelta

logger = logging.getLogger("interviewx.tts")


class PiperTTS(TTSAdapter):
    def __init__(
        self,
        binary: str,
        voice_male: str,
        voice_female: str,
        speaker_male: int | None = None,
        speaker_female: int | None = None,
        voices_dir: str | None = None,
    ) -> None:
        self.binary = binary
        self.voice_male = voice_male
        self.voice_female = voice_female
        self.speaker_male = speaker_male
        self.speaker_female = speaker_female
        self.voices_dir = Path(
            voices_dir
            or os.getenv("PIPER_VOICES_DIR", str(Path.home() / ".local/share/piper"))
        )
        self._voices: dict[str, object] = {}

    def _model_path(self, voice_profile: str) -> Path:
        name = self.voice_female if voice_profile.startswith("female") else self.voice_male
        candidate = Path(name)
        if candidate.suffix == ".onnx" and candidate.exists():
            return candidate
        onnx = self.voices_dir / f"{name}.onnx"
        if onnx.exists():
            return onnx
        nested = self.voices_dir / name / f"{name}.onnx"
        if nested.exists():
            return nested
        raise FileNotFoundError(
            f"Piper voice model not found for '{name}'. "
            f"Download an ONNX voice into {self.voices_dir} "
            "(see agent/README.md). Licence-verify each voice file."
        )

    def _silence(self, text: str, meta: dict) -> tuple[bytes, int, UsageDelta]:
        sr = 22050
        pcm = b"\x00\x00" * int(sr * 0.4)
        usage = UsageDelta(
            provider="piper",
            metric="tts_characters",
            quantity=float(len(text)),
            unit="characters",
            estimated_cost_usd=0.0,
            meta=meta,
        )
        return pcm, sr, usage

    async def synthesize(
        self, text: str, *, voice_profile: str
    ) -> tuple[bytes, int, UsageDelta]:
        try:
            model = self._model_path(voice_profile)
        except FileNotFoundError:
            logger.warning("Piper voice missing — returning short silence")
            return self._silence(text, {"fallback": "silence_missing_voice"})

        speaker = (
            self.speaker_female
            if voice_profile.startswith("female")
            else self.speaker_male
        )

        try:
            pcm, sr = await asyncio.to_thread(self._synthesize_python, model, text, speaker)
        except Exception:
            logger.exception("Python piper-tts failed; trying CLI")
            try:
                pcm, sr = await asyncio.to_thread(self._synthesize_cli, model, text, speaker)
            except Exception:
                logger.exception("Piper CLI failed — returning silence")
                return self._silence(text, {"fallback": "silence"})

        usage = UsageDelta(
            provider="piper",
            metric="tts_characters",
            quantity=float(len(text)),
            unit="characters",
            estimated_cost_usd=0.0,
            meta={"voice": model.name, "profile": voice_profile},
        )
        return pcm, sr, usage

    def _synthesize_python(self, model: Path, text: str, speaker: int | None) -> tuple[bytes, int]:
        from piper import PiperVoice

        key = str(model)
        voice = self._voices.get(key)
        if voice is None:
            voice = PiperVoice.load(str(model))
            self._voices[key] = voice

        with tempfile.TemporaryDirectory() as tmp:
            out_wav = Path(tmp) / "out.wav"
            with wave.open(str(out_wav), "wb") as wf:
                kwargs = {}
                if speaker is not None:
                    kwargs["speaker_id"] = speaker
                # piper-tts API variants
                try:
                    voice.synthesize_wav(text, wf, **kwargs)
                except TypeError:
                    voice.synthesize_wav(text, wf)
            with wave.open(str(out_wav), "rb") as wf:
                return wf.readframes(wf.getnframes()), wf.getframerate()

    def _synthesize_cli(self, model: Path, text: str, speaker: int | None) -> tuple[bytes, int]:
        if shutil.which(self.binary) is None and not Path(self.binary).exists():
            raise FileNotFoundError("piper binary not found")
        with tempfile.TemporaryDirectory() as tmp:
            out_wav = Path(tmp) / "out.wav"
            cmd = [self.binary, "--model", str(model), "--output_file", str(out_wav)]
            if speaker is not None:
                cmd.extend(["--speaker", str(speaker)])
            subprocess.run(cmd, input=text.encode("utf-8"), check=True, capture_output=True)
            with wave.open(str(out_wav), "rb") as wf:
                return wf.readframes(wf.getnframes()), wf.getframerate()
