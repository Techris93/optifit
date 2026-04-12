import io

from app.config import settings
from app.routers.equipment import detector
from app.security import rate_limiter


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "healthy"
    assert "environment" in payload
    assert "local_vision_enabled" in payload


def test_readiness_endpoint(client):
    response = client.get("/readyz")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ready"
    assert "release" in payload


def test_generate_workout_returns_template_payload(client):
    response = client.post(
        "/api/workouts/generate?goal=strength&difficulty=beginner&duration=40",
        json={"equipment": ["dumbbell", "yoga_mat"], "focus_areas": ["back"]},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["workout"]["generation_mode"] == "template"
    assert payload["equipment_used"] == ["dumbbell", "yoga_mat"]
    assert len(payload["exercise_matches"]) >= 1
    assert all(match.get("exercise") is not None for match in payload["exercise_matches"])
    assert all((match.get("exercise_id") or 0) > 0 for match in payload["exercise_matches"])


def test_generate_workout_auto_backfills_missing_template_labels(client):
    response = client.post(
        "/api/workouts/generate?goal=strength&difficulty=beginner&duration=45",
        json={"equipment": ["dumbbell"]},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["exercise_matches"], "Expected generated exercises"

    # In the test fixture, only push_ups and dumbbell_rows are pre-seeded.
    # This asserts that at least one additional generated label was backfilled into DB.
    assert any(
        match["slug"] in {"goblet_squats", "dumbbell_bench_press", "plank"}
        and (match.get("exercise_id") or 0) > 0
        for match in payload["exercise_matches"]
    )


def test_save_generated_workout_persists_record(client):
    generation = client.post(
        "/api/workouts/generate?goal=hypertrophy&difficulty=beginner&duration=45",
        json={"equipment": ["dumbbell", "yoga_mat"]},
    )
    generated_payload = generation.json()

    save_response = client.post(
        "/api/workouts/save-generated",
        json={
            "name": generated_payload["workout"]["name"],
            "description": generated_payload["workout"]["description"],
            "goal": "hypertrophy",
            "difficulty": generated_payload["workout"]["difficulty"],
            "estimated_duration_minutes": generated_payload["workout"]["estimated_duration_minutes"],
            "equipment_used": generated_payload["equipment_used"],
            "exercise_matches": generated_payload["exercise_matches"],
        },
    )
    assert save_response.status_code == 200
    saved = save_response.json()
    assert saved["id"] > 0
    assert saved["saved_exercise_count"] == len(generated_payload["exercise_matches"])

    workouts_response = client.get("/api/workouts/")
    assert workouts_response.status_code == 200
    workouts = workouts_response.json()
    assert any(workout["id"] == saved["id"] for workout in workouts)


def test_progress_logging_and_history(client):
    log_response = client.post(
        "/api/progress/log",
        json={
            "exercise_id": 1,
            "sets_completed": 3,
            "reps_per_set": [10, 10, 8],
            "weight_per_set": [0, 0, 0],
            "notes": "Felt solid",
        },
    )
    assert log_response.status_code == 200

    history_response = client.get("/api/progress/history?days=30")
    assert history_response.status_code == 200
    payload = history_response.json()
    assert payload["consistency"]["workouts_logged"] >= 1
    assert len(payload["entries"]) >= 1


def test_progress_log_rejects_mismatched_sets(client):
    response = client.post(
        "/api/progress/log",
        json={
            "exercise_id": 1,
            "sets_completed": 3,
            "reps_per_set": [10, 10],
            "weight_per_set": [20, 20, 20],
        },
    )
    assert response.status_code == 422


def test_cloud_vision_detection_path(client, monkeypatch):
    original_provider = settings.cloud_vision_provider
    original_local_vision = settings.enable_local_vision

    try:
        settings.cloud_vision_provider = "gemini"
        settings.enable_local_vision = False

        def fake_detect(_image_path: str, confidence_threshold: float = 0.5):
            return [
                {"label": "dumbbell", "confidence": 0.94, "bbox": [], "class_id": None},
                {"label": "bench", "confidence": 0.83, "bbox": [], "class_id": None},
            ]

        monkeypatch.setattr(detector, "detect", fake_detect)
        monkeypatch.setattr(detector, "annotate_image", lambda *_args, **_kwargs: None)

        response = client.post(
            "/api/equipment/detect",
            files={"file": ("gym.jpg", io.BytesIO(b"fake-image"), "image/jpeg")},
            data={"confidence": "0.5"},
        )
    finally:
        settings.cloud_vision_provider = original_provider
        settings.enable_local_vision = original_local_vision

    assert response.status_code == 200
    payload = response.json()
    assert payload["equipment_found"] == ["bench", "dumbbell"]
    assert payload["annotated_image"] is None
    assert payload["detection_mode"] == "gemini"


def test_login_rate_limit(client):
    register = client.post(
        "/api/auth/register",
        json={
            "email": "user@example.com",
            "username": "user_one",
            "password": "strongpass123",
        },
    )
    assert register.status_code == 200

    original_limit = settings.auth_rate_limit_count
    original_window = settings.auth_rate_limit_window_seconds
    try:
        settings.auth_rate_limit_count = 2
        settings.auth_rate_limit_window_seconds = 60
        rate_limiter.reset()

        for _ in range(2):
            response = client.post(
                "/api/auth/login",
                json={"username": "user_one", "password": "wrong-password"},
            )
            assert response.status_code == 401

        throttled = client.post(
            "/api/auth/login",
            json={"username": "user_one", "password": "wrong-password"},
        )
        assert throttled.status_code == 429
    finally:
        settings.auth_rate_limit_count = original_limit
        settings.auth_rate_limit_window_seconds = original_window
        rate_limiter.reset()


def test_detection_rejects_oversized_upload(client, monkeypatch):
    original_provider = settings.cloud_vision_provider
    original_local_vision = settings.enable_local_vision
    original_max_upload = settings.max_upload_bytes

    try:
        settings.cloud_vision_provider = "gemini"
        settings.enable_local_vision = False
        settings.max_upload_bytes = 8
        rate_limiter.reset()
        monkeypatch.setattr(detector, "detect", lambda *_args, **_kwargs: [])
        monkeypatch.setattr(detector, "annotate_image", lambda *_args, **_kwargs: None)

        response = client.post(
            "/api/equipment/detect",
            files={"file": ("gym.jpg", io.BytesIO(b"0123456789abcdef"), "image/jpeg")},
            data={"confidence": "0.5"},
        )
        assert response.status_code == 413
    finally:
        settings.cloud_vision_provider = original_provider
        settings.enable_local_vision = original_local_vision
        settings.max_upload_bytes = original_max_upload
        rate_limiter.reset()
