"""LiveKit Agents worker entrypoint for InterviewX."""

from __future__ import annotations

import json
import logging
import os
import sys

from dotenv import load_dotenv
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli

# Allow `python -m interviewx_agent.main` from agent/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from interviewx_agent.adapters.llm_ollama import OllamaLLM
from interviewx_agent.adapters.stt_whisper import FasterWhisperSTT
from interviewx_agent.adapters.tts_piper import PiperTTS
from interviewx_agent.api_client import BackendClient
from interviewx_agent.brain import InterviewBrain
from interviewx_agent.config import AgentConfig
from interviewx_agent.session_runner import InterviewSessionRunner

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("interviewx.agent")


async def entrypoint(ctx: JobContext) -> None:
    cfg = AgentConfig.from_env()
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    meta: dict = {}
    if ctx.job.metadata:
        try:
            meta = json.loads(ctx.job.metadata)
        except json.JSONDecodeError:
            meta = {}
    if ctx.room.metadata:
        try:
            room_meta = json.loads(ctx.room.metadata)
            meta = {**room_meta, **meta}
        except json.JSONDecodeError:
            pass

    session_id = meta.get("session_id")
    if not session_id:
        logger.error("No session_id in job/room metadata — aborting")
        return

    api = BackendClient(cfg.backend_url, cfg.agent_api_key)
    try:
        boot = await api.bootstrap(session_id)
        meta = {**meta, **boot}
    except Exception:
        logger.exception("Bootstrap failed; continuing with dispatch metadata")

    llm = OllamaLLM(cfg.ollama_base_url, cfg.ollama_model)
    stt = FasterWhisperSTT(cfg.whisper_model, cfg.whisper_device)
    tts = PiperTTS(
        binary=cfg.piper_binary,
        voice_male=cfg.piper_voice_male,
        voice_female=cfg.piper_voice_female,
        speaker_male=cfg.piper_speaker_male,
        speaker_female=cfg.piper_speaker_female,
    )
    brain = InterviewBrain(llm)
    runner = InterviewSessionRunner(
        room=ctx.room,
        session_id=session_id,
        meta=meta,
        brain=brain,
        stt=stt,
        tts=tts,
        api=api,
    )
    await runner.run()


def main() -> None:
    cfg = AgentConfig.from_env()
    # livekit-agents reads LIVEKIT_URL / API key / secret from env
    os.environ.setdefault("LIVEKIT_URL", cfg.livekit_url)
    os.environ.setdefault("LIVEKIT_API_KEY", cfg.livekit_api_key)
    os.environ.setdefault("LIVEKIT_API_SECRET", cfg.livekit_api_secret)
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name=cfg.agent_name,
        )
    )


if __name__ == "__main__":
    main()
