# Architecture (repo copy)

Canonical product architecture lives in the Project store (`docs/ARCHITECTURE.md`).

This repo implements:

- `apps/web` — Next.js candidate platform
- `backend` — FastAPI auth / profile / dashboard APIs
- `agent/` — stub for LiveKit Agents + Whisper → Ollama → Piper
- `avatar/` — stub for R3F seated characters
- `packages/contracts` — shared AvatarAction / observation shapes

See `docs/local-dev.md` for run instructions.
