import { Routes, Route, NavLink, Navigate, Link } from 'react-router-dom'
import { Archive, BookOpen, Camera, ClipboardList, History, Sparkles } from 'lucide-react'
import { enableAnalyze } from './config'
import Home from './pages/Home'
import EquipmentScan from './pages/EquipmentScan'
import WorkoutGenerator from './pages/WorkoutGenerator'
import ExerciseLibrary from './pages/ExerciseLibrary'
import Progress from './pages/Progress'
import SavedWorkouts from './pages/SavedWorkouts'
import './App.css'

function App() {
  const primaryLaunchRoute = enableAnalyze ? '/analyze' : '/workouts'
  const primaryLaunchLabel = enableAnalyze ? 'Start AI Scan' : 'Build Workout'

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <div className="nav-brand-mark">OF</div>
          <div className="nav-brand-copy">
            <span>OptiFit</span>
            <small>Equipment-aware training</small>
          </div>
        </div>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Sparkles size={18} />
            <span>Home</span>
          </NavLink>
          {enableAnalyze && (
            <NavLink to="/analyze" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Camera size={18} />
              <span>Analyze</span>
            </NavLink>
          )}
          <NavLink to="/workouts" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <ClipboardList size={18} />
            <span>Workouts</span>
          </NavLink>
          <NavLink to="/saved" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Archive size={18} />
            <span>Saved</span>
          </NavLink>
          <NavLink to="/exercises" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <BookOpen size={18} />
            <span>Exercises</span>
          </NavLink>
          <NavLink to="/progress" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <History size={18} />
            <span>Progress</span>
          </NavLink>
        </div>
        <div className="nav-actions">
          <div className="nav-meta">Scan what is available, build a plan, and keep the work measurable.</div>
          <Link to={primaryLaunchRoute} className="btn btn-primary nav-cta">
            <Sparkles size={16} />
            <span>{primaryLaunchLabel}</span>
          </Link>
        </div>
      </nav>

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

      <footer className="app-footer">
        <div className="app-footer-brand">
          <div className="nav-brand-mark footer-brand-mark">OF</div>
          <div>
            <strong>OptiFit</strong>
            <p>Professional, equipment-aware workout planning for the real-world training environment in front of you.</p>
          </div>
        </div>
        <div className="app-footer-links">
          <Link to="/">Home</Link>
          <Link to="/workouts">Workout Builder</Link>
          <Link to="/saved">Saved Sessions</Link>
          <Link to="/exercises">Exercise Library</Link>
          <Link to="/progress">Progress</Link>
        </div>
      </footer>
    </div>
  )
}

export default App
