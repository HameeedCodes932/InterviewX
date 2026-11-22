# InterviewX API

FastAPI + PostgreSQL backend foundation for InterviewX.

This package provides configuration, database connectivity, Alembic migrations, and health endpoints. Authentication, AI, and interview engines are intentionally **not** implemented here.

## Required software (Windows 11)

- Python **3.11+** (3.12 recommended)
- PostgreSQL **14+** (16 tested in CI/dev environments)
- Git
- Optional: [psql](https://www.postgresql.org/download/windows/) on `PATH`

## Project layout

```text
apps/api/
  app/
    api/v1/          # HTTP routes
    core/            # database engine/session
    models/          # SQLAlchemy models
    schemas/         # Pydantic schemas
    services/        # business / infra helpers
    config.py
    main.py
  alembic/           # migrations
  .env.example
  requirements.txt
```

## 1. Create a virtual environment

From PowerShell (or Command Prompt):

```powershell
cd apps\api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## 2. Install dependencies

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## 3. Create the PostgreSQL database

Using `psql` (adjust user/password as needed):

```powershell
psql -U postgres
```

```sql
CREATE USER interviewx WITH PASSWORD 'CHANGE_ME';
CREATE DATABASE interviewx OWNER interviewx;
GRANT ALL PRIVILEGES ON DATABASE interviewx TO interviewx;
\q
```

## 4. Configure environment

```powershell
copy .env.example .env
```

Edit `.env` and set a real `DATABASE_URL`:

```env
DATABASE_URL=postgresql+psycopg://interviewx:CHANGE_ME@127.0.0.1:5432/interviewx
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Never commit `.env` or real credentials.

## 5. Run migrations

From `apps\api` with the virtualenv active:

```powershell
alembic upgrade head
```

This applies migrations through the current head (users + interview sessions).

## 6. Start the API server

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open interactive docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## 7. Test health endpoints

API process:

```powershell
curl http://127.0.0.1:8000/api/v1/health
```

Expected JSON includes `"status": "ok"`.

Database connectivity:

```powershell
curl http://127.0.0.1:8000/api/v1/health/database
```

- Connected: HTTP 200 and `"database": "connected"`
- Unavailable: HTTP 503 and `"database": "unreachable"`

## Frontend pairing

The Next.js app reads `NEXT_PUBLIC_API_BASE_URL` (default `http://127.0.0.1:8000`). See `apps/web/.env.example`.

## Authentication endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/api/v1/auth/register` | Create user, return JWT + public user |
| `POST` | `/api/v1/auth/login` | Verify credentials, return JWT + public user |
| `GET` | `/api/v1/auth/me` | Current user (`Authorization: Bearer <token>`) |

Required auth env vars (see `.env.example`):

```env
JWT_SECRET_KEY=<at least 32 characters; not a placeholder>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

Generate a strong JWT secret:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

The API refuses to start when `JWT_SECRET_KEY` is a placeholder or shorter than 32 characters (except `APP_ENV=test`), or when `ACCESS_TOKEN_EXPIRE_MINUTES` is not positive.

Passwords are hashed with **bcrypt** and rejected when they exceed **72 UTF-8 bytes** (no silent truncation). Access tokens are **HS256 JWTs**. Never store plaintext passwords.

## Interview session endpoints

Both require `Authorization: Bearer <access_token>`. Ownership is always taken from the authenticated user — never from the request body.

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/api/v1/interviews` | Create a persisted interview session (201) |
| `GET` | `/api/v1/interviews/{session_id}` | Fetch own session (404 if missing or not owned) |
| `POST` | `/api/v1/interviews/{session_id}/complete` | Mark own session completed (idempotent) |

Example create request:

```json
{
  "category": "software_engineering",
  "role": "Software Engineer",
  "experience_level": "mid",
  "focus_areas": ["Programming & Problem Solving", "System Design"],
  "difficulty": "medium",
  "duration_minutes": 30
}
```

Example create response (truncated):

```json
{
  "id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "user_id": "11111111-2222-3333-4444-555555555555",
  "category": "software_engineering",
  "role": "Software Engineer",
  "experience_level": "mid",
  "focus_areas": ["Programming & Problem Solving", "System Design"],
  "difficulty": "medium",
  "duration_minutes": 30,
  "status": "created",
  "completed_at": null,
  "created_at": "2026-11-22T18:00:00Z",
  "updated_at": "2026-11-22T18:00:00Z"
}
```

Completing a session sets `status` to `completed` and records `completed_at`. Repeating the complete call is safe and preserves the original `completed_at`.

## Run tests

```powershell
pytest
```

## Notes

- Credentials come only from environment variables.
- Frontend stores the JWT in `localStorage` for SPA refresh persistence (XSS-readable). Prefer httpOnly cookies behind a same-origin reverse proxy for stronger production hardening.
- Client route guards complement API JWT checks and are not a substitute for server authorization.
