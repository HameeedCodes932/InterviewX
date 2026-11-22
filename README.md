# InterviewX

AI-powered virtual human interview simulation platform.

## Monorepo layout

| Path | Role |
| ---- | ---- |
| `apps/web` | Next.js frontend (Hybrid Luxury UI) |
| `apps/api` | FastAPI + PostgreSQL backend foundation |

## Run the web app

```bash
cd apps/web
npm install
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login) (root `/` redirects to `/login`).

Optional frontend env (see `apps/web/.env.example`):

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## Run the API

See **[apps/api/README.md](apps/api/README.md)** for Windows 11 setup (venv, PostgreSQL, Alembic, uvicorn).

Quick start (after configuring `apps/api/.env`):

```bash
cd apps/api
python -m venv .venv
# Windows: .\.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health checks:

- [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)
- [http://127.0.0.1:8000/api/v1/health/database](http://127.0.0.1:8000/api/v1/health/database)

## Frontend scripts

```bash
cd apps/web
npm run lint
npm run typecheck
npm run build
```
