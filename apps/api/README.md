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

## Notes

- Credentials come only from environment variables.
- Client-side frontend route protection (if present) is unrelated to this API.
- Do not treat this foundation as production authentication or production hardening.
