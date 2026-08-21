from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database.connection import get_db
from app.models.user import User
from app.models.extended import Medicine, SOSLog
from app.middleware.deps import get_current_admin_user

router = APIRouter(prefix="/api/admin", tags=["admin"])

# --- Schemas ---

class MedicineAdminBase(BaseModel):
    name: str
    price_inr: Optional[float] = None
    is_discontinued: bool = False
    manufacturer_name: Optional[str] = None
    type: Optional[str] = None
    pack_size_label: Optional[str] = None
    composition_primary: Optional[str] = None
    composition_secondary: Optional[str] = None

class MedicineAdminResponse(MedicineAdminBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class UserAdminResponse(BaseModel):
    id: str
    name: str
    email: str
    is_active: bool
    is_admin: bool
    created_at: datetime
    class Config:
        from_attributes = True

class SOSLogAdminResponse(BaseModel):
    id: str
    user_name: str
    user_email: str
    sent_at: datetime
    channel: str
    status: str
    location_link: Optional[str] = None

# --- Medicine Routes ---

@router.get("/medicines", response_model=List[MedicineAdminResponse])
async def admin_get_medicines(
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    query = select(Medicine)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(Medicine.name.ilike(search_pattern))
    
    query = query.order_by(Medicine.name).limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/medicines", response_model=MedicineAdminResponse)
async def admin_create_medicine(
    med_data: MedicineAdminBase,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    db_med = Medicine(**med_data.dict())
    db.add(db_med)
    await db.commit()
    await db.refresh(db_med)
    return db_med

@router.put("/medicines/{med_id}", response_model=MedicineAdminResponse)
async def admin_update_medicine(
    med_id: str,
    med_data: MedicineAdminBase,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    result = await db.execute(select(Medicine).filter(Medicine.id == med_id))
    db_med = result.scalars().first()
    if not db_med:
        raise HTTPException(status_code=404, detail="Medicine not found")
        
    for var, value in vars(med_data).items():
        setattr(db_med, var, value)
        
    db.add(db_med)
    await db.commit()
    await db.refresh(db_med)
    return db_med

@router.delete("/medicines/{med_id}")
async def admin_delete_medicine(
    med_id: str,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    result = await db.execute(select(Medicine).filter(Medicine.id == med_id))
    db_med = result.scalars().first()
    if not db_med:
        raise HTTPException(status_code=404, detail="Medicine not found")
        
    await db.delete(db_med)
    await db.commit()
    return {"message": "Medicine deleted"}

# --- Users Routes ---

@router.get("/users", response_model=List[UserAdminResponse])
async def admin_get_users(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    query = select(User).order_by(desc(User.created_at))
    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/users/{user_id}/deactivate")
async def admin_toggle_user_active(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    if user_id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
        
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = not user.is_active
    db.add(user)
    await db.commit()
    
    status_msg = "activated" if user.is_active else "deactivated"
    return {"message": f"User successfully {status_msg}", "is_active": user.is_active}

# --- SOS Logs Routes ---

@router.get("/sos-logs", response_model=List[SOSLogAdminResponse])
async def admin_get_sos_logs(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    # Join with User to get name and email
    query = select(SOSLog, User).join(User, SOSLog.user_id == User.id).order_by(desc(SOSLog.sent_at)).limit(limit)
    result = await db.execute(query)
    
    logs = []
    for sos, user in result.all():
        logs.append({
            "id": sos.id,
            "user_name": user.name,
            "user_email": user.email,
            "sent_at": sos.sent_at,
            "channel": sos.channel,
            "status": sos.status,
            "location_link": sos.location_link
        })
        
    return logs
