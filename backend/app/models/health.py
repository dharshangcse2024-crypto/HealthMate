from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database.connection import Base

def generate_uuid():
    return str(uuid.uuid4())

class HealthHistory(Base):
    __tablename__ = "health_history"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    record_type = Column(String, nullable=False) # 'symptom_check', 'manual_record'
    symptoms = Column(Text, nullable=True) # JSON stored as string for simplicity across DBs
    prediction = Column(String, nullable=True)
    prediction_score = Column(String, nullable=True)
    recommendations = Column(Text, nullable=True)
    doctor_name = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    report_details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Consent(Base):
    __tablename__ = "consents"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    acknowledged_at = Column(DateTime, default=datetime.utcnow)
