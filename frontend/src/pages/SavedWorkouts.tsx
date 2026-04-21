import { useEffect, useMemo, useState } from 'react'
import { Archive, Clock3, Dumbbell, RefreshCw, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import ExerciseAnimationCard from '../components/animation/ExerciseAnimationCard'
import { buildGeneratedExerciseAnimationProfile } from '../data/exerciseAnimations'
import type { SavedWorkoutDetail, SavedWorkoutSummary } from '../types'
import { getSavedWorkout, getSavedWorkouts } from '../utils/api'

function humanize(value?: string | null) {
  if (!value) return 'Unspecified'
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatSavedDate(value?: string | null) {
  if (!value) return 'Unknown'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function buildWorkoutRoute(equipment: string[]) {
  if (equipment.length === 0) {
    return '/workouts'
  }

  const params = new URLSearchParams({ equipment: equipment.join(',') })
  return `/workouts?${params.toString()}`
}

export default function SavedWorkouts() {
  const [workouts, setWorkouts] = useState<SavedWorkoutSummary[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedWorkout, setSelectedWorkout] = useState<SavedWorkoutDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadWorkoutDetail(workoutId: number) {
    setSelectedId(workoutId)
    setDetailLoading(true)
    setError(null)

    try {
      const data = await getSavedWorkout(workoutId)
      setSelectedWorkout(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved workout details')
    } finally {
      setDetailLoading(false)
    }
  }

  async function loadWorkouts() {
    setLoading(true)
    setError(null)

    try {
      const data = await getSavedWorkouts()
      setWorkouts(data)

      if (data.length === 0) {
        setSelectedId(null)
        setSelectedWorkout(null)
        return
      }

      const nextSelectedId = selectedId && data.some((workout) => workout.id === selectedId)
        ? selectedId
        : data[0].id

      await loadWorkoutDetail(nextSelectedId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved workouts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadWorkouts()
  }, [])

  const previewCards = useMemo(() => {
    return (selectedWorkout?.exercises ?? []).map((exercise) => ({
      exercise,
      profile: buildGeneratedExerciseAnimationProfile({
        slug: exercise.slug,
        title: exercise.name,
        equipment: exercise.equipment?.map((item) => item.name) ?? [],
        muscles: exercise.muscle_groups ?? [],
      }),
    }))
  }, [selectedWorkout])

  return (
    <div>
      <section className="card page-hero-card">
        <div className="hero-shell">
          <div className="hero-content">
            <div className="hero-kicker">Owned and scoped</div>
            <h1>Saved Workouts</h1>
            <p className="hero-copy">
              This view is now bound to the current user or guest session, so you can safely review only the workouts that belong to this scope.
            </p>
            <div className="page-status-row saved-hero-actions">
              <button type="button" className="btn btn-secondary" onClick={() => void loadWorkouts()} disabled={loading || detailLoading}>
                <RefreshCw size={16} className={loading || detailLoading ? 'spinning' : ''} />
                Refresh list
              </button>
              <Link to="/workouts" className="btn btn-primary">
                <Sparkles size={16} />
                Build new workout
              </Link>
            </div>
          </div>
          <div className="saved-hero-stat-card">
            <div className="saved-hero-stat-label">Saved sessions</div>
            <strong>{workouts.length}</strong>
            <span>Scoped to this current session or signed-in account.</span>
          </div>
        </div>
      </section>

      {error && <div className="card error-card">{error}</div>}

      {loading ? (
        <div className="card saved-workout-loading">
          <RefreshCw size={18} className="spinning" />
          Loading saved workouts...
        </div>
      ) : workouts.length === 0 ? (
        <section className="card saved-workout-empty-state">
          <Archive size={28} />
          <h2>No saved workouts yet</h2>
          <p>
            Generate a workout first, then save it. Once saved, it will appear here and stay isolated to the correct owner scope.
          </p>
          <Link to="/workouts" className="btn btn-primary btn-large">
            Build your first workout
          </Link>
        </section>
      ) : (
        <section className="saved-workouts-layout">
          <aside className="card saved-workout-sidebar">
            <div className="saved-workout-sidebar-header">
              <div className="card-title">Saved Session List</div>
              <span>{workouts.length} total</span>
            </div>

            <div className="saved-workout-list">
              {workouts.map((workout) => {
                const isActive = workout.id === selectedId
                return (
                  <button
                    key={workout.id}
                    type="button"
                    className={`saved-workout-list-item${isActive ? ' active' : ''}`}
                    onClick={() => void loadWorkoutDetail(workout.id)}
                  >
                    <div className="saved-workout-list-top">
                      <strong>{workout.name}</strong>
                      <span>{workout.estimated_duration_minutes ?? 0} min</span>
                    </div>
                    <p>{workout.description || 'Saved generated workout ready to reopen.'}</p>
                    <div className="saved-workout-list-meta">
                      <span>{humanize(workout.goal)}</span>
                      <span>{humanize(workout.difficulty)}</span>
                      <span>{formatSavedDate(workout.created_at)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          <div className="card saved-workout-detail-card">
            {detailLoading && !selectedWorkout ? (
              <div className="saved-workout-loading">
                <RefreshCw size={18} className="spinning" />
                Loading workout detail...
              </div>
            ) : selectedWorkout ? (
              <>
                <div className="saved-workout-detail-header">
                  <div>
                    <div className="hero-kicker">Saved session detail</div>
                    <h2>{selectedWorkout.name}</h2>
                    <p className="muted-paragraph">
                      {selectedWorkout.description || 'Saved generated workout ready for reuse or regeneration.'}
                    </p>
                  </div>
                  <div className="saved-workout-detail-actions">
                    <Link to={buildWorkoutRoute(selectedWorkout.equipment_used ?? [])} className="btn btn-primary">
                      <Sparkles size={16} />
                      Rebuild from this setup
                    </Link>
                  </div>
                </div>

                <div className="saved-workout-meta-grid">
                  <div className="saved-meta-chip">
                    <Clock3 size={15} />
                    {selectedWorkout.estimated_duration_minutes ?? 0} min
                  </div>
                  <div className="saved-meta-chip">
                    <Sparkles size={15} />
                    {humanize(selectedWorkout.goal)}
                  </div>
                  <div className="saved-meta-chip">
                    <Dumbbell size={15} />
                    {humanize(selectedWorkout.difficulty)}
                  </div>
                  <div className="saved-meta-chip">
                    <Archive size={15} />
                    Saved {formatSavedDate(selectedWorkout.created_at)}
                  </div>
                </div>

                <div className="equipment-tags compact top-gap-16">
                  {(selectedWorkout.equipment_used ?? []).map((item) => (
                    <span key={item} className="equipment-tag selected">
                      {item.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>

                {previewCards.length > 0 && (
                  <div className="saved-workout-preview-block">
                    <div className="card-title">Exercise Motion Preview</div>
                    <div className="saved-workout-preview-grid">
                      {previewCards.map(({ exercise, profile }, index) => (
                        <ExerciseAnimationCard key={`${exercise.slug}-${index}`} profile={profile} compact />
                      ))}
                    </div>
                  </div>
                )}

                <div className="saved-workout-exercises">
                  <div className="card-title">Exercise List</div>
                  {(selectedWorkout.exercises ?? []).map((exercise, index) => {
                    const demoUrl = exercise.video_url || exercise.gif_url || exercise.image_url || exercise.demo_search_url
                    const prescription = exercise.prescription
                    return (
                      <article key={`${exercise.slug}-${index}-detail`} className="saved-workout-exercise-row">
                        <div>
                          <strong>
                            {index + 1}. {exercise.name}
                          </strong>
                          <p>
                            {(exercise.muscle_groups ?? []).length > 0
                              ? `Targets ${(exercise.muscle_groups ?? []).join(', ').replace(/_/g, ' ')}`
                              : 'Exercise details available from the saved library entry.'}
                          </p>
                          {prescription && (
                            <div className="saved-workout-prescription-row">
                              <span>{prescription.sets} sets</span>
                              <span>{prescription.reps} reps</span>
                              <span>{prescription.rest_seconds}s rest</span>
                            </div>
                          )}
                        </div>
                        <div className="saved-workout-exercise-actions">
                          <span className="status-badge secondary">{humanize(exercise.difficulty)}</span>
                          {demoUrl && (
                            <a href={demoUrl} target="_blank" rel="noreferrer" className="exercise-demo-link">
                              Open demo
                            </a>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="saved-workout-loading">Select a saved workout to inspect it.</div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
