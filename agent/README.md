# InterviewX Agent

LiveKit Agents interviewer runtime for Software Engineering voice interviews.

**Pipeline:** Candidate audio → **faster-whisper** (STT) → **Ollama** (LLM brain) → **Piper** (TTS) → LiveKit room.

Avatar rendering stays in `avatar/`; this package only emits `AvatarAction` data messages.

## Licence notes (verify before commercial use)

| Component | Notes |
| --------- | ----- |
| LiveKit (server + clients) | Apache-2.0 |
| livekit-agents | Apache-2.0 |
| faster-whisper | MIT; **Whisper model weights** have their own terms — confirm for your use |
| Ollama | MIT; **each model** (e.g. Llama) has a separate licence — verify weights |
| Piper | MIT; **each voice ONNX** has its own licence — verify before redistribution |
| Silero VAD (optional) | Check package licence if you enable the plugin |

Free/OSS ≠ automatically commercial-safe. Keep adapters so providers stay swappable.

## Setup

### 1. LiveKit (docker compose from repo root)

```bash
docker compose up -d livekit
```

Dev credentials (compose defaults): API key `devkey`, secret `secret`, URL `ws://localhost:7880`.

### 2. Ollama

```bash
# Install from https://ollama.com — then:
ollama pull llama3.2:3b
```

Recommended default: **`llama3.2:3b`** (CPU-friendly). Override with `OLLAMA_MODEL`.

### 3. Piper voices (distinct male + female)

```bash
# Voices are synthesized via the Python `piper-tts` package (in requirements.txt).
# If pip cannot resolve piper-phonemize, use: pip install piper-tts --no-deps
mkdir -p ~/.local/share/piper
# Download licence-cleared en_US voices, e.g. from Hugging Face rhasspy/piper-voices:
#   en_US-amy-medium.onnx (+ .json)   → female
#   en_US-lessac-medium.onnx (+ .json) → male
# Place them in ~/.local/share/piper/
```

Env defaults:

- `PIPER_VOICE_FEMALE=en_US-amy-medium`
- `PIPER_VOICE_MALE=en_US-lessac-medium`

### 4. Python env

```bash
cd agent
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

First STT run downloads the Whisper `base` model via faster-whisper.

### 5. Run worker

From repo root (loads `.env`):

```bash
cd agent
source .venv/bin/activate
python -m interviewx_agent.main start
```

Keep this process running while candidates start interviews from the web app.

## Environment

See root `.env.example` for `LIVEKIT_*`, `OLLAMA_*`, `PIPER_*`, `AGENT_API_KEY`, `BACKEND_URL`.
