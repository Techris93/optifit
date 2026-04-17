export type AnimationMuscle =
  | 'abs'
  | 'back'
  | 'biceps'
  | 'chest'
  | 'core'
  | 'full_body'
  | 'glutes'
  | 'hamstrings'
  | 'hip_flexors'
  | 'lats'
  | 'quadriceps'
  | 'rear_deltoids'
  | 'shoulders'
  | 'triceps'
  | 'upper_back'

export type AnimationMotionKind = 'hinge' | 'lunge' | 'plank' | 'press' | 'pull' | 'row' | 'squat'
export type AnimationTone = 'blue' | 'red'

export type ExerciseAnimationProfile = {
  slug: string
  title: string
  subtitle: string
  muscles: AnimationMuscle[]
  equipmentLabel: string
  requiredEquipment: string[]
  requiredAnyEquipment?: string[]
  compatibleEquipment: string[]
  cues: string[]
  defaultScheme: string
  motionKind: AnimationMotionKind
  tone: AnimationTone
  highlightLabel?: string
  aliases?: string[]
}

type GeneratedAnimationInput = {
  slug?: string | null
  title?: string | null
  equipment?: string[] | string | null
  muscles?: string[] | null
  defaultScheme?: string | null
}

const bodyweightEquipment = new Set(['bodyweight', 'dip_station', 'yoga_mat'])
const backDominantMuscles = new Set<AnimationMuscle>(['back', 'glutes', 'hamstrings', 'lats', 'rear_deltoids', 'upper_back'])
const frontDominantMuscles = new Set<AnimationMuscle>(['abs', 'biceps', 'chest', 'core', 'hip_flexors', 'quadriceps', 'shoulders', 'triceps'])

