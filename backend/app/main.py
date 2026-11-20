import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, platform, profile
from app.core.config import get_settings
from app.core.database import Base, SessionLocal, engine
from app.seed import seed_categories

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("interviewx")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_categories(db)
        logger.info("Database ready; categories seeded.")
    finally:
        db.close()
    yield


settings = get_settings()

app = FastAPI(
    title="InterviewX API",
    description="Professional interview simulation platform API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(platform.router, prefix="/api")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "interviewx-api"}
