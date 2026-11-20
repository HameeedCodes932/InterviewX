"""Realtime interview loop on a LiveKit room: STT → Brain → TTS with interruption handling."""

from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any

import numpy as np
from livekit import rtc

from interviewx_agent.adapters.base import STTAdapter, TTSAdapter
from interviewx_agent.adapters.stt_whisper import NumpyEnergyVAD
from interviewx_agent.api_client import BackendClient
from interviewx_agent.brain import InterviewBrain, SessionMemory

logger = logging.getLogger("interviewx.session")

SAMPLE_RATE = 16000
FRAME_MS = 20
SAMPLES_PER_FRAME = SAMPLE_RATE * FRAME_MS // 1000


class InterviewSessionRunner:
    def __init__(
        self,
        *,
        room: rtc.Room,
        session_id: str,
        meta: dict[str, Any],
        brain: InterviewBrain,
        stt: STTAdapter,
        tts: TTSAdapter,
        api: BackendClient,
    ) -> None:
        self.room = room
        self.session_id = session_id
        self.meta = meta
        self.brain = brain
        self.stt = stt
        self.tts = tts
        self.api = api
        self.vad = NumpyEnergyVAD(threshold=0.012, silence_ms=1000)
        self._audio_source = rtc.AudioSource(SAMPLE_RATE, 1)
        self._audio_track = rtc.LocalAudioTrack.create_audio_track(
            "interviewer", self._audio_source
        )
        self._speaking = False
        self._interrupt = asyncio.Event()
        self._candidate_buf = bytearray()
        self._speech_active = False
        self._last_voice_ms = 0.0
        self._turn_index = 0
        gender = (meta.get("interviewer_gender") or "female").lower()
        self.voice_profile = (
            "female_professional_en" if gender.startswith("f") else "male_professional_en"
        )
        self.memory = SessionMemory(
            candidate_name=meta.get("candidate_name") or "candidate",
            category_slug=meta.get("category_slug") or "software-engineering",
            difficulty=meta.get("difficulty") or "mid",
            language=meta.get("language") or "en",
        )

    async def run(self) -> None:
        await self.room.local_participant.publish_track(self._audio_track)
        self.room.on("track_subscribed", self._on_track_subscribed)

        # Wait briefly for candidate mic
        await asyncio.sleep(1.0)
        decision = await self.brain.greeting(self.memory)
        await self._speak_decision(decision)

        while not decision.done:
            utterance = await self._collect_utterance(timeout_s=90)
            if utterance is None:
                decision = await self.brain.next_turn(
                    self.memory,
                    "(No audible answer — please continue with a brief wrap-up if appropriate.)",
                )
            else:
                text, stt_usage = utterance
                if stt_usage:
                    await self.api.record_usage(self.session_id, stt_usage)
                if not text.strip():
                    continue
                await self.api.append_transcript(
                    self.session_id, "candidate", text, self._turn_index
                )
                self._turn_index += 1
                decision = await self.brain.next_turn(self.memory, text)
            await self._speak_decision(decision)

        await self.api.end_session(self.session_id, reason="interview_complete")
        logger.info("Interview session %s complete", self.session_id)

    async def _speak_decision(self, decision) -> None:
        if decision.usage:
            await self.api.record_usage(self.session_id, decision.usage)
        await self.api.append_transcript(
            self.session_id, "interviewer", decision.speech, self._turn_index
        )
        self._turn_index += 1
        await self._publish_avatar_action(decision)
        await self._speak(decision.speech)

    async def _publish_avatar_action(self, decision) -> None:
        payload = {
            "schema_version": 1,
            "type": "avatar.action",
            "session_id": self.session_id,
            "turn_id": str(self._turn_index),
            "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "speech": {
                "text": decision.speech,
                "voice_profile": self.voice_profile,
                "expect_response": decision.expect_response,
            },
            "behaviour": {
                "state": decision.behaviour_state,
                "expression": "neutral_attentive",
                "gesture": None,
                "gaze": "candidate",
                "listening_state": None,
                "note": decision.note,
            },
            "meta": {"personality": "professional", "interruptible": True},
        }
        data = json.dumps(payload).encode("utf-8")
        try:
            await self.room.local_participant.publish_data(data, reliable=True)
        except Exception:
            logger.exception("Failed to publish AvatarAction")

    async def _speak(self, text: str) -> None:
        self._speaking = True
        self._interrupt.clear()
        try:
            pcm, sr, usage = await self.tts.synthesize(
                text, voice_profile=self.voice_profile
            )
            await self.api.record_usage(self.session_id, usage)
            await self._play_pcm(pcm, sr)
        finally:
            self._speaking = False

    async def _play_pcm(self, pcm: bytes, sample_rate: int) -> None:
        if sample_rate != SAMPLE_RATE:
            pcm = _resample_pcm16(pcm, sample_rate, SAMPLE_RATE)
        # Stream in FRAME_MS chunks; stop early on interrupt
        view = memoryview(pcm)
        step = SAMPLES_PER_FRAME * 2
        for i in range(0, len(view), step):
            if self._interrupt.is_set():
                logger.info("TTS interrupted by candidate speech")
                break
            chunk = bytes(view[i : i + step])
            if len(chunk) < step:
                chunk = chunk + b"\x00" * (step - len(chunk))
            frame = rtc.AudioFrame(
                data=chunk,
                sample_rate=SAMPLE_RATE,
                num_channels=1,
                samples_per_channel=SAMPLES_PER_FRAME,
            )
            await self._audio_source.capture_frame(frame)
            await asyncio.sleep(FRAME_MS / 1000)

    def _on_track_subscribed(
        self,
        track: rtc.Track,
        publication: rtc.RemoteTrackPublication,
        participant: rtc.RemoteParticipant,
    ) -> None:
        if track.kind != rtc.TrackKind.KIND_AUDIO:
            return
        logger.info("Subscribed to candidate audio from %s", participant.identity)
        audio_stream = rtc.AudioStream(track, sample_rate=SAMPLE_RATE, num_channels=1)
        asyncio.create_task(self._consume_audio(audio_stream))

    async def _consume_audio(self, stream: rtc.AudioStream) -> None:
        async for event in stream:
            frame = event.frame
            pcm = bytes(frame.data)
            speaking_now = self.vad.is_speech(pcm)
            now = time.time() * 1000
            if speaking_now:
                self._last_voice_ms = now
                if self._speaking:
                    self._interrupt.set()
                if not self._speech_active:
                    self._speech_active = True
                    self._candidate_buf.clear()
                self._candidate_buf.extend(pcm)
            elif self._speech_active:
                self._candidate_buf.extend(pcm)
                if now - self._last_voice_ms >= self.vad.silence_ms:
                    self._speech_active = False

    async def _collect_utterance(
        self, timeout_s: float
    ) -> tuple[str, Any] | None:
        self._candidate_buf.clear()
        self._speech_active = False
        deadline = time.time() + timeout_s
        saw_speech = False
        while time.time() < deadline:
            if len(self._candidate_buf) > SAMPLE_RATE * 2 * 0.4:
                saw_speech = True
            if (
                saw_speech
                and not self._speech_active
                and len(self._candidate_buf) > 0
                and (time.time() * 1000 - self._last_voice_ms) >= self.vad.silence_ms
            ):
                pcm = bytes(self._candidate_buf)
                self._candidate_buf.clear()
                text, usage = await self.stt.transcribe(pcm, SAMPLE_RATE)
                return text, usage
            await asyncio.sleep(0.05)
        if self._candidate_buf:
            pcm = bytes(self._candidate_buf)
            self._candidate_buf.clear()
            text, usage = await self.stt.transcribe(pcm, SAMPLE_RATE)
            return text, usage
        return None


def _resample_pcm16(pcm: bytes, src_rate: int, dst_rate: int) -> bytes:
    if src_rate == dst_rate:
        return pcm
    audio = np.frombuffer(pcm, dtype=np.int16).astype(np.float32)
    if audio.size == 0:
        return pcm
    duration = audio.size / src_rate
    new_len = int(duration * dst_rate)
    x_old = np.linspace(0, 1, num=audio.size, endpoint=False)
    x_new = np.linspace(0, 1, num=new_len, endpoint=False)
    resampled = np.interp(x_new, x_old, audio)
    return resampled.astype(np.int16).tobytes()
