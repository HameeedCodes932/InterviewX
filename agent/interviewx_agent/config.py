import os
from dataclasses import dataclass


@dataclass(frozen=True)
class AgentConfig:
    livekit_url: str
    livekit_api_key: str
    livekit_api_secret: str
    agent_name: str
    backend_url: str
    agent_api_key: str
    ollama_base_url: str
    ollama_model: str
    whisper_model: str
    whisper_device: str
    piper_binary: str
    piper_voice_male: str
    piper_voice_female: str
    piper_speaker_male: int | None
    piper_speaker_female: int | None
    language: str

    @classmethod
    def from_env(cls) -> "AgentConfig":
        return cls(
            livekit_url=os.getenv("LIVEKIT_URL", "ws://localhost:7880"),
            livekit_api_key=os.getenv("LIVEKIT_API_KEY", "devkey"),
            livekit_api_secret=os.getenv("LIVEKIT_API_SECRET", "secret"),
            agent_name=os.getenv("LIVEKIT_AGENT_NAME", "interviewx-interviewer"),
            backend_url=os.getenv("BACKEND_URL", "http://localhost:8000"),
            agent_api_key=os.getenv("AGENT_API_KEY", "dev-agent-api-key-change-me"),
            ollama_base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            ollama_model=os.getenv("OLLAMA_MODEL", "llama3.2:3b"),
            whisper_model=os.getenv("WHISPER_MODEL", "base"),
            whisper_device=os.getenv("WHISPER_DEVICE", "cpu"),
            piper_binary=os.getenv("PIPER_BINARY", "piper"),
            # Licence: check each Piper voice ONNX licence before redistribution.
            piper_voice_male=os.getenv(
                "PIPER_VOICE_MALE",
                "en_US-lessac-medium",
            ),
            piper_voice_female=os.getenv(
                "PIPER_VOICE_FEMALE",
                "en_US-amy-medium",
            ),
            piper_speaker_male=_optional_int(os.getenv("PIPER_SPEAKER_MALE")),
            piper_speaker_female=_optional_int(os.getenv("PIPER_SPEAKER_FEMALE")),
            language=os.getenv("INTERVIEW_LANGUAGE", "en"),
        )


def _optional_int(value: str | None) -> int | None:
    if value is None or value == "":
        return None
    return int(value)