const profiles: Record<string, ExerciseAnimationProfile> = {
  barbell_bench_press: {
    slug: 'barbell_bench_press',
    title: 'Barbell Bench Press',
    subtitle: 'Heavy horizontal press with chest-led recruitment and a stable bench setup.',
    muscles: ['chest', 'shoulders', 'triceps'],
    equipmentLabel: 'Barbell + Bench',
    requiredEquipment: ['barbell', 'bench'],
    compatibleEquipment: ['barbell', 'bench'],
    cues: ['Drive the bar over the sternum.', 'Keep feet planted and upper back tight.', 'Lower under control before pressing hard.'],
    defaultScheme: '5x5',
    motionKind: 'press',
    tone: 'red',
    highlightLabel: 'Strength press pack',
  },
  dumbbell_bench_press: {
    slug: 'dumbbell_bench_press',
    title: 'Dumbbell Bench Press',
    subtitle: 'Controlled chest press pattern with shoulder stability and unilateral balance.',
    muscles: ['chest', 'shoulders', 'triceps'],
    equipmentLabel: 'Dumbbells + Bench',
    requiredEquipment: ['dumbbell', 'bench'],
    compatibleEquipment: ['dumbbell', 'bench'],
    cues: ['Stack wrists over elbows.', 'Let the dumbbells travel slightly outward.', 'Squeeze the chest at the top.'],
    defaultScheme: '4x10',
    motionKind: 'press',
    tone: 'red',
    highlightLabel: 'Chest emphasis',
  },
  dumbbell_rows: {
    slug: 'dumbbell_rows',
    title: 'Dumbbell Row',
    subtitle: 'Back-dominant pulling pattern built around scapular drive and lat tension.',
    muscles: ['back', 'biceps', 'lats'],
    equipmentLabel: 'Dumbbells',
    requiredEquipment: ['dumbbell'],
    compatibleEquipment: ['dumbbell', 'bench'],
    cues: ['Pull the elbow toward the hip.', 'Keep the ribcage quiet.', 'Pause briefly at full contraction.'],
    defaultScheme: '4x10',
    motionKind: 'row',
    tone: 'blue',
    highlightLabel: 'Back pull pack',
  },
  goblet_squats: {
    slug: 'goblet_squats',
    title: 'Goblet Squat',
    subtitle: 'Front-loaded squat that cleans up posture while training quads, glutes, and bracing.',
    muscles: ['quadriceps', 'glutes', 'core'],
    equipmentLabel: 'Dumbbell or Kettlebell',
    requiredEquipment: [],
    requiredAnyEquipment: ['dumbbell', 'kettlebell'],
    compatibleEquipment: ['dumbbell', 'kettlebell'],
    cues: ['Keep the weight high on the chest.', 'Sit between the hips, not onto the toes.', 'Drive the floor away on the ascent.'],
    defaultScheme: '4x12',
    motionKind: 'squat',
    tone: 'blue',
    aliases: ['dumbbell_squats'],
    highlightLabel: 'Lower-body force',
  },
  kettlebell_swings: {
    slug: 'kettlebell_swings',
    title: 'Kettlebell Swing',
    subtitle: 'Explosive hinge pattern with glute snap, hamstring load, and braced trunk timing.',
    muscles: ['glutes', 'hamstrings', 'core'],
    equipmentLabel: 'Kettlebell',
    requiredEquipment: ['kettlebell'],
    compatibleEquipment: ['kettlebell'],
    cues: ['Hinge, do not squat the bell.', 'Project the hips forward sharply.', 'Let the bell float, not lift with the arms.'],
    defaultScheme: '5x20',
    motionKind: 'hinge',
    tone: 'blue',
    highlightLabel: 'Posterior-chain power',
  },
  push_ups: {
    slug: 'push_ups',
    title: 'Push-up Motion Guide',
    subtitle: 'Bodyweight press sequence with chest drive, shoulder control, and full-body tension.',
    muscles: ['chest', 'shoulders', 'triceps', 'core'],
    equipmentLabel: 'Bodyweight',
    requiredEquipment: ['bodyweight'],
    compatibleEquipment: ['bodyweight', 'yoga_mat'],
    cues: ['Brace before every rep.', 'Keep the elbows slightly tucked.', 'Move chest and hips together.'],
    defaultScheme: '3x15',
    motionKind: 'press',
    tone: 'red',
    highlightLabel: 'Bodyweight press',
    aliases: ['band_presses'],
  },
  plank: {
    slug: 'plank',
    title: 'Plank Hold',
    subtitle: 'Core stability hold built around abdominal brace, glute squeeze, and shoulder stacking.',
    muscles: ['abs', 'core'],
    equipmentLabel: 'Bodyweight',
    requiredEquipment: ['bodyweight'],
    compatibleEquipment: ['bodyweight', 'yoga_mat'],
    cues: ['Pull the ribs down.', 'Squeeze glutes and quads together.', 'Push the floor away to stay long.'],
    defaultScheme: '3x45s',
    motionKind: 'plank',
    tone: 'blue',
    highlightLabel: 'Core control',
  },
  bodyweight_lunges: {
    slug: 'bodyweight_lunges',
    title: 'Bodyweight Lunge',
    subtitle: 'Split-stance knee flexion pattern that targets quads and glutes with unilateral control.',
    muscles: ['quadriceps', 'glutes', 'hamstrings'],
    equipmentLabel: 'Bodyweight',
    requiredEquipment: ['bodyweight'],
    compatibleEquipment: ['bodyweight', 'yoga_mat'],
    cues: ['Drop straight down through the hips.', 'Keep front foot stable through the whole rep.', 'Drive through the full foot to stand tall.'],
    defaultScheme: '3x12/side',
    motionKind: 'lunge',
    tone: 'blue',
    aliases: ['lunges', 'dumbbell_lunges'],
    highlightLabel: 'Single-leg control',
  },
  glute_bridges: {
    slug: 'glute_bridges',
    title: 'Glute Bridge',
    subtitle: 'Bridge pattern that isolates glute drive without overextending the low back.',
    muscles: ['glutes', 'hamstrings', 'core'],
    equipmentLabel: 'Bodyweight',
    requiredEquipment: ['bodyweight'],
    compatibleEquipment: ['bodyweight', 'yoga_mat'],
    cues: ['Tuck the pelvis slightly first.', 'Press through the heels.', 'Finish by squeezing the glutes, not arching.'],
    defaultScheme: '4x15',
    motionKind: 'hinge',
    tone: 'blue',
    highlightLabel: 'Glute bridge pack',
  },
  pull_ups: {
    slug: 'pull_ups',
    title: 'Pull-up',
    subtitle: 'Vertical pull centered on lat depression, upper-back strength, and arm flexion.',
    muscles: ['back', 'biceps', 'lats', 'upper_back'],
    equipmentLabel: 'Pull-up Bar',
    requiredEquipment: ['pull_up_bar'],
    compatibleEquipment: ['pull_up_bar'],
    cues: ['Start by pulling the shoulders down.', 'Keep legs quiet and ribs stacked.', 'Drive elbows to the ribs.'],
    defaultScheme: '5x6',
    motionKind: 'pull',
    tone: 'blue',
    highlightLabel: 'Vertical pull pack',
  },
  chin_ups: {
    slug: 'chin_ups',
    title: 'Chin-up',
    subtitle: 'Supinated vertical pull with strong biceps contribution and lat-driven control.',
    muscles: ['biceps', 'lats', 'upper_back'],
    equipmentLabel: 'Pull-up Bar',
    requiredEquipment: ['pull_up_bar'],
    compatibleEquipment: ['pull_up_bar'],
    cues: ['Keep the chest tall toward the bar.', 'Lead with the elbows down and back.', 'Control the full lowering phase.'],
    defaultScheme: '4x8',
    motionKind: 'pull',
    tone: 'blue',
    highlightLabel: 'Arm-biased pull pack',
  },
  band_rows: {
    slug: 'band_rows',
    title: 'Band Row',
    subtitle: 'Elastic-resistance row pattern with mid-back squeeze and controlled retraction.',
    muscles: ['back', 'biceps', 'upper_back'],
    equipmentLabel: 'Resistance Band',
    requiredEquipment: ['resistance_band'],
    compatibleEquipment: ['resistance_band'],
    cues: ['Lead with the elbows, not the wrists.', 'Pause when shoulder blades meet.', 'Return slowly against band tension.'],
    defaultScheme: '3x20',
    motionKind: 'row',
    tone: 'blue',
    highlightLabel: 'Band pull pack',
  },
  band_face_pulls: {
    slug: 'band_face_pulls',
    title: 'Band Face Pull',
    subtitle: 'Upper-back and rear-delt pull for posture, scapular balance, and cuff-friendly volume.',
    muscles: ['rear_deltoids', 'upper_back', 'back'],
    equipmentLabel: 'Resistance Band',
    requiredEquipment: ['resistance_band'],
    compatibleEquipment: ['resistance_band'],
    cues: ['Pull toward forehead height.', 'Rotate thumbs behind you at the finish.', 'Keep ribs down as the band comes in.'],
    defaultScheme: '3x15',
    motionKind: 'row',
    tone: 'blue',
    highlightLabel: 'Rear-delt emphasis',
  },
  band_squats: {
    slug: 'band_squats',
    title: 'Band Squat',
    subtitle: 'Resistance-assisted squat variation suited for high-rep lower-body density work.',
    muscles: ['quadriceps', 'glutes'],
    equipmentLabel: 'Resistance Band',
    requiredEquipment: ['resistance_band'],
    compatibleEquipment: ['resistance_band'],
    cues: ['Stay stacked through the ribcage.', 'Push knees out against the band line.', 'Finish each rep with full hip extension.'],
    defaultScheme: '3x20',
    motionKind: 'squat',
    tone: 'blue',
    highlightLabel: 'Band lower-body pack',
  },
  dumbbell_shoulder_press: {
    slug: 'dumbbell_shoulder_press',
    title: 'Dumbbell Shoulder Press',
    subtitle: 'Vertical press sequence with shoulder and triceps drive under a stable core.',
    muscles: ['shoulders', 'triceps', 'core'],
    equipmentLabel: 'Dumbbells',
    requiredEquipment: ['dumbbell'],
    compatibleEquipment: ['dumbbell'],
    cues: ['Press in a slight arc, not straight behind you.', 'Keep ribs stacked over pelvis.', 'Finish with biceps near ears.'],
    defaultScheme: '4x8',
    motionKind: 'press',
    tone: 'red',
    highlightLabel: 'Overhead press pack',
  },
  barbell_rows: {
    slug: 'barbell_rows',
    title: 'Barbell Row',
    subtitle: 'Heavy horizontal pull that builds lats, upper back, and braced torso control.',
    muscles: ['back', 'lats', 'biceps'],
    equipmentLabel: 'Barbell',
    requiredEquipment: ['barbell'],
    compatibleEquipment: ['barbell'],
    cues: ['Keep the torso fixed and hinged.', 'Drive elbows toward the hips.', 'Pause before lowering under control.'],
    defaultScheme: '4x8',
    motionKind: 'row',
    tone: 'blue',
    aliases: ['barbell_row'],
    highlightLabel: 'Barbell pull pack',
  },
  barbell_squats: {
    slug: 'barbell_squats',
    title: 'Barbell Back Squat',
    subtitle: 'Foundational squat pattern for lower-body strength, trunk stiffness, and force production.',
    muscles: ['quadriceps', 'glutes', 'core'],
    equipmentLabel: 'Barbell',
    requiredEquipment: ['barbell'],
    compatibleEquipment: ['barbell', 'squat_rack'],
    cues: ['Brace before the descent.', 'Sit between the hips and keep the chest proud.', 'Drive straight up through the mid-foot.'],
    defaultScheme: '5x5',
    motionKind: 'squat',
    tone: 'blue',
    highlightLabel: 'Strength squat pack',
  },
  barbell_deadlifts: {
    slug: 'barbell_deadlifts',
    title: 'Barbell Deadlift',
    subtitle: 'Posterior-chain hinge built on hip drive, hamstring load, and full-body tension.',
    muscles: ['glutes', 'hamstrings', 'back', 'core'],
    equipmentLabel: 'Barbell',
    requiredEquipment: ['barbell'],
    compatibleEquipment: ['barbell'],
    cues: ['Wedge into the bar before you pull.', 'Push the floor away and keep the bar close.', 'Lock out with glutes, not lower-back extension.'],
    defaultScheme: '5x3',
    motionKind: 'hinge',
    tone: 'blue',
    highlightLabel: 'Posterior-chain strength',
  },
  barbell_overhead_press: {
    slug: 'barbell_overhead_press',
    title: 'Barbell Overhead Press',
    subtitle: 'Standing press variation that trains stacked bracing, shoulder strength, and triceps drive.',
    muscles: ['shoulders', 'triceps', 'core'],
    equipmentLabel: 'Barbell',
    requiredEquipment: ['barbell'],
    compatibleEquipment: ['barbell'],
    cues: ['Squeeze glutes and ribs down before pressing.', 'Press the bar in a straight path over mid-foot.', 'Finish with biceps beside the ears.'],
    defaultScheme: '5x5',
    motionKind: 'press',
    tone: 'red',
    highlightLabel: 'Standing press pack',
  },
  dumbbell_lunges: {
    slug: 'dumbbell_lunges',
    title: 'Dumbbell Lunge',
    subtitle: 'Loaded split-stance pattern for unilateral leg strength and balance under tension.',
    muscles: ['quadriceps', 'glutes', 'hamstrings'],
    equipmentLabel: 'Dumbbells',
    requiredEquipment: ['dumbbell'],
    compatibleEquipment: ['dumbbell'],
    cues: ['Keep the dumbbells quiet at the sides.', 'Drop straight down instead of reaching forward.', 'Drive through the front foot to return tall.'],
    defaultScheme: '3x10/side',
    motionKind: 'lunge',
    tone: 'blue',
    highlightLabel: 'Loaded split-stance pack',
  },
  dumbbell_romanian_deadlifts: {
    slug: 'dumbbell_romanian_deadlifts',
    title: 'Dumbbell Romanian Deadlift',
    subtitle: 'Controlled hinge for hamstring length, glute drive, and trunk stability.',
    muscles: ['glutes', 'hamstrings', 'back'],
    equipmentLabel: 'Dumbbells',
    requiredEquipment: ['dumbbell'],
    compatibleEquipment: ['dumbbell'],
    cues: ['Slide the hips back with soft knees.', 'Keep the dumbbells close to the legs.', 'Stand up by squeezing through the glutes.'],
    defaultScheme: '4x10',
    motionKind: 'hinge',
    tone: 'blue',
    highlightLabel: 'Hinge control pack',
  },
  kettlebell_rows: {
    slug: 'kettlebell_rows',
    title: 'Kettlebell Row',
    subtitle: 'Single-arm pull using lat tension, upper-back control, and trunk anti-rotation.',
    muscles: ['back', 'lats', 'biceps'],
    equipmentLabel: 'Kettlebell',
    requiredEquipment: ['kettlebell'],
    compatibleEquipment: ['kettlebell', 'bench'],
    cues: ['Brace the support side hard.', 'Pull the handle toward the pocket.', 'Lower slowly to keep the lat loaded.'],
    defaultScheme: '4x10',
    motionKind: 'row',
    tone: 'blue',
    aliases: ['kettlebell_row'],
    highlightLabel: 'Single-arm pull pack',
  },
  kettlebell_turkish_get_ups: {
    slug: 'kettlebell_turkish_get_ups',
    title: 'Turkish Get-up',
    subtitle: 'Full-body control sequence combining shoulder stability, trunk rotation, and lunge mechanics.',
    muscles: ['shoulders', 'core', 'glutes', 'full_body'],
    equipmentLabel: 'Kettlebell',
    requiredEquipment: ['kettlebell'],
    compatibleEquipment: ['kettlebell', 'yoga_mat'],
    cues: ['Keep the loaded arm vertical at every step.', 'Roll to the elbow before you sit up.', 'Stand and reverse each position with control.'],
    defaultScheme: '3x3/side',
    motionKind: 'lunge',
    tone: 'red',
    highlightLabel: 'Total-body control',
  },
  hanging_leg_raises: {
    slug: 'hanging_leg_raises',
    title: 'Hanging Leg Raise',
    subtitle: 'Hanging core sequence with hip-flexor drive and lower-abdominal control.',
    muscles: ['abs', 'core', 'hip_flexors'],
    equipmentLabel: 'Pull-up Bar',
    requiredEquipment: ['pull_up_bar'],
    compatibleEquipment: ['pull_up_bar'],
    cues: ['Set the shoulders before the legs move.', 'Raise with the abs, not momentum.', 'Lower slowly to avoid swinging.'],
    defaultScheme: '4x10',
    motionKind: 'pull',
    tone: 'red',
    highlightLabel: 'Hanging core pack',
  },
  hanging_knee_raises: {
    slug: 'hanging_knee_raises',
    title: 'Hanging Knee Raise',
    subtitle: 'Accessible hanging ab pattern built around trunk control and strict knee drive.',
    muscles: ['abs', 'core', 'hip_flexors'],
    equipmentLabel: 'Pull-up Bar',
    requiredEquipment: ['pull_up_bar'],
    compatibleEquipment: ['pull_up_bar'],
    cues: ['Keep the ribcage tucked down.', 'Lift knees with a smooth exhale.', 'Avoid swinging between reps.'],
    defaultScheme: '3x12',
    motionKind: 'pull',
    tone: 'red',
    highlightLabel: 'Strict core raise',
  },
  band_pull_aparts: {
    slug: 'band_pull_aparts',
    title: 'Band Pull-apart',
    subtitle: 'High-rep shoulder health movement for rear delts, mid-back tension, and posture.',
    muscles: ['rear_deltoids', 'upper_back', 'back'],
    equipmentLabel: 'Resistance Band',
    requiredEquipment: ['resistance_band'],
    compatibleEquipment: ['resistance_band'],
    cues: ['Keep the ribs down and arms long.', 'Spread the band by moving from the upper back.', 'Pause with shoulder blades set.'],
    defaultScheme: '3x20',
    motionKind: 'row',
    tone: 'blue',
    highlightLabel: 'Posture reset pack',
  },
  band_presses: {
    slug: 'band_presses',
    title: 'Band Press',
    subtitle: 'Elastic-resistance press that builds chest and triceps tension without heavy loading.',
    muscles: ['chest', 'shoulders', 'triceps'],
    equipmentLabel: 'Resistance Band',
    requiredEquipment: ['resistance_band'],
    compatibleEquipment: ['resistance_band'],
    cues: ['Brace before the press starts.', 'Drive hands forward in a smooth path.', 'Return slowly against the band.'],
    defaultScheme: '3x15',
    motionKind: 'press',
    tone: 'red',
    highlightLabel: 'Band chest pack',
  },
  bodyweight_squats: {
    slug: 'bodyweight_squats',
    title: 'Bodyweight Squat',
    subtitle: 'Foundational lower-body pattern for mobility, leg endurance, and positional control.',
    muscles: ['quadriceps', 'glutes', 'core'],
    equipmentLabel: 'Bodyweight',
    requiredEquipment: ['bodyweight'],
    compatibleEquipment: ['bodyweight', 'yoga_mat'],
    cues: ['Keep the chest stacked and knees tracking.', 'Sit down between the ankles.', 'Stand up with full foot pressure.'],
    defaultScheme: '3x20',
    motionKind: 'squat',
    tone: 'blue',
    highlightLabel: 'Foundational squat',
  },
  mountain_climbers: {
    slug: 'mountain_climbers',
    title: 'Mountain Climber',
    subtitle: 'Fast core-and-conditioning pattern built around shoulder stability and hip drive.',
    muscles: ['abs', 'core', 'shoulders', 'hip_flexors'],
    equipmentLabel: 'Bodyweight',
    requiredEquipment: ['bodyweight'],
    compatibleEquipment: ['bodyweight', 'yoga_mat'],
    cues: ['Keep the shoulders over the hands.', 'Drive knees without bouncing the hips.', 'Stay long through the torso.'],
    defaultScheme: '4x30s',
    motionKind: 'plank',
    tone: 'red',
    highlightLabel: 'Conditioning core pack',
  },
  burpees: {
    slug: 'burpees',
    title: 'Burpee',
    subtitle: 'Full-body conditioning sequence combining squat, plank, and explosive stand-up phases.',
    muscles: ['full_body', 'chest', 'quadriceps', 'core'],
    equipmentLabel: 'Bodyweight',
    requiredEquipment: ['bodyweight'],
    compatibleEquipment: ['bodyweight', 'yoga_mat'],
    cues: ['Drop into the floor with control.', 'Snap the feet back under the hips quickly.', 'Finish tall with a clean jump or reach.'],
    defaultScheme: '4x12',
    motionKind: 'press',
    tone: 'red',
    highlightLabel: 'Conditioning burst',
  },
  inverted_rows: {
    slug: 'inverted_rows',
    title: 'Inverted Row',
    subtitle: 'Bodyweight pull that trains lats, upper back, and scapular retraction with strict form.',
    muscles: ['back', 'lats', 'biceps', 'upper_back'],
    equipmentLabel: 'Dip Station or Pull-up Bar',
    requiredEquipment: [],
    requiredAnyEquipment: ['dip_station', 'pull_up_bar'],
    compatibleEquipment: ['dip_station', 'pull_up_bar'],
    cues: ['Keep the body in one line.', 'Pull the chest toward the bar.', 'Lower with shoulders still packed.'],
    defaultScheme: '4x10',
    motionKind: 'row',
    tone: 'blue',
    highlightLabel: 'Bodyweight pull pack',
  },
  bird_dogs: {
    slug: 'bird_dogs',
    title: 'Bird Dog',
    subtitle: 'Cross-body stability drill for trunk control, glute activation, and spinal positioning.',
    muscles: ['core', 'glutes', 'back'],
    equipmentLabel: 'Bodyweight',
    requiredEquipment: ['bodyweight'],
    compatibleEquipment: ['bodyweight', 'yoga_mat'],
    cues: ['Reach long through heel and fingertips.', 'Keep the pelvis square.', 'Move slowly enough to stay stable.'],
    defaultScheme: '3x8/side',
    motionKind: 'plank',
    tone: 'blue',
    highlightLabel: 'Stability control pack',
  },
}

