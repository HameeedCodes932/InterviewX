# Local development

## Auth + dashboard only

```bash
cp .env.example .env
docker compose up -d postgres
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# other terminal
cd apps/web && npm install && npm run dev
```

## Avatar preview (no LiveKit)

```bash
cd apps/web && npm run dev
# open http://localhost:3000/avatar-preview
# toggle Male / Female — distinct seated GLBs with idle breath/blink
```

Asset licences: `avatar/LICENSES.md`. Regenerate: `node avatar/scripts/generate-interviewers.mjs`.

## Full Software Engineering voice interview

```bash
docker compose up -d postgres livekit
ollama pull llama3.2:3b
# Install Piper + male/female voices (see agent/README.md)

# terminals:
# 1) backend uvicorn
# 2) cd agent && source .venv/bin/activate && python -m interviewx_agent.main start
# 3) apps/web npm run dev
```

Set preferred interviewer in **Profile** (male/female). The interview room loads that seated GLB.

Recommended model: **llama3.2:3b**. Recommended Piper voices: **en_US-amy-medium** (female), **en_US-lessac-medium** (male) — licence-verify ONNX files.

Note: `apps/web` builds with webpack (`next build --webpack`) so the monorepo `@interviewx/avatar` package resolves reliably.
