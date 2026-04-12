import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Award, Calendar, TrendingUp } from 'lucide-react'
import { getProgressHistory, logProgress, searchExercises } from '../utils/api'
import type { Exercise, ProgressHistoryResponse } from '../types'
import progressPreview from '../assets/stitch/progress_tracking_dashboard.jpg'

export default function Progress() {
  const [timeRange, setTimeRange] = useState('30')
  const [history, setHistory] = useState<ProgressHistoryResponse | null>(null)
  const [exerciseOptions, setExerciseOptions] = useState<Exercise[]>([])
  const [exerciseId, setExerciseId] = useState<number | ''>('')
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState('10,10,10')
  const [weights, setWeights] = useState('0,0,0')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = async (days: number) => {
    setLoading(true)
    setError(null)

    try {
      const data = await getProgressHistory({ days })
      setHistory(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadHistory(Number(timeRange))
  }, [timeRange])

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const data = await searchExercises({})
        setExerciseOptions(data.exercises)
      } catch (err) {
        console.error('Failed to load exercise options', err)
      }
    }

    void loadExercises()
  }, [])

  const submitLog = async () => {
    if (!exerciseId) {
      setError('Select an exercise before logging progress.')
      return
    }

    const repsPerSet = reps.split(',').map((item) => Number(item.trim())).filter((item) => !Number.isNaN(item))
    const weightPerSet = weights.split(',').map((item) => Number(item.trim())).filter((item) => !Number.isNaN(item))

    if (repsPerSet.length === 0 || weightPerSet.length === 0) {
      setError('Enter comma-separated reps and weights, for example 10,10,8.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await logProgress({
        exercise_id: Number(exerciseId),
        sets_completed: sets,
        reps_per_set: repsPerSet,
        weight_per_set: weightPerSet,
        notes,
      })
      setNotes('')
      await loadHistory(Number(timeRange))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save progress')
    } finally {
      setSubmitting(false)
    }
  }

  const latestEntries = history?.entries.slice(0, 5) ?? []

  return (
    <div>
      <div className="card page-hero-card">
        <div className="hero-shell">
          <div className="hero-content">
            <div className="hero-kicker">Measure consistency</div>
            <h1>Progress Tracking</h1>
            <p className="hero-copy">Log each session, track volume trends, and keep recent activity visible so progression stays objective.</p>
          </div>
          <div className="hero-visual">
            <img src={progressPreview} alt="Progress dashboard interface preview" loading="lazy" decoding="async" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Log a Session</div>
        <div className="preference-grid">
          <div>
            <label className="field-label">Exercise</label>
            <select
              className="field-control"
              value={exerciseId}
              onChange={(event) => setExerciseId(event.target.value ? Number(event.target.value) : '')}
            >
              <option value="">Select an exercise</option>
              {exerciseOptions.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Sets completed</label>
            <input className="field-control" type="number" min="1" value={sets} onChange={(event) => setSets(Number(event.target.value))} />
          </div>
        </div>

        <div className="preference-grid top-gap-16">
          <div>
            <label className="field-label">Reps per set</label>
            <input className="field-control" value={reps} onChange={(event) => setReps(event.target.value)} />
          </div>
          <div>
            <label className="field-label">Weight per set</label>
            <input className="field-control" value={weights} onChange={(event) => setWeights(event.target.value)} />
          </div>
        </div>

        <div className="top-gap-16">
          <label className="field-label">Notes</label>
          <textarea className="field-control textarea-control" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>

        {error && <div className="card error-card top-gap-16">{error}</div>}

        <button type="button" className="btn btn-primary top-gap-16" onClick={submitLog} disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Progress'}
        </button>
      </div>

      <div className="card">
        <div className="stats-grid">
          <StatCard icon={<Calendar size={24} color="var(--primary)" />} value={history?.consistency.workouts_logged ?? 0} label="Logged Sessions" />
          <StatCard icon={<TrendingUp size={24} color="var(--secondary)" />} value={`${history?.total_volume.total_volume ?? 0} ${history?.total_volume.unit ?? 'kg'}`} label="Total Volume" />
          <StatCard icon={<Award size={24} color="var(--warning)" />} value={history?.consistency.unique_workout_days ?? 0} label="Active Days" />
        </div>
      </div>

      <div className="card">
        <div className="result-header">
          <div className="card-title zero-margin">Recent Activity</div>
          <select className="field-control compact-control" value={timeRange} onChange={(event) => setTimeRange(event.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
          </select>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : latestEntries.length === 0 ? (
          <p className="muted-paragraph">No workouts logged in this period yet.</p>
        ) : (
          latestEntries.map((entry) => (
            <div key={entry.id} className="exercise-card">
              <div className="exercise-header">
                <div className="exercise-name">
                  {exerciseOptions.find((exercise) => exercise.id === entry.exercise_id)?.name || `Exercise #${entry.exercise_id}`}
                </div>
                <div className="exercise-meta">
                  <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="exercise-meta">
                <span>{entry.sets_completed} sets</span>
                <span>{entry.reps_per_set.join(', ')} reps</span>
                <span>{entry.weight_per_set.join(', ')} {entry.weight_unit}</span>
              </div>
              {entry.notes && <p className="muted-paragraph top-gap-8">{entry.notes}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
