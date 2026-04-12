import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Dumbbell, Info, Search } from 'lucide-react'
import ExerciseMediaPreview from '../components/ExerciseMediaPreview'
import { getMuscleGroups, searchExercises } from '../utils/api'
import type { Exercise } from '../types'
import libraryPreview from '../assets/stitch/exercise_library_screen.jpg'

export default function ExerciseLibrary() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [muscleGroups, setMuscleGroups] = useState<string[]>([])

  useEffect(() => {
    void loadExercises()
    void loadMuscleGroups()
  }, [])

  const loadExercises = async () => {
    setLoading(true)
    try {
      const data = await searchExercises({ search, muscle_group: muscleGroup, difficulty })
      setExercises(data.exercises)
    } catch (err) {
      console.error('Failed to load exercises:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMuscleGroups = async () => {
    try {
      const data = await getMuscleGroups()
      setMuscleGroups(data.groups.map((group: { id: string }) => group.id))
    } catch (err) {
      console.error('Failed to load muscle groups:', err)
    }
  }

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    void loadExercises()
  }

  return (
    <div>
      <div className="card page-hero-card">
        <div className="hero-shell">
          <div className="hero-content">
            <div className="hero-kicker">Find and learn</div>
            <h1>Exercise Library</h1>
            <p className="hero-copy">Search movements by muscle group and difficulty, then review form guidance and media without leaving your workout flow.</p>
          </div>
          <div className="hero-visual">
            <img src={libraryPreview} alt="Exercise library interface preview" loading="lazy" decoding="async" />
          </div>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSearch}>
          <div className="search-row">
            <div className="search-input-wrap">
              <Search size={18} className="search-input-icon" />
              <input
                type="text"
                placeholder="Search exercises..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="field-control search-input"
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>

          <div className="filter-row">
            <select
              value={muscleGroup}
              onChange={(event) => setMuscleGroup(event.target.value)}
              className="field-control filter-control"
            >
              <option value="">All Muscle Groups</option>
              {muscleGroups.map((group) => (
                <option key={group} value={group}>
                  {group.replace('_', ' ')}
                </option>
              ))}
            </select>

            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
              className="field-control filter-control"
            >
              <option value="">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
        <div>
          <p className="helper-text mb-16">Showing {exercises.length} exercises</p>

          {exercises.map((exercise) => (
            <div key={exercise.id} className="exercise-card">
              <div className="exercise-layout">
                <ExerciseMediaPreview exercise={exercise} title={exercise.name} />

                <div className="exercise-body">
                  <div className="exercise-header">
                    <div>
                      <div className="exercise-name">
                        <Dumbbell size={16} className="inline-icon" />
                        {exercise.name}
                      </div>
                      <div className="exercise-type-row">
                        <span className="exercise-difficulty">{exercise.difficulty}</span>
                        <span>•</span>
                        <span>{exercise.exercise_type}</span>
                      </div>
                    </div>

                    <button type="button" className="icon-button">
                      <Info size={20} color="var(--text-muted)" />
                    </button>
                  </div>

                  {exercise.description && (
                    <p className="muted-paragraph top-gap-8">
                      {exercise.description}
                    </p>
                  )}

                  {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                    <div className="muscle-chip-row">
                      {exercise.muscle_groups.map((muscle) => (
                        <span key={muscle} className="muscle-chip">
                          {muscle.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
