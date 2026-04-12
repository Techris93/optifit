from datetime import datetime
import re
from urllib.parse import quote_plus
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.models.database import EquipmentType, Exercise, Workout, get_db, workout_exercises
from app.services.workout_generator import WorkoutGenerator
from app.services.exercise_media_service import exercise_media_service

router = APIRouter()


class WorkoutGenerateRequest(BaseModel):
    equipment: List[str] = Field(min_length=1)
    focus_areas: Optional[List[str]] = None
    user_preferences: Optional[dict] = None


class WorkoutExerciseSave(BaseModel):
    exercise_id: Optional[int] = None
    slug: str
    sets: int = 3
    reps: str = "10-12"
    rest_seconds: int = 60
    equipment: Optional[str] = None
    notes: Optional[str] = None


class WorkoutSaveRequest(BaseModel):
    name: str
    description: str
    goal: str
    difficulty: str
    estimated_duration_minutes: int
    equipment_used: List[str]
    exercise_matches: List[WorkoutExerciseSave]


def _serialize_exercise(exercise: Exercise) -> dict:
    """Serialize exercise with media enrichment."""
    base_data = {
        "id": exercise.id,
        "name": exercise.name,
        "slug": exercise.slug,
        "description": exercise.description,
        "instructions": exercise.instructions,
        "tips": exercise.tips,
        "muscle_groups": exercise.muscle_groups or [],
        "difficulty": exercise.difficulty,
        "exercise_type": exercise.exercise_type,
        "image_url": exercise.image_url,
        "video_url": exercise.video_url,
        "gif_url": exercise.gif_url,
        "demo_search_url": f"https://www.youtube.com/results?search_query={quote_plus(f'{exercise.name} exercise demo')}",
        "equipment": [
            {
                "id": item.id,
                "name": item.name,
                "display_name": item.display_name,
                "category": item.category,
            }
            for item in exercise.equipment
        ],
    }

    # Enrich with media service data
    media_data = exercise_media_service.get_exercise_media(exercise.slug)
    if media_data:
        # Use media service data if exercise doesn't have media
        if not base_data["video_url"] and media_data.get("video_url"):
            base_data["video_url"] = media_data["video_url"]
        if not base_data["gif_url"] and media_data.get("gif_url"):
            base_data["gif_url"] = media_data["gif_url"]
        if not base_data["image_url"] and media_data.get("image_url"):
            base_data["image_url"] = media_data["image_url"]

    return base_data


EXERCISE_ALIASES = {
    "band_rows": "resistance_band_rows",
    "band_presses": "push_ups",
    "dumbbell_squats": "goblet_squats",
    "dumbbell_lunges": "bodyweight_lunges",
    "lunges": "bodyweight_lunges",
    "barbell_row": "barbell_rows",
    "kettlebell_row": "kettlebell_rows",
}

