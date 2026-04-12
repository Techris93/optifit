#!/usr/bin/env python3
"""Seed exercise database with initial data from open sources."""

import json
import sqlite3
from pathlib import Path

# Sample exercise data (subset - full dataset would be larger)
EXERCISES = [
    {
        "name": "Barbell Bench Press",
        "slug": "barbell_bench_press",
        "description": "Compound chest exercise using a barbell on a bench.",
        "instructions": "Lie on bench, grip bar slightly wider than shoulders. Lower to chest, press up.",
        "tips": "Keep feet planted, slight arch in back, control the descent.",
        "muscle_groups": ["chest", "shoulders", "triceps"],
        "primary_muscles": ["pectoralis_major"],
        "secondary_muscles": ["anterior_deltoid", "triceps"],
        "difficulty": "intermediate",
        "exercise_type": "compound",
        "equipment": ["barbell", "bench"],
        "video_url": "https://youtube.com/watch?v=Zw6qCAFsV0w",
        "source": "wger",
        "license": "CC-BY-SA"
    },
    {
        "name": "Dumbbell Bench Press",
        "slug": "dumbbell_bench_press",
        "description": "Chest press with dumbbells for greater range of motion.",
        "instructions": "Sit on bench with dumbbells at shoulder height. Press up and together.",
        "tips": "Keep wrists straight, lower with control, squeeze at top.",
        "muscle_groups": ["chest", "shoulders", "triceps"],
        "primary_muscles": ["pectoralis_major"],
        "secondary_muscles": ["anterior_deltoid", "triceps"],
        "difficulty": "beginner",
        "exercise_type": "compound",
        "equipment": ["dumbbell", "bench"],
        "video_url": "https://youtube.com/watch?v=WLTU1j7Ur8M",
        "source": "wger",
        "license": "CC-BY-SA"
    },
    {
        "name": "Push-ups",
        "slug": "push_ups",
        "description": "Classic bodyweight chest and tricep exercise.",
        "instructions": "Start in plank position, lower chest to floor, push back up.",
        "tips": "Keep body straight, core tight, full range of motion.",
        "muscle_groups": ["chest", "shoulders", "triceps", "core"],
        "primary_muscles": ["pectoralis_major", "triceps"],
        "secondary_muscles": ["anterior_deltoid", "core"],
        "difficulty": "beginner",
        "exercise_type": "compound",
        "equipment": ["yoga_mat"],
        "video_url": "https://youtube.com/watch?v=W1LCL-Sw0yU",
        "source": "wger",
        "license": "CC-BY-SA"
    },
    {
        "name": "Barbell Squats",
        "slug": "barbell_squats",
        "description": "The king of leg exercises. Full lower body compound movement.",
        "instructions": "Bar on upper back/shoulders. Feet shoulder-width, squat down, stand up.",
        "tips": "Keep chest up, knees track over toes, break parallel if mobility allows.",
        "muscle_groups": ["legs", "glutes", "core"],
        "primary_muscles": ["quadriceps", "gluteus_maximus"],
        "secondary_muscles": ["hamstrings", "core", "lower_back"],
        "difficulty": "intermediate",
        "exercise_type": "compound",
        "equipment": ["barbell", "squat_rack"],
        "video_url": "https://www.youtube.com/watch?v=rM6SDUdl9fs",
        "source": "wger",
        "license": "CC-BY-SA"
    },
    {
        "name": "Goblet Squats",
        "slug": "goblet_squats",
        "description": "Squat holding a dumbbell or kettlebell at chest level.",
        "instructions": "Hold weight at chest, squat down keeping torso upright.",
        "tips": "Great for learning squat form. Weight acts as counterbalance.",
        "muscle_groups": ["legs", "glutes", "core"],
        "primary_muscles": ["quadriceps", "gluteus_maximus"],
        "secondary_muscles": ["hamstrings", "core"],
        "difficulty": "beginner",
        "exercise_type": "compound",
        "equipment": ["dumbbell", "kettlebell"],
        "video_url": "https://www.youtube.com/watch?v=BR4tlEE_A98",
        "source": "wger",
        "license": "CC-BY-SA"
    },
    {
        "name": "Dumbbell Rows",
        "slug": "dumbbell_rows",
        "description": "Unilateral back exercise targeting lats and rhomboids.",
        "instructions": "Hinge at hips, pull dumbbell to hip, squeeze shoulder blade.",
        "tips": "Keep back flat, pull to hip not chest, control the negative.",
        "muscle_groups": ["back", "biceps", "shoulders"],
        "primary_muscles": ["latissimus_dorsi", "rhomboids"],
        "secondary_muscles": ["biceps", "rear_deltoid"],
        "difficulty": "beginner",
        "exercise_type": "compound",
        "equipment": ["dumbbell", "bench"],
        "video_url": "https://www.youtube.com/watch?v=ufhQhwyrx-4",
        "source": "wger",
        "license": "CC-BY-SA"
    },
    {
        "name": "Pull-ups",
        "slug": "pull_ups",
        "description": "Bodyweight back exercise. Gold standard for lat development.",
        "instructions": "Hang from bar, pull chin over bar, lower with control.",
        "tips": "Start from dead hang, lead with chest, full range of motion.",
        "muscle_groups": ["back", "biceps", "core"],
        "primary_muscles": ["latissimus_dorsi"],
        "secondary_muscles": ["biceps", "rhomboids", "core"],
        "difficulty": "intermediate",
        "exercise_type": "compound",
        "equipment": ["pull_up_bar"],
        "video_url": "https://www.youtube.com/watch?v=8O68v_iIi40",
        "source": "wger",
        "license": "CC-BY-SA"
    },
    {
        "name": "Kettlebell Swings",
        "slug": "kettlebell_swings",
        "description": "Explosive hip hinge exercise for posterior chain.",
        "instructions": "Hinge hips, swing kettlebell to chest height, snap hips forward.",
        "tips": "Power comes from hips not arms. Don't squat the swing.",
        "muscle_groups": ["glutes", "hamstrings", "back", "shoulders"],
        "primary_muscles": ["gluteus_maximus", "hamstrings"],
        "secondary_muscles": ["lower_back", "deltoids", "core"],
        "difficulty": "beginner",
        "exercise_type": "compound",
        "equipment": ["kettlebell"],
        "video_url": "https://www.youtube.com/watch?v=X12k2AiJuwE",
        "source": "wger",
        "license": "CC-BY-SA"
    },
    {
        "name": "Plank",
        "slug": "plank",
        "description": "Isometric core exercise. Builds stability and endurance.",
        "instructions": "Forearms on ground, body straight from head to heels. Hold.",
        "tips": "Don't let hips sag or pike up. Breathe normally.",
        "muscle_groups": ["core", "shoulders"],
        "primary_muscles": ["rectus_abdominis", "transverse_abdominis"],
        "secondary_muscles": ["shoulders", "glutes"],
        "difficulty": "beginner",
        "exercise_type": "isolation",
        "equipment": ["yoga_mat"],
        "video_url": "https://www.youtube.com/watch?v=7A-uDuGAqts",
        "source": "wger",
        "license": "CC-BY-SA"
    },
    {
        "name": "Dumbbell Shoulder Press",
        "slug": "dumbbell_shoulder_press",
        "description": "Overhead pressing movement for shoulder development.",
        "instructions": "Seated or standing, press dumbbells overhead, lower with control.",
        "tips": "Don't arch back excessively, full range of motion, control the negative.",
        "muscle_groups": ["shoulders", "triceps", "core"],
        "primary_muscles": ["deltoids"],
        "secondary_muscles": ["triceps", "upper_chest", "core"],
        "difficulty": "beginner",
        "exercise_type": "compound",
        "equipment": ["dumbbell", "bench"],
        "video_url": "https://youtube.com/watch?v=qEwKCR5JCog",
        "source": "wger",
        "license": "CC-BY-SA"
    },
    {
        "name": "Resistance Band Rows",
        "slug": "resistance_band_rows",
        "description": "Back exercise using resistance bands. Great for home gyms.",
        "instructions": "Anchor band, pull handles to torso, squeeze shoulder blades.",
        "tips": "Keep elbows close to body, squeeze at contraction, control release.",
        "muscle_groups": ["back", "biceps"],
        "primary_muscles": ["latissimus_dorsi", "rhomboids"],
        "secondary_muscles": ["biceps", "rear_deltoid"],
        "difficulty": "beginner",
        "exercise_type": "compound",
        "equipment": ["resistance_band"],
        "video_url": "https://youtube.com/watch?v=rRT14E9y380",
        "source": "wger",
        "license": "CC-BY-SA"
    },
    {
        "name": "Bodyweight Lunges",
        "slug": "bodyweight_lunges",
        "description": "Unilateral leg exercise. Builds balance and leg strength.",
        "instructions": "Step forward, lower back knee toward ground, push back up.",
        "tips": "Keep front knee over ankle, torso upright, controlled movement.",
        "muscle_groups": ["legs", "glutes", "core"],
        "primary_muscles": ["quadriceps", "gluteus_maximus"],
        "secondary_muscles": ["hamstrings", "calves", "core"],
        "difficulty": "beginner",
        "exercise_type": "compound",
        "equipment": [],
        "video_url": "https://www.youtube.com/watch?v=RqimDHU-tkg",
        "source": "wger",
        "license": "CC-BY-SA"
    }
]

