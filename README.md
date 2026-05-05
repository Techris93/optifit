# OptiFit

OptiFit is an AI-powered workout planner that uses Google's Gemini API to analyze gym equipment and generate personalized workout plans.

[![GitHub](https://img.shields.io/github/stars/Techris93/optifit)](https://github.com/Techris93/optifit)
[![License](https://img.shields.io/badge/license-AGPL--3.0-green)]()

## ✨ Features

### Core Flow

1. **📸 Upload & Analyze** - Take photos of your gym equipment
2. **✅ Confirm Equipment** - Review AI-detected items
3. **🧬 Check Recovery** - Add sleep, soreness, mood, HRV trend, food, recent load, and training window
4. **🤖 Generate Workout** - AI creates a personalized plan
5. **🎥 Watch & Learn** - Exercise demos with video/GIFs

### AI-Powered Capabilities

- **Equipment Detection** - Gemini Vision API analyzes gym photos
- **Workout Generation** - Gemini creates personalized workout plans
- **Adaptive Recovery Engine** - Adjusts volume, rest, timing, and coaching tone from readiness signals
- **Exercise Media** - 50+ exercises mapped to demo videos and GIFs
- **Smart Fallbacks** - Template workouts when AI is unavailable

### Nature-Inspired Training Intelligence

OptiFit now copies biological operating systems instead of only generating static sessions:

- **Immune system** detects overtraining, injury risk, and poor recovery.
- **Ant colonies** can recommend evidence-backed paths from users with similar readiness patterns.
- **Mycelium networks** connect sleep, soreness, mood, nutrition, workout load, and missed sessions into one readiness view.
- **Flocking birds** keep group or cohort training aligned through simple local readiness rules.
- **Predator-prey cycles** vary sessions to break plateaus without overwhelming recovery.
- **Skin** applies recovery-first safeguards as the outer barrier around hard training.
- **Circadian rhythm** adapts training and recovery advice to the user's best time window.
- **Tree roots** prioritize the weakest area first: sleep debt, tissue recovery, fuel, mobility, or focus area.
- **Echolocation** asks short readiness checks before committing to the main workload.
- **Octopus camouflage** adapts coaching tone to the user's recovery and motivation state.

Use it from the Workout Builder by filling the **Check Recovery** step before generating a workout. The response includes `adaptive_recovery` with readiness score, action state, volume/rest multipliers, recovery protocol, energy budget, micro-assessments, and the implemented biological signals.

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Gemini API key (get one at [ai.google.dev](https://ai.google.dev/))

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/optifit.git
cd optifit

# Setup backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# Setup frontend
cd frontend
npm install
cd ..

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run the application
./run-local.sh
```

Visit `http://127.0.0.1:4173`

## 🌐 Deployment

### Deploy to Render (Recommended)

The repository includes `render.yaml` for one-click deployment:

1. **Fork this repository** to your GitHub account
2. **Go to [Render Dashboard](https://dashboard.render.com)**
3. Click **"New +"** → **"Blueprint"**
4. Connect your GitHub repository
5. Render will automatically create both services

**Required Environment Variables:**

| Service | Variable | Description |
|---------|----------|-------------|
| optifit-api | `GEMINI_API_KEY` | Your Gemini API key |
| optifit-api | `CORS_ORIGINS` | Your frontend URL |
| optifit-web | `VITE_API_URL` | Your backend URL + `/api` |

See [DEPLOY.md](DEPLOY.md) for detailed deployment instructions.

## 🔧 Configuration

### Environment Variables

```bash
# Required for Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Gemini Configuration
ENABLE_GEMINI_WORKOUT=true
GEMINI_WORKOUT_MODEL=gemini-2.5-flash
GEMINI_VISION_MODEL=gemini-2.5-flash
CLOUD_VISION_PROVIDER=gemini

# Application Settings
APP_ENV=production
DATABASE_URL=sqlite:///./optifit.db
JWT_SECRET=your-secret-key
CORS_ORIGINS=https://your-frontend-url.com
```

### Gemini API Features

**Equipment Detection (Vision):**
- Analyzes uploaded gym equipment photos
- Returns structured JSON with detected items
- Supports batch uploads (up to 5 images)

**Workout Generation (Text):**
- Creates personalized workout plans
- Considers available equipment, goals, difficulty
- Includes warm-up, main exercises, cool-down
- Provides form cues and alternative exercises

## 📁 Project Structure

```
optifit/
├── backend/
│   ├── app/
│   │   ├── services/
│   │   │   ├── gemini_workout_service.py  # Gemini workout generation
│   │   │   ├── workout_generator.py         # Main workout generator
│   │   │   ├── recovery_engine.py           # Adaptive recovery engine
│   │   │   ├── exercise_media_service.py    # Exercise demo mapping
│   │   │   └── detection_service.py         # Equipment detection
│   │   └── routers/
│   │       └── workouts.py                  # API endpoints
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── EquipmentScan.tsx            # Upload & analyze
│   │   │   ├── WorkoutGenerator.tsx         # Generate workouts
│   │   │   └── ExerciseLibrary.tsx          # Exercise demos
│   │   └── utils/
│   │       └── api.ts                       # API client
│   └── package.json
├── render.yaml                              # Render deployment config
└── DEPLOY.md                                # Deployment guide
```

## 🔒 Security

- Production requires secure `JWT_SECRET`
- CORS origins must be explicitly set
- Rate limiting on auth and scan endpoints
- Upload size capped at 8MB
- API keys stored as environment variables

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
npm test
```

## 📝 API Documentation

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/equipment/detect` | Detect equipment from images |
| POST | `/api/workouts/generate` | Generate AI workout plan |
| POST | `/api/workouts/save-generated` | Save generated workout |
| GET | `/api/workouts/exercises/{slug}/media` | Get exercise media |
| GET | `/health` | Health check |
| GET | `/readyz` | Readiness probe |

### Adaptive Recovery Request Fields

Pass recovery signals in `user_preferences` when calling `POST /api/workouts/generate`:

```json
{
  "equipment": ["dumbbells", "bench"],
  "focus_areas": ["legs"],
  "user_preferences": {
    "sleep_hours": 5.5,
    "soreness": 7,
    "mood": 2,
    "hrv_trend": "down",
    "recent_load": "high",
    "missed_sessions": 1,
    "preferred_training_time": "morning",
    "nutrition": "under_fueled"
  }
}
```

The generated workout is automatically adjusted before it is returned, and the top-level response includes the same `adaptive_recovery` object for UI display or downstream coaching.

## 🤝 Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md)

## 📄 License

AGPL-3.0 License - See [LICENSE](LICENSE)

## 🙏 Acknowledgments

- [Google Gemini API](https://ai.google.dev/) for AI capabilities
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [React](https://react.dev/) for the frontend
- [Render](https://render.com/) for hosting

---

**Built with ❤️ using Gemini AI**