TEMPLATE_MEDIA_FALLBACKS = {
    "barbell_bench_press": "https://youtube.com/watch?v=Zw6qCAFsV0w",
    "barbell_rows": "https://www.youtube.com/watch?v=vT2GjY_Umpw",
    "barbell_deadlifts": "https://www.youtube.com/watch?v=op9kVnSso6Q",
    "barbell_squats": "https://www.youtube.com/watch?v=rM6SDUdl9fs",
    "barbell_overhead_press": "https://www.youtube.com/watch?v=2yjwXTZQDDI",
    "dumbbell_bench_press": "https://youtube.com/watch?v=WLTU1j7Ur8M",
    "dumbbell_rows": "https://www.youtube.com/watch?v=ufhQhwyrx-4",
    "dumbbell_shoulder_press": "https://youtube.com/watch?v=qEwKCR5JCog",
    "dumbbell_squats": "https://www.youtube.com/watch?v=BR4tlEE_A98",
    "dumbbell_lunges": "https://www.youtube.com/watch?v=RqimDHU-tkg",
    "dumbbell_romanian_deadlifts": "https://www.youtube.com/watch?v=7j-2w4-P14I",
    "kettlebell_swings": "https://www.youtube.com/watch?v=X12k2AiJuwE",
    "kettlebell_rows": "https://www.youtube.com/watch?v=ufhQhwyrx-4",
    "goblet_squats": "https://www.youtube.com/watch?v=BR4tlEE_A98",
    "kettlebell_turkish_get_ups": "https://www.youtube.com/watch?v=3l6B7J1MJMY",
    "pull_ups": "https://www.youtube.com/watch?v=8O68v_iIi40",
    "chin_ups": "https://www.youtube.com/watch?v=brhRXlOhsAM",
    "hanging_leg_raises": "https://www.youtube.com/watch?v=Pr1ieGZ5atk",
    "hanging_knee_raises": "https://www.youtube.com/watch?v=JB2oyawG9KO",
    "push_ups": "https://youtube.com/watch?v=W1LCL-Sw0yU",
    "glute_bridges": "https://www.youtube.com/watch?v=wPM8icPu6H8",
    "plank": "https://www.youtube.com/watch?v=7A-uDuGAqts",
    "resistance_band_rows": "https://youtube.com/watch?v=rRT14E9y380",
    "band_pull_aparts": "https://www.youtube.com/watch?v=JObYtU7Y7ag",
    "band_rows": "https://youtube.com/watch?v=rRT14E9y380",
    "band_face_pulls": "https://www.youtube.com/watch?v=0Po47vvj9g4",
    "band_presses": "https://youtube.com/watch?v=W1LCL-Sw0yU",
    "band_squats": "https://www.youtube.com/watch?v=54q20D3bS8E",
    "mountain_climbers": "https://www.youtube.com/watch?v=nmwgirgXLYM",
    "bodyweight_squats": "https://www.youtube.com/watch?v=YaXPRqUwItQ",
    "bodyweight_lunges": "https://www.youtube.com/watch?v=RqimDHU-tkg",
    "lunges": "https://www.youtube.com/watch?v=RqimDHU-tkg",
    "burpees": "https://www.youtube.com/watch?v=auBLPXO8Fww",
    "inverted_rows": "https://www.youtube.com/watch?v=Kq5z7H0d5F0",
    "bird_dogs": "https://www.youtube.com/watch?v=wiFNA3sqjCA",
}


def _equipment_names_for_exercise(exercise: Exercise) -> set[str]:
    return {item.name for item in exercise.equipment}


