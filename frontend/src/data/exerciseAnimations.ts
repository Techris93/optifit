import upperBodyPressMotion from '../assets/animations/upper-body-press.json'

export type AnimationMuscle = 'chest' | 'shoulders' | 'triceps' | 'core'

export type ExerciseAnimationProfile = {
  slug: string
  title: string
  subtitle: string
  animationData: string
  muscles: AnimationMuscle[]
  cues: string[]
  equipmentLabel: string
}

const profiles: Record<string, ExerciseAnimationProfile> = {
  push_ups: {
    slug: 'push_ups',
    title: 'Push-up Motion Guide',
    subtitle: 'Animation-ready prototype with a front-body muscle emphasis overlay for pressing mechanics.',
    animationData: JSON.stringify(upperBodyPressMotion),
    muscles: ['chest', 'shoulders', 'triceps', 'core'],
    equipmentLabel: 'Bodyweight',
    cues: [
      'Brace your trunk before each rep.',
      'Keep elbows slightly tucked instead of flaring wide.',
      'Move chest and hips together to keep tension on the line of push.'
    ]
  }
}

export function getExerciseAnimationProfile(slug?: string | null) {
  if (!slug) return null
  return profiles[slug] ?? null
}
