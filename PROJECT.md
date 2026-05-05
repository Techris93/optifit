# OptiFit Project Guide

## Product Position

OptiFit is currently a web-first MVP built to preserve a broader AI-assisted fitness product vision.

Current shipping path:
- Manual equipment selection
- Lightweight workout generation
- Exercise library
- Progress logging
- Optional local-only upload analysis via a separate vision dependency set
- Optional cloud vision analysis via OpenAI or Gemini

Vision that remains intact:
- Upload setup photos or videos
- Analyze equipment with computer vision
- Generate richer plans from detected gear and goals
- Deliver exercise demos with media

## Structure

```text
optifit/
├── README.md
├── PROJECT.md
├── .env.example
├── docker-compose.yml
├── setup.sh
├── backend/
├── frontend/
├── database/
└── docs/
```

## Current Behavior

- `POST /api/equipment/detect` accepts one `file` or multiple `files`
- `/api/equipment/detect` can use local YOLO, OpenAI vision, or Gemini vision based on env config
- `POST /api/workouts/generate` accepts JSON with `equipment` and optional `focus_areas`
- `POST /api/workouts/generate` accepts optional recovery signals in `user_preferences`
- Workout generation defaults to a lightweight template planner
- Generated workouts pass through the Adaptive Recovery Engine before return
- Ollama is optional and only used when `ENABLE_OLLAMA=true`
- Generated workouts can now be persisted through `POST /api/workouts/save-generated`
- Upload analysis is local-only by default unless fallback download is explicitly enabled
- Progress logging works directly in the web UI
- Production defaults now enforce a non-placeholder JWT secret, explicit CORS origins, rate limiting, and upload size caps

## Adaptive Recovery Engine

The workout builder now uses readiness intelligence to make safer training decisions:

- Sensing: sleep, soreness, mood, HRV trend, recent load, missed sessions, nutrition, timing, and focus areas
- Memory-ready signals: similar-user paths, plateau variation, cohort scaling, and decision signal coverage
- Adaptation: readiness score, action state, volume multiplier, rest multiplier, adjusted duration, and coaching tone
- Containment: recovery-first safeguards when readiness drops
- Regeneration: recovery protocol, energy budget, and micro-assessments before the main workload

The frontend exposes this as the **Check Recovery** step in the Workout Builder and renders the returned `adaptive_recovery` dashboard under each generated plan.

## Running Locally

```bash
git clone https://github.com/Techris93/optifit.git
cd optifit
./setup.sh
cp .env.example .env
```

To enable local-only upload analysis too:

```bash
cd backend
source venv/bin/activate
pip install -r requirements-vision.txt
```

Then run:

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

```bash
cd frontend
npm run dev
```

## Hosted Deployment

- `render.yaml` provisions a Render web service plus a static site profile
- hosted deployments default to `ENABLE_LOCAL_VISION=false`
- the frontend hides upload analysis unless `VITE_ENABLE_ANALYZE=true`
- SQLite is mounted on a persistent disk at `/opt/render/project/data`

## Immediate Next Work

1. Add richer saved-workout browsing and reuse flows in the web UI.
2. Persist adaptive recovery snapshots alongside saved workouts.
3. Expand exercise media coverage for the deliver step.
4. Improve local-only upload-analysis reliability without making hosted deploys depend on it.
5. Add a PostgreSQL profile once the hosted MVP needs multi-instance or safer persistence.
