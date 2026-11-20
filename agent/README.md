# InterviewX Agent (stub)

LiveKit Agents interviewer runtime. Phase 1 voice work lands here:

- Join self-hosted LiveKit rooms as the interviewer participant
- STT → LLM → TTS via adapters: **Whisper / faster-whisper → Ollama → Piper**
- Emit `AvatarAction` events (see `packages/contracts`)
- Persist transcripts / usage via the FastAPI backend

This package must **not** import Three.js or avatar rendering code.

Status: **stub only** — not runnable yet.
