"""
Exercise Media Service - Maps exercises to demo videos, GIFs, and images.
Provides rich visual content for the workout delivery step.
"""

from typing import Dict, List, Optional, Any


class ExerciseMediaService:
    """Service for managing exercise demonstration media."""

    # Comprehensive exercise media database
    # Maps exercise slugs to media URLs (YouTube, GIFs, images)
    EXERCISE_MEDIA_DB: Dict[str, Dict[str, Any]] = {
        # Barbell exercises
        "barbell_bench_press": {
            "video_url": "https://www.youtube.com/watch?v=Zw6qCAFsV0w",
            "gif_url": "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/360/Male/m/360_1.jpg",
            "muscle_groups": ["chest", "shoulders", "triceps"],
            "difficulty": "intermediate",
        },
        "barbell_rows": {
            "video_url": "https://www.youtube.com/watch?v=vT2GjY_Umpw",
            "gif_url": None,
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/321/Male/m/321_1.jpg",
            "muscle_groups": ["back", "biceps"],
            "difficulty": "intermediate",
        },
        "barbell_deadlifts": {
            "video_url": "https://www.youtube.com/watch?v=op9kVnSso6Q",
            "gif_url": "https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif",
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/293/Male/m/293_1.jpg",
            "muscle_groups": ["back", "hamstrings", "glutes"],
            "difficulty": "advanced",
        },
        "barbell_squats": {
            "video_url": "https://www.youtube.com/watch?v=rM6SDUdl9fs",
            "gif_url": "https://media.giphy.com/media/3o7TKVtlg8GlCmqv5u/giphy.gif",
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/287/Male/m/287_1.jpg",
            "muscle_groups": ["quadriceps", "glutes", "core"],
            "difficulty": "intermediate",
        },
        "barbell_overhead_press": {
            "video_url": "https://www.youtube.com/watch?v=2yjwXTZQDDI",
            "gif_url": None,
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/364/Male/m/364_1.jpg",
            "muscle_groups": ["shoulders", "triceps", "core"],
            "difficulty": "intermediate",
        },

        # Dumbbell exercises
        "dumbbell_bench_press": {
            "video_url": "https://www.youtube.com/watch?v=WLTU1j7Ur8M",
            "gif_url": "https://media.giphy.com/media/3o7TKTDn976rzVgky4/giphy.gif",
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/380/Male/m/380_1.jpg",
            "muscle_groups": ["chest", "shoulders", "triceps"],
            "difficulty": "beginner",
        },
        "dumbbell_rows": {
            "video_url": "https://www.youtube.com/watch?v=ufhQhwyrx-4",
            "gif_url": None,
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/385/Male/m/385_1.jpg",
            "muscle_groups": ["back", "biceps"],
            "difficulty": "beginner",
        },
        "dumbbell_shoulder_press": {
            "video_url": "https://www.youtube.com/watch?v=qEwKCR5JCog",
            "gif_url": "https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif",
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/388/Male/m/388_1.jpg",
            "muscle_groups": ["shoulders", "triceps"],
            "difficulty": "beginner",
        },
        "dumbbell_squats": {
            "video_url": "https://www.youtube.com/watch?v=BR4tlEE_A98",
            "gif_url": None,
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/382/Male/m/382_1.jpg",
            "muscle_groups": ["quadriceps", "glutes"],
            "difficulty": "beginner",
        },
        "dumbbell_lunges": {
            "video_url": "https://www.youtube.com/watch?v=RqimDHU-tkg",
            "gif_url": "https://media.giphy.com/media/3o7TKVtlg8GlCmqv5u/giphy.gif",
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/384/Male/m/384_1.jpg",
            "muscle_groups": ["quadriceps", "glutes", "hamstrings"],
            "difficulty": "beginner",
        },
        "dumbbell_romanian_deadlifts": {
            "video_url": "https://www.youtube.com/watch?v=7j-2w4-P14I",
            "gif_url": None,
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/383/Male/m/383_1.jpg",
            "muscle_groups": ["hamstrings", "glutes", "back"],
            "difficulty": "intermediate",
        },

        # Kettlebell exercises
        "kettlebell_swings": {
            "video_url": "https://www.youtube.com/watch?v=X12k2AiJuwE",
            "gif_url": "https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif",
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/428/Male/m/428_1.jpg",
            "muscle_groups": ["glutes", "hamstrings", "core"],
            "difficulty": "intermediate",
        },
        "goblet_squats": {
            "video_url": "https://www.youtube.com/watch?v=BR4tlEE_A98",
            "gif_url": None,
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/429/Male/m/429_1.jpg",
            "muscle_groups": ["quadriceps", "glutes"],
            "difficulty": "beginner",
        },
        "kettlebell_rows": {
            "video_url": "https://www.youtube.com/watch?v=ufhQhwyrx-4",
            "gif_url": None,
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/430/Male/m/430_1.jpg",
            "muscle_groups": ["back", "biceps"],
            "difficulty": "beginner",
        },
        "kettlebell_turkish_get_ups": {
            "video_url": "https://www.youtube.com/watch?v=3l6B7J1MJMY",
            "gif_url": None,
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/431/Male/m/431_1.jpg",
            "muscle_groups": ["full body", "shoulders", "core"],
            "difficulty": "advanced",
        },

        # Pull-up bar exercises
        "pull_ups": {
            "video_url": "https://www.youtube.com/watch?v=8O68v_iIi40",
            "gif_url": "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/340/Male/m/340_1.jpg",
            "muscle_groups": ["back", "biceps"],
            "difficulty": "intermediate",
        },
        "chin_ups": {
            "video_url": "https://www.youtube.com/watch?v=brhRXlOhsAM",
            "gif_url": None,
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/341/Male/m/341_1.jpg",
            "muscle_groups": ["back", "biceps"],
            "difficulty": "intermediate",
        },
        "hanging_leg_raises": {
            "video_url": "https://www.youtube.com/watch?v=Pr1ieGZ5atk",
            "gif_url": None,
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/342/Male/m/342_1.jpg",
            "muscle_groups": ["abs", "hip flexors"],
            "difficulty": "intermediate",
        },
        "hanging_knee_raises": {
            "video_url": "https://www.youtube.com/watch?v=JB2oyawG9KO",
            "gif_url": None,
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/343/Male/m/343_1.jpg",
            "muscle_groups": ["abs"],
            "difficulty": "beginner",
        },

        # Resistance band exercises
        "band_pull_aparts": {
            "video_url": "https://www.youtube.com/watch?v=JObYtU7Y7ag",
            "gif_url": None,
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/450/Male/m/450_1.jpg",
            "muscle_groups": ["rear deltoids", "upper back"],
            "difficulty": "beginner",
        },
        "band_rows": {
            "video_url": "https://www.youtube.com/watch?v=rRT14E9y380",
            "gif_url": None,
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/451/Male/m/451_1.jpg",
            "muscle_groups": ["back", "biceps"],
            "difficulty": "beginner",
        },
        "band_face_pulls": {
            "video_url": "https://www.youtube.com/watch?v=0Po47vvj9g4",
            "gif_url": None,
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/452/Male/m/452_1.jpg",
            "muscle_groups": ["rear deltoids", "rotator cuff"],
            "difficulty": "beginner",
        },
        "band_presses": {
            "video_url": "https://www.youtube.com/watch?v=W1LCL-Sw0yU",
            "gif_url": None,
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/453/Male/m/453_1.jpg",
            "muscle_groups": ["chest", "shoulders", "triceps"],
            "difficulty": "beginner",
        },
        "band_squats": {
            "video_url": "https://www.youtube.com/watch?v=54q20D3bS8E",
            "gif_url": None,
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/454/Male/m/454_1.jpg",
            "muscle_groups": ["quadriceps", "glutes"],
            "difficulty": "beginner",
        },

        # Bodyweight exercises
        "push_ups": {
            "video_url": "https://www.youtube.com/watch?v=W1LCL-Sw0yU",
            "gif_url": "https://media.giphy.com/media/3o7TKVtlg8GlCmqv5u/giphy.gif",
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/300/Male/m/300_1.jpg",
            "muscle_groups": ["chest", "shoulders", "triceps"],
            "difficulty": "beginner",
        },
        "bodyweight_squats": {
            "video_url": "https://www.youtube.com/watch?v=YaXPRqUwItQ",
            "gif_url": "https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif",
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/301/Male/m/301_1.jpg",
            "muscle_groups": ["quadriceps", "glutes"],
            "difficulty": "beginner",
        },
        "lunges": {
            "video_url": "https://www.youtube.com/watch?v=RqimDHU-tkg",
            "gif_url": "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/302/Male/m/302_1.jpg",
            "muscle_groups": ["quadriceps", "glutes", "hamstrings"],
            "difficulty": "beginner",
        },
        "bodyweight_lunges": {
            "video_url": "https://www.youtube.com/watch?v=RqimDHU-tkg",
            "gif_url": None,
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/302/Male/m/302_1.jpg",
            "muscle_groups": ["quadriceps", "glutes", "hamstrings"],
            "difficulty": "beginner",
        },
        "plank": {
            "video_url": "https://www.youtube.com/watch?v=7A-uDuGAqts",
            "gif_url": "https://media.giphy.com/media/3o7TKTDn976rzVgky4/giphy.gif",
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/303/Male/m/303_1.jpg",
            "muscle_groups": ["core"],
            "difficulty": "beginner",
        },
        "mountain_climbers": {
            "video_url": "https://www.youtube.com/watch?v=nmwgirgXLYM",
            "gif_url": "https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif",
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/304/Male/m/304_1.jpg",
            "muscle_groups": ["core", "legs", "shoulders"],
            "difficulty": "intermediate",
        },
        "glute_bridges": {
            "video_url": "https://www.youtube.com/watch?v=wPM8icPu6H8",
            "gif_url": None,
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/305/Male/m/305_1.jpg",
            "muscle_groups": ["glutes", "hamstrings"],
            "difficulty": "beginner",
        },
        "burpees": {
            "video_url": "https://www.youtube.com/watch?v=auBLPXO8Fww",
            "gif_url": "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/306/Male/m/306_1.jpg",
            "muscle_groups": ["full body"],
            "difficulty": "advanced",
        },
        "inverted_rows": {
            "video_url": "https://www.youtube.com/watch?v=Kq5z7H0d5F0",
            "gif_url": None,
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/307/Male/m/307_1.jpg",
            "muscle_groups": ["back", "biceps"],
            "difficulty": "intermediate",
        },
        "bird_dogs": {
            "video_url": "https://www.youtube.com/watch?v=wiFNA3sqjCA",
            "gif_url": None,
            "image_url": "https://www.bodybuilding.com/exercises/exerciseImages/sequences/308/Male/m/308_1.jpg",
            "muscle_groups": ["core", "back"],
            "difficulty": "beginner",
        },
    }

    # Equipment-specific fallback media
    EQUIPMENT_FALLBACKS = {
        "barbell": {
            "video_url": "https://www.youtube.com/results?search_query=barbell+exercise+demo",
            "instruction_guide": "https://www.bodybuilding.com/exercises/barbell"
        },
        "dumbbell": {
            "video_url": "https://www.youtube.com/results?search_query=dumbbell+exercise+demo",
            "instruction_guide": "https://www.bodybuilding.com/exercises/dumbbell"
        },
        "kettlebell": {
            "video_url": "https://www.youtube.com/results?search_query=kettlebell+exercise+demo",
            "instruction_guide": "https://www.bodybuilding.com/exercises/kettlebell"
        },
        "resistance_band": {
            "video_url": "https://www.youtube.com/results?search_query=resistance+band+exercise+demo",
            "instruction_guide": "https://www.bodybuilding.com/exercises/resistance-band"
        },
        "pull_up_bar": {
            "video_url": "https://www.youtube.com/results?search_query=pull+up+exercise+demo",
            "instruction_guide": "https://www.bodybuilding.com/exercises/pull-up"
        },
        "yoga_mat": {
            "video_url": "https://www.youtube.com/results?search_query=bodyweight+exercise+demo",
            "instruction_guide": "https://www.bodybuilding.com/exercises/bodyweight"
        },
    }

    @classmethod
    def get_exercise_media(cls, exercise_slug: str) -> Dict[str, Any]:
        """
        Get media URLs for a specific exercise.

        Args:
            exercise_slug: Normalized exercise name/slug

        Returns:
            Dictionary with video_url, gif_url, image_url, and metadata
        """
        # Normalize the slug
        normalized = cls._normalize_slug(exercise_slug)

        # Try exact match
        if normalized in cls.EXERCISE_MEDIA_DB:
            return cls.EXERCISE_MEDIA_DB[normalized]

        # Try common variations
        variations = cls._generate_variations(normalized)
        for variation in variations:
            if variation in cls.EXERCISE_MEDIA_DB:
                return cls.EXERCISE_MEDIA_DB[variation]

        # Return fallback with search URL
        return cls._get_fallback_media(normalized)

    @classmethod
    def get_media_for_equipment(cls, equipment_name: str) -> Dict[str, str]:
        """Get fallback media for an equipment type."""
        normalized = cls._normalize_slug(equipment_name)
        return cls.EQUIPMENT_FALLBACKS.get(normalized, {
            "video_url": f"https://www.youtube.com/results?search_query={normalized}+exercise+demo",
            "instruction_guide": f"https://www.google.com/search?q={normalized}+exercise+guide"
        })

    @classmethod
    def enrich_exercise_data(cls, exercise: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enrich exercise data with media URLs.

        Args:
            exercise: Exercise dictionary with at least 'name' or 'slug'

        Returns:
            Enriched exercise with media URLs
        """
        slug = exercise.get("slug") or cls._normalize_slug(exercise.get("name", ""))
        media = cls.get_exercise_media(slug)

        enriched = exercise.copy()
        enriched["media"] = {
            "video_url": media.get("video_url"),
            "gif_url": media.get("gif_url"),
            "image_url": media.get("image_url"),
        }
        enriched["muscle_groups"] = media.get("muscle_groups", exercise.get("target_muscles", []))
        enriched["difficulty_level"] = media.get("difficulty", exercise.get("difficulty", "intermediate"))

        return enriched

    @classmethod
    def get_exercises_by_muscle_group(cls, muscle_group: str) -> List[str]:
        """Get all exercises targeting a specific muscle group."""
        exercises = []
        muscle_normalized = cls._normalize_slug(muscle_group)

        for slug, data in cls.EXERCISE_MEDIA_DB.items():
            muscles = data.get("muscle_groups", [])
            if muscle_normalized in [cls._normalize_slug(m) for m in muscles]:
                exercises.append(slug)

        return exercises

    @classmethod
    def get_exercises_by_difficulty(cls, difficulty: str) -> List[str]:
        """Get all exercises of a specific difficulty level."""
        return [
            slug for slug, data in cls.EXERCISE_MEDIA_DB.items()
            if data.get("difficulty") == difficulty
        ]

    @classmethod
    def search_exercises(cls, query: str) -> List[Dict[str, Any]]:
        """Search exercises by name or muscle group."""
        query_normalized = cls._normalize_slug(query)
        results = []

        for slug, data in cls.EXERCISE_MEDIA_DB.items():
            if query_normalized in slug:
                results.append({"slug": slug, **data})
            elif any(query_normalized in cls._normalize_slug(m) for m in data.get("muscle_groups", [])):
                results.append({"slug": slug, **data})

        return results

    @staticmethod
    def _normalize_slug(text: str) -> str:
        """Normalize text to a consistent slug format."""
        import re
        normalized = re.sub(r"[^a-z0-9]+", "_", text.lower().strip()).strip("_")
        normalized = re.sub(r"_+", "_", normalized)
        return normalized

    @classmethod
    def _generate_variations(cls, slug: str) -> List[str]:
        """Generate possible variations of an exercise slug."""
        variations = [slug]

        # Common prefix/suffix variations
        prefixes = ["", "standing_", "seated_", "incline_", "decline_"]
        suffixes = ["", "s", "_exercise", "_variation"]

        for prefix in prefixes:
            for suffix in suffixes:
                variations.append(f"{prefix}{slug}{suffix}")

        # Equipment variations
        equipment_swaps = {
            "barbell_": ["dumbbell_", "kettlebell_"],
            "dumbbell_": ["barbell_", "kettlebell_"],
        }

        for old, replacements in equipment_swaps.items():
            if slug.startswith(old):
                for replacement in replacements:
                    variations.append(slug.replace(old, replacement))

        return list(set(variations))

    @classmethod
    def _get_fallback_media(cls, slug: str) -> Dict[str, Any]:
        """Generate fallback media for unknown exercises."""
        search_query = slug.replace("_", "+")
        return {
            "video_url": f"https://www.youtube.com/results?search_query={search_query}+exercise+demo",
            "gif_url": None,
            "image_url": None,
            "muscle_groups": [],
            "difficulty": "intermediate",
            "is_fallback": True,
        }


# Singleton instance
exercise_media_service = ExerciseMediaService()