const profileList = Object.values(profiles)
const aliasLookup = new Map<string, string>()

for (const profile of profileList) {
  aliasLookup.set(normalizeKey(profile.slug), profile.slug)
  for (const alias of profile.aliases ?? []) {
    aliasLookup.set(normalizeKey(alias), profile.slug)
  }
}

const featuredProfileSlugs = ['barbell_bench_press', 'goblet_squats', 'band_face_pulls', 'kettlebell_turkish_get_ups']

export function getExerciseAnimationProfile(slug?: string | null) {
  if (!slug) return null
  const resolvedSlug = aliasLookup.get(normalizeKey(slug))
  return resolvedSlug ? profiles[resolvedSlug] : null
}

export function getFeaturedExerciseAnimationProfiles(limit = 3) {
  return featuredProfileSlugs
    .map((slug) => profiles[slug])
    .filter(Boolean)
    .slice(0, limit)
}

export function getExerciseAnimationProfilesForEquipment(equipment: string[], limit = 6) {
  const equipmentSet = new Set(normalizeEquipmentList(equipment))
  const strictMatches = profileList
    .filter((profile) => isEquipmentMatch(profile, equipmentSet))
    .sort((left, right) => profileScore(right, equipmentSet) - profileScore(left, equipmentSet))

  const fillerProfiles = profileList
    .filter((profile) => !strictMatches.some((entry) => entry.slug === profile.slug))
    .filter((profile) => profile.requiredEquipment.includes('bodyweight'))

  return [...strictMatches, ...fillerProfiles].slice(0, limit)
}

