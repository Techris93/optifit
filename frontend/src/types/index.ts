export interface DetectionResult {
  scan_id: string
  filename: string
  detections: Detection[]
  equipment_found: string[]
  annotated_image: string | null
  total_items: number
  files_processed?: number
  total_scans?: number
  detection_mode?: string
}

export interface Detection {
  label: string
  confidence: number
  bbox: number[]
  class_id: number
}

export interface Workout {
  name: string
  description: string
  estimated_duration_minutes: number
  difficulty: string
  goal?: string
  generation_mode?: string
  ai_provider?: string
  vision_status?: string
  warmup?: WarmupItem[]
  exercises: WorkoutExercise[]
  cooldown?: CooldownItem[]
  training_tips?: string[]
  estimated_calories_burned?: number
}

export interface WarmupItem {
  name: string
  duration_seconds?: number
  description?: string
}

export interface WorkoutExercise {
  name: string
  sets: number
  reps: string
  rest_seconds: number
  equipment?: string
  notes?: string
  target_muscles?: string[]
  alternative?: string
  exercise_id?: number
  slug?: string
}

export interface CooldownItem {
  name: string
  duration_seconds?: number
  description?: string
}

export interface Exercise {
  id: number
  name: string
  slug: string
  description?: string
  instructions?: string
  tips?: string
  muscle_groups?: string[]
  primary_muscles?: string[]
  secondary_muscles?: string[]
  difficulty: string
  exercise_type: string
  image_url?: string
  video_url?: string
  gif_url?: string
  demo_search_url?: string
  media?: ExerciseMedia
  equipment?: Equipment[]
  prescription?: WorkoutPrescription
}

export interface ExerciseMedia {
  video_url?: string
  gif_url?: string
  image_url?: string
}

export interface Equipment {
  id: number
  name: string
  display_name: string
  category: string
}

export interface ProgressEntry {
  id: number
  exercise_id: number
  workout_id?: number | null
  sets_completed: number
  reps_per_set: number[]
  weight_per_set: number[]
  weight_unit: string
  notes?: string | null
  perceived_difficulty?: number | null
  created_at: string
}

export interface ProgressHistoryResponse {
  entries: ProgressEntry[]
  total_volume: {
    total_volume: number
    unit: string
  }
  consistency: {
    workouts_logged: number
    unique_workout_days: number
    consistency_percentage: number
  }
}

export interface WorkoutExerciseMatch {
  exercise_id?: number
  slug: string
  sets: number
  reps: string
  rest_seconds: number
  equipment?: string
  notes?: string
  target_muscles?: string[]
  alternative?: string
  exercise?: Exercise | null
}

export interface WorkoutPrescription {
  sets: number
  reps: string
  rest_seconds: number
  order?: number
}

export interface WorkoutGenerationResponse {
  workout: Workout
  exercise_matches: WorkoutExerciseMatch[]
  generated_at: string
  equipment_used: string[]
  ai_provider?: string
  generation_mode?: string
}

export interface SavedWorkoutSummary {
  id: number
  name: string
  description?: string | null
  goal?: string | null
  difficulty?: string | null
  estimated_duration_minutes?: number | null
  equipment_used?: string[] | null
  created_at?: string | null
  is_template?: boolean
}

export interface SavedWorkoutDetail extends SavedWorkoutSummary {
  exercises?: Exercise[]
}

export interface HealthStatus {
  status: string
  environment: string
  local_vision_enabled: boolean
  detection_mode: 'manual' | 'local' | 'openai' | 'gemini' | string
}

export interface UserPreferences {
  injuries?: string
  experience_years?: number
  preferred_style?: string
}

export interface HomeSummary {
  scope: 'guest' | 'user' | 'anonymous' | string
  detection_mode: HealthStatus['detection_mode']
  stats: {
    saved_workouts: number
    exercise_library_total: number
    progress_entries: number
    active_days_30: number
  }
  recent_saved_workouts: SavedWorkoutSummary[]
  recent_progress: RecentProgressSummary[]
}

export interface RecentProgressSummary {
  id: number
  exercise_id: number
  exercise_name: string
  sets_completed: number
  total_volume: number
  weight_unit: string
  created_at: string
}
