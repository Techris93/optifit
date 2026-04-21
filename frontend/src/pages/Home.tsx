import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Camera,
  CheckCircle2,
  Clock3,
  History,
  PlayCircle,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import ExerciseAnimationGallery from '../components/animation/ExerciseAnimationGallery'
import VisionStatusBadge from '../components/VisionStatusBadge'
import { enableAnalyze } from '../config'
import { getFeaturedExerciseAnimationProfiles } from '../data/exerciseAnimations'
import type { HealthStatus, HomeSummary } from '../types'
import { getHealthStatus, getHomeSummary } from '../utils/api'

const workflow = [
  {
    icon: Camera,
    title: 'Scan your space',
    text: 'Upload a few photos or a short clip, then let OptiFit identify what is actually available in front of you.',
  },
  {
    icon: CheckCircle2,
    title: 'Confirm the gear',
    text: 'Keep the equipment you want to use, remove anything incorrect, and move into workout planning with a clean inventory.',
  },
  {
    icon: Target,
    title: 'Set the goal',
    text: 'Choose the training outcome, experience level, and available time window instead of starting from a generic template.',
  },
  {
    icon: TrendingUp,
    title: 'Train and track',
    text: 'Save the session, revisit it later, and log the work so progression stays visible over time.',
  },
]

const capabilities = [
  {
    icon: Sparkles,
    title: 'Equipment-aware planning',
    description:
      'The workout builder stays grounded in the tools you actually have access to instead of assuming a perfect gym setup.',
  },
  {
    icon: PlayCircle,
    title: 'Embedded exercise media',
    description:
      'Workout cards and the exercise library carry demos and visual references forward so execution stays as clear as planning.',
  },
  {
    icon: History,
    title: 'Scoped progress history',
    description:
      'Guest and signed-in activity stay isolated, which makes saved workouts and progress tracking safe to use across sessions.',
  },
  {
    icon: BookOpen,
    title: 'Usable exercise library',
    description:
      'Search by muscle group, difficulty, and keywords while keeping instructions, coach notes, and equipment guidance one click away.',
  },
]

const faqs = [
  {
    question: 'What is the fastest way to get value from OptiFit?',
    answer:
      'If you already know your equipment, open the workout builder and generate immediately. If you are in a new gym or hotel gym, start with the scanner so the plan is grounded in what is there.',
  },
  {
    question: 'Do I need a full gym setup?',
    answer:
      'No. OptiFit is built for imperfect environments: home gyms, apartment gyms, hotel gyms, and bodyweight-focused setups all work.',
  },
  {
    question: 'Can I keep using the product without signing in?',
    answer:
      'Yes. Guest sessions can save workouts and log progress in a session-scoped workspace, and signed-in users can keep those flows tied to an account.',
  },
  {
    question: 'How does the media layer help during training?',
    answer:
      'The saved workout detail, library cards, and matched exercise previews all keep the exercise references close to the decision point so you spend less time context-switching.',
  },
]

const launchpads = [
  {
    title: 'Analyze your space',
    description: 'Use computer vision to confirm the equipment around you before planning the session.',
    route: enableAnalyze ? '/analyze' : '/workouts',
    cta: enableAnalyze ? 'Open scanner' : 'Open builder',
  },
  {
    title: 'Build a session',
    description: 'Select your gear, training goal, difficulty, and duration to generate a usable workout fast.',
    route: '/workouts',
    cta: 'Generate workout',
  },
  {
    title: 'Review saved sessions',
    description: 'Reopen scoped workouts, inspect the exercise stack, and rebuild from the same equipment setup.',
    route: '/saved',
    cta: 'Open saved',
  },
  {
    title: 'Browse the library',
    description: 'Search exercises, inspect media, and learn movement details without leaving the product.',
    route: '/exercises',
    cta: 'Explore exercises',
  },
]

