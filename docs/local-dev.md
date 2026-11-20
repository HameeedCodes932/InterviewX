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

Recommended model: **llama3.2:3b**. Recommended Piper voices: **en_US-amy-medium** (female), **en_US-lessac-medium** (male) — licence-verify ONNX files.
