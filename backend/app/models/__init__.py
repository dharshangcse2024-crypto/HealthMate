from app.database.connection import Base
from app.models.user import User, Profile
from app.models.health import HealthHistory, Consent
from app.models.extended import MedicineReminder, SOSLog, ReminderLog, Medicine, ChatSession, ChatMessage

# This allows alembic to import `Base` with all models registered to it.
