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

This applies the foundation baseline revision (`20261122_0001`). Domain tables will be added in later tasks.

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

The Next.js app reads `NEXT_PUBLIC_API_BASE_URL` (default `http://127.0.0.1:8000`). See `apps/web/.env.example`. Temporary browser demo authentication is unchanged until a later task wires real auth.

## Authentication endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/api/v1/auth/register` | Create user, return JWT + public user |
| `POST` | `/api/v1/auth/login` | Verify credentials, return JWT + public user |
| `GET` | `/api/v1/auth/me` | Current user (`Authorization: Bearer <token>`) |

Required auth env vars (see `.env.example`):

```env
JWT_SECRET_KEY=CHANGE_ME_TO_A_LONG_RANDOM_SECRET
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

Passwords are hashed with **bcrypt**. Access tokens are **HS256 JWTs**. Never store plaintext passwords.

## Run tests

```powershell
pytest
```

## Notes

- Credentials come only from environment variables.
- Frontend stores the JWT in `localStorage` for SPA refresh persistence (XSS-readable). Prefer httpOnly cookies behind a same-origin reverse proxy for stronger production hardening.
- Client route guards complement API JWT checks and are not a substitute for server authorization.
