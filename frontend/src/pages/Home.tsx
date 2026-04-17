import { useEffect, useState } from 'react'
import { ArrowRight, Camera, Dumbbell, Sparkles, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import ExerciseAnimationGallery from '../components/animation/ExerciseAnimationGallery'
import { enableAnalyze } from '../config'
import { getFeaturedExerciseAnimationProfiles } from '../data/exerciseAnimations'
import VisionStatusBadge from '../components/VisionStatusBadge'
import type { HealthStatus } from '../types'
import { getHealthStatus } from '../utils/api'

const steps = [
  {
    icon: Camera,
    title: 'Upload',
    text: 'Upload photos of the equipment you can use right now, whether you are in a home gym or on a commercial gym floor.'
  },
  {
    icon: Video,
    title: 'Analyze',
    text: 'OptiFit identifies the visible equipment and lets you confirm the final list before generating a plan.'
  },
  {
    icon: Sparkles,
    title: 'Generate',
    text: 'Build a workout around your available gear, training goal, and time window instead of guessing what is possible.'
  },
  {
    icon: Dumbbell,
    title: 'Deliver',
    text: 'Get a structured routine with exercise instructions and demo media so you can start training immediately.'
  }
]

const launchpads = [
  {
    title: 'Analyze Your Space',
    description: 'Capture the equipment in front of you and review what the scanner finds before planning.',
    route: enableAnalyze ? '/analyze' : '/workouts',
    cta: enableAnalyze ? 'Open scanner' : 'Open builder'
  },
  {
    title: 'Build A Session',
    description: 'Choose gear, training goal, and duration to get a session you can run immediately.',
    route: '/workouts',
    cta: 'Generate workout'
  },
  {
    title: 'Saved Sessions',
    description: 'Open only the workouts scoped to your current session or account and rebuild from them quickly.',
    route: '/saved',
    cta: 'Open saved'
  },
  {
    title: 'Browse The Library',
    description: 'Search exercises, open demo media, and review instructions without leaving the app.',
    route: '/exercises',
    cta: 'Explore exercises'
  },
  {
    title: 'Track Progress',
    description: 'Log completed sets, monitor recent activity, and keep progression measurable over time.',
    route: '/progress',
    cta: 'Open progress'
  }
]

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const featuredProfiles = getFeaturedExerciseAnimationProfiles(4)

  useEffect(() => {
    getHealthStatus().then(setHealth).catch(() => undefined)
  }, [])

  return (
    <div>
      <section className="card hero-card">
        <div className="hero-shell hero-shell-text-only">
          <div className="hero-content">
            <div className="hero-kicker">Scan. Confirm. Train.</div>
            <div className="hero-status-row">
              <VisionStatusBadge mode={health?.detection_mode ?? (enableAnalyze ? 'local' : 'manual')} />
            </div>
            <h1>Turn the equipment in front of you into a workout you can actually do.</h1>
            <p className="hero-copy">
              OptiFit helps you scan the gear you have available, confirm the equipment list, and generate a practical workout with
              exercise demos. It is built for the moment when you want to train with what is actually around you.
            </p>
            <div className="hero-actions">
              {enableAnalyze ? (
                <Link to="/analyze" className="btn btn-primary btn-large">
                  Start AI Scan
                  <ArrowRight size={18} />
                </Link>
              ) : (
                <Link to="/workouts" className="btn btn-primary btn-large">
                  Start With Equipment Picker
                  <ArrowRight size={18} />
                </Link>
              )}
              <Link to="/workouts" className="btn btn-secondary btn-large">
                Manual Selection
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-title">Launchpads</div>
        <div className="launchpad-grid">
          {launchpads.map((item) => (
            <Link key={item.title} to={item.route} className="launchpad-card">
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
      </section>

      <section className="card">
        <div className="card-title">Core Flow</div>
        <div className="step-grid">
          {steps.map(({ icon: Icon, title, text }) => (
            <div key={title} className="step-card">
              <div className="step-icon">
                <Icon size={20} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-title">What You Can Do</div>
        <div className="status-list">
          <div><strong>Scan equipment:</strong> analyze photos of your setup and confirm what is available before planning</div>
          <div><strong>Generate practical workouts:</strong> build sessions around your current gear, training goal, and available time</div>
          <div><strong>Follow exercise demos:</strong> open embedded clips and guided exercise references directly from workout cards</div>
          <div><strong>Track progress:</strong> log training history and review your recent work over time</div>
          {!enableAnalyze && <div><strong>Manual mode:</strong> this deployment hides scan analysis and starts from equipment selection</div>}
        </div>
      </section>

      {featuredProfiles.length > 0 && (
        <section className="card">
          <div className="card-title">Anatomical Motion Packs</div>
          <p className="muted-paragraph">
            Curated anatomy-first workout tiles now match equipment and exercise intent instead of relying on a single generic loop.
          </p>
          <div className="top-gap-16">
            <ExerciseAnimationGallery profiles={featuredProfiles} compact />
          </div>
        </section>
      )}
    </div>
  )
}
