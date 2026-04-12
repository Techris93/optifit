import os
from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Table, Text, create_engine
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

Base = declarative_base()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./optifit.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Association tables
workout_exercises = Table(
    'workout_exercises',
    Base.metadata,
    Column('workout_id', Integer, ForeignKey('workouts.id')),
    Column('exercise_id', Integer, ForeignKey('exercises.id')),
    Column('sets', Integer, default=3),
    Column('reps', Integer, default=10),
    Column('rest_seconds', Integer, default=60),
    Column('order', Integer, default=0)
)

user_equipment = Table(
    'user_equipment',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('equipment_id', Integer, ForeignKey('equipment_types.id'))
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Profile
    fitness_goal = Column(String, default="strength")  # strength, hypertrophy, endurance
    experience_level = Column(String, default="beginner")  # beginner, intermediate, advanced
    workouts_per_week = Column(Integer, default=3)
    
    # Relationships
    workouts = relationship("Workout", back_populates="user")
    progress_entries = relationship("ProgressEntry", back_populates="user")
    equipment = relationship("EquipmentType", secondary=user_equipment, back_populates="users")

class EquipmentType(Base):
    __tablename__ = "equipment_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # e.g., "dumbbell", "barbell", "kettlebell"
    display_name = Column(String)
    category = Column(String)  # free_weights, machines, bodyweight, cardio
    description = Column(Text)
    
    # For detection model
    model_label = Column(String)  # YOLO class name
    confidence_threshold = Column(Float, default=0.5)
    
    # Relationships
    users = relationship("User", secondary=user_equipment, back_populates="equipment")
    exercises = relationship("Exercise", secondary="exercise_equipment", back_populates="equipment")

class Exercise(Base):
    __tablename__ = "exercises"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    slug = Column(String, unique=True, index=True)
    description = Column(Text)
    instructions = Column(Text)
    tips = Column(Text)
    
    # Categorization
    muscle_groups = Column(JSON)  # ["chest", "triceps"]
    primary_muscles = Column(JSON)  # ["pectoralis_major"]
    secondary_muscles = Column(JSON)  # ["anterior_deltoid"]
    
    # Difficulty & type
    difficulty = Column(String)  # beginner, intermediate, advanced
    exercise_type = Column(String)  # compound, isolation, cardio, flexibility
    
    # Media
    image_url = Column(String)
    video_url = Column(String)
    gif_url = Column(String)
    
    # Metadata
    source = Column(String)  # wger, exercisedb, community
    license = Column(String)  # CC-BY-SA, CC0, etc.
    
    # Relationships
    equipment = relationship("EquipmentType", secondary="exercise_equipment", back_populates="exercises")
    workouts = relationship("Workout", secondary=workout_exercises, back_populates="exercises")

exercise_equipment = Table(
    'exercise_equipment',
    Base.metadata,
    Column('exercise_id', Integer, ForeignKey('exercises.id')),
    Column('equipment_id', Integer, ForeignKey('equipment_types.id'))
)

# Backward-compatible alias for older imports.
ExerciseEquipment = exercise_equipment

class Workout(Base):
    __tablename__ = "workouts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    description = Column(Text)
    goal = Column(String)
    difficulty = Column(String)
    estimated_duration_minutes = Column(Integer)
    
    # Generated from equipment
    equipment_used = Column(JSON)  # ["dumbbell", "bench"]
    
    created_at = Column(DateTime, default=datetime.utcnow)
    is_template = Column(Boolean, default=False)  # For sharing
    
    # Relationships
    user = relationship("User", back_populates="workouts")
    exercises = relationship("Exercise", secondary=workout_exercises, back_populates="workouts")

class ProgressEntry(Base):
    __tablename__ = "progress_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    
    # Work data
    sets_completed = Column(Integer)
    reps_per_set = Column(JSON)  # [10, 10, 8]
    weight_per_set = Column(JSON)  # [135, 135, 125] in kg or lbs
    weight_unit = Column(String, default="kg")
    
    # Optional
    notes = Column(Text)
    perceived_difficulty = Column(Integer)  # 1-10 RPE
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="progress_entries")

class EquipmentScan(Base):
    __tablename__ = "equipment_scans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_path = Column(String)
    
    # Detection results
    detected_equipment = Column(JSON)  # [{"label": "dumbbell", "confidence": 0.95, "bbox": [...]}]
    
    created_at = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
