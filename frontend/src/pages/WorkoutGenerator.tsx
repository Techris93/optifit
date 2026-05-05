import { useEffect, useState } from 'react'
import { Activity, Clock, Dumbbell, Moon, RefreshCw, Save, Target, Utensils } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import ExerciseAnimationCard from '../components/animation/ExerciseAnimationCard'
import VisionStatusBadge from '../components/VisionStatusBadge'
import { generateWorkout, getEquipmentTypes, saveGeneratedWorkout } from '../utils/api'
import { buildGeneratedExerciseAnimationProfile } from '../data/exerciseAnimations'
import type { AdaptiveRecovery, WorkoutExerciseMatch, WorkoutGenerationResponse } from '../types'

type EquipmentCategory = {
  id: string
  name: string
  items: string[]
}

export default function WorkoutGenerator() {
  const [searchParams] = useSearchParams()
  const queryEquipment = searchParams.get('equipment')?.split(',').filter(Boolean) || []
  const source = searchParams.get('source')
  const detectionMode = searchParams.get('detection_mode') || 'manual'

  const [equipment, setEquipment] = useState<string[]>(queryEquipment)
  const [goal, setGoal] = useState('strength')
  const [difficulty, setDifficulty] = useState('beginner')
  const [duration, setDuration] = useState(45)
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [sleepHours, setSleepHours] = useState(7)
  const [soreness, setSoreness] = useState(3)
  const [mood, setMood] = useState(3)
  const [hrvTrend, setHrvTrend] = useState('flat')
  const [recentLoad, setRecentLoad] = useState('moderate')
  const [missedSessions, setMissedSessions] = useState(0)
  const [preferredTrainingTime, setPreferredTrainingTime] = useState('flexible')
  const [nutrition, setNutrition] = useState('unknown')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [result, setResult] = useState<WorkoutGenerationResponse | null>(null)
  const [equipmentCategories, setEquipmentCategories] = useState<EquipmentCategory[]>([])

  // Default equipment categories as fallback
  const defaultEquipmentCategories: EquipmentCategory[] = [
    { id: 'free_weights', name: 'Free Weights', items: ['barbell', 'dumbbell', 'kettlebell', 'medicine_ball'] },
    { id: 'machines', name: 'Machines', items: ['squat_rack', 'cable_machine', 'leg_press', 'lat_pulldown'] },
    { id: 'bodyweight', name: 'Bodyweight', items: ['pull_up_bar', 'yoga_mat', 'dip_station'] },
    { id: 'accessories', name: 'Accessories', items: ['resistance_band', 'jump_rope', 'foam_roller'] },
  ]

  useEffect(() => {
    const loadEquipment = async () => {
      try {
        const data = await getEquipmentTypes()
        setEquipmentCategories(data.categories)
      } catch (err) {
        console.error('Failed to load equipment types, using defaults', err)
        setEquipmentCategories(defaultEquipmentCategories)
      }
    }

    void loadEquipment()
  }, [])

  const toggleEquipment = (item: string) => {
    setEquipment((current) => (
      current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item]
    ))
  }

  const toggleFocus = (item: string) => {
    setFocusAreas((current) => (
      current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item]
    ))
  }

  const handleGenerate = async () => {
    if (equipment.length === 0) {
      setError('Choose at least one piece of equipment to build a workout.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const data = await generateWorkout({
        equipment,
        goal,
        difficulty,
        duration,
        focus_areas: focusAreas,
        user_preferences: {
          sleep_hours: sleepHours,
          soreness,
          mood,
          hrv_trend: hrvTrend,
          recent_load: recentLoad,
          missed_sessions: missedSessions,
          preferred_training_time: preferredTrainingTime,
          nutrition,
        },
      })
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate workout')
    } finally {
      setLoading(false)
    }
  }

  const focusOptions = ['chest', 'back', 'legs', 'shoulders', 'core', 'glutes']

  return (
    <div className="feature-page">
      <div className="card page-hero-card feature-intro-card">
        <div className="feature-intro-header">
          <div className="page-status-row">
            <VisionStatusBadge mode={source === 'scan' ? detectionMode : 'manual'} />
          </div>
          <div className="hero-kicker">Plan with precision</div>
          <h1>Workout Builder</h1>
          <p className="hero-copy">
            Choose available equipment, set your training objective, and generate a session you can run immediately
            with practical sets, reps, and rest timings.
          </p>
        </div>
        <div className="feature-stat-strip">
          <div className="feature-stat-chip">
            <strong>{equipment.length}</strong>
            <span>Gear items</span>
          </div>
          <div className="feature-stat-chip">
            <strong>{duration}</strong>
            <span>Minutes</span>
          </div>
          <div className="feature-stat-chip">
            <strong>{focusAreas.length || 'Open'}</strong>
            <span>Focus</span>
          </div>
        </div>
      </div>

      {!result ? (
        <>
          <div className="card">
            <div className="section-heading-row">
              <div>
                <div className="card-title zero-margin">1. Pick Your Equipment</div>
                <p className="card-subtitle">
                  Only workouts compatible with the equipment you keep selected will be proposed.
                </p>
              </div>
            </div>
            <p className="muted-paragraph">
              {source === 'scan'
                ? 'These selections came from your upload scan. Confirm or edit them before generating the workout.'
                : 'Choose the equipment you can actually use right now. The workout plan will only be built from this list.'}
            </p>

            <div className="equipment-tags">
              {equipment.length === 0 ? (
                <span className="equipment-tag">No equipment selected yet</span>
              ) : (
                equipment.map((item) => (
                  <button key={item} type="button" className="equipment-tag equipment-button selected" onClick={() => toggleEquipment(item)}>
                    {item.replace(/_/g, ' ')}
                  </button>
                ))
              )}
            </div>

            <div className="selection-summary-card">
              <span>Selected equipment</span>
              <strong>{equipment.length}</strong>
            </div>

            <div className="category-grid">
              {equipmentCategories.map((category) => (
                <div key={category.id} className="category-card">
                  <h3>{category.name}</h3>
                  <div className="equipment-tags compact">
                    {category.items.map((item) => {
                      const selected = equipment.includes(item)
                      return (
                        <button
                          key={item}
                          type="button"
                          className={`equipment-tag equipment-button ${selected ? 'selected' : ''}`}
                          onClick={() => toggleEquipment(item)}
                        >
                          {item.replace(/_/g, ' ')}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-heading-row">
              <div>
                <div className="card-title zero-margin">2. Set Your Goal</div>
                <p className="card-subtitle">Tune the session for the outcome you want and the time you actually have.</p>
              </div>
            </div>

            <div className="preference-grid">
              <div>
                <label className="field-label">
                  <Target size={14} />
                  Goal
                </label>
                <select className="field-control" value={goal} onChange={(event) => setGoal(event.target.value)}>
                  <option value="strength">Strength</option>
                  <option value="hypertrophy">Hypertrophy</option>
                  <option value="endurance">Endurance</option>
                  <option value="fat_loss">Fat loss</option>
                </select>
              </div>

              <div>
                <label className="field-label">
                  <Dumbbell size={14} />
                  Difficulty
                </label>
                <div className="pill-row">
                  {['beginner', 'intermediate', 'advanced'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`pill-button ${difficulty === level ? 'active' : ''}`}
                      onClick={() => setDifficulty(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="top-gap-20">
              <label className="field-label">
                <Clock size={14} />
                Duration: {duration} minutes
              </label>
              <input
                type="range"
                min="20"
                max="75"
                step="5"
                value={duration}
                onChange={(event) => setDuration(parseInt(event.target.value, 10))}
                className="range-control"
              />
            </div>

            <div className="top-gap-20">
              <label className="field-label">Optional focus areas</label>
              <div className="pill-row">
                {focusOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`pill-button ${focusAreas.includes(item) ? 'active' : ''}`}
                    onClick={() => toggleFocus(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-heading-row">
              <div>
                <div className="card-title zero-margin">3. Check Recovery</div>
                <p className="card-subtitle">
                  OptiFit uses these signals to adapt training stress, recovery, timing, and coaching tone.
                </p>
              </div>
            </div>

            <div className="preference-grid">
              <div>
                <label className="field-label">
                  <Moon size={14} />
                  Sleep: {sleepHours}h
                </label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  step="0.5"
                  value={sleepHours}
                  onChange={(event) => setSleepHours(parseFloat(event.target.value))}
                  className="range-control"
                />
              </div>

              <div>
                <label className="field-label">
                  <Activity size={14} />
                  Soreness: {soreness}/10
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={soreness}
                  onChange={(event) => setSoreness(parseInt(event.target.value, 10))}
                  className="range-control"
                />
              </div>

              <div>
                <label className="field-label">
                  <Activity size={14} />
                  Mood: {mood}/5
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={mood}
                  onChange={(event) => setMood(parseInt(event.target.value, 10))}
                  className="range-control"
                />
              </div>

              <div>
                <label className="field-label">
                  <Utensils size={14} />
                  Food and recovery
                </label>
                <select className="field-control" value={nutrition} onChange={(event) => setNutrition(event.target.value)}>
                  <option value="unknown">Not sure</option>
                  <option value="good">Well fueled</option>
                  <option value="low">Low fuel</option>
                  <option value="missed">Missed meal</option>
                  <option value="poor">Poor recovery food</option>
                </select>
              </div>
            </div>

            <div className="preference-grid top-gap-20">
              <div>
                <label className="field-label">HRV trend</label>
                <div className="pill-row">
                  {['down', 'flat', 'up'].map((trend) => (
                    <button
                      key={trend}
                      type="button"
                      className={`pill-button ${hrvTrend === trend ? 'active' : ''}`}
                      onClick={() => setHrvTrend(trend)}
                    >
                      {trend}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label">Recent load</label>
                <div className="pill-row">
                  {['low', 'moderate', 'high'].map((load) => (
                    <button
                      key={load}
                      type="button"
                      className={`pill-button ${recentLoad === load ? 'active' : ''}`}
                      onClick={() => setRecentLoad(load)}
                    >
                      {load}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="preference-grid top-gap-20">
              <div>
                <label className="field-label">Missed sessions: {missedSessions}</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={missedSessions}
                  onChange={(event) => setMissedSessions(parseInt(event.target.value, 10))}
                  className="range-control"
                />
              </div>

              <div>
                <label className="field-label">Training window</label>
                <select className="field-control" value={preferredTrainingTime} onChange={(event) => setPreferredTrainingTime(event.target.value)}>
                  <option value="flexible">Flexible</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
            </div>
          </div>

          {error && <div className="card error-card">{error}</div>}

          <button className="btn btn-primary btn-large full-width" onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw size={18} className="spinning" />
                Building your workout...
              </>
            ) : (
              'Generate Workout'
            )}
          </button>
        </>
      ) : (
        <WorkoutResult
          result={result}
          goal={goal}
          saving={saving}
          successMessage={successMessage}
          onReset={() => {
            setResult(null)
            setSuccessMessage(null)
          }}
          onSave={async () => {
            setSaving(true)
            setError(null)
            setSuccessMessage(null)

            try {
              const saved = await saveGeneratedWorkout({
                name: result.workout.name,
                description: result.workout.description,
                goal,
                difficulty: result.workout.difficulty,
                estimated_duration_minutes: result.workout.estimated_duration_minutes,
                equipment_used: result.equipment_used,
                exercise_matches: result.exercise_matches,
              })
              setSuccessMessage(`Workout saved successfully${saved.id ? ` as #${saved.id}` : ''}.`)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to save workout')
            } finally {
              setSaving(false)
            }
          }}
        />
      )}
    </div>
  )
}

function WorkoutResult({
  result,
  goal,
  saving,
  successMessage,
  onReset,
  onSave,
}: {
  result: WorkoutGenerationResponse
  goal: string
  saving: boolean
  successMessage: string | null
  onReset: () => void
  onSave: () => Promise<void>
}) {
  const { workout, exercise_matches: exerciseMatches } = result
  const recovery = result.adaptive_recovery || workout.adaptive_recovery

  return (
    <div className="card workout-result-card">
      <div className="result-header">
        <div>
          <h2>{workout.name}</h2>
          <p className="muted-paragraph">{workout.description.replace(/_/g, ' ')}</p>
        </div>
        <div className="result-badges">
          <span className="status-badge">{(workout.generation_mode || 'template').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</span>
          <span className="status-badge secondary">{workout.estimated_duration_minutes} min</span>
        </div>
      </div>

      <div className="feature-stat-strip">
        <div className="feature-stat-chip">
          <strong>{exerciseMatches.length}</strong>
          <span>Main exercises</span>
        </div>
        <div className="feature-stat-chip">
          <strong>{result.equipment_used.length}</strong>
          <span>Equipment types</span>
        </div>
        <div className="feature-stat-chip">
          <strong>{goal.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}</strong>
          <span>Primary goal</span>
        </div>
      </div>

      <div className="equipment-tags">
        {result.equipment_used.map((item) => (
          <span key={item} className="equipment-tag selected">
            {item.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      {recovery && <RecoveryDashboard recovery={recovery} />}

      {workout.training_tips && workout.training_tips.length > 0 && (
        <div className="delivery-box">
          <div><strong>Training tips</strong></div>
          <div className="feature-note-list">
            {workout.training_tips.map((tip) => (
              <span key={tip} className="feature-note-chip">{tip}</span>
            ))}
          </div>
        </div>
      )}

      {workout.warmup && workout.warmup.length > 0 && (
        <section className="result-section">
          <h3>Warm-up</h3>
          {workout.warmup.map((item, index) => (
            <div key={`${item.name}-${index}`} className="exercise-card">
              <div className="exercise-name">{item.name}</div>
              <div className="exercise-meta">
                {item.duration_seconds && <span>{item.duration_seconds}s</span>}
                {item.duration_seconds && item.description && <span> · </span>}
                {item.description && <span>{item.description}</span>}
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="result-section">
        <h3>Main Workout</h3>
        {exerciseMatches.map((match, index) => (
          <WorkoutExerciseCard key={`${match.slug}-${index}`} match={match} index={index} />
        ))}
      </section>

      {workout.cooldown && workout.cooldown.length > 0 && (
        <section className="result-section">
          <h3>Cool-down</h3>
          {workout.cooldown.map((item, index) => (
            <div key={`${item.name}-${index}`} className="exercise-card">
              <div className="exercise-name">{item.name}</div>
              <div className="exercise-meta">
                {item.duration_seconds && <span>{item.duration_seconds}s</span>}
                {item.duration_seconds && item.description && <span> · </span>}
                {item.description && <span>{item.description}</span>}
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="delivery-box">
        <div><strong>Goal:</strong> {goal.replace(/_/g, ' ')}</div>
        <div><strong>Equipment used:</strong> {result.equipment_used.map((item) => item.replace(/_/g, ' ')).join(', ')}</div>
      </div>

      {successMessage && (
        <div className="card top-gap-16 saved-confirmation-card">
          <strong>{successMessage}</strong>
          <p className="muted-paragraph">Open Saved Workouts to review the stored session inside the same owner scope.</p>
          <Link to="/saved" className="btn btn-secondary">
            View Saved Workouts
          </Link>
        </div>
      )}

      <div className="inline-actions top-gap-24">
        <button type="button" className="btn btn-primary flex-grow" onClick={() => void onSave()} disabled={saving}>
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Workout'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onReset}>
          Generate New
        </button>
      </div>
    </div>
  )
}

function RecoveryDashboard({ recovery }: { recovery: AdaptiveRecovery }) {
  return (
    <section className="result-section">
      <div className="section-heading-row">
        <div>
          <h3>Adaptive Recovery Engine</h3>
          <p className="muted-paragraph">
            Readiness-driven stress, recovery, timing, and coaching adjustments are applied before the session starts.
          </p>
        </div>
        <div className="result-badges">
          <span className="status-badge">{recovery.action_state.replace(/_/g, ' ')}</span>
          <span className="status-badge secondary">{recovery.readiness_score}/100</span>
        </div>
      </div>

      <div className="feature-stat-strip">
        <div className="feature-stat-chip">
          <strong>{Math.round(recovery.volume_multiplier * 100)}%</strong>
          <span>Volume</span>
        </div>
        <div className="feature-stat-chip">
          <strong>{Math.round(recovery.rest_multiplier * 100)}%</strong>
          <span>Rest</span>
        </div>
        <div className="feature-stat-chip">
          <strong>{recovery.priority_limiter}</strong>
          <span>Priority limiter</span>
        </div>
      </div>

      <div className="delivery-box">
        <div><strong>Range control:</strong> {recovery.range_control.target}</div>
        <div><strong>Training dose:</strong> {recovery.training_dose.dose}</div>
        <div><strong>Timing guidance:</strong> {recovery.timing_guidance.timing_note}</div>
        <div><strong>Recovery rebound:</strong> {recovery.recovery_rebound.note}</div>
        <div><strong>Coaching tone:</strong> {recovery.coaching_tone}</div>
      </div>

      <div className="delivery-box">
        <div><strong>Energy budget</strong></div>
        <div className="feature-note-list">
          <span className="feature-note-chip">Warm-up {recovery.energy_budgeting.warmup}%</span>
          <span className="feature-note-chip">Main work {recovery.energy_budgeting.main_work}%</span>
          <span className="feature-note-chip">Recovery {recovery.energy_budgeting.recovery}%</span>
        </div>
      </div>

      <div className="delivery-box">
        <div><strong>Short readiness checks</strong></div>
        <div className="feature-note-list">
          {recovery.micro_assessments.map((assessment) => (
            <span key={assessment} className="feature-note-chip">{assessment}</span>
          ))}
        </div>
      </div>

      <div className="delivery-box">
        <div><strong>Decision signals</strong></div>
        <div className="feature-note-list">
          {recovery.adaptation_signals.map((signal) => (
            <span key={signal.model} className="feature-note-chip">{signal.model}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

function WorkoutExerciseCard({ match, index }: { match: WorkoutExerciseMatch; index: number }) {
  const title = match.exercise?.name || match.slug.replace(/_/g, ' ')
  const schemeText = `${match.sets}x${match.reps}`
  const equipmentKeys = match.exercise?.equipment?.map((item) => item.name) || (match.equipment ? [match.equipment] : [])
  const muscles = match.exercise?.muscle_groups || match.target_muscles || []
  const animationProfile = buildGeneratedExerciseAnimationProfile({
    slug: match.slug,
    title,
    equipment: equipmentKeys,
    muscles,
    defaultScheme: schemeText,
  })
  const demoUrl = match.exercise?.video_url || match.exercise?.gif_url || match.exercise?.image_url || match.exercise?.demo_search_url

  return (
    <div className="exercise-card">
      <div className="exercise-layout">
        <ExerciseAnimationCard profile={animationProfile} schemeText={schemeText} compact />

        <div className="exercise-body">
          <div className="exercise-header">
            <div>
              <div className="exercise-name">
                {index + 1}. {title}
              </div>
              <div className="exercise-meta">
                <span>{match.sets} sets</span>
                <span>·</span>
                <span>{match.reps} reps</span>
                <span>·</span>
                <span>{match.rest_seconds}s rest</span>
              </div>
            </div>
            <div className="result-badges">
              <span className="status-badge secondary">{schemeText}</span>
              <span className="status-badge">{match.rest_seconds}s rest</span>
            </div>
          </div>

          {((match.exercise?.description && !match.exercise.description.includes('Auto-created canonical')) || match.notes) && (
            <p className="muted-paragraph top-gap-8">
              {match.exercise?.description && !match.exercise.description.includes('Auto-created canonical') ? match.exercise.description : match.notes}
            </p>
          )}

          {(match.exercise?.instructions || match.exercise?.tips) && (
            <div className="delivery-box">
              {match.exercise?.instructions && <div><strong>How:</strong> {match.exercise.instructions}</div>}
              {match.exercise?.tips && <div><strong>Cue:</strong> {match.exercise.tips}</div>}
            </div>
          )}

          <div className="exercise-meta top-gap-10">
            <span>
              Equipment: {(match.exercise?.equipment?.map((item) => item.display_name).join(', ')) || match.equipment?.replace(/_/g, ' ') || 'Bodyweight'}
            </span>
            <span className="media-status">
              {match.exercise?.video_url || match.exercise?.gif_url || match.exercise?.image_url ? 'Media attached' : 'Media link fallback ready'}
            </span>
          </div>

          {demoUrl && (
            <a href={demoUrl} target="_blank" rel="noreferrer" className="exercise-demo-link top-gap-10">
              Open demo reference
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
