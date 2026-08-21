from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database.connection import get_db
from app.models.user import User, Profile
from app.schemas.user import ProfileResponse, ProfileBase
from app.middleware.deps import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])

@router.get("/", response_model=ProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Profile).filter(Profile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    # We need to construct a dictionary or update an object to include the user's name
    profile_data = {
        "id": profile.id,
        "user_id": profile.user_id,
        "name": current_user.name,
        "age": profile.age,
        "gender": profile.gender,
        "blood_group": profile.blood_group,
        "height": profile.height,
        "weight": profile.weight,
        "emergency_contact": profile.emergency_contact,
        "emergency_contact_email": profile.emergency_contact_email,
        "profile_picture": profile.profile_picture,
        "updated_at": profile.updated_at,
        "is_admin": current_user.is_admin,
        "is_active": current_user.is_active
    }
    return profile_data

@router.put("/", response_model=ProfileResponse)
async def update_profile(profile_data: ProfileBase, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Profile).filter(Profile.user_id == current_user.id))
    profile = result.scalars().first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    for var, value in vars(profile_data).items():
        if value is not None:
            if var == 'name':
                current_user.name = value
                db.add(current_user)
            else:
                setattr(profile, var, value)
            
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    
    profile_data = {
        "id": profile.id,
        "user_id": profile.user_id,
        "name": current_user.name,
        "age": profile.age,
        "gender": profile.gender,
        "blood_group": profile.blood_group,
        "height": profile.height,
        "weight": profile.weight,
        "emergency_contact": profile.emergency_contact,
        "emergency_contact_email": profile.emergency_contact_email,
        "profile_picture": profile.profile_picture,
        "updated_at": profile.updated_at,
        "is_admin": current_user.is_admin,
        "is_active": current_user.is_active
    }
    return profile_data