export function buildGeneratedExerciseAnimationProfile({
  slug,
  title,
  equipment,
  muscles,
  defaultScheme,
}: GeneratedAnimationInput): ExerciseAnimationProfile {
  const exact = getExerciseAnimationProfile(slug)
  if (exact) {
    return defaultScheme ? { ...exact, defaultScheme } : exact
  }

  const normalizedEquipment = normalizeEquipmentList(equipment)
  const normalizedMuscles = normalizeMuscles(muscles)
  const motionKind = inferMotionKind(normalizedMuscles, normalizedEquipment)
  const tone = inferTone(normalizedMuscles)
  const resolvedSlug = normalizeKey(slug || title || 'generated_motion_pack')

  return {
    slug: resolvedSlug,
    title: title || humanizeKey(resolvedSlug),
    subtitle: 'Generated anatomical motion pack based on the exercise pattern, equipment, and primary muscle emphasis.',
    muscles: normalizedMuscles.length > 0 ? normalizedMuscles : ['full_body'],
    equipmentLabel: normalizedEquipment.length > 0 ? normalizedEquipment.map(humanizeKey).join(' + ') : 'Bodyweight',
    requiredEquipment: normalizedEquipment.length > 0 ? normalizedEquipment : ['bodyweight'],
    compatibleEquipment: normalizedEquipment.length > 0 ? normalizedEquipment : ['bodyweight'],
    cues: buildDefaultCues(motionKind),
    defaultScheme: defaultScheme || inferDefaultScheme(motionKind),
    motionKind,
    tone,
    highlightLabel: 'Generated match',
  }
}

