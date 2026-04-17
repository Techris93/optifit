from sqlalchemy.orm import Session
from app.models.database import EquipmentType, Exercise, ExerciseEquipment
from typing import List

class ExerciseService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_exercises_for_equipment(
        self, 
        equipment_names: List[str],
        goal: str = "strength",
        difficulty: str = "beginner",
        limit: int = 50
    ) -> List[Exercise]:
        """Get exercises that can be performed with given equipment."""
        
        # Find equipment IDs
        equipment_ids = [
            eq.id for eq in 
            self.db.query(EquipmentType).filter(
                EquipmentType.name.in_(equipment_names)
            ).all()
        ]
        
        # Get exercises matching equipment
        exercises = self.db.query(Exercise).join(
            ExerciseEquipment
        ).filter(
            ExerciseEquipment.c.equipment_id.in_(equipment_ids)
        ).filter(
            Exercise.difficulty.in_([difficulty, "beginner"] if difficulty != "beginner" else ["beginner"])
        ).limit(limit).all()
        
        return exercises
    
    def get_exercise_by_slug(self, slug: str) -> Exercise:
        return self.db.query(Exercise).filter(Exercise.slug == slug).first()
    
    def search_exercises(
        self, 
        query: str = None,
        muscle_group: str = None,
        equipment: str = None,
        difficulty: str = None
    ) -> List[Exercise]:
        """Search exercises with filters."""
        q = self.db.query(Exercise)
        
        if query:
            q = q.filter(Exercise.name.ilike(f"%{query}%"))
        if equipment:
            q = q.join(ExerciseEquipment).join(EquipmentType).filter(
                EquipmentType.name == equipment
            )
        if difficulty:
            q = q.filter(Exercise.difficulty == difficulty)

        exercises = q.all()

        if muscle_group:
            exercises = [
                exercise
                for exercise in exercises
                if muscle_group in (exercise.muscle_groups or [])
            ]

        return exercises
