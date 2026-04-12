import os


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_list(name: str) -> list[str]:
    value = os.getenv(name, "")
    return [item.strip() for item in value.split(",") if item.strip()]


_app_env = os.getenv("APP_ENV", "development").strip().lower()
_is_render = _env_bool("RENDER", False)
_default_local_vision = not (_app_env == "production" or _is_render)


class Settings:
    app_env = _app_env
    is_render = _is_render
    uploads_dir = os.getenv("UPLOADS_DIR", "uploads").strip() or "uploads"
    enable_local_vision = _env_bool("ENABLE_LOCAL_VISION", _default_local_vision)
    cors_origins = _env_list("CORS_ORIGINS")
    cloud_vision_provider = os.getenv("CLOUD_VISION_PROVIDER", "none").strip().lower() or "none"
    cloud_vision_timeout_seconds = float(os.getenv("CLOUD_VISION_TIMEOUT_SECONDS", "30"))
    openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()
    openai_vision_model = os.getenv("OPENAI_VISION_MODEL", "gpt-4.1-mini").strip() or "gpt-4.1-mini"
    gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
    gemini_vision_model = os.getenv("GEMINI_VISION_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
    max_upload_bytes = int(os.getenv("MAX_UPLOAD_BYTES", str(8 * 1024 * 1024)))
    auth_rate_limit_count = int(os.getenv("AUTH_RATE_LIMIT_COUNT", "10"))
    auth_rate_limit_window_seconds = int(os.getenv("AUTH_RATE_LIMIT_WINDOW_SECONDS", "300"))
    detect_rate_limit_count = int(os.getenv("DETECT_RATE_LIMIT_COUNT", "20"))
    detect_rate_limit_window_seconds = int(os.getenv("DETECT_RATE_LIMIT_WINDOW_SECONDS", "300"))
    require_secure_jwt_secret = _env_bool("REQUIRE_SECURE_JWT_SECRET", True)
    require_auth_for_progress = _env_bool("REQUIRE_AUTH_FOR_PROGRESS", _app_env == "production")
    log_level = os.getenv("LOG_LEVEL", "INFO").strip().upper() or "INFO"
    release_version = os.getenv("RENDER_GIT_COMMIT", "").strip()

    @property
    def uploads_equipment_dir(self) -> str:
        return os.path.join(self.uploads_dir, "equipment")

    @property
    def allow_all_origins(self) -> bool:
        return not self.cors_origins or "*" in self.cors_origins

    @property
    def allow_credentials(self) -> bool:
        return not self.allow_all_origins

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


settings = Settings()
