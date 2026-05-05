from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict, List, Optional


def _number(value: Any, default: float) -> float:
    try:
        if value in {None, ""}:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _text(value: Any, default: str = "") -> str:
    return str(value or default).strip().lower()


def _int_sets(value: Any, default: int = 3) -> int:
    try:
        return max(1, int(value))
    except (TypeError, ValueError):
        return default


def _readiness_inputs(user_preferences: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    prefs = user_preferences if isinstance(user_preferences, dict) else {}
    return {
        "sleep_hours": _number(prefs.get("sleep_hours"), 7.0),
        "soreness": _number(prefs.get("soreness"), 3.0),
        "mood": _number(prefs.get("mood"), 3.0),
        "hrv_trend": _text(prefs.get("hrv_trend"), "flat"),
        "recent_load": _text(prefs.get("recent_load"), "moderate"),
        "missed_sessions": _number(prefs.get("missed_sessions"), 0.0),
        "preferred_training_time": _text(prefs.get("preferred_training_time"), "flexible"),
        "nutrition": _text(prefs.get("nutrition"), "unknown"),
    }


def _readiness_score(inputs: Dict[str, Any], difficulty: str) -> int:
    score = 70.0
    sleep = float(inputs["sleep_hours"])
    soreness = float(inputs["soreness"])
    mood = float(inputs["mood"])

    if sleep < 5:
        score -= 24
    elif sleep < 6.5:
        score -= 12
    elif sleep >= 8:
        score += 6

    score -= max(0.0, soreness - 3.0) * 7
    score += max(-8.0, min(8.0, (mood - 3.0) * 4))

    hrv_trend = str(inputs["hrv_trend"])
    if hrv_trend in {"down", "low", "dropping"}:
        score -= 14
    elif hrv_trend in {"up", "high", "improving"}:
        score += 7

    recent_load = str(inputs["recent_load"])
    if recent_load == "high":
        score -= 10
    elif recent_load == "low":
        score += 5

    missed = float(inputs["missed_sessions"])
    if missed >= 3:
        score -= 8
    elif missed == 1 and score >= 65:
        score += 2

    if difficulty == "advanced":
        score -= 5

    return max(5, min(100, round(score)))


def _multipliers(readiness: int) -> tuple[float, float, str]:
    if readiness < 45:
        return 0.55, 1.3, "regenerate"
    if readiness < 65:
        return 0.75, 1.15, "restore"
    if readiness < 82:
        return 0.92, 1.0, "build"
    return 1.05, 0.95, "push"


def _priority_limiter(focus_areas: Optional[List[str]], inputs: Dict[str, Any]) -> str:
    if float(inputs["soreness"]) >= 7:
        return "tissue recovery"
    if float(inputs["sleep_hours"]) < 6.5:
        return "sleep debt"
    if str(inputs["nutrition"]) in {"low", "missed", "poor"}:
        return "fuel availability"
    if focus_areas:
        return str(focus_areas[0]).replace("_", " ")
    return "movement quality"


def build_adaptive_recovery_engine(
    *,
    workout: Dict[str, Any],
    goal: str,
    difficulty: str,
    duration_minutes: int,
    focus_areas: Optional[List[str]] = None,
    user_preferences: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    inputs = _readiness_inputs(user_preferences)
    readiness = _readiness_score(inputs, difficulty)
    volume_multiplier, rest_multiplier, action_state = _multipliers(readiness)
    priority_limiter = _priority_limiter(focus_areas, inputs)
    missed = float(inputs["missed_sessions"])

    if readiness < 45:
        hormone_dose = "minimum effective stress"
        recovery_protocol = "Swap max-effort work for technique, mobility, and easy zone-2 conditioning."
    elif readiness < 65:
        hormone_dose = "moderate stress with extended recovery"
        recovery_protocol = "Keep the pattern, reduce set volume, and add longer rest between hard efforts."
    elif missed >= 2:
        hormone_dose = "controlled re-entry stress"
        recovery_protocol = "Resume with a ramp session; do not make up every missed set today."
    else:
        hormone_dose = "productive training stress"
        recovery_protocol = "Progress normally while keeping one rep or interval in reserve."

    preferred_time = str(inputs["preferred_training_time"])
    timing_window = {
        "morning": "Train after a longer warm-up and keep explosive work after temperature rises.",
        "afternoon": "Use the main strength block here; coordination and temperature are usually favorable.",
        "evening": "Keep the cool-down longer so sleep is protected after training.",
    }.get(preferred_time, "Train in the window where energy and schedule adherence are highest.")

    energy_budget = {
        "warmup": 20 if readiness < 65 else 15,
        "main_work": 45 if readiness < 45 else 55 if readiness < 65 else 68,
        "recovery": 35 if readiness < 45 else 30 if readiness < 65 else 17,
    }

    return {
        "readiness_score": readiness,
        "action_state": action_state,
        "volume_multiplier": volume_multiplier,
        "rest_multiplier": rest_multiplier,
        "adjusted_duration_minutes": max(15, round(duration_minutes * (0.75 if readiness < 45 else 0.9 if readiness < 65 else 1.0))),
        "range_control": {
            "status": "protect" if readiness < 65 else "stable",
            "target": "Keep effort inside a recoverable range before chasing more load.",
        },
        "training_dose": {
            "dose": hormone_dose,
            "target": "Apply enough stress to adapt without overwhelming recovery.",
        },
        "timing_guidance": {
            "preferred_training_time": preferred_time,
            "timing_note": timing_window,
        },
        "recovery_rebound": {
            "status": "wait_for_rebound" if readiness < 65 else "train_on_rebound",
            "note": recovery_protocol,
        },
        "energy_budgeting": energy_budget,
        "priority_limiter": priority_limiter,
        "recovery_protocol": recovery_protocol,
        "safeguards": [
            "Stop a set when form speed or joint comfort drops sharply.",
            "Keep two easier options available for the first compound movement.",
            "Log soreness, sleep, and perceived difficulty after the session.",
        ],
        "micro_assessments": [
            "How did the first warm-up set feel from 1 to 5?",
            "Can breathing return to normal within two minutes?",
            "Is soreness changing movement quality or confidence?",
        ],
        "coaching_tone": "gentle and recovery-first" if readiness < 65 else "confident and progressive",
        "adaptation_signals": [
            {
                "model": "Recovery risk detection",
                "application": "Detect overtraining, injury risk, and poor recovery before loading the session.",
            },
            {
                "model": "Progression evidence",
                "application": "Use repeated successful sessions as confidence signals for future progressions.",
            },
            {
                "model": "Readiness integration",
                "application": "Connect sleep, soreness, mood, nutrition, and recent load into one readiness view.",
            },
            {
                "model": "Cohort scaling",
                "application": "Keep group or cohort work aligned by scaling intensity from simple local readiness rules.",
            },
            {
                "model": "Plateau variation",
                "application": "Break plateaus by changing stress when adaptation stalls.",
            },
            {
                "model": "Safety guardrails",
                "application": "Use recovery-first safeguards as the outer barrier for training decisions.",
            },
            {
                "model": "Training-window timing",
                "application": "Match training and recovery nudges to the user's preferred training window.",
            },
            {
                "model": "Priority limiter",
                "application": f"Address the main limiter first: {priority_limiter}.",
            },
            {
                "model": "Readiness checks",
                "application": "Ask short readiness checks before committing to the main workload.",
            },
            {
                "model": "Coaching tone adaptation",
                "application": "Adapt coaching tone to the user's recovery and motivation state.",
            },
        ],
    }


def apply_recovery_engine(
    *,
    workout: Dict[str, Any],
    goal: str,
    difficulty: str,
    duration_minutes: int,
    focus_areas: Optional[List[str]] = None,
    user_preferences: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    adjusted = deepcopy(workout)
    engine = build_adaptive_recovery_engine(
        workout=adjusted,
        goal=goal,
        difficulty=difficulty,
        duration_minutes=duration_minutes,
        focus_areas=focus_areas,
        user_preferences=user_preferences,
    )

    volume_multiplier = float(engine["volume_multiplier"])
    rest_multiplier = float(engine["rest_multiplier"])
    if engine["action_state"] in {"regenerate", "restore"}:
        for exercise in adjusted.get("exercises") or []:
            if not isinstance(exercise, dict):
                continue
            original_sets = _int_sets(exercise.get("sets"))
            exercise["sets"] = max(1, round(original_sets * volume_multiplier))
            exercise["rest_seconds"] = max(30, round(_number(exercise.get("rest_seconds"), 60) * rest_multiplier))
            note = str(exercise.get("notes") or "").strip()
            recovery_note = f"Recovery adjusted for {engine['action_state']} readiness."
            exercise["notes"] = f"{note} {recovery_note}".strip()

    adjusted["estimated_duration_minutes"] = engine["adjusted_duration_minutes"]
    adjusted["adaptive_recovery"] = engine
    tips = [str(item) for item in adjusted.get("training_tips") or []]
    tips.extend(
        [
            engine["recovery_protocol"],
            f"Energy budget: {engine['energy_budgeting']['main_work']}% main work, {engine['energy_budgeting']['recovery']}% recovery.",
        ]
    )
    adjusted["training_tips"] = list(dict.fromkeys(tips))
    return {"workout": adjusted, "adaptive_recovery": engine}
