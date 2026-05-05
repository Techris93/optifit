# Adaptive Recovery Engine

OptiFit's Adaptive Recovery Engine turns a generated workout into a readiness-aware plan before the API returns it. It uses recovery signals, decision rules, and progression safeguards instead of assuming more effort is always better.

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
| `preferred_training_time` | `morning` | Add training-window timing guidance |
| `nutrition` | `under_fueled`, `adequate`, `strong` | Budget energy around fuel availability |

## Capabilities

| Capability | OptiFit behavior |
| --- | --- |
| Recovery risk detection | Detects overtraining, injury risk, and poor recovery |
| Progression evidence | Frames evidence-backed workout paths for similar users |
| Readiness integration | Connects sleep, soreness, mood, nutrition, load, and missed sessions |
| Cohort scaling | Scales group or cohort intensity from local readiness rules |
| Plateau variation | Varies training to break plateaus without overwhelming recovery |
| Safety guardrails | Applies recovery-first safeguards around hard training |
| Training-window timing | Times training and recovery nudges around the user's preferred window |
| Priority limiter | Prioritizes the weakest recovery or mobility area first |
| Readiness checks | Asks short readiness checks before committing to the main workload |
| Coaching tone adaptation | Adapts coaching tone to recovery and motivation state |

## Response Shape

The API returns `adaptive_recovery` at the top level and inside `workout.adaptive_recovery`.

Important fields:
- `readiness_score`: 0-100 readiness estimate
- `action_state`: `regenerate`, `restore`, `build`, or `push`
- `volume_multiplier`: applied set-volume scaling
- `rest_multiplier`: applied rest scaling
- `adjusted_duration_minutes`: recovery-adjusted duration
- `priority_limiter`: the priority limiter to address first
- `recovery_protocol`: plain-language coaching guidance
- `energy_budgeting`: warm-up, main work, and recovery allocation
- `micro_assessments`: short readiness checks
- `adaptation_signals`: implemented decision signals for display and audit

## Frontend Use

Open **Workout Builder**, fill **Check Recovery**, then generate a workout. The result page shows the Adaptive Recovery Engine dashboard and the decision signals applied to the plan.
