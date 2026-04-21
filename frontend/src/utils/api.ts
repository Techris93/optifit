import axios from 'axios'
import { enableAnalyze } from '../config'
import type {
  HealthStatus,
  HomeSummary,
  SavedWorkoutDetail,
  SavedWorkoutSummary,
  WorkoutExerciseMatch,
  UserPreferences,
} from '../types'
import { getAccessToken, getOrCreateClientSessionId } from './session'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const headers = config.headers ?? {}
  const token = getAccessToken()
  const clientSessionId = getOrCreateClientSessionId()

  headers['x-client-session-id'] = clientSessionId
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  config.headers = headers
  return config
})

// Equipment detection
export const detectEquipment = async (files: File[]) => {
  if (!enableAnalyze) {
    throw new Error('Upload analysis is disabled in this deployment. Use manual equipment selection instead.')
  }

  const formData = new FormData()
  files.forEach(file => formData.append(files.length > 1 ? 'files' : 'file', file))
  formData.append('confidence', '0.5')
  
  const { data } = await api.post('/equipment/detect', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

// Workouts
export const generateWorkout = async (params: {
  equipment: string[]
  goal: string
  difficulty: string
  duration: number
  focus_areas?: string[]
  user_preferences?: UserPreferences
}) => {
  const { data } = await api.post('/workouts/generate', {
    equipment: params.equipment,
    focus_areas: params.focus_areas,
    user_preferences: params.user_preferences
  }, {
    params: {
      goal: params.goal,
      difficulty: params.difficulty,
      duration: params.duration
    }
  })
  return data
}

export const saveGeneratedWorkout = async (payload: {
  name: string
  description: string
  goal: string
  difficulty: string
  estimated_duration_minutes: number
  equipment_used: string[]
  exercise_matches: WorkoutExerciseMatch[]
}) => {
  const { data } = await api.post('/workouts/save-generated', payload)
  return data
}

export const getSavedWorkouts = async (): Promise<SavedWorkoutSummary[]> => {
  const { data } = await api.get('/workouts/')
  return data
}

export const getSavedWorkout = async (id: number): Promise<SavedWorkoutDetail> => {
  const { data } = await api.get(`/workouts/${id}`)
  return data
}

// Exercises
export const searchExercises = async (filters: {
  search?: string
  muscle_group?: string
  difficulty?: string
}) => {
  const { data } = await api.get('/exercises/', {
    params: filters
  })
  return data
}

export const getMuscleGroups = async () => {
  const { data } = await api.get('/exercises/muscle-groups/list')
  return data
}

export const getEquipmentTypes = async () => {
  const { data } = await api.get('/equipment/equipment-types')
  return data
}

export const getExercise = async (slug: string) => {
  const { data } = await api.get(`/exercises/${slug}`)
  return data
}

export const getExerciseMedia = async (slug: string) => {
  const { data } = await api.get(`/workouts/exercises/${slug}/media`)
  return data
}

export const searchExercisesWithMedia = async (params: {
  query?: string
  muscle_group?: string
  difficulty?: string
}) => {
  const { data } = await api.get('/workouts/exercises/search', {
    params
  })
  return data
}

// Progress
export const logProgress = async (entry: {
  exercise_id: number
  sets_completed: number
  reps_per_set: number[]
  weight_per_set: number[]
  weight_unit?: string
  notes?: string
}) => {
  const { data } = await api.post('/progress/log', entry)
  return data
}

export const getProgressHistory = async (params?: {
  exercise_id?: number
  days?: number
}) => {
  const { data } = await api.get('/progress/history', { params })
  return data
}

export const getHealthStatus = async (): Promise<HealthStatus> => {
  const baseUrl = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL
  const { data } = await axios.get(`${baseUrl}/health`)
  return data
}

export const getHomeSummary = async (): Promise<HomeSummary> => {
  const { data } = await api.get('/dashboard/summary')
  return data
}
