from contextlib import asynccontextmanager
import logging
import os
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.routers import equipment, workouts, exercises, auth, uploads, progress
from app.models.database import engine, Base
from app.security import validate_runtime_security

logging.basicConfig(level=getattr(logging, settings.log_level, logging.INFO))
logger = logging.getLogger("optifit.api")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Keep table bootstrap for MVP environments that do not run migrations yet.
    Base.metadata.create_all(bind=engine)
    reconcile_runtime_schema()
    validate_runtime_security()
    yield


def reconcile_runtime_schema() -> None:
    inspector = inspect(engine)
    workout_columns = {column["name"] for column in inspector.get_columns("workouts")}

    if "guest_session_id" not in workout_columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE workouts ADD COLUMN guest_session_id VARCHAR"))

app = FastAPI(
    title="OptiFit API",
    description="Open source AI workout planner",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_credentials=settings.allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        if settings.is_production:
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return response


class RequestContextLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        logger.info(
            "request_complete request_id=%s method=%s path=%s status=%s duration_ms=%s release=%s",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            settings.release_version or "local",
        )
        return response


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestContextLoggingMiddleware)

# Static files for uploads
if settings.enable_local_vision:
    os.makedirs(settings.uploads_dir, exist_ok=True)
    os.makedirs(settings.uploads_equipment_dir, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.uploads_dir), name="uploads")

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(equipment.router, prefix="/api/equipment", tags=["equipment"])
app.include_router(workouts.router, prefix="/api/workouts", tags=["workouts"])
app.include_router(exercises.router, prefix="/api/exercises", tags=["exercises"])
if settings.enable_local_vision:
    app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])

@app.get("/")
async def root():
    return {"message": "OptiFit API", "version": "1.0.0"}

@app.get("/health")
async def health():
    detection_mode = settings.cloud_vision_provider if settings.cloud_vision_provider in {"openai", "gemini"} else ("local" if settings.enable_local_vision else "manual")
    return {
        "status": "healthy",
        "environment": settings.app_env,
        "local_vision_enabled": settings.enable_local_vision,
        "detection_mode": detection_mode,
        "release": settings.release_version or "local",
    }


@app.get("/readyz")
async def readyz():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    detection_mode = settings.cloud_vision_provider if settings.cloud_vision_provider in {"openai", "gemini"} else ("local" if settings.enable_local_vision else "manual")
    return {
        "status": "ready",
        "environment": settings.app_env,
        "detection_mode": detection_mode,
        "release": settings.release_version or "local",
    }
