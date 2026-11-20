# InterviewX

AI-powered virtual human interview simulation platform.

Phase 1: professional auth + candidate dashboard + Software Engineering voice interviewer (OSS stack).  
Phase 2: **distinct seated male/female 3D interviewers** in the browser (R3F + GLB).

## Monorepo layout

```
apps/web/          Next.js platform UI + interview room + avatar host
backend/           FastAPI (auth, sessions, transcripts, evaluation, usage)
agent/             LiveKit Agents runtime (Whisper → Ollama → Piper)
avatar/            R3F avatar runtime + seated GLB assets
packages/contracts Shared AvatarAction / observation types
docs/              Engineering notes
docker-compose.yml PostgreSQL + self-hosted LiveKit
```

## How to run (full SE voice interview + 3D interviewer)

### Prerequisites

- Docker (Postgres + LiveKit)
- Node.js 20+
- Python 3.11+
- [Ollama](https://ollama.com) with a local model
- [Piper](https://github.com/rhasspy/piper) CLI + male/female voice ONNX files

### 1. Environment

```bash
cp .env.example .env
```

### 2. Infrastructure

```bash
docker compose up -d postgres livekit
```

LiveKit dev defaults: `ws://localhost:7880`, API key `devkey`, secret `secret`.

### 3. Ollama model

```bash
ollama pull llama3.2:3b
```

### 4. Piper voices (distinct male + female)

```bash
mkdir -p ~/.local/share/piper
# Place en_US-amy-medium.onnx (+ .json) and en_US-lessac-medium.onnx (+ .json)
```

See `agent/README.md` for licence notes.

### 5. Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 6. Agent worker

```bash
cd agent
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m interviewx_agent.main start
```

### 7. Frontend (+ avatar package)

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:3000 → sign up → **Profile** → choose male or female interviewer → **Start interview** on Software Engineering.

The interview room renders the selected seated GLB with idle breathing/blink. Voice agent is unchanged (Phase 1).

### Regenerate avatar GLBs (optional)

```bash
node avatar/scripts/generate-interviewers.mjs
```

Licences: `avatar/LICENSES.md`.

## What works

- Auth (signup / login / logout / forgot-password)
- Dashboard with category paths + interviewer preference
- Distinct male/female seated 3D interviewers (R3F) with idle animation
- LiveKit room join, mic, end interview
- Adaptive SE interviewer (greeting, follow-ups, session memory, interruption handling)
- Transcript persistence + usage metrics
- Scored SE rubric + qualitative feedback with evidence quotes

## Still stubbed / next

- Phase 3: full AvatarAction → speak/listen lip-sync
- Categories other than Software Engineering
- Real SMTP for password reset

## Stack (v0, free/OSS)

| Layer | Choice |
| ----- | ------ |
| Frontend | Next.js |
| 3D | Three.js / React Three Fiber + InterviewX GLB |
| Backend | FastAPI |
| Realtime | Self-hosted LiveKit |
| LLM | Ollama |
| STT | faster-whisper |
| TTS | Piper |
| DB | PostgreSQL |
