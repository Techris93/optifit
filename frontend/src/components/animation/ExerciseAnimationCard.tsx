import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { Sparkles } from 'lucide-react'
import type { ExerciseAnimationProfile, AnimationMuscle } from '../../data/exerciseAnimations'

type ExerciseAnimationCardProps = {
  profile: ExerciseAnimationProfile
}

const activeMuscleSet = (muscles: AnimationMuscle[]) => new Set(muscles)

export default function ExerciseAnimationCard({ profile }: ExerciseAnimationCardProps) {
  const highlighted = activeMuscleSet(profile.muscles)

  return (
    <section className="exercise-animation-card">
      <div className="exercise-animation-stage">
        <div className="exercise-animation-stage-header">
          <span className="exercise-animation-chip">Animation Prototype</span>
          <span className="exercise-animation-equipment">{profile.equipmentLabel}</span>
        </div>
        <div className="exercise-animation-canvas">
          <DotLottieReact
            data={profile.animationData}
            loop
            autoplay
          />
        </div>
      </div>

      <div className="exercise-animation-panel">
        <div className="exercise-animation-copy">
          <div className="exercise-animation-title-row">
            <Sparkles size={16} />
            <strong>{profile.title}</strong>
          </div>
          <p>{profile.subtitle}</p>
        </div>

        <div className="exercise-animation-map">
          <MuscleTargetMap highlighted={highlighted} />
        </div>

        <div className="exercise-animation-cues">
          {profile.cues.map((cue) => (
            <div key={cue} className="exercise-animation-cue">
              {cue}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function MuscleTargetMap({ highlighted }: { highlighted: Set<AnimationMuscle> }) {
  const isActive = (muscle: AnimationMuscle) => highlighted.has(muscle)

  return (
    <svg viewBox="0 0 220 280" className="muscle-map-svg" role="img" aria-label="Highlighted target muscles">
      <circle cx="110" cy="38" r="22" className="muscle-body-base" />
      <path d="M85 66 C92 58, 128 58, 135 66 L144 108 C146 118, 138 130, 128 132 L92 132 C82 130, 74 118, 76 108 Z" className="muscle-body-base" />
      <rect x="70" y="72" width="16" height="78" rx="8" className="muscle-body-base" />
      <rect x="134" y="72" width="16" height="78" rx="8" className="muscle-body-base" />
      <rect x="92" y="132" width="16" height="92" rx="10" className="muscle-body-base" />
      <rect x="112" y="132" width="16" height="92" rx="10" className="muscle-body-base" />
      <ellipse cx="93" cy="78" rx="15" ry="13" className={isActive('shoulders') ? 'muscle-hot' : 'muscle-body-soft'} />
      <ellipse cx="127" cy="78" rx="15" ry="13" className={isActive('shoulders') ? 'muscle-hot' : 'muscle-body-soft'} />
      <ellipse cx="95" cy="98" rx="17" ry="18" className={isActive('chest') ? 'muscle-hot' : 'muscle-body-soft'} />
      <ellipse cx="125" cy="98" rx="17" ry="18" className={isActive('chest') ? 'muscle-hot' : 'muscle-body-soft'} />
      <rect x="71" y="102" width="13" height="34" rx="6" className={isActive('triceps') ? 'muscle-hot' : 'muscle-body-soft'} />
      <rect x="136" y="102" width="13" height="34" rx="6" className={isActive('triceps') ? 'muscle-hot' : 'muscle-body-soft'} />
      <rect x="97" y="130" width="26" height="46" rx="12" className={isActive('core') ? 'muscle-hot' : 'muscle-body-soft'} />
    </svg>
  )
}
