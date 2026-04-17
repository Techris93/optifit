import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { Archive, BookOpen, Camera, ClipboardList, Dumbbell, History, Sparkles } from 'lucide-react'
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
      <nav className="navbar">
        <div className="nav-brand">
          <Dumbbell size={24} />
          <span>OptiFit</span>
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
    </div>
  )
}

export default App