function isEquipmentMatch(profile: ExerciseAnimationProfile, equipmentSet: Set<string>) {
  if (profile.requiredAnyEquipment && !profile.requiredAnyEquipment.some((item) => equipmentSet.has(item))) {
    return false
  }
  if (profile.requiredEquipment.length === 0) return true
  return profile.requiredEquipment.every((item) => {
    if (item === 'bodyweight') {
      return equipmentSet.size === 0 || [...bodyweightEquipment].some((entry) => equipmentSet.has(entry))
    }
    return equipmentSet.has(item)
  })
}

function profileScore(profile: ExerciseAnimationProfile, equipmentSet: Set<string>) {
  const overlap = profile.compatibleEquipment.filter((item) => equipmentSet.has(item)).length
  const strictBonus = isEquipmentMatch(profile, equipmentSet) ? 100 : 0
  const bodyweightPenalty = profile.requiredEquipment.includes('bodyweight') ? -5 : 0
  return strictBonus + overlap * 10 + profile.muscles.length + bodyweightPenalty
}

function normalizeEquipmentList(input: string[] | string | null | undefined) {
  const values = Array.isArray(input) ? input : input ? [input] : []
  return values
    .map((value) => normalizeKey(value))
    .filter(Boolean)
    .map((value) => (value === 'bench_press_bench' ? 'bench' : value))
}

