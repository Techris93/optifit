# Gemini API Integration Guide

This document explains how OptiFit integrates with Google's Gemini API for AI-powered workout generation and equipment detection.

## Overview

OptiFit uses Gemini in two main ways:

1. **Gemini Vision API** - Analyzes gym equipment photos
2. **Gemini Text API** - Generates personalized workout plans

After Gemini returns a plan, OptiFit's Adaptive Recovery Engine can adjust volume, rest, duration, timing, safeguards, and coaching tone from readiness signals before the response reaches the frontend.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Upload   │────▶│  Gemini Vision   │────▶│ Equipment List  │
│   (Gym Photo)   │     │     API          │     │  (JSON Output)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                           │
                                                           ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Workout Plan   │◀────│  Gemini Text     │◀────│  User Confirms  │
│  (AI Generated) │     │     API          │     │   Equipment     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Services

### 1. GeminiWorkoutService

**File:** `backend/app/services/gemini_workout_service.py`

Handles AI-powered workout generation using Gemini.

**Key Methods:**
- `generate_workout()` - Creates personalized workout plans
- `analyze_exercise_form()` - Provides form tips and cues

**Configuration:**
```python
GEMINI_WORKOUT_MODEL=gemini-2.5-flash
GEMINI_WORKOUT_TIMEOUT_SECONDS=60
ENABLE_GEMINI_WORKOUT=true
```

**Prompt Structure:**
The service sends a detailed prompt to Gemini including:
- Client profile (goal, difficulty, equipment)
- Exercise selection guidelines
- Optional user preferences such as injuries, training experience, style, and recovery context
- Required JSON output format
- Safety rules and constraints

**Example Response:**
```json
{
  "name": "Strength Building Session",
  "description": "A 45-minute strength workout...",
  "estimated_duration_minutes": 45,
  "difficulty": "intermediate",
  "warmup": [...],
  "exercises": [
    {
      "name": "Barbell Squats",
      "sets": 4,
      "reps": "8-10",
      "rest_seconds": 120,
      "equipment": "barbell",
      "notes": "Keep core tight",
      "target_muscles": ["quadriceps", "glutes"],
      "alternative": "Goblet Squats"
    }
  ],
  "cooldown": [...],
  "training_tips": [...]
}
```

### 2. DetectionService (Enhanced)

**File:** `backend/app/services/detection_service.py`

Handles equipment detection from uploaded images.

**Gemini Integration:**
- `detect_with_gemini()` - Uses Gemini Vision API
- Returns structured JSON with detected equipment

**Configuration:**
```python
CLOUD_VISION_PROVIDER=gemini
GEMINI_VISION_MODEL=gemini-2.5-flash
```

**Example Request:**
```python
POST /api/equipment/detect
Content-Type: multipart/form-data

file: <image_file>
confidence: 0.5
```

**Example Response:**
```json
{
  "scan_id": "uuid",
  "equipment_found": ["dumbbell", "bench", "resistance_band"],
  "detections": [
    {"label": "dumbbell", "confidence": 0.95},
    {"label": "bench", "confidence": 0.88}
  ],
  "detection_mode": "gemini"
}
```

### 3. ExerciseMediaService

**File:** `backend/app/services/exercise_media_service.py`

Maps exercises to demo videos, GIFs, and images.

**Features:**
- 50+ exercises with media URLs
- Fallback to search URLs for unknown exercises
- Equipment-specific fallbacks

**Example:**
```python
media = exercise_media_service.get_exercise_media("barbell_squats")
# Returns:
{
  "video_url": "https://youtube.com/watch?v=rM6SDUdl9fs",
  "gif_url": "https://media.giphy.com/media/...",
  "image_url": "https://bodybuilding.com/exercises/...",
  "muscle_groups": ["quadriceps", "glutes", "core"],
  "difficulty": "intermediate"
}
```

## API Endpoints

### Workout Generation

```http
POST /api/workouts/generate
Content-Type: application/json

{
  "equipment": ["dumbbell", "bench"],
  "focus_areas": ["chest", "back"],
  "user_preferences": {
    "experience_years": 2,
    "preferred_style": "hypertrophy",
    "sleep_hours": 6,
    "soreness": 5,
    "mood": 3,
    "hrv_trend": "stable",
    "recent_load": "normal",
    "preferred_training_time": "evening",
    "nutrition": "adequate"
  }
}

Query Parameters:
  - goal: strength | hypertrophy | endurance | fat_loss
  - difficulty: beginner | intermediate | advanced
  - duration: 15-120 (minutes)
```

The response includes `adaptive_recovery` with readiness score, action state, volume/rest multipliers, recovery protocol, energy budget, micro-assessments, and decision signal coverage.

### Equipment Detection

```http
POST /api/equipment/detect
Content-Type: multipart/form-data

file: <image_file>
confidence: 0.5
```

### Exercise Media

```http
GET /api/workouts/exercises/{slug}/media
```

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Gemini API key | `AIzaSy...` |

### Optional (with defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_GEMINI_WORKOUT` | `true` | Enable Gemini workout generation |
| `GEMINI_WORKOUT_MODEL` | `gemini-2.5-flash` | Model for workout generation |
| `GEMINI_WORKOUT_TIMEOUT_SECONDS` | `60` | Timeout for API calls |
| `CLOUD_VISION_PROVIDER` | `none` | Vision provider (gemini/openai/none) |
| `GEMINI_VISION_MODEL` | `gemini-2.5-flash` | Model for vision API |
| `CLOUD_VISION_TIMEOUT_SECONDS` | `30` | Timeout for vision API |

## Fallback System

If Gemini is unavailable or fails:

1. **Workout Generation** → Template-based workouts
2. **Equipment Detection** → Manual selection
3. **Exercise Media** → Search URL fallbacks

## Rate Limits

Gemini API has the following limits (as of 2024):
- Free tier: 60 requests/minute
- Pay-as-you-go: Higher limits available

OptiFit includes:
- In-memory rate limiting
- Request timeouts
- Graceful error handling

## Security

- API keys stored as environment variables
- Never committed to git
- Server-side only (backend)
- Input validation on all requests

## Testing

```bash
# Test Gemini workout generation
curl -X POST http://localhost:8000/api/workouts/generate \
  -H "Content-Type: application/json" \
  -d '{
    "equipment": ["dumbbell", "bench"],
    "focus_areas": ["chest"]
  }' \
  -G -d "goal=strength" -d "difficulty=beginner" -d "duration=30"

# Test equipment detection
curl -X POST http://localhost:8000/api/equipment/detect \
  -F "file=@gym_photo.jpg" \
  -F "confidence=0.5"
```

## Troubleshooting

### "Gemini API key not configured"
- Set `GEMINI_API_KEY` in environment variables
- Verify the key is valid at https://ai.google.dev/

### "Vision mode currently supports images only"
- Video analysis requires local YOLO model
- Use photo uploads for cloud vision

### Slow responses
- Increase `GEMINI_WORKOUT_TIMEOUT_SECONDS`
- Check Gemini API status
- Consider using a smaller model

## Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini Vision API](https://ai.google.dev/tutorials/vision)
- [Render Environment Variables](https://render.com/docs/environment-variables)
