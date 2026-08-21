from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MedicineReminderBase(BaseModel):
    medicine_name: str
    reminder_time: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    frequency: Optional[str] = "daily"
    days_of_week: Optional[str] = None
    food_instruction: Optional[str] = None

class MedicineReminderCreate(MedicineReminderBase):
    pass

class MedicineReminderResponse(MedicineReminderBase):
    id: str
    user_id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class SOSLogResponse(BaseModel):
    id: str
    user_id: str
    sent_at: datetime
    channel: str
    status: str
    location_link: Optional[str] = None

    class Config:
        from_attributes = True

class ReminderLogCreate(BaseModel):
    action: str

class MedicineResponse(BaseModel):
    id: str
    name: str
    generic_name: Optional[str] = None
    purpose: Optional[str] = None
    dosage_form: Optional[str] = None
    side_effects: Optional[str] = None
    warnings: Optional[str] = None
    active_ingredients: Optional[str] = None
    
    price_inr: Optional[float] = None
    is_discontinued: Optional[bool] = None
    manufacturer_name: Optional[str] = None
    type: Optional[str] = None
    pack_size_label: Optional[str] = None
    composition_primary: Optional[str] = None
    composition_secondary: Optional[str] = None

    class Config:
        from_attributes = True

class MedicineDetailsResponse(BaseModel):
    id: str
    name: str
    purpose: Optional[str] = None
    warnings: Optional[str] = None
    side_effects: Optional[str] = None
    fetched_from_fda: bool = False

class ReminderLogResponse(BaseModel):
    id: str
    reminder_id: str
    user_id: str
    action: str
    timestamp: datetime

    class Config:
        from_attributes = True

class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    is_user: bool
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionResponse(BaseModel):
    id: str
    user_id: str
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: Optional[list[ChatMessageResponse]] = None

    class Config:
        from_attributes = True

class ChatSessionUpdateRequest(BaseModel):
    title: str
