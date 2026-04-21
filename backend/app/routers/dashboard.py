from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.models.database import Exercise, ProgressEntry, User, Workout, get_db
from app.routers.auth import get_optional_current_user
from app.session_scope import RequestScope, get_request_scope

router = APIRouter()


def _resolve_detection_mode() -> str:
    if settings.cloud_vision_provider in {"openai", "gemini"}:
        return settings.cloud_vision_provider
    if settings.enable_local_vision:
        return "local"
    return "manual"


def _apply_workout_scope(query, scope: RequestScope | None):
    if scope is None:
        return query.filter(Workout.id == -1)
    if scope.user_id is not None:
        return query.filter(Workout.user_id == scope.user_id)
    return query.filter(Workout.guest_session_id == scope.guest_session_id)


def _apply_progress_scope(query, scope: RequestScope | None):
    if scope is None:
        return query.filter(ProgressEntry.id == -1)
    if scope.user_id is not None:
        return query.filter(ProgressEntry.user_id == scope.user_id)
    return query.filter(ProgressEntry.guest_session_id == scope.guest_session_id)


def _serialize_saved_workout(workout: Workout) -> dict:
    return {
        "id": workout.id,
        "name": workout.name,
        "description": workout.description,
        "goal": workout.goal,
        "difficulty": workout.difficulty,
        "estimated_duration_minutes": workout.estimated_duration_minutes,
        "equipment_used": workout.equipment_used,
        "created_at": workout.created_at,
    }


def _serialize_recent_progress(entry: ProgressEntry, exercise_name: str | None) -> dict:
    total_volume = round(
        sum(reps * weight for reps, weight in zip(entry.reps_per_set or [], entry.weight_per_set or [])),
        2,
    )
    return {
        "id": entry.id,
        "exercise_id": entry.exercise_id,
        "exercise_name": exercise_name or f"Exercise #{entry.exercise_id}",
        "sets_completed": entry.sets_completed,
        "total_volume": total_volume,
        "weight_unit": entry.weight_unit,
        "created_at": entry.created_at,
    }


@router.get("/summary")
async def get_dashboard_summary(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    scope = get_request_scope(request, current_user)

    workout_query = _apply_workout_scope(
        db.query(Workout).filter(Workout.is_template == False),  # noqa: E712
        scope,
    )
    progress_query = _apply_progress_scope(db.query(ProgressEntry), scope)

    recent_workouts = workout_query.order_by(Workout.created_at.desc()).limit(3).all()
    recent_progress_rows = (
        _apply_progress_scope(
            db.query(ProgressEntry, Exercise.name.label("exercise_name"))
            .outerjoin(Exercise, Exercise.id == ProgressEntry.exercise_id),
            scope,
        )
        .order_by(ProgressEntry.created_at.desc())
        .limit(4)
        .all()
    )

    progress_entries_last_30_days = progress_query.filter(
        ProgressEntry.created_at >= datetime.now(UTC).replace(tzinfo=None) - timedelta(days=30)
    ).all()
    active_days_30 = len({entry.created_at.date() for entry in progress_entries_last_30_days})

    return {
        "scope": scope.kind if scope is not None else "anonymous",
        "detection_mode": _resolve_detection_mode(),
        "stats": {
            "saved_workouts": workout_query.count(),
            "exercise_library_total": db.query(Exercise).count(),
            "progress_entries": progress_query.count(),
            "active_days_30": active_days_30,
        },
        "recent_saved_workouts": [_serialize_saved_workout(workout) for workout in recent_workouts],
        "recent_progress": [
            _serialize_recent_progress(entry, exercise_name)
            for entry, exercise_name in recent_progress_rows
        ],
    }
