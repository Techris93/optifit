from __future__ import annotations

import os
import time
from collections import defaultdict, deque
from threading import Lock
from typing import Iterable

from fastapi import HTTPException, Request, UploadFile

from app.config import settings


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def hit(self, key: str, limit: int, window_seconds: int) -> None:
        now = time.monotonic()
        cutoff = now - window_seconds
        with self._lock:
            bucket = self._events[key]
            while bucket and bucket[0] < cutoff:
                bucket.popleft()
            if len(bucket) >= limit:
                raise HTTPException(429, "Too many requests. Please try again later.")
            bucket.append(now)

    def reset(self) -> None:
        with self._lock:
            self._events.clear()


rate_limiter = InMemoryRateLimiter()


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    if forwarded:
        return forwarded
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def apply_rate_limit(request: Request, namespace: str, identifier: str, limit: int, window_seconds: int) -> None:
    key = f"{namespace}:{client_ip(request)}:{identifier}"
    rate_limiter.hit(key, limit, window_seconds)


async def save_upload_file(upload: UploadFile, file_path: str, max_bytes: int, allowed_extensions: Iterable[str]) -> str:
    filename = upload.filename or ""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in set(allowed_extensions):
        raise HTTPException(400, f"Unsupported file type: {ext or 'unknown'}")

    size = 0
    try:
        with open(file_path, "wb") as destination:
            while True:
                chunk = await upload.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > max_bytes:
                    raise HTTPException(413, f"File too large. Max size is {max_bytes // (1024 * 1024)} MB.")
                destination.write(chunk)
    finally:
        await upload.close()

    return ext


def validate_runtime_security() -> None:
    insecure_secret = os.getenv("JWT_SECRET", "change-me-in-production").strip() == "change-me-in-production"
    if settings.is_production and settings.require_secure_jwt_secret and insecure_secret:
        raise RuntimeError("JWT_SECRET must be set to a secure value in production.")
    if settings.is_production and not settings.cors_origins:
        raise RuntimeError("CORS_ORIGINS must be set explicitly in production.")
    if settings.cloud_vision_provider == "openai" and not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required when CLOUD_VISION_PROVIDER=openai.")
    if settings.cloud_vision_provider == "gemini" and not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is required when CLOUD_VISION_PROVIDER=gemini.")
