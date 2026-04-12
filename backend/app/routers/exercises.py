from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.database import get_db, Exercise
from app.services.exercise_service import ExerciseService

router = APIRouter()


def _shares_muscle_group(candidate: Exercise, target_groups: list[str]) -> bool:
    candidate_groups = candidate.muscle_groups or []
    return any(group in candidate_groups for group in target_groups)


@router.get("/muscle-groups/list")
async def list_muscle_groups():
    """List all available muscle groups."""
    return {
        "groups": [
            {"id": "chest", "name": "Chest", "subgroups": ["upper_chest", "lower_chest"]},
            {"id": "back", "name": "Back", "subgroups": ["lats", "traps", "rhomboids", "lower_back"]},
            {"id": "shoulders", "name": "Shoulders", "subgroups": ["front_delts", "side_delts", "rear_delts"]},
            {"id": "arms", "name": "Arms", "subgroups": ["biceps", "triceps", "forearms"]},
            {"id": "legs", "name": "Legs", "subgroups": ["quads", "hamstrings", "glutes", "calves"]},
            {"id": "core", "name": "Core", "subgroups": ["abs", "obliques", "lower_back"]},
        ]
    }


@router.get("/equipment/list")
async def list_equipment_types(db: Session = Depends(get_db)):
    """List all equipment types in the database."""
    from app.models.database import EquipmentType

    equipment = db.query(EquipmentType).all()
    return {
        "equipment": [
            {
                "id": eq.id,
                "name": eq.name,
                "display_name": eq.display_name,
                "category": eq.category,
            }
            for eq in equipment
        ]
    }

@router.get("/")
async def list_exercises(
    skip: int = 0,
    limit: int = 50,
    muscle_group: Optional[str] = None,
    equipment: Optional[str] = None,
    difficulty: Optional[str] = Query(None, enum=["beginner", "intermediate", "advanced"]),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List exercises with filtering."""
    service = ExerciseService(db)
    
    if search or muscle_group or equipment or difficulty:
        exercises = service.search_exercises(
            query=search,
            muscle_group=muscle_group,
            equipment=equipment,
            difficulty=difficulty
        )
    else:
        exercises = db.query(Exercise).offset(skip).limit(limit).all()
    
    return {
        "exercises": exercises,
        "total": len(exercises),
        "skip": skip,
        "limit": limit,
    }

@router.get("/{exercise_slug}/alternatives")
async def get_alternatives(
    exercise_slug: str,
    available_equipment: Optional[List[str]] = None,
    db: Session = Depends(get_db)
):
    """Get alternative exercises for the same muscle group."""
    service = ExerciseService(db)
    exercise = service.get_exercise_by_slug(exercise_slug)

    if not exercise:
        raise HTTPException(404, "Exercise not found")

    target_groups = exercise.muscle_groups or []
    candidates = db.query(Exercise).filter(Exercise.id != exercise.id).all()
    alternatives = [candidate for candidate in candidates if _shares_muscle_group(candidate, target_groups)]

    # Filter by available equipment if provided
    if available_equipment:
        alternatives = [
            alt for alt in alternatives
            if any(eq.name in available_equipment for eq in alt.equipment)
        ]

    return {
        "original": exercise,
        "alternatives": alternatives[:10],
    }

@router.get("/{exercise_slug}")
async def get_exercise(exercise_slug: str, db: Session = Depends(get_db)):
    """Get exercise details."""
    service = ExerciseService(db)
    exercise = service.get_exercise_by_slug(exercise_slug)

    if not exercise:
        raise HTTPException(404, "Exercise not found")

    return exercise
