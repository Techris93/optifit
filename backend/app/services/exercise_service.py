from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload
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
        exercises = self.db.query(Exercise).options(selectinload(Exercise.equipment)).join(
            ExerciseEquipment
        ).filter(
            ExerciseEquipment.c.equipment_id.in_(equipment_ids)
        ).filter(
            Exercise.difficulty.in_([difficulty, "beginner"] if difficulty != "beginner" else ["beginner"])
        ).limit(limit).all()
        
        return exercises
    
    def get_exercise_by_slug(self, slug: str) -> Exercise:
        return self.db.query(Exercise).options(selectinload(Exercise.equipment)).filter(Exercise.slug == slug).first()
    
    def search_exercises(
        self, 
        query: str = None,
        muscle_group: str = None,
        equipment: str = None,
        difficulty: str = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Exercise]:
        """Search exercises with filters."""
        q = self.db.query(Exercise).options(selectinload(Exercise.equipment))
        
        if query:
            q = q.filter(Exercise.name.ilike(f"%{query}%"))
        if equipment:
            q = q.join(ExerciseEquipment).join(EquipmentType).filter(
                EquipmentType.name == equipment
            )
        if difficulty:
            q = q.filter(Exercise.difficulty == difficulty)

        db_limit = min(max(limit * 5 if muscle_group else limit, limit), 250)
        exercises = q.offset(skip if not muscle_group else 0).limit(db_limit).all()

        if muscle_group:
            exercises = [
                exercise
                for exercise in exercises
                if muscle_group in (exercise.muscle_groups or [])
            ]
            exercises = exercises[skip : skip + limit]

        return exercises