function formatDate(value?: string | null) {
  if (!value) return 'Just now'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function humanize(value?: string | null) {
  if (!value) return 'Unspecified'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function Home() {
  const [summary, setSummary] = useState<HomeSummary | null>(null)
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const featuredProfiles = getFeaturedExerciseAnimationProfiles(4)

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
  const stats = summary?.stats ?? {
    saved_workouts: 0,
    exercise_library_total: 0,
    progress_entries: 0,
    active_days_30: 0,
  }
  const recentWorkouts = summary?.recent_saved_workouts ?? []
  const recentProgress = summary?.recent_progress ?? []
  const latestWorkout = recentWorkouts[0]
  const scopeLabel =
    summary?.scope === 'user' ? 'Signed-in workspace' : summary?.scope === 'guest' ? 'Guest workspace' : 'Fresh workspace'

  const headlineStats = useMemo(
    () => [
      { label: 'Saved sessions', value: stats.saved_workouts },
      { label: 'Library exercises', value: stats.exercise_library_total },
      { label: 'Logged entries', value: stats.progress_entries },
      { label: 'Active days / 30', value: stats.active_days_30 },
    ],
    [stats]
  )

  return (
    <div className="home-page">
      <section className="card home-hero-panel">
        <video className="home-hero-video" autoPlay muted loop playsInline poster="" aria-hidden="true">
          <source src="/videos/hero-training.mp4" type="video/mp4" />
        </video>
        <div className="home-hero-overlay" aria-hidden="true" />
        <div className="home-hero-grid">
          <div className="home-hero-copy">
            <div className="hero-kicker">Pro fitness infrastructure</div>
            <div className="home-hero-status-row">
              <VisionStatusBadge mode={detectionMode} />
              <span className="home-inline-badge">{scopeLabel}</span>
            </div>
            <h1>Turn the equipment in front of you into a workout you can actually do.</h1>
            <p className="hero-copy home-hero-description">
              OptiFit merges the strongest ideas from the downloaded concept work with the real product underneath it:
              scan the room, confirm the gear, generate the plan, save the session, and keep the progress measurable.
            </p>
            <div className="hero-actions">
              <Link to={enableAnalyze ? '/analyze' : '/workouts'} className="btn btn-primary btn-large">
                {enableAnalyze ? 'Start AI Scan' : 'Start with equipment picker'}
                <ArrowRight size={18} />
              </Link>
              <Link to="/workouts" className="btn btn-secondary btn-large">
                Manual selection
                <ArrowRight size={18} />
              </Link>
              {latestWorkout && (
                <Link to="/saved" className="btn btn-secondary btn-large">
                  Resume saved session
                  <ArrowRight size={18} />
                </Link>
              )}
            </div>
            <div className="home-proof-points">
              <span>AI-guided equipment capture</span>
              <span>Professional workout generation</span>
              <span>Scoped progress tracking</span>
            </div>
          </div>

          <aside className="home-command-card">
            <div className="home-command-header">
              <span>Workspace overview</span>
              <strong>{scopeLabel}</strong>
            </div>
            <div className="home-command-grid">
              {headlineStats.map((item) => (
                <div key={item.label} className="home-command-stat">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
            <div className="home-command-panel">
              <div className="home-command-panel-title">Latest saved workout</div>
              {latestWorkout ? (
                <div className="home-command-item">
                  <strong>{latestWorkout.name}</strong>
                  <span>
                    {humanize(latestWorkout.goal)} • {latestWorkout.estimated_duration_minutes ?? 0} min • {formatDate(latestWorkout.created_at)}
                  </span>
                </div>
              ) : (
                <div className="home-command-empty">
                  Generate and save a workout to make this command center feel alive.
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section className="home-stat-grid">
        {headlineStats.map((item) => (
          <article key={item.label} className="card home-stat-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="home-main-grid">
        <div className="card home-launchpad-panel">
          <div className="home-section-copy">
            <div className="card-title zero-margin">Launchpads</div>
            <p className="muted-paragraph">
              The real product routes are the point of this redesign. Each path below leads to a working part of OptiFit.
            </p>
          </div>
          <div className="launchpad-grid home-launchpad-grid">
            {launchpads.map((item) => (
              <Link key={item.title} to={item.route} className="launchpad-card home-launchpad-card">
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <span className="launchpad-link">
                  {item.cta}
                  <ArrowRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card home-activity-panel">
          <div className="home-activity-column">
            <div className="home-section-copy">
              <div className="card-title zero-margin">Recent saved workouts</div>
              <p className="muted-paragraph">Session-scoped summaries from the new backend home overview route.</p>
            </div>
            {recentWorkouts.length === 0 ? (
              <div className="home-empty-state">No saved sessions yet. Build one from the workout generator to populate this rail.</div>
            ) : (
              <div className="home-activity-list">
                {recentWorkouts.map((workout) => (
                  <article key={workout.id} className="home-activity-card">
                    <div className="home-activity-topline">
                      <strong>{workout.name}</strong>
                      <span>{workout.estimated_duration_minutes ?? 0} min</span>
                    </div>
                    <p>{workout.description || 'Saved generated workout ready to reopen.'}</p>
                    <div className="home-activity-meta">
                      <span>{humanize(workout.goal)}</span>
                      <span>{humanize(workout.difficulty)}</span>
                      <span>{formatDate(workout.created_at)}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="home-activity-column">
            <div className="home-section-copy">
              <div className="card-title zero-margin">Recent training activity</div>
              <p className="muted-paragraph">Progress entries now respect guest-session boundaries instead of mixing anonymous histories.</p>
            </div>
            {recentProgress.length === 0 ? (
              <div className="home-empty-state">No logged sets yet. Use the progress screen to start building a measurable history.</div>
            ) : (
              <div className="home-activity-list">
                {recentProgress.map((entry) => (
                  <article key={entry.id} className="home-activity-card">
                    <div className="home-activity-topline">
                      <strong>{entry.exercise_name}</strong>
                      <span>{formatDate(entry.created_at)}</span>
                    </div>
                    <p>
                      {entry.sets_completed} sets logged
                      {entry.total_volume > 0 ? ` • ${entry.total_volume} ${entry.weight_unit} total volume` : ' • Bodyweight or unloaded session'}
                    </p>
                    <div className="home-activity-meta">
                      <span>Exercise #{entry.exercise_id}</span>
                      <span>{entry.weight_unit.toUpperCase()}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="card home-section-panel">
        <div className="home-section-copy">
          <div className="hero-kicker">Capabilities</div>
          <h2 className="home-section-title">Built for the way people really train.</h2>
          <p className="muted-paragraph">
            The downloaded concept emphasized cinematic storytelling; the product underneath now backs that up with scoped data, working routes, and a clearer product narrative.
          </p>
        </div>
        <div className="home-feature-grid">
          {capabilities.map(({ icon: Icon, title, description }) => (
            <article key={title} className="home-feature-card">
              <div className="step-icon">
                <Icon size={18} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card home-section-panel">
        <div className="home-section-copy">
          <div className="hero-kicker">Workflow</div>
          <h2 className="home-section-title">From scan to sweat in a clean four-step system.</h2>
          <p className="muted-paragraph">This flow is lifted from the strongest parts of the downloaded concept work and mapped onto the live product routes.</p>
        </div>
        <div className="home-workflow-grid">
          {workflow.map(({ icon: Icon, title, text }, index) => (
            <article key={title} className="home-workflow-card">
              <div className="home-workflow-index">0{index + 1}</div>
              <div className="home-workflow-copy">
                <div className="step-icon">
                  <Icon size={18} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {featuredProfiles.length > 0 && (
        <section className="card home-section-panel home-gallery-panel">
          <div className="home-section-copy">
            <div className="hero-kicker">Motion packs</div>
            <h2 className="home-section-title">Exercise visuals that carry into saved sessions and the library.</h2>
            <p className="muted-paragraph">
              The anatomical motion cards remain one of the strongest pieces of the existing app, so the redesign keeps them as a high-value product surface.
            </p>
          </div>
          <ExerciseAnimationGallery profiles={featuredProfiles} compact />
        </section>
      )}

      <section className="card home-showcase-panel">
        <video className="home-showcase-video" autoPlay muted loop playsInline aria-hidden="true">
          <source src="/videos/showcase-training.mp4" type="video/mp4" />
        </video>
        <div className="home-showcase-overlay" aria-hidden="true" />
        <div className="home-showcase-content">
          <div className="hero-kicker">See it in motion</div>
          <h2 className="home-section-title">A sharper front door without disconnecting from the product underneath.</h2>
          <p className="muted-paragraph">
            The showcase section uses the downloaded video assets directly and positions OptiFit as a serious product instead of a stitched-together demo.
          </p>
          <div className="home-proof-points home-proof-points-contrast">
            <span>Downloaded hero media integrated</span>
            <span>Real backend data supporting the homepage</span>
            <span>Saved-session detail now carries prescription data</span>
          </div>
        </div>
      </section>

      <section className="card home-section-panel">
        <div className="home-section-copy">
          <div className="hero-kicker">FAQ</div>
          <h2 className="home-section-title">The product questions that matter most.</h2>
        </div>
        <div className="home-faq-list">
          {faqs.map((faq) => (
            <details key={faq.question} className="home-faq-item">
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="card home-cta-panel">
        <div className="home-section-copy">
          <div className="hero-kicker">Ready to train</div>
          <h2 className="home-section-title">Use the route that matches how you want to start.</h2>
          <p className="muted-paragraph">
            Start with AI scan if the environment is unknown. Start with manual equipment selection if you already know the setup and want a workout right away.
          </p>
        </div>
        <div className="hero-actions">
          <Link to={enableAnalyze ? '/analyze' : '/workouts'} className="btn btn-primary btn-large">
            {enableAnalyze ? 'Open scanner' : 'Open workout builder'}
            <ArrowRight size={18} />
          </Link>
          <Link to="/saved" className="btn btn-secondary btn-large">
            Review saved sessions
            <ArrowRight size={18} />
          </Link>
          <Link to="/progress" className="btn btn-secondary btn-large">
            Track progress
            <Clock3 size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
