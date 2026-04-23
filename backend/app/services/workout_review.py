from __future__ import annotations

import json
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional


REVIEW_DIR = Path(__file__).resolve().parents[2] / "reports" / "workout_reviews"

INJURY_KEYWORDS = {
    "shoulder": {"shoulder", "shoulders", "chest", "triceps"},
    "knee": {"knee", "knees", "quadriceps", "glutes"},
    "back": {"back", "hamstrings", "glutes"},
    "wrist": {"wrist", "wrists", "forearms", "shoulders"},
    "elbow": {"elbow", "elbows", "biceps", "triceps"},
}


def _slug(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return cleaned or "workout-review"


def _utc_now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _normalize_set(values: List[str] | None) -> set[str]:
    return {str(item or "").strip().lower().replace(" ", "_") for item in values or [] if str(item or "").strip()}


def _exercise_targets(exercise: Dict[str, Any]) -> set[str]:
    return {
        str(item or "").strip().lower()
        for item in exercise.get("target_muscles") or []
        if str(item or "").strip()
    }


def _injury_terms(user_preferences: Optional[Dict[str, Any]]) -> set[str]:
    if not isinstance(user_preferences, dict):
        return set()
    text = " ".join(
        [
            str(user_preferences.get("injuries") or ""),
            str(user_preferences.get("limitations") or ""),
        ]
    ).lower()
    return {keyword for keyword in INJURY_KEYWORDS if keyword in text}


def review_workout_plan(
    *,
    workout: Dict[str, Any],
    equipment: List[str],
    goal: str,
    difficulty: str,
    focus_areas: Optional[List[str]] = None,
    user_preferences: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    available_equipment = _normalize_set(equipment) | {"bodyweight"}
    normalized_focus = {str(item or "").strip().lower() for item in focus_areas or [] if str(item or "").strip()}
    injuries = _injury_terms(user_preferences)
    exercises = workout.get("exercises") or []

    equipment_mismatches: List[str] = []
    focus_hits = 0
    safety_flags: List[str] = []

    for exercise in exercises:
        if not isinstance(exercise, dict):
            continue
        equipment_hint = str(exercise.get("equipment") or "").strip().lower().replace(" ", "_")
        name = str(exercise.get("name") or "exercise")
        if equipment_hint and equipment_hint not in available_equipment:
            equipment_mismatches.append(f"{name} expects {equipment_hint}, which is outside the selected equipment.")

        targets = _exercise_targets(exercise)
        if normalized_focus and targets.intersection(normalized_focus):
            focus_hits += 1

        for injury in injuries:
            risky_targets = INJURY_KEYWORDS.get(injury) or set()
            if targets.intersection(risky_targets):
                safety_flags.append(f"{name} may aggravate {injury}-related limitations.")

    exercise_count = len([item for item in exercises if isinstance(item, dict)])
    focus_coverage = round(focus_hits / max(1, exercise_count), 3) if normalized_focus else None

    confidence = "high"
    generation_mode = str(workout.get("generation_mode") or "template")
    if generation_mode == "template":
        confidence = "medium"
    if equipment_mismatches or safety_flags:
        confidence = "low"

    recommendations: List[str] = []
    if equipment_mismatches:
        recommendations.append("Review the exercises that require equipment outside the scanned or selected set.")
    if safety_flags:
        recommendations.append("Adjust the plan around the user limitation notes before using it as-is.")
    if normalized_focus and (focus_coverage or 0.0) < 0.34:
        recommendations.append("Add more movements that directly hit the requested focus areas.")
    if not recommendations:
        recommendations.append("The plan aligns with the selected equipment and does not show obvious constraint conflicts.")

    review = {
        "review_id": f"review-{int(time.time() * 1000)}",
        "generated_at": _utc_now(),
        "goal": goal,
        "difficulty": difficulty,
        "generation_mode": generation_mode,
        "confidence": confidence,
        "equipment_match": {
            "selected": sorted(available_equipment),
            "mismatches": equipment_mismatches,
        },
        "focus_coverage": {
            "requested": sorted(normalized_focus),
            "score": focus_coverage,
        },
        "safety_flags": sorted(set(safety_flags)),
        "recommendations": recommendations,
    }

    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    review_path = REVIEW_DIR / f"{int(time.time())}-{_slug(str(workout.get('name') or goal))}.json"
    review_path.write_text(json.dumps(review, indent=2), encoding="utf-8")
    review["report_path"] = str(review_path)
    return review


def latest_reviews(limit: int = 10) -> List[Dict[str, Any]]:
    if not REVIEW_DIR.exists():
        return []
    rows: List[Dict[str, Any]] = []
    for path in sorted(REVIEW_DIR.glob("*.json"), key=lambda item: item.stat().st_mtime, reverse=True):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        if not isinstance(payload, dict):
            continue
        payload["report_path"] = str(path)
        rows.append(payload)
        if len(rows) >= limit:
            break
    return rows
