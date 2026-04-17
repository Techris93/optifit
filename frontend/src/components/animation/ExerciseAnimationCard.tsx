import type { AnimationMuscle, ExerciseAnimationProfile } from '../../data/exerciseAnimations'
import { isBackDominantAnimationProfile } from '../../data/exerciseAnimations'

type ExerciseAnimationCardProps = {
  profile: ExerciseAnimationProfile
  schemeText?: string
  compact?: boolean
}

export default function ExerciseAnimationCard({ profile, schemeText, compact = false }: ExerciseAnimationCardProps) {
  const cardClassName = compact ? 'exercise-animation-card compact' : 'exercise-animation-card'
  const stageClassName = profile.tone === 'red' ? 'exercise-animation-stage tone-red' : 'exercise-animation-stage tone-blue'
  const cueList = compact ? profile.cues.slice(0, 2) : profile.cues

  return (
    <section className={cardClassName}>
      <div className={stageClassName}>
        <div className="exercise-animation-stage-header">
          <span className="exercise-animation-chip">{profile.highlightLabel || 'Anatomical motion pack'}</span>
          <span className="exercise-animation-equipment">{profile.equipmentLabel}</span>
        </div>

        <div className="exercise-animation-canvas">
          <MotionFigure profile={profile} />
          <div className="exercise-animation-scheme">{schemeText || profile.defaultScheme}</div>
        </div>
      </div>

      <div className="exercise-animation-panel">
        <div className="exercise-animation-copy">
          <div className="exercise-animation-title-row">
            <strong>{profile.title}</strong>
            <span className="exercise-animation-motion">{profile.motionKind}</span>
          </div>
          <p>{profile.subtitle}</p>
        </div>

        <div className="exercise-animation-map">
          <MuscleTargetMap profile={profile} />
        </div>

        <div className="exercise-animation-cues">
          {cueList.map((cue) => (
            <div key={cue} className="exercise-animation-cue">
              {cue}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function MuscleTargetMap({ profile }: { profile: ExerciseAnimationProfile }) {
  const backView = isBackDominantAnimationProfile(profile)
  const active = (muscle: AnimationMuscle | AnimationMuscle[]) => {
    const targets = Array.isArray(muscle) ? muscle : [muscle]
    return targets.some((entry) => profile.muscles.includes(entry) || profile.muscles.includes('full_body'))
  }
  const toneClass = profile.tone === 'red' ? 'muscle-hot red' : 'muscle-hot blue'

  if (backView) {
    return (
      <svg viewBox="0 0 220 240" className="muscle-map-svg" role="img" aria-label="Highlighted target muscles">
        <circle cx="110" cy="30" r="18" className="muscle-body-base" />
        <path d="M82 54 C94 48, 126 48, 138 54 L150 96 C154 114, 142 132, 126 138 L94 138 C78 132, 66 114, 70 96 Z" className="muscle-body-base" />
        <rect x="74" y="56" width="15" height="68" rx="8" className="muscle-body-base" />
        <rect x="131" y="56" width="15" height="68" rx="8" className="muscle-body-base" />
        <rect x="92" y="138" width="16" height="72" rx="9" className="muscle-body-base" />
        <rect x="112" y="138" width="16" height="72" rx="9" className="muscle-body-base" />

        <path d="M96 58 L124 58 L135 82 L85 82 Z" className={active(['upper_back', 'rear_deltoids']) ? toneClass : 'muscle-body-soft'} />
        <path d="M82 84 L102 84 L98 132 L82 120 Z" className={active(['back', 'lats']) ? toneClass : 'muscle-body-soft'} />
        <path d="M138 84 L118 84 L122 132 L138 120 Z" className={active(['back', 'lats']) ? toneClass : 'muscle-body-soft'} />
        <ellipse cx="82" cy="67" rx="12" ry="10" className={active('rear_deltoids') ? toneClass : 'muscle-body-soft'} />
        <ellipse cx="138" cy="67" rx="12" ry="10" className={active('rear_deltoids') ? toneClass : 'muscle-body-soft'} />
        <ellipse cx="100" cy="150" rx="13" ry="11" className={active('glutes') ? toneClass : 'muscle-body-soft'} />
        <ellipse cx="120" cy="150" rx="13" ry="11" className={active('glutes') ? toneClass : 'muscle-body-soft'} />
        <rect x="93" y="162" width="13" height="34" rx="6" className={active('hamstrings') ? toneClass : 'muscle-body-soft'} />
        <rect x="114" y="162" width="13" height="34" rx="6" className={active('hamstrings') ? toneClass : 'muscle-body-soft'} />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 220 240" className="muscle-map-svg" role="img" aria-label="Highlighted target muscles">
      <circle cx="110" cy="30" r="18" className="muscle-body-base" />
      <path d="M82 54 C94 48, 126 48, 138 54 L150 96 C154 114, 142 132, 126 138 L94 138 C78 132, 66 114, 70 96 Z" className="muscle-body-base" />
      <rect x="74" y="56" width="15" height="68" rx="8" className="muscle-body-base" />
      <rect x="131" y="56" width="15" height="68" rx="8" className="muscle-body-base" />
      <rect x="92" y="138" width="16" height="72" rx="9" className="muscle-body-base" />
      <rect x="112" y="138" width="16" height="72" rx="9" className="muscle-body-base" />

      <ellipse cx="88" cy="66" rx="13" ry="11" className={active('shoulders') ? toneClass : 'muscle-body-soft'} />
      <ellipse cx="132" cy="66" rx="13" ry="11" className={active('shoulders') ? toneClass : 'muscle-body-soft'} />
      <ellipse cx="92" cy="90" rx="16" ry="18" className={active('chest') ? toneClass : 'muscle-body-soft'} />
      <ellipse cx="128" cy="90" rx="16" ry="18" className={active('chest') ? toneClass : 'muscle-body-soft'} />
      <rect x="76" y="88" width="12" height="34" rx="6" className={active(['biceps', 'triceps']) ? toneClass : 'muscle-body-soft'} />
      <rect x="132" y="88" width="12" height="34" rx="6" className={active(['biceps', 'triceps']) ? toneClass : 'muscle-body-soft'} />
      <rect x="97" y="118" width="26" height="40" rx="12" className={active(['abs', 'core']) ? toneClass : 'muscle-body-soft'} />
      <rect x="94" y="160" width="14" height="34" rx="6" className={active(['quadriceps', 'hip_flexors']) ? toneClass : 'muscle-body-soft'} />
      <rect x="112" y="160" width="14" height="34" rx="6" className={active(['quadriceps', 'hip_flexors']) ? toneClass : 'muscle-body-soft'} />
    </svg>
  )
}

function MotionFigure({ profile }: { profile: ExerciseAnimationProfile }) {
  switch (profile.motionKind) {
    case 'hinge':
      return <HingeMotion tone={profile.tone} />
    case 'lunge':
      return <LungeMotion tone={profile.tone} />
    case 'plank':
      return <PlankMotion tone={profile.tone} />
    case 'press':
      return <PressMotion tone={profile.tone} />
    case 'pull':
      return <PullMotion tone={profile.tone} />
    case 'row':
      return <RowMotion tone={profile.tone} />
    case 'squat':
      return <SquatMotion tone={profile.tone} />
    default:
      return <RowMotion tone={profile.tone} />
  }
}

function PressMotion({ tone }: { tone: ExerciseAnimationProfile['tone'] }) {
  return (
    <svg viewBox="0 0 320 220" className="motion-figure-svg" role="img" aria-label="Press motion animation">
      <line x1="44" y1="172" x2="278" y2="172" className="motion-equipment" />
      <rect x="106" y="160" width="98" height="9" rx="4.5" className="motion-equipment" />
      <g className="motion-frame motion-frame-a">
        <circle cx="80" cy="148" r="10" className="motion-head" />
        <line x1="90" y1="148" x2="144" y2="148" className="motion-limb" />
        <line x1="144" y1="148" x2="182" y2="130" className="motion-limb" />
        <line x1="144" y1="148" x2="182" y2="164" className="motion-limb" />
        <line x1="182" y1="130" x2="220" y2="122" className="motion-limb" />
        <line x1="182" y1="164" x2="220" y2="172" className="motion-limb" />
        <line x1="145" y1="148" x2="164" y2="172" className="motion-limb" />
        <line x1="145" y1="148" x2="190" y2="172" className="motion-limb" />
        <ellipse cx="145" cy="146" rx="24" ry="12" className={`motion-accent ${tone}`} />
        <circle cx="225" cy="121" r="10" className="motion-weight" />
        <circle cx="225" cy="173" r="10" className="motion-weight" />
      </g>
      <g className="motion-frame motion-frame-b">
        <circle cx="80" cy="148" r="10" className="motion-head" />
        <line x1="90" y1="148" x2="144" y2="148" className="motion-limb" />
        <line x1="144" y1="148" x2="188" y2="112" className="motion-limb" />
        <line x1="144" y1="148" x2="188" y2="112" className="motion-limb" />
        <line x1="188" y1="112" x2="224" y2="92" className="motion-limb" />
        <line x1="188" y1="112" x2="224" y2="132" className="motion-limb" />
        <line x1="145" y1="148" x2="164" y2="172" className="motion-limb" />
        <line x1="145" y1="148" x2="190" y2="172" className="motion-limb" />
        <ellipse cx="145" cy="146" rx="24" ry="12" className={`motion-accent ${tone}`} />
        <circle cx="228" cy="90" r="10" className="motion-weight" />
        <circle cx="228" cy="135" r="10" className="motion-weight" />
      </g>
    </svg>
  )
}

function RowMotion({ tone }: { tone: ExerciseAnimationProfile['tone'] }) {
  return (
    <svg viewBox="0 0 320 220" className="motion-figure-svg" role="img" aria-label="Row motion animation">
      <line x1="58" y1="176" x2="262" y2="176" className="motion-floor" />
      <g className="motion-frame motion-frame-a">
        <circle cx="116" cy="92" r="10" className="motion-head" />
        <line x1="122" y1="100" x2="170" y2="132" className="motion-limb" />
        <line x1="170" y1="132" x2="212" y2="140" className="motion-limb" />
        <line x1="170" y1="132" x2="132" y2="146" className="motion-limb" />
        <line x1="132" y1="146" x2="98" y2="170" className="motion-limb" />
        <line x1="170" y1="132" x2="196" y2="170" className="motion-limb" />
        <line x1="152" y1="120" x2="206" y2="128" className="motion-limb" />
        <line x1="206" y1="128" x2="244" y2="144" className="motion-limb" />
        <ellipse cx="170" cy="128" rx="20" ry="12" className={`motion-accent ${tone}`} />
        <circle cx="248" cy="146" r="10" className="motion-weight" />
      </g>
      <g className="motion-frame motion-frame-b">
        <circle cx="116" cy="92" r="10" className="motion-head" />
        <line x1="122" y1="100" x2="170" y2="132" className="motion-limb" />
        <line x1="170" y1="132" x2="212" y2="140" className="motion-limb" />
        <line x1="170" y1="132" x2="132" y2="146" className="motion-limb" />
        <line x1="132" y1="146" x2="98" y2="170" className="motion-limb" />
        <line x1="170" y1="132" x2="196" y2="170" className="motion-limb" />
        <line x1="152" y1="120" x2="188" y2="112" className="motion-limb" />
        <line x1="188" y1="112" x2="220" y2="110" className="motion-limb" />
        <ellipse cx="170" cy="128" rx="20" ry="12" className={`motion-accent ${tone}`} />
        <circle cx="224" cy="110" r="10" className="motion-weight" />
      </g>
    </svg>
  )
}

function SquatMotion({ tone }: { tone: ExerciseAnimationProfile['tone'] }) {
  return (
    <svg viewBox="0 0 320 220" className="motion-figure-svg" role="img" aria-label="Squat motion animation">
      <line x1="52" y1="182" x2="268" y2="182" className="motion-floor" />
      <g className="motion-frame motion-frame-a">
        <circle cx="160" cy="64" r="12" className="motion-head" />
        <line x1="160" y1="76" x2="160" y2="118" className="motion-limb" />
        <line x1="160" y1="92" x2="126" y2="102" className="motion-limb" />
        <line x1="160" y1="92" x2="194" y2="102" className="motion-limb" />
        <line x1="160" y1="118" x2="138" y2="154" className="motion-limb" />
        <line x1="160" y1="118" x2="182" y2="154" className="motion-limb" />
        <line x1="138" y1="154" x2="128" y2="180" className="motion-limb" />
        <line x1="182" y1="154" x2="192" y2="180" className="motion-limb" />
        <circle cx="160" cy="96" r="12" className="motion-weight" />
        <ellipse cx="160" cy="122" rx="18" ry="26" className={`motion-accent ${tone}`} />
      </g>
      <g className="motion-frame motion-frame-b">
        <circle cx="160" cy="76" r="12" className="motion-head" />
        <line x1="160" y1="88" x2="160" y2="132" className="motion-limb" />
        <line x1="160" y1="102" x2="124" y2="112" className="motion-limb" />
        <line x1="160" y1="102" x2="196" y2="112" className="motion-limb" />
        <line x1="160" y1="132" x2="124" y2="156" className="motion-limb" />
        <line x1="160" y1="132" x2="196" y2="156" className="motion-limb" />
        <line x1="124" y1="156" x2="120" y2="182" className="motion-limb" />
        <line x1="196" y1="156" x2="200" y2="182" className="motion-limb" />
        <circle cx="160" cy="106" r="12" className="motion-weight" />
        <ellipse cx="160" cy="132" rx="20" ry="28" className={`motion-accent ${tone}`} />
      </g>
    </svg>
  )
}

function LungeMotion({ tone }: { tone: ExerciseAnimationProfile['tone'] }) {
  return (
    <svg viewBox="0 0 320 220" className="motion-figure-svg" role="img" aria-label="Lunge motion animation">
      <line x1="44" y1="184" x2="278" y2="184" className="motion-floor" />
      <g className="motion-frame motion-frame-a">
        <circle cx="146" cy="66" r="12" className="motion-head" />
        <line x1="146" y1="78" x2="156" y2="122" className="motion-limb" />
        <line x1="156" y1="122" x2="122" y2="150" className="motion-limb" />
        <line x1="156" y1="122" x2="198" y2="138" className="motion-limb" />
        <line x1="122" y1="150" x2="112" y2="184" className="motion-limb" />
        <line x1="198" y1="138" x2="220" y2="184" className="motion-limb" />
        <line x1="152" y1="96" x2="126" y2="110" className="motion-limb" />
        <line x1="152" y1="96" x2="182" y2="106" className="motion-limb" />
        <ellipse cx="156" cy="122" rx="18" ry="24" className={`motion-accent ${tone}`} />
      </g>
      <g className="motion-frame motion-frame-b">
        <circle cx="152" cy="60" r="12" className="motion-head" />
        <line x1="152" y1="72" x2="162" y2="114" className="motion-limb" />
        <line x1="162" y1="114" x2="128" y2="142" className="motion-limb" />
        <line x1="162" y1="114" x2="206" y2="134" className="motion-limb" />
        <line x1="128" y1="142" x2="120" y2="184" className="motion-limb" />
        <line x1="206" y1="134" x2="224" y2="184" className="motion-limb" />
        <line x1="158" y1="90" x2="132" y2="102" className="motion-limb" />
        <line x1="158" y1="90" x2="186" y2="100" className="motion-limb" />
        <ellipse cx="162" cy="116" rx="18" ry="24" className={`motion-accent ${tone}`} />
      </g>
    </svg>
  )
}

function HingeMotion({ tone }: { tone: ExerciseAnimationProfile['tone'] }) {
  return (
    <svg viewBox="0 0 320 220" className="motion-figure-svg" role="img" aria-label="Hinge motion animation">
      <line x1="48" y1="184" x2="272" y2="184" className="motion-floor" />
      <g className="motion-frame motion-frame-a">
        <circle cx="144" cy="78" r="12" className="motion-head" />
        <line x1="150" y1="86" x2="184" y2="118" className="motion-limb" />
        <line x1="184" y1="118" x2="160" y2="154" className="motion-limb" />
        <line x1="184" y1="118" x2="214" y2="156" className="motion-limb" />
        <line x1="160" y1="154" x2="154" y2="184" className="motion-limb" />
        <line x1="214" y1="156" x2="220" y2="184" className="motion-limb" />
        <line x1="174" y1="108" x2="206" y2="124" className="motion-limb" />
        <line x1="206" y1="124" x2="230" y2="160" className="motion-limb" />
        <ellipse cx="186" cy="126" rx="20" ry="24" className={`motion-accent ${tone}`} />
        <circle cx="236" cy="166" r="12" className="motion-weight" />
      </g>
      <g className="motion-frame motion-frame-b">
        <circle cx="162" cy="66" r="12" className="motion-head" />
        <line x1="162" y1="78" x2="166" y2="122" className="motion-limb" />
        <line x1="166" y1="122" x2="150" y2="160" className="motion-limb" />
        <line x1="166" y1="122" x2="188" y2="160" className="motion-limb" />
        <line x1="150" y1="160" x2="146" y2="184" className="motion-limb" />
        <line x1="188" y1="160" x2="194" y2="184" className="motion-limb" />
        <line x1="166" y1="94" x2="188" y2="82" className="motion-limb" />
        <line x1="188" y1="82" x2="204" y2="66" className="motion-limb" />
        <ellipse cx="168" cy="126" rx="20" ry="24" className={`motion-accent ${tone}`} />
        <circle cx="208" cy="64" r="12" className="motion-weight" />
      </g>
    </svg>
  )
}

function PlankMotion({ tone }: { tone: ExerciseAnimationProfile['tone'] }) {
  return (
    <svg viewBox="0 0 320 220" className="motion-figure-svg" role="img" aria-label="Plank motion animation">
      <line x1="38" y1="176" x2="284" y2="176" className="motion-floor" />
      <g className="motion-frame motion-frame-a">
        <circle cx="88" cy="116" r="10" className="motion-head" />
        <line x1="96" y1="118" x2="150" y2="128" className="motion-limb" />
        <line x1="150" y1="128" x2="206" y2="132" className="motion-limb" />
        <line x1="102" y1="128" x2="88" y2="170" className="motion-limb" />
        <line x1="142" y1="128" x2="128" y2="170" className="motion-limb" />
        <line x1="206" y1="132" x2="238" y2="170" className="motion-limb" />
        <line x1="180" y1="132" x2="162" y2="170" className="motion-limb" />
        <ellipse cx="154" cy="130" rx="22" ry="12" className={`motion-accent ${tone}`} />
      </g>
      <g className="motion-frame motion-frame-b">
        <circle cx="88" cy="116" r="10" className="motion-head" />
        <line x1="96" y1="118" x2="150" y2="128" className="motion-limb" />
        <line x1="150" y1="128" x2="198" y2="136" className="motion-limb" />
        <line x1="102" y1="128" x2="88" y2="170" className="motion-limb" />
        <line x1="142" y1="128" x2="128" y2="170" className="motion-limb" />
        <line x1="198" y1="136" x2="218" y2="110" className="motion-limb" />
        <line x1="198" y1="136" x2="178" y2="170" className="motion-limb" />
        <ellipse cx="150" cy="132" rx="22" ry="12" className={`motion-accent ${tone}`} />
      </g>
    </svg>
  )
}

function PullMotion({ tone }: { tone: ExerciseAnimationProfile['tone'] }) {
  return (
    <svg viewBox="0 0 320 220" className="motion-figure-svg" role="img" aria-label="Pull motion animation">
      <line x1="82" y1="42" x2="236" y2="42" className="motion-equipment" />
      <g className="motion-frame motion-frame-a">
        <circle cx="160" cy="88" r="10" className="motion-head" />
        <line x1="146" y1="42" x2="150" y2="110" className="motion-limb" />
        <line x1="174" y1="42" x2="170" y2="110" className="motion-limb" />
        <line x1="150" y1="110" x2="140" y2="152" className="motion-limb" />
        <line x1="170" y1="110" x2="180" y2="152" className="motion-limb" />
        <line x1="140" y1="152" x2="136" y2="184" className="motion-limb" />
        <line x1="180" y1="152" x2="184" y2="184" className="motion-limb" />
        <ellipse cx="160" cy="118" rx="20" ry="28" className={`motion-accent ${tone}`} />
      </g>
      <g className="motion-frame motion-frame-b">
        <circle cx="160" cy="62" r="10" className="motion-head" />
        <line x1="146" y1="42" x2="150" y2="90" className="motion-limb" />
        <line x1="174" y1="42" x2="170" y2="90" className="motion-limb" />
        <line x1="150" y1="90" x2="142" y2="136" className="motion-limb" />
        <line x1="170" y1="90" x2="178" y2="136" className="motion-limb" />
        <line x1="142" y1="136" x2="138" y2="184" className="motion-limb" />
        <line x1="178" y1="136" x2="182" y2="184" className="motion-limb" />
        <ellipse cx="160" cy="102" rx="20" ry="26" className={`motion-accent ${tone}`} />
      </g>
    </svg>
  )
}
