# Local development

## Prerequisites

- Node.js 20+
- Python 3.11+
- Docker (for PostgreSQL via `docker-compose`)

## Quick start

```bash
# 1. Environment
cp .env.example .env

# 2. Database
docker compose up -d postgres

# 3. Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 4. Frontend (new terminal)
cd apps/web
npm install
npm run dev
```

Open http://localhost:3000 — sign up, then land on the candidate dashboard.

API docs: http://localhost:8000/docs

## Notes

- Password reset works without SMTP: the forgot-password API returns `reset_token` / `reset_url` for local testing (TODO: enable SMTP).
- Voice agent, LiveKit, Ollama, Whisper, and Piper are **not** required for auth + dashboard.
- Categories other than Software Engineering are Coming Soon shells.
