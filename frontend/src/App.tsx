import { Routes, Route, NavLink, Navigate, Link } from 'react-router-dom'
import { Activity, Archive, BarChart3, Camera, Dumbbell, Home as HomeIcon } from 'lucide-react'
import { enableAnalyze } from './config'
import Home from './pages/Home'
import EquipmentScan from './pages/EquipmentScan'
import WorkoutGenerator from './pages/WorkoutGenerator'
import ExerciseLibrary from './pages/ExerciseLibrary'
import Progress from './pages/Progress'
import SavedWorkouts from './pages/SavedWorkouts'
import './App.css'

function App() {
  return (
    <div className="app">
      <div className="app-shell">
        <header className="app-header">
          <Link
            to={enableAnalyze ? '/analyze' : '/workouts'}
            className="app-header-action"
            aria-label={enableAnalyze ? 'Analyze available equipment' : 'Open workout builder'}
          >
            {enableAnalyze ? <Camera size={18} /> : <Activity size={18} />}
          </Link>
          <Link to="/" className="app-brand" aria-label="OptiFit home">
            <span className="app-brand-opt">Opti</span>
            <span className="app-brand-fit">Fit</span>
          </Link>
          <Link to="/saved" className="app-header-action" aria-label="Saved workouts">
            <Archive size={18} />
          </Link>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analyze" element={enableAnalyze ? <EquipmentScan /> : <Navigate to="/workouts" replace />} />
            <Route path="/workouts" element={<WorkoutGenerator />} />
            <Route path="/saved" element={<SavedWorkouts />} />
            <Route path="/exercises" element={<ExerciseLibrary />} />
            <Route path="/progress" element={<Progress />} />
          </Routes>
        </main>

        <nav className="tab-bar" aria-label="Primary navigation">
          <NavLink to="/" end className={({ isActive }) => `tab-link${isActive ? ' active' : ''}`}>
            <HomeIcon size={22} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/workouts" className={({ isActive }) => `tab-link${isActive ? ' active' : ''}`}>
            <Activity size={22} />
            <span>Workouts</span>
          </NavLink>
          <NavLink to="/exercises" className={({ isActive }) => `tab-link${isActive ? ' active' : ''}`}>
            <Dumbbell size={22} />
            <span>Exercises</span>
          </NavLink>
          <NavLink to="/progress" className={({ isActive }) => `tab-link${isActive ? ' active' : ''}`}>
            <BarChart3 size={22} />
            <span>Progress</span>
          </NavLink>
        </nav>
        <div className="app-home-indicator" aria-hidden="true" />
      </div>
    </div>
  )
}

export default App
