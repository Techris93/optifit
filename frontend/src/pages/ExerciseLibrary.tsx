import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Dumbbell, Info, Search } from 'lucide-react'
import ExerciseAnimationCard from '../components/animation/ExerciseAnimationCard'
import ExerciseMediaPreview from '../components/ExerciseMediaPreview'
import { getExerciseAnimationProfile } from '../data/exerciseAnimations'
import { getMuscleGroups, searchExercises } from '../utils/api'
import type { Exercise } from '../types'

export default function ExerciseLibrary() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [muscleGroups, setMuscleGroups] = useState<string[]>([])
  const [expandedExerciseId, setExpandedExerciseId] = useState<number | null>(null)

  useEffect(() => {
    void loadMuscleGroups()
  }, [])

  useEffect(() => {
    void loadExercises()
  }, [muscleGroup, difficulty])

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

  const activeFilterCount = [search, muscleGroup, difficulty].filter(Boolean).length

  return (
    <div className="feature-page">
      <div className="card page-hero-card feature-intro-card">
        <div className="feature-intro-header">
          <div className="hero-kicker">Find and learn</div>
          <h1>Exercise Library</h1>
          <p className="hero-copy">
            Search movements by muscle group and difficulty, then review the demo, setup notes, and coaching cues
            without leaving the workout flow.
          </p>
        </div>
        <div className="feature-stat-strip">
          <div className="feature-stat-chip">
            <strong>{loading ? '...' : exercises.length}</strong>
            <span>Matches</span>
          </div>
          <div className="feature-stat-chip">
            <strong>{muscleGroups.length}</strong>
            <span>Muscle groups</span>
          </div>
          <div className="feature-stat-chip">
            <strong>{activeFilterCount}</strong>
            <span>Active filters</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-heading-row">
          <div>
            <div className="card-title zero-margin">Search the library</div>
            <p className="card-subtitle">Filter by focus area, difficulty, or a direct movement name.</p>
          </div>
        </div>
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
      ) : exercises.length === 0 ? (
        <div className="card feature-empty-state">
          <div className="card-title zero-margin">No exercises matched this search</div>
          <p className="card-subtitle">Try a different keyword or remove one of the active filters.</p>
        </div>
      ) : (
        <div>
          <div className="card feature-list-intro">
            <div className="section-heading-row">
              <div>
                <div className="card-title zero-margin">Results</div>
                <p className="card-subtitle">Showing {exercises.length} movement{exercises.length === 1 ? '' : 's'} ready for review.</p>
              </div>
            </div>
          </div>

          {exercises.map((exercise) => (
            <ExerciseLibraryCard
              key={exercise.id}
              exercise={exercise}
              expanded={expandedExerciseId === exercise.id}
              onToggle={() => setExpandedExerciseId((current) => current === exercise.id ? null : exercise.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

type ExerciseLibraryCardProps = {
  exercise: Exercise
  expanded: boolean
  onToggle: () => void
}

function ExerciseLibraryCard({ exercise, expanded, onToggle }: ExerciseLibraryCardProps) {
  const animationProfile = getExerciseAnimationProfile(exercise.slug)

  return (
    <div className="exercise-card">
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

            <button
              type="button"
              className="icon-button exercise-detail-button"
              onClick={onToggle}
              aria-expanded={expanded}
            >
              <Info size={20} color="var(--text-muted)" />
              <span>{expanded ? 'Hide details' : 'Details'}</span>
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

          {expanded && (
            <div className="exercise-detail-panel">
              {animationProfile && (
                <ExerciseAnimationCard profile={animationProfile} />
              )}
              {exercise.instructions && (
                <div>
                  <strong>How to do it</strong>
                  <p className="muted-paragraph top-gap-8">{exercise.instructions}</p>
                </div>
              )}
              {exercise.tips && (
                <div>
                  <strong>Coach notes</strong>
                  <p className="muted-paragraph top-gap-8">{exercise.tips}</p>
                </div>
              )}
              {exercise.equipment && exercise.equipment.length > 0 && (
                <div>
                  <strong>Equipment</strong>
                  <div className="muscle-chip-row top-gap-8">
                    {exercise.equipment.map((item) => (
                      <span key={item.id} className="muscle-chip">
                        {item.display_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
