-- OptiFit Database Schema
-- Compatible with PostgreSQL and SQLite

-- Users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fitness_goal TEXT DEFAULT 'strength',
    experience_level TEXT DEFAULT 'beginner',
    workouts_per_week INTEGER DEFAULT 3
);

-- Equipment Types
CREATE TABLE IF NOT EXISTS equipment_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    model_label TEXT,
    confidence_threshold REAL DEFAULT 0.5
);

-- Exercises
CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    instructions TEXT,
    tips TEXT,
    muscle_groups TEXT, -- JSON array
    primary_muscles TEXT, -- JSON array
    secondary_muscles TEXT, -- JSON array
    difficulty TEXT,
    exercise_type TEXT,
    image_url TEXT,
    video_url TEXT,
    gif_url TEXT,
    source TEXT,
    license TEXT
);

-- Exercise-Equipment Junction
CREATE TABLE IF NOT EXISTS exercise_equipment (
    exercise_id INTEGER NOT NULL,
    equipment_id INTEGER NOT NULL,
    PRIMARY KEY (exercise_id, equipment_id),
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment_types(id) ON DELETE CASCADE
);

-- Workouts
CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    goal TEXT,
    difficulty TEXT,
    estimated_duration_minutes INTEGER,
    equipment_used TEXT, -- JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_template BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Workout-Exercise Junction with details
CREATE TABLE IF NOT EXISTS workout_exercises (
    workout_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    sets INTEGER DEFAULT 3,
    reps TEXT DEFAULT '10-12',
    rest_seconds INTEGER DEFAULT 60,
    "order" INTEGER DEFAULT 0,
    PRIMARY KEY (workout_id, exercise_id),
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- User-Equipment Junction (user's gym)
CREATE TABLE IF NOT EXISTS user_equipment (
    user_id INTEGER NOT NULL,
    equipment_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, equipment_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment_types(id) ON DELETE CASCADE
);

-- Progress Tracking
CREATE TABLE IF NOT EXISTS progress_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workout_id INTEGER,
    exercise_id INTEGER NOT NULL,
    sets_completed INTEGER,
    reps_per_set TEXT, -- JSON array
    weight_per_set TEXT, -- JSON array
    weight_unit TEXT DEFAULT 'kg',
    notes TEXT,
    perceived_difficulty INTEGER, -- 1-10 RPE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE SET NULL,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- Equipment Scans (for tracking uploads)
CREATE TABLE IF NOT EXISTS equipment_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    image_path TEXT NOT NULL,
    detected_equipment TEXT, -- JSON array of detections
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercises_slug ON exercises(slug);
CREATE INDEX IF NOT EXISTS idx_exercises_muscles ON exercises(muscle_groups);
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_exercise ON progress_entries(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workouts_user ON workouts(user_id);
