import type { ExerciseAnimationProfile } from '../../data/exerciseAnimations'
import ExerciseAnimationCard from './ExerciseAnimationCard'

type ExerciseAnimationWorkoutGridProps = {
  profiles: ExerciseAnimationProfile[]
}

export default function ExerciseAnimationWorkoutGrid({ profiles }: ExerciseAnimationWorkoutGridProps) {
  const layoutProfiles = profiles.slice(0, 7)

  if (layoutProfiles.length === 0) {
    return null
  }

  const [featuredProfile, ...supportingProfiles] = layoutProfiles

  return (
    <section className="anatomical-workout-board">
      <div className="anatomical-workout-board-header">
        <div>
          <div className="hero-kicker">Matched motion packs</div>
          <h3>Recommended Workout Grid</h3>
          <p>
            A larger anatomy-first board built from your confirmed equipment, designed to feel closer to the multi-tile workout references.
          </p>
        </div>
        <span className="anatomical-workout-board-count">{layoutProfiles.length} packs</span>
      </div>

      <div className="anatomical-workout-board-grid">
        <div className="anatomical-workout-board-featured">
          <ExerciseAnimationCard profile={featuredProfile} compact />
        </div>

        {supportingProfiles.length > 0 && (
          <div className="anatomical-workout-board-supporting">
            {supportingProfiles.map((profile) => (
              <ExerciseAnimationCard key={profile.slug} profile={profile} compact />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
