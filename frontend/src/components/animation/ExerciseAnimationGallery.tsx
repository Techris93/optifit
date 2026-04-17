import type { ExerciseAnimationProfile } from '../../data/exerciseAnimations'
import ExerciseAnimationCard from './ExerciseAnimationCard'

type ExerciseAnimationGalleryProps = {
  profiles: ExerciseAnimationProfile[]
  compact?: boolean
}

export default function ExerciseAnimationGallery({ profiles, compact = false }: ExerciseAnimationGalleryProps) {
  if (profiles.length === 0) {
    return null
  }

  const className = compact ? 'exercise-animation-gallery compact' : 'exercise-animation-gallery'

  return (
    <div className={className}>
      {profiles.map((profile) => (
        <ExerciseAnimationCard key={profile.slug} profile={profile} compact={compact} />
      ))}
    </div>
  )
}
