from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, model_validator
from typing import List, Optional
from datetime import UTC, datetime

from app.config import settings
from app.models.database import Exercise, User, get_db, ProgressEntry
from app.routers.auth import get_optional_current_user
from app.session_scope import get_request_scope, require_request_scope

router = APIRouter()


def _scoped_progress_query(db: Session, scope):
    query = db.query(ProgressEntry)
    if scope.user_id is not None:
        return query.filter(ProgressEntry.user_id == scope.user_id)
    return query.filter(ProgressEntry.guest_session_id == scope.guest_session_id)


def _serialize_progress_entry(entry: ProgressEntry, exercise_name: str | None = None) -> dict:
    return {
        "id": entry.id,
        "exercise_id": entry.exercise_id,
        "exercise_name": exercise_name,
        "workout_id": entry.workout_id,
        "sets_completed": entry.sets_completed,
        "reps_per_set": entry.reps_per_set,
        "weight_per_set": entry.weight_per_set,
        "weight_unit": entry.weight_unit,
        "notes": entry.notes,
        "perceived_difficulty": entry.perceived_difficulty,
        "created_at": entry.created_at,
    }

class ProgressCreate(BaseModel):
    exercise_id: int = Field(gt=0)
    workout_id: Optional[int] = None
    sets_completed: int = Field(ge=1, le=12)
    reps_per_set: List[int] = Field(min_length=1, max_length=12)
    weight_per_set: List[float] = Field(min_length=1, max_length=12)
    weight_unit: str = Field(default="kg", pattern="^(kg|lbs)$")
    notes: Optional[str] = Field(default=None, max_length=1000)
    perceived_difficulty: Optional[int] = Field(default=None, ge=1, le=10)  # 1-10 RPE

    @model_validator(mode="after")
    def validate_set_lengths(self):
        if self.sets_completed != len(self.reps_per_set) or self.sets_completed != len(self.weight_per_set):
            raise ValueError("sets_completed must match reps_per_set and weight_per_set lengths")
        if any(rep <= 0 for rep in self.reps_per_set):
            raise ValueError("reps_per_set values must be positive")
        if any(weight < 0 for weight in self.weight_per_set):
            raise ValueError("weight_per_set values must be zero or positive")
        return self

@router.post("/log")
async def log_progress(
    request: Request,
    entry: ProgressCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    """Log a workout session."""
    if settings.require_auth_for_progress and get_request_scope(request, current_user) is None:
        raise HTTPException(401, "Authentication required")

    scope = require_request_scope(request, current_user)
    progress = ProgressEntry(
        user_id=scope.user_id,
        guest_session_id=scope.guest_session_id,
        exercise_id=entry.exercise_id,
        workout_id=entry.workout_id,
        sets_completed=entry.sets_completed,
        reps_per_set=entry.reps_per_set,
        weight_per_set=entry.weight_per_set,
        weight_unit=entry.weight_unit,
        notes=entry.notes,
        perceived_difficulty=entry.perceived_difficulty
    )
    
    db.add(progress)
    db.commit()
    db.refresh(progress)
    
    return progress

@router.get("/history")
async def get_progress_history(
    request: Request,
    exercise_id: Optional[int] = None,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    """Get progress history."""
    if settings.require_auth_for_progress and get_request_scope(request, current_user) is None:
        raise HTTPException(401, "Authentication required")

    scope = require_request_scope(request, current_user)
    query = _scoped_progress_query(db, scope)
    
    if exercise_id:
        query = query.filter(ProgressEntry.exercise_id == exercise_id)
    
    # Add date filter
    from datetime import timedelta
    cutoff = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=days)
    query = query.filter(ProgressEntry.created_at >= cutoff)
    
    entries = query.order_by(ProgressEntry.created_at.desc()).all()
    exercise_names = {}
    if entries:
        exercise_ids = list({entry.exercise_id for entry in entries})
        exercise_rows = (
            db.query(Exercise.id, Exercise.name)
            .filter(Exercise.id.in_(exercise_ids))
            .all()
        )
        exercise_names = {exercise_id: exercise_name for exercise_id, exercise_name in exercise_rows}
    
    return {
        "entries": [_serialize_progress_entry(entry, exercise_names.get(entry.exercise_id)) for entry in entries],
        "total_volume": calculate_total_volume(entries),
        "consistency": calculate_consistency(entries, days)
    }

def calculate_total_volume(entries: List[ProgressEntry]) -> dict:
    """Calculate total volume lifted."""
    total = 0
    for entry in entries:
        for i, reps in enumerate(entry.reps_per_set):
            if i < len(entry.weight_per_set):
                total += reps * entry.weight_per_set[i]
    
    return {
        "total_volume": round(total, 2),
        "unit": entries[0].weight_unit if entries else "kg"
    }

def calculate_consistency(entries: List[ProgressEntry], days: int) -> dict:
    """Calculate workout consistency."""
    if not entries:
        return {"workouts_logged": 0, "unique_workout_days": 0, "consistency_percentage": 0}
    
    unique_days = len(set(e.created_at.date() for e in entries))
    
    return {
        "workouts_logged": len(entries),
        "unique_workout_days": unique_days,
        "consistency_percentage": round((unique_days / days) * 100, 1)
    }

@router.get("/exercise/{exercise_id}/progress")
async def get_exercise_progress(
    exercise_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    """Get progress for a specific exercise over time."""
    if settings.require_auth_for_progress and get_request_scope(request, current_user) is None:
        raise HTTPException(401, "Authentication required")

    scope = require_request_scope(request, current_user)
    query = db.query(ProgressEntry).filter(
        ProgressEntry.exercise_id == exercise_id
    )
    if scope.user_id is not None:
        query = query.filter(ProgressEntry.user_id == scope.user_id)
    else:
        query = query.filter(ProgressEntry.guest_session_id == scope.guest_session_id)
    entries = query.order_by(ProgressEntry.created_at).all()
    
    # Calculate 1RM estimates using Epley formula
    one_rm_data = []
    for entry in entries:
        max_weight = max(entry.weight_per_set) if entry.weight_per_set else 0
        max_reps = max(entry.reps_per_set) if entry.reps_per_set else 0
        
        if max_weight and max_reps:
            one_rm = max_weight * (1 + max_reps / 30)
            one_rm_data.append({
                "date": entry.created_at,
                "estimated_1rm": round(one_rm, 2),
                "max_weight": max_weight,
                "max_reps": max_reps
            })
    
    return {
        "exercise_id": exercise_id,
        "entries": entries,
        "one_rm_progression": one_rm_data
    }