EQUIPMENT_TYPES = [
    {"name": "barbell", "display_name": "Barbell", "category": "free_weights", "description": "Standard Olympic barbell"},
    {"name": "dumbbell", "display_name": "Dumbbells", "category": "free_weights", "description": "Adjustable or fixed dumbbells"},
    {"name": "kettlebell", "display_name": "Kettlebell", "category": "free_weights", "description": "Cast iron ball with handle"},
    {"name": "medicine_ball", "display_name": "Medicine Ball", "category": "free_weights", "description": "Weighted ball for throws and slams"},
    {"name": "bench", "display_name": "Weight Bench", "category": "accessories", "description": "Flat or adjustable bench"},
    {"name": "squat_rack", "display_name": "Squat Rack", "category": "machines", "description": "Power rack or squat stand"},
    {"name": "pull_up_bar", "display_name": "Pull-up Bar", "category": "bodyweight", "description": "Wall-mounted or doorway bar"},
    {"name": "resistance_band", "display_name": "Resistance Bands", "category": "accessories", "description": "Elastic bands for resistance"},
    {"name": "yoga_mat", "display_name": "Yoga Mat", "category": "accessories", "description": "Exercise mat for floor work"},
    {"name": "cable_machine", "display_name": "Cable Machine", "category": "machines", "description": "Cable crossover or functional trainer"},
    {"name": "leg_press", "display_name": "Leg Press", "category": "machines", "description": "45-degree or horizontal leg press"},
    {"name": "lat_pulldown", "display_name": "Lat Pulldown", "category": "machines", "description": "Cable pulldown station"},
    {"name": "treadmill", "display_name": "Treadmill", "category": "cardio", "description": "Running/walking machine"},
    {"name": "rowing_machine", "display_name": "Rowing Machine", "category": "cardio", "description": "Indoor rower"},
    {"name": "jump_rope", "display_name": "Jump Rope", "category": "cardio", "description": "Speed or weighted rope"},
]

