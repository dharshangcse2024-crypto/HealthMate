# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text, Float
import uuid
from datetime import datetime
from app.database.connection import Base

def generate_uuid():
    return str(uuid.uuid4())

class MedicineReminder(Base):
    __tablename__ = "medicine_reminders"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    medicine_name = Column(String, nullable=False)
    reminder_time = Column(String, nullable=False)  # HH:MM format
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    frequency = Column(String, default="daily") # daily, specific_days
    days_of_week = Column(String, nullable=True) # e.g., "Mon,Wed,Fri"
    food_instruction = Column(String, nullable=True) # before_food, after_food, with_food, none
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

class SOSLog(Base):
    __tablename__ = "sos_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    sent_at = Column(DateTime, default=datetime.utcnow)
    channel = Column(String, default="email")
    status = Column(String, nullable=False)
    location_link = Column(String, nullable=True)

class ReminderLog(Base):
    __tablename__ = "reminder_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    reminder_id = Column(String, ForeignKey("medicine_reminders.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action = Column(String, nullable=False)  # taken, skipped, missed
    timestamp = Column(DateTime, default=datetime.utcnow)

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, index=True)
    generic_name = Column(String, nullable=True)
    purpose = Column(Text, nullable=True)
    dosage_form = Column(String, nullable=True)
    side_effects = Column(Text, nullable=True)
    warnings = Column(Text, nullable=True)
    active_ingredients = Column(String, nullable=True)
    
    # New Indian Medicine Dataset columns
    price_inr = Column(Float, nullable=True)
    is_discontinued = Column(Boolean, default=False)
    manufacturer_name = Column(String, nullable=True)
    type = Column(String, nullable=True)
    pack_size_label = Column(String, nullable=True)
    composition_primary = Column(String, nullable=True)
    composition_secondary = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    is_user = Column(Boolean, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
