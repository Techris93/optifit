import { useEffect, useState } from 'react'
import { ChevronRight, Clock, Dumbbell, RefreshCw, Save, Target } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import ExerciseMediaPreview from '../components/ExerciseMediaPreview'
import VisionStatusBadge from '../components/VisionStatusBadge'
import { generateWorkout, getEquipmentTypes, saveGeneratedWorkout } from '../utils/api'
import type { WorkoutExerciseMatch, WorkoutGenerationResponse } from '../types'
import routinePreview from '../assets/stitch/ai_generated_workout_routine.jpg'

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
    <div>
      <div className="card page-hero-card">
        <div className="hero-shell">
          <div className="hero-content">
            <div className="hero-kicker">Plan with precision</div>
            <h1>Workout Builder</h1>
            <p className="hero-copy">Choose available equipment, set your training objective, and generate a session you can run immediately with practical sets, reps, and rest timings.</p>
            <div className="page-status-row">
              <VisionStatusBadge mode={source === 'scan' ? detectionMode : 'manual'} />
            </div>
          </div>
          <div className="hero-visual">
            <img src={routinePreview} alt="Workout routine preview" loading="lazy" decoding="async" />
          </div>
        </div>
      </div>

      {!result ? (
        <>
          <div className="card">
          <div className="card-title">1. Pick Your Equipment</div>
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
            <div className="card-title">2. Set Your Goal</div>

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
              setSuccessMessage(`Workout saved with id ${saved.id}.`)
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

  return (
    <div className="card">
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

      {successMessage && <div className="card top-gap-16">{successMessage}</div>}

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

function WorkoutExerciseCard({ match, index }: { match: WorkoutExerciseMatch; index: number }) {
  const title = match.exercise?.name || match.slug.replace(/_/g, ' ')

  return (
    <div className="exercise-card">
      <div className="exercise-layout">
        <ExerciseMediaPreview exercise={match.exercise} title={title} />

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
            <ChevronRight size={18} color="var(--text-muted)" />
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
        </div>
      </div>
    </div>
  )
}
