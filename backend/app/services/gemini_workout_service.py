"""
Gemini-powered workout generation service.
Provides AI-generated workout plans using Google's Gemini API.
"""

import json
import os
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings


class GeminiWorkoutService:
    """Service for generating AI-powered workouts using Gemini API."""

    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.model = os.getenv("GEMINI_WORKOUT_MODEL", "gemini-2.5-flash")
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.timeout = float(os.getenv("GEMINI_WORKOUT_TIMEOUT_SECONDS", "60"))
        self.client = httpx.AsyncClient(timeout=self.timeout)

    @property
    def is_configured(self) -> bool:
        """Check if Gemini API is properly configured."""
        return bool(self.api_key)

    async def generate_workout(
        self,
        equipment: List[str],
        goal: str = "strength",
        difficulty: str = "beginner",
        duration_minutes: int = 45,
        focus_areas: Optional[List[str]] = None,
        user_preferences: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate an AI-powered workout plan using Gemini.

        Args:
            equipment: List of available equipment
            goal: Training goal (strength, hypertrophy, endurance, fat_loss)
            difficulty: Experience level (beginner, intermediate, advanced)
            duration_minutes: Target workout duration
            focus_areas: Optional muscle groups to emphasize
            user_preferences: Optional additional preferences

        Returns:
            Structured workout plan with exercises, sets, reps, and rest times
        """
        if not self.is_configured:
            raise RuntimeError("Gemini API key not configured")

        prompt = self._build_workout_prompt(
            equipment=equipment,
            goal=goal,
            difficulty=difficulty,
            duration_minutes=duration_minutes,
            focus_areas=focus_areas,
            user_preferences=user_preferences,
        )

        try:
            response = await self._call_gemini(prompt)
            workout_data = self._parse_workout_response(response)
            workout_data["generation_mode"] = "gemini"
            workout_data["ai_provider"] = "google_gemini"
            return workout_data

        except Exception as e:
            raise RuntimeError(f"Gemini workout generation failed: {str(e)}")

    def _build_workout_prompt(
        self,
        equipment: List[str],
        goal: str,
        difficulty: str,
        duration_minutes: int,
        focus_areas: Optional[List[str]] = None,
        user_preferences: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Build a comprehensive prompt for Gemini workout generation."""

        equipment_str = ", ".join(item.replace('_', ' ') for item in equipment) if equipment else "bodyweight only"
        focus_str = f"Focus areas: {', '.join(focus_areas)}." if focus_areas else ""

        # Build user context
        user_context = ""
        if user_preferences:
            if "injuries" in user_preferences:
                user_context += f"\n- Injuries/limitations: {user_preferences['injuries']}"
            if "experience_years" in user_preferences:
                user_context += f"\n- Training experience: {user_preferences['experience_years']} years"
            if "preferred_style" in user_preferences:
                user_context += f"\n- Preferred training style: {user_preferences['preferred_style']}"

        goal_descriptions = {
            "strength": "Build maximal strength with compound movements and lower rep ranges",
            "hypertrophy": "Build muscle size with moderate weights and higher volume",
            "endurance": "Improve muscular endurance with higher reps and shorter rest",
            "fat_loss": "Maximize calorie burn with compound movements and minimal rest",
        }

        difficulty_guidance = {
            "beginner": "Focus on fundamental movements, proper form, and manageable volume",
            "intermediate": "Include more challenging variations and moderate volume increases",
            "advanced": "Use advanced techniques, higher intensity, and periodization concepts",
        }

        return f"""You are an expert certified personal trainer with 15+ years of experience creating personalized workout programs.

CLIENT PROFILE:
- Goal: {goal} - {goal_descriptions.get(goal, 'General fitness')}
- Difficulty: {difficulty} - {difficulty_guidance.get(difficulty, 'Standard training')}
- Available Equipment: {equipment_str}
- Target Duration: {duration_minutes} minutes
{focus_str}{user_context}

YOUR TASK:
Create a complete, personalized workout plan that:
1. Uses ONLY the available equipment listed
2. Fits within the target duration (including warm-up and cool-down)
3. Matches the client's goal and experience level
4. Includes proper exercise sequencing (compound before isolation)
5. Provides realistic sets, reps, and rest periods

EXERCISE SELECTION GUIDELINES:
- Prioritize compound movements (squats, deadlifts, presses, rows, pull-ups)
- Include unilateral exercises for balance
- Add core work appropriate to the goal
- Select exercises that match the equipment perfectly

RESPONSE FORMAT - Return ONLY valid JSON in this exact structure:
{{
    "name": "Descriptive workout name",
    "description": "Brief overview of the workout's purpose and approach",
    "estimated_duration_minutes": {duration_minutes},
    "difficulty": "{difficulty}",
    "goal": "{goal}",
    "warmup": [
        {{
            "name": "Exercise name",
            "duration_seconds": 60,
            "description": "How to perform"
        }}
    ],
    "exercises": [
        {{
            "name": "Exercise Name",
            "sets": 3,
            "reps": "8-12",
            "rest_seconds": 60,
            "equipment": "equipment_name_from_list",
            "notes": "Form cues and tips",
            "target_muscles": ["primary muscle", "secondary muscle"],
            "difficulty": "beginner|intermediate|advanced",
            "alternative": "Alternative exercise if needed"
        }}
    ],
    "cooldown": [
        {{
            "name": "Stretch or recovery exercise",
            "duration_seconds": 30,
            "description": "How to perform"
        }}
    ],
    "training_tips": [
        "Specific tip for this workout",
        "Progression guidance"
    ],
    "estimated_calories_burned": 250
}}

IMPORTANT RULES:
- Use ONLY equipment from the available list: {equipment_str}
- Total workout time must fit within {duration_minutes} minutes
- Sets and reps must match the {goal} goal
- Rest periods should be appropriate for the goal
- Include specific form cues in notes
- Provide alternative exercises for each movement
- Ensure balanced muscle group coverage"""

    async def _call_gemini(self, prompt: str) -> str:
        """Make API call to Gemini."""
        url = f"{self.base_url}/{self.model}:generateContent"

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 4096,
                "responseMimeType": "application/json",
            },
            "safetySettings": [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        }

        response = await self.client.post(
            url,
            params={"key": self.api_key},
            headers={"Content-Type": "application/json"},
            json=payload,
        )
        response.raise_for_status()

        data = response.json()
        return self._extract_text_from_response(data)

    def _extract_text_from_response(self, data: Dict[str, Any]) -> str:
        """Extract text from Gemini API response."""
        texts = []
        for candidate in data.get("candidates", []):
            content = candidate.get("content", {})
            for part in content.get("parts", []):
                text = part.get("text")
                if text:
                    texts.append(text)
        return "\n".join(texts)

    def _parse_workout_response(self, raw_text: str) -> Dict[str, Any]:
        """Parse and validate the workout JSON response."""
        # Clean up the response (remove markdown code fences if present)
        cleaned = raw_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        # Parse JSON
        try:
            workout = json.loads(cleaned)
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Invalid JSON response from Gemini: {str(e)}")

        # Validate required fields
        required_fields = ["name", "description", "exercises"]
        for field in required_fields:
            if field not in workout:
                workout[field] = self._get_default_field(field)

        # Ensure exercises have required fields
        for exercise in workout.get("exercises", []):
            if "sets" not in exercise:
                exercise["sets"] = 3
            if "reps" not in exercise:
                exercise["reps"] = "10-12"
            if "rest_seconds" not in exercise:
                exercise["rest_seconds"] = 60
            if "equipment" not in exercise:
                exercise["equipment"] = "bodyweight"
            if "notes" not in exercise:
                exercise["notes"] = "Focus on proper form and controlled movement."

        # Add default warmup/cooldown if missing
        if "warmup" not in workout:
            workout["warmup"] = self._default_warmup()
        if "cooldown" not in workout:
            workout["cooldown"] = self._default_cooldown()

        return workout

    def _get_default_field(self, field: str) -> Any:
        """Get default values for missing fields."""
        defaults = {
            "name": "AI-Generated Workout",
            "description": "A personalized workout plan generated by AI.",
            "exercises": [],
        }
        return defaults.get(field)

    def _default_warmup(self) -> List[Dict[str, Any]]:
        """Default warmup routine."""
        return [
            {"name": "Light Cardio", "duration_seconds": 60, "description": "Jumping jacks or light jog to raise heart rate"},
            {"name": "Dynamic Stretching", "duration_seconds": 60, "description": "Arm circles, leg swings, hip rotations"},
            {"name": "Movement Prep", "duration_seconds": 60, "description": "Bodyweight squats and push-ups to prepare muscles"},
        ]

    def _default_cooldown(self) -> List[Dict[str, Any]]:
        """Default cooldown routine."""
        return [
            {"name": "Light Walking", "duration_seconds": 60, "description": "Slow walking to lower heart rate gradually"},
            {"name": "Static Stretching", "duration_seconds": 120, "description": "Hold stretches for major muscle groups worked"},
            {"name": "Deep Breathing", "duration_seconds": 60, "description": "Focus on recovery breathing"},
        ]

    async def analyze_exercise_form(
        self,
        exercise_name: str,
        user_description: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Get AI-powered form tips and cues for a specific exercise.

        Args:
            exercise_name: Name of the exercise
            user_description: Optional description of user's current approach

        Returns:
            Form analysis with tips, common mistakes, and cues
        """
        if not self.is_configured:
            raise RuntimeError("Gemini API key not configured")

        prompt = f"""You are an expert strength coach analyzing exercise form.

Exercise: {exercise_name}
{ f"User's description: {user_description}" if user_description else ""}

Provide detailed form guidance in JSON format:
{{
    "exercise": "exercise name",
    "setup": "How to set up for the exercise",
    "execution": "Step-by-step movement instructions",
    "key_cues": ["cue 1", "cue 2", "cue 3"],
    "common_mistakes": ["mistake 1", "mistake 2"],
    "breathing": "Breathing pattern guidance",
    "progression_tips": "How to progress safely",
    "safety_notes": "Important safety considerations"
}}"""

        response = await self._call_gemini(prompt)
        return json.loads(self._clean_json_response(response))

    def _clean_json_response(self, raw_text: str) -> str:
        """Clean and extract JSON from response."""
        cleaned = raw_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        return cleaned.strip()


# Singleton instance
gemini_workout_service = GeminiWorkoutService()
