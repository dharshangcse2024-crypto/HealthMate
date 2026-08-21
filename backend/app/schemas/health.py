from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class HealthHistoryCreate(BaseModel):
    record_type: str
    symptoms: Optional[str] = None
    prediction: Optional[str] = None
    prediction_score: Optional[str] = None
    recommendations: Optional[str] = None
    doctor_name: Optional[str] = None
    description: Optional[str] = None
    report_details: Optional[str] = None

class HealthHistoryResponse(HealthHistoryCreate):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConsentCreate(BaseModel):
    acknowledged: bool

class ConsentResponse(BaseModel):
    id: str
    user_id: str
    acknowledged_at: datetime

    class Config:
        from_attributes = True