def _normalize_slug(text: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")
    normalized = re.sub(r"_+", "_", normalized)
    return normalized


def _candidate_slugs(name: str) -> list[str]:
    slug = _normalize_slug(name)
    candidates = [slug]
    alias = EXERCISE_ALIASES.get(slug)
    if alias and alias not in candidates:
        candidates.append(alias)
    if slug.endswith("s"):
        singular = slug[:-1]
        alias = EXERCISE_ALIASES.get(singular, singular)
        if alias not in candidates:
            candidates.append(alias)
    else:
        plural = f"{slug}s"
        alias = EXERCISE_ALIASES.get(plural, plural)
        if alias not in candidates:
            candidates.append(alias)
    return candidates


def _exercise_is_compatible(exercise: Exercise, available_equipment: set[str]) -> bool:
    required_equipment = _equipment_names_for_exercise(exercise)
    if not required_equipment:
        return True
    if required_equipment.issubset(available_equipment):
        return True

    # Seed data mixes strict requirements and workable alternatives.
    # Allow a match when at least one required equipment overlaps what the user has.
    if required_equipment.intersection(available_equipment):
        return True

    # Many floor bodyweight movements are tagged with yoga_mat in the catalog.
    if "yoga_mat" in required_equipment and "bodyweight" in available_equipment:
        return True

    return False


def _find_best_exercise_match(db: Session, name: str, available_equipment: set[str]) -> Exercise | None:
    candidate_slugs = _candidate_slugs(name)

    candidates: list[Exercise] = []
    for candidate_slug in candidate_slugs:
        exact = db.query(Exercise).filter(Exercise.slug == candidate_slug).first()
        if exact:
            candidates.append(exact)

    if not candidates:
        name_match = db.query(Exercise).filter(Exercise.name.ilike(name)).first()
        if name_match:
            candidates.append(name_match)

    for candidate in candidates:
        if _exercise_is_compatible(candidate, available_equipment):
            return candidate

    return candidates[0] if candidates else None


def _ensure_equipment_type(db: Session, equipment_name: str | None) -> EquipmentType | None:
    if not equipment_name:
        return None
    normalized_name = _normalize_slug(equipment_name)
    if not normalized_name:
        return None
    equipment = db.query(EquipmentType).filter(EquipmentType.name == normalized_name).first()
    if equipment:
        return equipment
    equipment = EquipmentType(
        name=normalized_name,
        display_name=normalized_name.replace("_", " ").title(),
        category="custom",
        description="Auto-created from template exercise metadata.",
    )
    db.add(equipment)
    db.flush()
    return equipment


def _get_or_create_canonical_exercise(
    db: Session,
    name: str,
    difficulty: str,
    equipment_hint: str | None,
) -> Exercise:
    slug = EXERCISE_ALIASES.get(_normalize_slug(name), _normalize_slug(name))
    existing = db.query(Exercise).filter(Exercise.slug == slug).first()
    if existing:
        return existing

    # Get media from exercise media service
    media_data = exercise_media_service.get_exercise_media(slug)
    fallback_video = media_data.get("video_url") or TEMPLATE_MEDIA_FALLBACKS.get(slug)

    # Build a meaningful description from muscle groups or use empty string
    muscle_groups = media_data.get("muscle_groups", [])
    if muscle_groups:
        description = f"Targets: {', '.join(muscle_groups)}."
    else:
        description = None

    exercise = Exercise(
        name=name,
        slug=slug,
        description=description,
        instructions=None,
        tips=None,
        muscle_groups=muscle_groups,
        primary_muscles=[],
        secondary_muscles=[],
        difficulty=difficulty,
        exercise_type="compound",
        image_url=media_data.get("image_url"),
        video_url=fallback_video,
        gif_url=media_data.get("gif_url"),
        source="optifit_auto_backfill",
        license="internal",
    )
    equipment_type = _ensure_equipment_type(db, equipment_hint)
    if equipment_type:
        exercise.equipment = [equipment_type]
    db.add(exercise)
    db.flush()
    return exercise


@router.post("/generate")
async def generate_workout(
    payload: WorkoutGenerateRequest,
    goal: str = Query("strength", enum=["strength", "hypertrophy", "endurance", "fat_loss"]),
    difficulty: str = Query("beginner", enum=["beginner", "intermediate", "advanced"]),
    duration: int = Query(45, ge=15, le=120),
    db: Session = Depends(get_db)
):
    """Generate a workout based on detected equipment using AI (Gemini preferred)."""

    generator = WorkoutGenerator()

    workout_data = await generator.generate_workout(
        equipment=payload.equipment,
        goal=goal,
        difficulty=difficulty,
        duration_minutes=duration,
        focus_areas=payload.focus_areas,
        user_preferences=payload.user_preferences,
    )

    available_equipment = {_normalize_slug(item) for item in payload.equipment} | {"bodyweight"}
    exercise_matches = []
    normalized_exercises = []

    for ex in workout_data.get("exercises", []):
        name = ex["name"].strip()
        equipment_hint = _normalize_slug(ex.get("equipment") or "")
        match = _find_best_exercise_match(db, name, available_equipment)

        if match and not _exercise_is_compatible(match, available_equipment):
            match = None

        if not match:
            # Auto-backfill canonical exercises so future plans match the DB directly.
            match = _get_or_create_canonical_exercise(
                db=db,
                name=name,
                difficulty=difficulty,
                equipment_hint=equipment_hint,
            )

        # Enrich with media data
        enriched_exercise = _serialize_exercise(match)

        exercise_matches.append({
            "exercise_id": match.id,
            "slug": match.slug,
            "sets": ex.get("sets", 3),
            "reps": ex.get("reps", "10-12"),
            "rest_seconds": ex.get("rest_seconds", 60),
            "equipment": ex.get("equipment", ""),
            "notes": ex.get("notes", ""),
            "target_muscles": ex.get("target_muscles", []),
            "alternative": ex.get("alternative", ""),
            "exercise": enriched_exercise,
        })
        normalized_exercises.append({
            **ex,
            "name": match.name,
            "slug": match.slug,
            "exercise_id": match.id,
        })

    db.commit()
    workout_data["exercises"] = normalized_exercises

    return {
        "workout": workout_data,
        "exercise_matches": exercise_matches,
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "equipment_used": payload.equipment,
        "ai_provider": workout_data.get("ai_provider", "template"),
        "generation_mode": workout_data.get("generation_mode", "template"),
    }


@router.post("/save-generated")
async def save_generated_workout(payload: WorkoutSaveRequest, db: Session = Depends(get_db)):
    """Persist a generated workout and any matched exercise metadata."""

    workout = Workout(
        name=payload.name,
        description=payload.description,
        goal=payload.goal,
        difficulty=payload.difficulty,
        estimated_duration_minutes=payload.estimated_duration_minutes,
        equipment_used=payload.equipment_used,
        is_template=False,
    )
    db.add(workout)
    db.commit()
    db.refresh(workout)

    for order, match in enumerate(payload.exercise_matches):
        exercise = None
        if match.exercise_id:
            exercise = db.query(Exercise).filter(Exercise.id == match.exercise_id).first()
        if exercise is None:
            exercise = db.query(Exercise).filter(Exercise.slug == match.slug).first()
        if exercise is None:
            continue

        db.execute(
            workout_exercises.insert().values(
                workout_id=workout.id,
                exercise_id=exercise.id,
                sets=match.sets,
                reps=match.reps,
                rest_seconds=match.rest_seconds,
                order=order,
            )
        )

    db.commit()

    return {
        "id": workout.id,
        "name": workout.name,
        "description": workout.description,
        "goal": workout.goal,
        "difficulty": workout.difficulty,
        "estimated_duration_minutes": workout.estimated_duration_minutes,
        "equipment_used": workout.equipment_used,
        "saved_exercise_count": len(payload.exercise_matches),
        "created_at": workout.created_at,
    }


@router.get("/")
async def get_workouts(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """List saved workouts."""
    workouts = db.query(Workout).offset(skip).limit(limit).all()
    return workouts


@router.get("/{workout_id}")
async def get_workout(workout_id: int, db: Session = Depends(get_db)):
    """Get a specific workout with enriched exercise data."""
    workout = db.query(Workout).filter(Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(404, "Workout not found")

    # Enrich exercises with media
    enriched_exercises = []
    for exercise in workout.exercises:
        enriched = _serialize_exercise(exercise)
        enriched_exercises.append(enriched)

    return {
        "id": workout.id,
        "name": workout.name,
        "description": workout.description,
        "goal": workout.goal,
        "difficulty": workout.difficulty,
        "estimated_duration_minutes": workout.estimated_duration_minutes,
        "equipment_used": workout.equipment_used,
        "exercises": enriched_exercises,
        "created_at": workout.created_at,
    }


@router.post("/{workout_id}/save")
async def save_workout(workout_id: int, db: Session = Depends(get_db)):
    """Save a generated workout to user's profile."""
    workout = db.query(Workout).filter(Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(404, "Workout not found")
    return {"message": "Workout is already stored", "workout_id": workout.id}


@router.get("/templates/community")
async def get_community_templates(
    equipment: Optional[List[str]] = None,
    goal: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get community-created workout templates."""
    query = db.query(Workout).filter(Workout.is_template == True)

    if goal:
        query = query.filter(Workout.goal == goal)

    if equipment:
        query = query.filter(Workout.equipment_used.is_not(None))

    templates = query.limit(20).all()
    return templates


@router.get("/exercises/{exercise_slug}/media")
async def get_exercise_media(
    exercise_slug: str,
    db: Session = Depends(get_db)
):
    """Get media URLs and metadata for a specific exercise."""
    exercise = db.query(Exercise).filter(Exercise.slug == exercise_slug).first()

    if not exercise:
        # Try to get from media service
        media = exercise_media_service.get_exercise_media(exercise_slug)
        if media:
            return {
                "slug": exercise_slug,
                **media,
                "source": "media_service"
            }
        raise HTTPException(404, "Exercise not found")

    return _serialize_exercise(exercise)


@router.get("/exercises/search")
async def search_exercises(
    query: str,
    muscle_group: Optional[str] = None,
    difficulty: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Search exercises with media enrichment."""
    db_query = db.query(Exercise)

    if query:
        db_query = db_query.filter(
            (Exercise.name.ilike(f"%{query}%")) |
            (Exercise.slug.ilike(f"%{query}%"))
        )

    if muscle_group:
        db_query = db_query.filter(Exercise.muscle_groups.contains([muscle_group]))

    if difficulty:
        db_query = db_query.filter(Exercise.difficulty == difficulty)

    exercises = db_query.limit(20).all()

    return [_serialize_exercise(ex) for ex in exercises]
