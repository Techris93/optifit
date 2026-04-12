import json
import os
from collections import defaultdict
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings


class WorkoutGenerator:
    """Generate workouts with multiple AI providers and template fallback."""

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama3.1:8b"):
        self.base_url = base_url
        self.model = model
        self.enable_ollama = os.getenv("ENABLE_OLLAMA", "false").lower() == "true"
        self.enable_gemini = os.getenv("ENABLE_GEMINI_WORKOUT", "true").lower() == "true"
        self.client = httpx.AsyncClient(timeout=60.0)

    async def generate_workout(
        self,
        equipment: List[str],
        goal: str = "strength",
        difficulty: str = "beginner",
        duration_minutes: int = 45,
        focus_areas: Optional[List[str]] = None,
        user_preferences: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Generate a workout plan based on available equipment using best available provider."""

        normalized_equipment = sorted(set(equipment))

        # Try Gemini first if enabled and configured
        if self.enable_gemini and settings.gemini_api_key:
            try:
                from app.services.gemini_workout_service import gemini_workout_service
                return await gemini_workout_service.generate_workout(
                    equipment=normalized_equipment,
                    goal=goal,
                    difficulty=difficulty,
                    duration_minutes=duration_minutes,
                    focus_areas=focus_areas,
                    user_preferences=user_preferences,
                )
            except Exception as e:
                print(f"Gemini workout generation failed, falling back: {e}")
                # Fall through to next option

        # Try Ollama if enabled
        if self.enable_ollama:
            try:
                return await self._generate_with_ollama(
                    normalized_equipment, goal, difficulty, duration_minutes, focus_areas
                )
            except Exception as e:
                print(f"Ollama workout generation failed, using template fallback: {e}")
                # Fall through to template

        # Template fallback (always works)
        return self._fallback_workout(normalized_equipment, goal, difficulty, duration_minutes, focus_areas)

    async def _generate_with_ollama(
        self,
        equipment: List[str],
        goal: str,
        difficulty: str,
        duration: int,
        focus_areas: Optional[List[str]],
    ) -> Dict[str, Any]:
        """Generate workout using local Ollama instance."""
        prompt = self._build_prompt(equipment, goal, difficulty, duration, focus_areas)

        response = await self.client.post(
            f"{self.base_url}/api/generate",
            json={
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "format": "json",
            },
        )
        response.raise_for_status()

        result = response.json()
        workout_json = json.loads(result["response"])
        workout_json["generation_mode"] = "ollama"
        return workout_json

    def _build_prompt(
        self,
        equipment: List[str],
        goal: str,
        difficulty: str,
        duration: int,
        focus_areas: Optional[List[str]],
    ) -> str:
        focus_str = f"Focus on: {', '.join(focus_areas)}." if focus_areas else ""

        return f"""You are a certified personal trainer. Create a workout plan in JSON format.

Available equipment: {', '.join(equipment)}
Goal: {goal}
Difficulty: {difficulty}
Duration: approximately {duration} minutes
{focus_str}

Create a balanced workout with warm-up, main exercises, and cool-down.
For each exercise, specify: name, sets, reps, rest seconds, and which equipment to use.

Respond ONLY with valid JSON in this exact format:
{{
    "name": "Workout Name",
    "description": "Brief description of the workout",
    "estimated_duration_minutes": {duration},
    "difficulty": "{difficulty}",
    "warmup": [
        {{"name": "Exercise", "duration_seconds": 60, "description": "..."}}
    ],
    "exercises": [
        {{
            "name": "Exercise Name",
            "sets": 3,
            "reps": "10-12",
            "rest_seconds": 60,
            "equipment": "equipment_name",
            "notes": "Form cues or tips",
            "target_muscles": ["muscle1", "muscle2"]
        }}
    ],
    "cooldown": [
        {{"name": "Stretch", "duration_seconds": 30, "description": "..."}}
    ],
    "training_tips": ["tip1", "tip2"]
}}

Ensure exercises match the available equipment. If equipment is limited, include bodyweight variations."""

    def _exercise_library(self) -> Dict[str, List[Dict[str, Any]]]:
        return {
            "dumbbell": [
                {"name": "Dumbbell Bench Press", "category": "push", "sets": 4, "reps": "8-12", "rest_seconds": 90, "notes": "Drive evenly through both arms.", "target_muscles": ["chest", "shoulders", "triceps"]},
                {"name": "Dumbbell Rows", "category": "pull", "sets": 4, "reps": "10-12 each", "rest_seconds": 75, "notes": "Pull toward the hip and stay square.", "target_muscles": ["back", "biceps"]},
                {"name": "Dumbbell Shoulder Press", "category": "push", "sets": 3, "reps": "8-10", "rest_seconds": 75, "notes": "Brace hard before pressing overhead.", "target_muscles": ["shoulders", "triceps"]},
                {"name": "Dumbbell Squats", "category": "legs", "sets": 4, "reps": "10-15", "rest_seconds": 75, "notes": "Stay upright and control the bottom.", "target_muscles": ["quadriceps", "glutes"]},
                {"name": "Dumbbell Lunges", "category": "legs", "sets": 3, "reps": "10 each", "rest_seconds": 60, "notes": "Take a long enough step to keep your heel down.", "target_muscles": ["quadriceps", "glutes", "hamstrings"]},
                {"name": "Dumbbell Romanian Deadlifts", "category": "hinge", "sets": 4, "reps": "10-12", "rest_seconds": 75, "notes": "Feel the stretch in hamstrings, keep back flat.", "target_muscles": ["hamstrings", "glutes", "back"]},
            ],
            "barbell": [
                {"name": "Barbell Bench Press", "category": "push", "sets": 5, "reps": "5-8", "rest_seconds": 120, "notes": "Control the descent and use leg drive.", "target_muscles": ["chest", "shoulders", "triceps"]},
                {"name": "Barbell Rows", "category": "pull", "sets": 4, "reps": "6-10", "rest_seconds": 90, "notes": "Keep the bar close to your body.", "target_muscles": ["back", "biceps"]},
                {"name": "Barbell Deadlifts", "category": "hinge", "sets": 4, "reps": "4-6", "rest_seconds": 150, "notes": "Brace before each rep and push the floor away.", "target_muscles": ["back", "hamstrings", "glutes"]},
                {"name": "Barbell Squats", "category": "legs", "sets": 5, "reps": "5-8", "rest_seconds": 120, "notes": "Stay tight through the whole rep.", "target_muscles": ["quadriceps", "glutes", "core"]},
                {"name": "Barbell Overhead Press", "category": "push", "sets": 4, "reps": "6-8", "rest_seconds": 90, "notes": "Keep core tight, press in a straight line.", "target_muscles": ["shoulders", "triceps", "core"]},
            ],
            "kettlebell": [
                {"name": "Kettlebell Swings", "category": "hinge", "sets": 4, "reps": "15-20", "rest_seconds": 60, "notes": "Explode from the hips, not the shoulders.", "target_muscles": ["glutes", "hamstrings", "core"]},
                {"name": "Goblet Squats", "category": "legs", "sets": 4, "reps": "10-15", "rest_seconds": 60, "notes": "Use the load to stay tall.", "target_muscles": ["quadriceps", "glutes"]},
                {"name": "Kettlebell Rows", "category": "pull", "sets": 3, "reps": "10-12 each", "rest_seconds": 60, "notes": "Pause at the top of each rep.", "target_muscles": ["back", "biceps"]},
                {"name": "Kettlebell Turkish Get-ups", "category": "full_body", "sets": 3, "reps": "3-5 each", "rest_seconds": 90, "notes": "Move slowly and with control throughout.", "target_muscles": ["full body", "shoulders", "core"]},
            ],
            "resistance_band": [
                {"name": "Band Pull-Aparts", "category": "pull", "sets": 3, "reps": "15-20", "rest_seconds": 45, "notes": "Move from the upper back, not the neck.", "target_muscles": ["rear deltoids", "upper back"]},
                {"name": "Band Rows", "category": "pull", "sets": 4, "reps": "12-15", "rest_seconds": 45, "notes": "Lead with the elbows.", "target_muscles": ["back", "biceps"]},
                {"name": "Band Face Pulls", "category": "pull", "sets": 3, "reps": "15-20", "rest_seconds": 45, "notes": "Pull toward eye level.", "target_muscles": ["rear deltoids", "rotator cuff"]},
                {"name": "Band Presses", "category": "push", "sets": 3, "reps": "12-15", "rest_seconds": 45, "notes": "Keep tension throughout the movement.", "target_muscles": ["chest", "shoulders", "triceps"]},
                {"name": "Band Squats", "category": "legs", "sets": 3, "reps": "15-20", "rest_seconds": 45, "notes": "Stand on band, hold at shoulders.", "target_muscles": ["quadriceps", "glutes"]},
            ],
            "pull_up_bar": [
                {"name": "Pull-ups", "category": "pull", "sets": 4, "reps": "5-10", "rest_seconds": 90, "notes": "Start from a dead hang when possible.", "target_muscles": ["back", "biceps"]},
                {"name": "Chin-ups", "category": "pull", "sets": 3, "reps": "5-10", "rest_seconds": 90, "notes": "Palms facing you targets biceps more.", "target_muscles": ["back", "biceps"]},
                {"name": "Hanging Leg Raises", "category": "core", "sets": 3, "reps": "10-15", "rest_seconds": 60, "notes": "Avoid swinging between reps.", "target_muscles": ["abs", "hip flexors"]},
                {"name": "Hanging Knee Raises", "category": "core", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Bring knees to chest with control.", "target_muscles": ["abs"]},
            ],
            "yoga_mat": [
                {"name": "Push-ups", "category": "push", "sets": 4, "reps": "10-20", "rest_seconds": 60, "notes": "Keep a straight line from head to heel.", "target_muscles": ["chest", "shoulders", "triceps"]},
                {"name": "Glute Bridges", "category": "hinge", "sets": 3, "reps": "15-20", "rest_seconds": 30, "notes": "Pause briefly at the top.", "target_muscles": ["glutes", "hamstrings"]},
                {"name": "Plank", "category": "core", "sets": 3, "reps": "30-60 sec", "rest_seconds": 30, "notes": "Brace your abs and glutes.", "target_muscles": ["core", "shoulders"]},
                {"name": "Mountain Climbers", "category": "conditioning", "sets": 3, "reps": "20-30", "rest_seconds": 45, "notes": "Move quickly without bouncing the hips.", "target_muscles": ["core", "shoulders", "legs"]},
                {"name": "Bird Dogs", "category": "core", "sets": 3, "reps": "10 each", "rest_seconds": 30, "notes": "Extend opposite arm and leg, hold briefly.", "target_muscles": ["core", "back"]},
            ],
            "bodyweight": [
                {"name": "Bodyweight Squats", "category": "legs", "sets": 3, "reps": "15-20", "rest_seconds": 45, "notes": "Keep your whole foot planted.", "target_muscles": ["quadriceps", "glutes"]},
                {"name": "Push-ups", "category": "push", "sets": 3, "reps": "10-20", "rest_seconds": 60, "notes": "Lower with control.", "target_muscles": ["chest", "shoulders", "triceps"]},
                {"name": "Lunges", "category": "legs", "sets": 3, "reps": "12 each", "rest_seconds": 45, "notes": "Keep your torso tall.", "target_muscles": ["quadriceps", "glutes", "hamstrings"]},
                {"name": "Plank", "category": "core", "sets": 3, "reps": "30-60 sec", "rest_seconds": 30, "notes": "Exhale slightly to stay braced.", "target_muscles": ["core"]},
                {"name": "Mountain Climbers", "category": "conditioning", "sets": 3, "reps": "20-30", "rest_seconds": 45, "notes": "Move quickly without bouncing the hips.", "target_muscles": ["core", "legs", "shoulders"]},
                {"name": "Burpees", "category": "conditioning", "sets": 3, "reps": "8-12", "rest_seconds": 60, "notes": "Full explosive movement, modify if needed.", "target_muscles": ["full body"]},
                {"name": "Inverted Rows", "category": "pull", "sets": 3, "reps": "8-12", "rest_seconds": 60, "notes": "Use a table or low bar if available.", "target_muscles": ["back", "biceps"]},
            ],
        }

    def _fallback_workout(
        self,
        equipment: List[str],
        goal: str,
        difficulty: str,
        duration: int,
        focus_areas: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Template-based workout optimized for lightweight web deployment."""

        library = self._exercise_library()
        focus_areas = focus_areas or []
        selected_by_category: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

        for item in equipment:
            for exercise in library.get(item, []):
                selected_by_category[exercise["category"]].append({**exercise, "equipment": item})

        for exercise in library["bodyweight"]:
            selected_by_category[exercise["category"]].append({**exercise, "equipment": "bodyweight"})

        category_order = self._goal_split(goal, focus_areas)
        chosen: List[Dict[str, Any]] = []

        for category in category_order:
            pool = selected_by_category.get(category, [])
            for exercise in pool:
                if all(existing["name"] != exercise["name"] for existing in chosen):
                    chosen.append(exercise)
                    break

        if len(chosen) < 4:
            for pool in selected_by_category.values():
                for exercise in pool:
                    if all(existing["name"] != exercise["name"] for existing in chosen):
                        chosen.append(exercise)
                    if len(chosen) >= 5:
                        break
                if len(chosen) >= 5:
                    break

        num_exercises = max(3, min(len(chosen), duration // 10))
        tuned_exercises = [self._apply_difficulty(exercise, difficulty) for exercise in chosen[:num_exercises]]

        return {
            "name": f"{goal.replace('_', ' ').title()} Session",
            "description": self._description(goal, equipment, focus_areas, duration),
            "estimated_duration_minutes": duration,
            "difficulty": difficulty,
            "generation_mode": "template",
            "vision_status": "manual_ready",
            "warmup": self._warmup(goal),
            "exercises": tuned_exercises,
            "cooldown": self._cooldown(focus_areas),
            "training_tips": [
                "Focus on proper form over weight",
                "Rest as needed between sets",
                "Stay hydrated throughout the workout"
            ],
        }

    def _goal_split(self, goal: str, focus_areas: List[str]) -> List[str]:
        splits = {
            "strength": ["legs", "push", "pull", "hinge", "core"],
            "hypertrophy": ["push", "pull", "legs", "hinge", "core"],
            "endurance": ["conditioning", "legs", "push", "pull", "core"],
            "fat_loss": ["conditioning", "legs", "push", "pull", "core"],
        }
        order = splits.get(goal, splits["strength"]).copy()
        focus_map = {
            "chest": "push",
            "shoulders": "push",
            "triceps": "push",
            "back": "pull",
            "biceps": "pull",
            "legs": "legs",
            "glutes": "hinge",
            "core": "core",
        }

        for focus in reversed(focus_areas):
            category = focus_map.get(focus)
            if category and category in order:
                order.remove(category)
                order.insert(0, category)
        return order

    def _apply_difficulty(self, exercise: Dict[str, Any], difficulty: str) -> Dict[str, Any]:
        tuned = exercise.copy()
        if difficulty == "advanced":
            tuned["sets"] = min(int(tuned["sets"]) + 1, 6)
            tuned["rest_seconds"] = min(int(tuned["rest_seconds"]) + 15, 150)
        elif difficulty == "beginner":
            tuned["sets"] = max(int(tuned["sets"]) - 1, 2)
            tuned["rest_seconds"] = max(int(tuned["rest_seconds"]) - 15, 30)
        return tuned

    def _description(self, goal: str, equipment: List[str], focus_areas: List[str], duration: int) -> str:
        gear_summary = ", ".join(item.replace('_', ' ') for item in equipment) if equipment else "bodyweight only"
        focus_summary = f" with extra emphasis on {', '.join(focus_areas)}" if focus_areas else ""
        return (
            f"A {duration}-minute {goal.replace('_', ' ')} workout built for {gear_summary}{focus_summary}. "
            "Generated using OptiFit's intelligent workout planner."
        )

    def _warmup(self, goal: str) -> List[Dict[str, Any]]:
        warmup = [
            {"name": "Brisk March or Jog in Place", "duration_seconds": 60, "description": "Raise your heart rate gradually."},
            {"name": "Bodyweight Squats", "duration_seconds": 45, "description": "Open the hips and knees."},
            {"name": "Arm Circles", "duration_seconds": 30, "description": "Move through a comfortable shoulder range."},
        ]
        if goal in {"fat_loss", "endurance"}:
            warmup.append({"name": "Fast Feet", "duration_seconds": 30, "description": "Prime for a quicker training pace."})
        return warmup

    def _cooldown(self, focus_areas: List[str]) -> List[Dict[str, Any]]:
        cooldown = [
            {"name": "Hamstring Stretch", "duration_seconds": 30, "description": "Hold gently and breathe."},
            {"name": "Chest Stretch", "duration_seconds": 30, "description": "Open up through the front of the shoulders."},
            {"name": "Child's Pose", "duration_seconds": 45, "description": "Finish with slow nasal breathing."},
        ]
        if "back" in focus_areas:
            cooldown.insert(1, {"name": "Lat Stretch", "duration_seconds": 30, "description": "Reach long through the sides of the torso."})
        return cooldown

    def _basic_exercises(self, equipment: List[str]) -> List[Dict[str, Any]]:
        return [
            {"name": "Push-ups", "sets": 3, "reps": "10-15", "rest_seconds": 60, "equipment": "bodyweight", "target_muscles": ["chest", "shoulders", "triceps"]},
            {"name": "Bodyweight Squats", "sets": 3, "reps": "15-20", "rest_seconds": 45, "equipment": "bodyweight", "target_muscles": ["quadriceps", "glutes"]},
            {"name": "Plank", "sets": 3, "reps": "30-45 sec", "rest_seconds": 30, "equipment": "bodyweight", "target_muscles": ["core"]},
            {"name": "Lunges", "sets": 3, "reps": "10 each leg", "rest_seconds": 45, "equipment": "bodyweight", "target_muscles": ["quadriceps", "glutes", "hamstrings"]},
        ]
