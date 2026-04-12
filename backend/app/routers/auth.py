from datetime import datetime, timedelta
import os
from typing import Optional

import re

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field

from app.models.database import EquipmentType, User, get_db
from app.config import settings
from app.security import apply_rate_limit

router = APIRouter()
security = HTTPBearer(auto_error=False)
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))
USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_.-]{3,50}$")

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8)

class UserLogin(BaseModel):
    username: str
    password: str

class ProfileUpdate(BaseModel):
    fitness_goal: Optional[str] = None
    experience_level: Optional[str] = None
    workouts_per_week: Optional[int] = None


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user: User) -> str:
    expires_at = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {
        "sub": str(user.id),
        "username": user.username,
        "exp": expires_at,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(401, "Authentication required")
    user = _user_from_token(credentials.credentials, db)
    if not user:
        raise HTTPException(401, "Invalid authentication credentials")
    return user


def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User | None:
    if credentials is None:
        return None
    return _user_from_token(credentials.credentials, db)


def _user_from_token(token: str, db: Session) -> User | None:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(401, "Invalid authentication credentials")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(401, "Invalid authentication credentials")
    return user


@router.post("/register")
async def register(user_data: UserCreate, request: Request, db: Session = Depends(get_db)):
    """Register new user."""
    apply_rate_limit(
        request,
        "auth-register",
        user_data.username.lower(),
        settings.auth_rate_limit_count,
        settings.auth_rate_limit_window_seconds,
    )

    normalized_email = user_data.email.lower()
    normalized_username = user_data.username.strip()
    if not USERNAME_PATTERN.fullmatch(normalized_username):
        raise HTTPException(400, "Username may only contain letters, numbers, dots, underscores, and hyphens.")

    # Check if user exists
    existing = db.query(User).filter(
        (User.email == normalized_email) | (User.username == normalized_username)
    ).first()
    
    if existing:
        raise HTTPException(400, "Unable to register with those credentials.")
    
    user = User(
        email=normalized_email,
        username=normalized_username,
        hashed_password=hash_password(user_data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "username": user.username, "email": user.email},
    }

@router.post("/login")
async def login(credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Login user."""
    normalized_username = credentials.username.strip()
    apply_rate_limit(
        request,
        "auth-login",
        normalized_username.lower(),
        settings.auth_rate_limit_count,
        settings.auth_rate_limit_window_seconds,
    )

    user = db.query(User).filter(User.username == normalized_username).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")

    return {
        "access_token": create_access_token(user),
        "token_type": "bearer",
        "user": {"id": user.id, "username": user.username, "email": user.email},
    }

@router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get user profile."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "fitness_goal": current_user.fitness_goal,
        "experience_level": current_user.experience_level,
        "workouts_per_week": current_user.workouts_per_week,
        "equipment": [
            {
                "id": equipment.id,
                "name": equipment.name,
                "display_name": equipment.display_name,
                "category": equipment.category,
            }
            for equipment in current_user.equipment
        ],
    }

@router.put("/profile")
async def update_profile(
    update: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update user profile."""
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return {"message": "Profile updated", "profile": await get_profile(current_user)}

@router.get("/my-equipment")
async def get_my_equipment(current_user: User = Depends(get_current_user)):
    """Get user's saved equipment list."""
    return {
        "equipment": [
            {
                "id": equipment.id,
                "name": equipment.name,
                "display_name": equipment.display_name,
                "category": equipment.category,
            }
            for equipment in current_user.equipment
        ]
    }

@router.post("/my-equipment")
async def add_equipment(
    equipment_ids: list[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add equipment to user's gym."""
    equipment = db.query(EquipmentType).filter(EquipmentType.id.in_(equipment_ids)).all()
    if len(equipment) != len(set(equipment_ids)):
        raise HTTPException(404, "One or more equipment items were not found")

    existing_ids = {item.id for item in current_user.equipment}
    for item in equipment:
        if item.id not in existing_ids:
            current_user.equipment.append(item)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return await get_my_equipment(current_user)