def seed_database(db_path: str = "optifit.db"):
    """Seed the database with initial data."""
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Insert equipment types
    print("Seeding equipment types...")
    for eq in EQUIPMENT_TYPES:
        cursor.execute("""
            INSERT OR IGNORE INTO equipment_types (name, display_name, category, description)
            VALUES (?, ?, ?, ?)
        """, (eq["name"], eq["display_name"], eq["category"], eq["description"]))
    
    # Build equipment ID map
    cursor.execute("SELECT id, name FROM equipment_types")
    equipment_map = {name: id for id, name in cursor.fetchall()}
    
    # Insert exercises
    print("Seeding exercises...")
    for ex in EXERCISES:
        cursor.execute("""
            INSERT OR IGNORE INTO exercises 
            (name, slug, description, instructions, tips, muscle_groups, primary_muscles, 
             secondary_muscles, difficulty, exercise_type, image_url, video_url, gif_url, source, license)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ex["name"],
            ex["slug"],
            ex["description"],
            ex["instructions"],
            ex["tips"],
            json.dumps(ex["muscle_groups"]),
            json.dumps(ex["primary_muscles"]),
            json.dumps(ex["secondary_muscles"]),
            ex["difficulty"],
            ex["exercise_type"],
            ex.get("image_url"),
            ex.get("video_url"),
            ex.get("gif_url"),
            ex["source"],
            ex["license"]
        ))

        cursor.execute("""
            UPDATE exercises
            SET image_url = ?, video_url = ?, gif_url = ?
            WHERE slug = ?
        """, (
            ex.get("image_url"),
            ex.get("video_url"),
            ex.get("gif_url"),
            ex["slug"]
        ))
        
        # Get exercise ID
        cursor.execute("SELECT id FROM exercises WHERE slug = ?", (ex["slug"],))
        result = cursor.fetchone()
        if result:
            exercise_id = result[0]
            
            # Link to equipment
            for eq_name in ex.get("equipment", []):
                if eq_name in equipment_map:
                    cursor.execute("""
                        INSERT OR IGNORE INTO exercise_equipment (exercise_id, equipment_id)
                        VALUES (?, ?)
                    """, (exercise_id, equipment_map[eq_name]))
    
    conn.commit()
    conn.close()
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed_database()