function normalizeMuscles(input: string[] | null | undefined) {
  return (input ?? [])
    .map((value) => muscleAlias(normalizeKey(value)))
    .filter((value): value is AnimationMuscle => value !== null)
}

function muscleAlias(value: string): AnimationMuscle | null {
  switch (value) {
    case 'abs':
      return 'abs'
    case 'back':
    case 'mid_back':
      return 'back'
    case 'biceps':
      return 'biceps'
    case 'chest':
    case 'pectorals':
      return 'chest'
    case 'core':
      return 'core'
    case 'full_body':
      return 'full_body'
    case 'glutes':
      return 'glutes'
    case 'hamstrings':
      return 'hamstrings'
    case 'hip_flexors':
      return 'hip_flexors'
    case 'lats':
      return 'lats'
    case 'legs':
      return 'quadriceps'
    case 'quadriceps':
    case 'quads':
      return 'quadriceps'
    case 'rear_deltoids':
      return 'rear_deltoids'
    case 'rotator_cuff':
    case 'shoulders':
      return 'shoulders'
    case 'triceps':
      return 'triceps'
    case 'upper_back':
      return 'upper_back'
    default:
      return null
  }
}

function inferMotionKind(muscles: AnimationMuscle[], equipment: string[]) {
  const muscleSet = new Set(muscles)
  const equipmentSet = new Set(equipment)

  if (equipmentSet.has('pull_up_bar')) return 'pull'
  if (muscleSet.has('chest') || muscleSet.has('shoulders') || muscleSet.has('triceps')) return 'press'
  if (muscleSet.has('back') || muscleSet.has('lats') || muscleSet.has('upper_back') || muscleSet.has('biceps')) return 'row'
  if (muscleSet.has('glutes') && muscleSet.has('hamstrings') && !muscleSet.has('quadriceps')) return 'hinge'
  if (muscleSet.has('quadriceps') && muscleSet.has('hamstrings') && !equipmentSet.has('barbell') && !equipmentSet.has('dumbbell')) return 'lunge'
  if (muscleSet.has('quadriceps') || muscleSet.has('glutes')) return 'squat'
  if (muscleSet.has('abs') || muscleSet.has('core') || muscleSet.has('hip_flexors')) return 'plank'
  return 'row'
}

