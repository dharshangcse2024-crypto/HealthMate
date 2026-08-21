from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.database.connection import get_db
from app.models.user import User
from app.models.health import HealthHistory, Consent
from app.schemas.health import HealthHistoryCreate, HealthHistoryResponse, ConsentCreate, ConsentResponse
from app.middleware.deps import get_current_user

router = APIRouter(prefix="/api", tags=["health"])

@router.post("/consent", response_model=ConsentResponse)
async def acknowledge_consent(consent_data: ConsentCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not consent_data.acknowledged:
        raise HTTPException(status_code=400, detail="Consent must be acknowledged")
    
    new_consent = Consent(user_id=current_user.id)
    db.add(new_consent)
    await db.commit()
    await db.refresh(new_consent)
    return new_consent

@router.get("/health-history", response_model=List[HealthHistoryResponse])
async def get_health_history(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(HealthHistory).filter(HealthHistory.user_id == current_user.id).order_by(HealthHistory.created_at.desc()))
    history = result.scalars().all()
    return history

@router.post("/health-history", response_model=HealthHistoryResponse)
async def add_health_history(history_data: HealthHistoryCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    new_history = HealthHistory(user_id=current_user.id, **history_data.model_dump())
    db.add(new_history)
    await db.commit()
    await db.refresh(new_history)
    return new_history

@router.delete("/health-history/{id}")
async def delete_health_history(id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(HealthHistory).filter(HealthHistory.id == id, HealthHistory.user_id == current_user.id))
    history_record = result.scalars().first()
    if not history_record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    await db.delete(history_record)
    await db.commit()
    return {"detail": "Record deleted"}
