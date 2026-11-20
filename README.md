# InterviewX

AI-powered virtual human interview simulation platform.

Phase 1 scaffold: **professional auth + candidate dashboard** (voice agent and 3D avatar are stubs).

## Monorepo layout

```
apps/web/          Next.js platform UI
backend/           FastAPI modular monolith (auth, profile, dashboard APIs)
agent/             LiveKit agent runtime (stub)
avatar/            R3F avatar runtime (stub)
packages/contracts Shared AvatarAction / observation types
docs/              Engineering notes
docker-compose.yml PostgreSQL for local development
```

## How to run (auth + dashboard)

### 1. Environment

```bash
cp .env.example .env
```

### 2. PostgreSQL

```bash
docker compose up -d postgres
```

### 3. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health: http://localhost:8000/health · Docs: http://localhost:8000/docs

### 4. Frontend

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:3000 → create an account → land on the candidate dashboard.

## What works now

- Signup, login, logout
- Forgot / reset password (SMTP stubbed — reset token returned in API when `SMTP_ENABLED=false`)
- Hashed passwords (bcrypt) + JWT sessions
- Candidate dashboard with category grid (Software Engineering **Available**; others **Coming Soon**)
- Profile management
- Interview history + evaluation report shells (empty states)

## Stubbed / not in this slice

- LiveKit voice interview agent (`agent/`)
- Ollama / Whisper / Piper adapters
- 3D avatars (`avatar/`)
- Starting an interview from the dashboard (button disabled until voice slice)
- Real email delivery for password reset

## Stack (v0, free/OSS)

| Layer | Choice |
| ----- | ------ |
| Frontend | Next.js |
| Backend | FastAPI |
| DB | PostgreSQL |
| LLM / STT / TTS (later) | Ollama / Whisper / Piper |
| Realtime (later) | Self-hosted LiveKit |

Product decisions: see Project store `docs/DECISIONS.md`.