function inferTone(muscles: AnimationMuscle[]) {
  return muscles.some((muscle) => muscle === 'chest' || muscle === 'shoulders' || muscle === 'triceps') ? 'red' : 'blue'
}

function inferDefaultScheme(motionKind: AnimationMotionKind) {
  switch (motionKind) {
    case 'hinge':
      return '5x20'
    case 'lunge':
      return '3x12/side'
    case 'plank':
      return '3x45s'
    case 'press':
      return '4x10'
    case 'pull':
      return '4x8'
    case 'row':
      return '4x10'
    case 'squat':
      return '4x12'
    default:
      return '3x12'
  }
}

function buildDefaultCues(motionKind: AnimationMotionKind) {
  switch (motionKind) {
    case 'hinge':
      return ['Load the hips back first.', 'Keep the spine long through the rep.', 'Finish with glutes, not low-back extension.']
    case 'lunge':
      return ['Stay tall through the torso.', 'Control the drop straight down.', 'Drive evenly through the full front foot.']
    case 'plank':
      return ['Lock ribs down over the pelvis.', 'Squeeze glutes and quads.', 'Push away from the floor to stay long.']
    case 'press':
      return ['Brace before every rep.', 'Keep wrists stacked over elbows.', 'Finish by driving through the target muscle, not momentum.']
    case 'pull':
      return ['Start by setting the shoulders.', 'Lead the motion with elbows.', 'Control the lowering phase fully.']
    case 'row':
      return ['Drive elbows toward the hip line.', 'Keep the ribcage quiet.', 'Pause briefly at peak contraction.']
    case 'squat':
      return ['Sit between the hips with balance.', 'Stay stacked through the midline.', 'Push the floor away to stand.']
    default:
      return ['Stay braced.', 'Control both directions.', 'Own the finishing position.']
  }
}

export function isBackDominantAnimationProfile(profile: ExerciseAnimationProfile) {
  const backCount = profile.muscles.filter((muscle) => backDominantMuscles.has(muscle)).length
  const frontCount = profile.muscles.filter((muscle) => frontDominantMuscles.has(muscle)).length
  return backCount > frontCount
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function humanizeKey(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
