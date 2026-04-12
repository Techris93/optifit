import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("DATABASE_URL", "sqlite:///./optifit_test_bootstrap.db")

from app.main import app
from app.models.database import Base, Exercise, EquipmentType, get_db
from app.security import rate_limiter


@pytest.fixture()
def client(tmp_path: Path):
    rate_limiter.reset()
    database_path = tmp_path / "test.db"
    engine = create_engine(
        f"sqlite:///{database_path}",
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    db = TestingSessionLocal()
    dumbbell = EquipmentType(name="dumbbell", display_name="Dumbbells", category="free_weights", description="Adjustable dumbbells")
    mat = EquipmentType(name="yoga_mat", display_name="Yoga Mat", category="accessories", description="Mat for floor work")
    pushups = Exercise(
        name="Push-ups",
        slug="push_ups",
        description="Classic bodyweight press.",
        instructions="Start in a plank, lower your chest, and press back up.",
        tips="Stay rigid through your trunk.",
        muscle_groups=["chest", "triceps", "core"],
        primary_muscles=["pectorals"],
        secondary_muscles=["triceps"],
        difficulty="beginner",
        exercise_type="compound",
        equipment=[mat],
    )
    rows = Exercise(
        name="Dumbbell Rows",
        slug="dumbbell_rows",
        description="Back exercise with dumbbells.",
        instructions="Hinge, row, and control the lowering phase.",
        tips="Pull toward the hip.",
        muscle_groups=["back", "biceps"],
        primary_muscles=["lats"],
        secondary_muscles=["biceps"],
        difficulty="beginner",
        exercise_type="compound",
        equipment=[dumbbell],
    )
    db.add_all([dumbbell, mat, pushups, rows])
    db.commit()
    db.close()

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    rate_limiter.reset()
