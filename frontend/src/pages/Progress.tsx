import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Award, Calendar, Minus, Plus, TrendingUp } from 'lucide-react'
import { getProgressHistory, logProgress, searchExercises } from '../utils/api'
import type { Exercise, ProgressHistoryResponse } from '../types'
import progressPreview from '../assets/stitch/progress_tracking_dashboard.jpg'

type SetRow = {
  reps: string
  weight: string
}

const createSetRows = (count: number): SetRow[] =>
  Array.from({ length: count }, () => ({ reps: '10', weight: '0' }))

export default function Progress() {
  const [timeRange, setTimeRange] = useState('30')
  const [history, setHistory] = useState<ProgressHistoryResponse | null>(null)
  const [exerciseOptions, setExerciseOptions] = useState<Exercise[]>([])
  const [exerciseId, setExerciseId] = useState<number | ''>('')
  const [setRows, setSetRows] = useState<SetRow[]>(() => createSetRows(3))
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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

    const repsPerSet = setRows.map((row) => Number(row.reps.trim()))
    const weightPerSet = setRows.map((row) => Number(row.weight.trim()))

    if (
      repsPerSet.length === 0 ||
      weightPerSet.length === 0 ||
      repsPerSet.some((item) => !Number.isFinite(item) || item <= 0) ||
      weightPerSet.some((item) => !Number.isFinite(item) || item < 0)
    ) {
      setError('Enter valid reps and weight values for each set before saving.')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await logProgress({
        exercise_id: Number(exerciseId),
        sets_completed: setRows.length,
        reps_per_set: repsPerSet,
        weight_per_set: weightPerSet,
        weight_unit: weightUnit,
        notes,
      })
      setNotes('')
      setSuccessMessage('Session saved.')
      await loadHistory(Number(timeRange))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save progress')
    } finally {
      setSubmitting(false)
    }
  }

  const latestEntries = history?.entries.slice(0, 5) ?? []
  const consistencyRate = history?.consistency.consistency_percentage ?? 0

  const updateSetRow = (index: number, field: keyof SetRow, value: string) => {
    setSetRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row))
    )
  }

  const addSetRow = () => {
    setSetRows((current) => {
      const lastRow = current[current.length - 1]
      return [...current, { reps: lastRow?.reps || '10', weight: lastRow?.weight || '0' }]
    })
  }

  const removeSetRow = () => {
    setSetRows((current) => (current.length > 1 ? current.slice(0, -1) : current))
  }

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
            <label className="field-label">Weight unit</label>
            <select className="field-control" value={weightUnit} onChange={(event) => setWeightUnit(event.target.value as 'kg' | 'lbs')}>
              <option value="kg">kg</option>
              <option value="lbs">lbs</option>
            </select>
          </div>
        </div>

        <div className="set-rows-header top-gap-16">
          <label className="field-label zero-margin">Set details</label>
          <div className="set-rows-actions">
            <button type="button" className="mini-action-button" onClick={removeSetRow} disabled={setRows.length <= 1}>
              <Minus size={14} />
              Remove set
            </button>
            <button type="button" className="mini-action-button" onClick={addSetRow} disabled={setRows.length >= 12}>
              <Plus size={14} />
              Add set
            </button>
          </div>
        </div>

        <div className="set-row-grid">
          {setRows.map((row, index) => (
            <div key={`set-row-${index}`} className="set-row-card">
              <div className="set-row-index">Set {index + 1}</div>
              <div className="set-row-fields">
                <div>
                  <label className="field-label">Reps</label>
                  <input
                    className="field-control"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={row.reps}
                    onChange={(event) => updateSetRow(index, 'reps', event.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">Weight ({weightUnit})</label>
                  <input
                    className="field-control"
                    type="number"
                    min="0"
                    step="0.5"
                    inputMode="decimal"
                    value={row.weight}
                    onChange={(event) => updateSetRow(index, 'weight', event.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="top-gap-16">
          <label className="field-label">Notes</label>
          <textarea className="field-control textarea-control" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>

        {error && <div className="card error-card top-gap-16">{error}</div>}
        {successMessage && <div className="card top-gap-16">{successMessage}</div>}

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
        <div className="progress-highlight-row">
          <div className="progress-highlight-card">
            <span>Consistency</span>
            <strong>{consistencyRate}%</strong>
          </div>
          <div className="progress-highlight-card">
            <span>Latest window</span>
            <strong>{timeRange} days</strong>
          </div>
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
