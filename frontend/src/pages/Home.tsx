import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Archive,
  BarChart3,
  BookOpen,
  Brain,
  Camera,
  ClipboardList,
  Dumbbell,
  Moon,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import VisionStatusBadge from '../components/VisionStatusBadge'
import { enableAnalyze } from '../config'
import type { HealthStatus, HomeSummary } from '../types'
import { getHealthStatus, getHomeSummary } from '../utils/api'

const steps = [
  {
    icon: Camera,
    title: 'Upload',
    text: 'Take photos of your gym equipment.',
  },
  {
    icon: Brain,
    title: 'Analyze',
    text: 'Identify and confirm your gear list.',
  },
  {
    icon: ClipboardList,
    title: 'Check',
    text: 'Add sleep, soreness, mood, fuel, load, and timing.',
  },
  {
    icon: Sparkles,
    title: 'Generate',
    text: 'Build a workout for your equipment, goals, and readiness.',
  },
  {
    icon: Dumbbell,
    title: 'Deliver',
    text: 'Get a routine with instructions and demos.',
  },
]

function formatDate(value?: string | null) {
  if (!value) return 'No activity yet'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No activity yet'

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export default function Home() {
  const [summary, setSummary] = useState<HomeSummary | null>(null)
  const [health, setHealth] = useState<HealthStatus | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const [summaryResult, healthResult] = await Promise.allSettled([getHomeSummary(), getHealthStatus()])

      if (cancelled) return

      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value)
      }

      if (healthResult.status === 'fulfilled') {
        setHealth(healthResult.value)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const detectionMode = summary?.detection_mode ?? health?.detection_mode ?? (enableAnalyze ? 'local' : 'manual')
  const recentWorkout = summary?.recent_saved_workouts?.[0]
  const recentProgress = summary?.recent_progress?.[0]

  return (
    <div className="home-screen">
      <section className="home-hero-card">
        <div className="home-hero-copy-block">
          <div className="home-hero-meta">
            <VisionStatusBadge mode={detectionMode} />
          </div>
          <h1 className="home-hero-title">Turn the equipment in front of you into a workout you can actually do.</h1>
          <p className="home-hero-text">
            OptiFit helps you scan your gear, confirm the list, check recovery signals, and generate a practical
            workout with readiness-aware volume, rest, timing, coaching, and exercise demos.
          </p>
          <div className="home-hero-actions">
            <Link to={enableAnalyze ? '/analyze' : '/workouts'} className="home-hero-primary">
              <Camera size={20} />
              <span>{enableAnalyze ? 'Start AI Scan' : 'Start Workout Builder'}</span>
              <ArrowRight size={20} />
            </Link>
            <Link to="/workouts" className="home-hero-secondary">
              <Sparkles size={20} />
              <span>Manual Selection</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-heading">How It Works</div>
        <div className="how-it-works-strip">
          {steps.map(({ icon: Icon, title, text }) => (
            <article key={title} className="how-card">
              <div className="how-card-icon">
                <Icon size={28} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-heading">Quick Access</div>
        <div className="home-quick-grid">
          {enableAnalyze && (
            <Link to="/analyze" className="home-quick-card">
              <div className="home-quick-icon">
                <Camera size={20} />
              </div>
              <div>
                <strong>Analyze</strong>
                <p>Scan your space and confirm available gear</p>
              </div>
            </Link>
          )}

          <Link to="/workouts" className="home-quick-card">
            <div className="home-quick-icon">
              <Moon size={20} />
            </div>
            <div>
              <strong>Adaptive Recovery</strong>
              <p>Generate a workout from sleep, soreness, mood, fuel, load, and timing</p>
            </div>
          </Link>

          <Link to="/saved" className="home-quick-card">
            <div className="home-quick-icon">
              <Archive size={20} />
            </div>
            <div>
              <strong>Saved Workouts</strong>
              <p>{summary?.stats.saved_workouts ?? 0} sessions saved</p>
            </div>
          </Link>

          <Link to="/exercises" className="home-quick-card">
            <div className="home-quick-icon">
              <BookOpen size={20} />
            </div>
            <div>
              <strong>Exercises</strong>
              <p>{summary?.stats.exercise_library_total ?? 0} library entries</p>
            </div>
          </Link>

          <Link to="/progress" className="home-quick-card">
            <div className="home-quick-icon">
              <BarChart3 size={20} />
            </div>
            <div>
              <strong>Progress</strong>
              <p>{summary?.stats.progress_entries ?? 0} logged sessions</p>
            </div>
          </Link>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-heading">Your Workspace</div>
        <div className="home-stack">
          <article className="home-detail-card">
            <div className="home-detail-top">
              <strong>Latest Saved Workout</strong>
              <span>{formatDate(recentWorkout?.created_at)}</span>
            </div>
            {recentWorkout ? (
              <>
                <h3>{recentWorkout.name}</h3>
                <p>{recentWorkout.description || 'Saved generated workout ready to reopen.'}</p>
                <Link to="/saved" className="home-inline-link">
                  Open saved workouts
                  <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <p>Generate and save a workout to make this section useful.</p>
            )}
          </article>

          <article className="home-detail-card">
            <div className="home-detail-top">
              <strong>Recent Progress</strong>
              <span>{summary?.stats.active_days_30 ?? 0} active days</span>
            </div>
            {recentProgress ? (
              <>
                <h3>{recentProgress.exercise_name}</h3>
                <p>
                  {recentProgress.sets_completed} sets logged
                  {recentProgress.total_volume > 0
                    ? ` • ${recentProgress.total_volume} ${recentProgress.weight_unit} total volume`
                    : ' • bodyweight or unloaded session'}
                </p>
                <Link to="/progress" className="home-inline-link">
                  Open progress
                  <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <p>Log your first session to start building a measurable training history.</p>
            )}
          </article>
        </div>
      </section>
    </div>
  )
}
