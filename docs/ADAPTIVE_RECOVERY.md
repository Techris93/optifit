# Adaptive Recovery Engine

OptiFit's Adaptive Recovery Engine turns a generated workout into a readiness-aware plan before the API returns it. It copies biological systems that sense, adapt, protect, and recover instead of assuming more effort is always better.

## What It Uses

Send any of these fields in `user_preferences` when calling `POST /api/workouts/generate`:

| Field | Example | Purpose |
| --- | --- | --- |
| `sleep_hours` | `6.5` | Detect sleep debt and recovery capacity |
| `soreness` | `7` | Reduce load when tissue recovery is poor |
| `mood` | `2` | Adapt coaching tone and training ambition |
| `hrv_trend` | `down`, `stable`, `up` | Detect nervous-system readiness |
| `recent_load` | `light`, `normal`, `heavy` | Avoid stacking stress too aggressively |
| `missed_sessions` | `2` | Ramp back after gaps instead of making up everything |
| `preferred_training_time` | `morning` | Add circadian timing guidance |
| `nutrition` | `under_fueled`, `adequate`, `strong` | Budget energy around fuel availability |

## Nature Models Implemented

| Nature model | OptiFit behavior |
| --- | --- |
| Immune system | Detects overtraining, injury risk, and poor recovery |
| Ant colonies | Frames evidence-backed workout paths for similar users |
| Mycelium networks | Connects sleep, soreness, mood, nutrition, load, and missed sessions |
| Flocking birds | Scales cohort or group intensity from local readiness rules |
| Predator-prey cycles | Varies training to break plateaus without overwhelming recovery |
| Skin | Applies recovery-first safeguards around hard training |
| Circadian rhythm | Times training and recovery nudges around the user's preferred window |
| Tree roots | Prioritizes the weakest recovery or mobility area first |
| Echolocation | Asks short readiness checks before committing to the main workload |
| Octopus camouflage | Adapts coaching tone to recovery and motivation state |

## Response Shape

The API returns `adaptive_recovery` at the top level and inside `workout.adaptive_recovery`.

Important fields:
- `readiness_score`: 0-100 readiness estimate
- `action_state`: `regenerate`, `restore`, `build`, or `push`
- `volume_multiplier`: applied set-volume scaling
- `rest_multiplier`: applied rest scaling
- `adjusted_duration_minutes`: recovery-adjusted duration
- `weakest_root`: the priority limiter to address first
- `recovery_protocol`: plain-language coaching guidance
- `energy_budgeting`: warm-up, main work, and recovery allocation
- `micro_assessments`: short readiness checks
- `biological_signals`: all implemented nature models for display and audit

## Frontend Use

Open **Workout Builder**, fill **Check Recovery**, then generate a workout. The result page shows the Adaptive Recovery Engine dashboard and the biological signals applied to the plan.
