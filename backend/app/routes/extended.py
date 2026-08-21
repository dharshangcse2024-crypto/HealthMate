from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import httpx
import math
from pydantic import BaseModel
from app.database.connection import get_db
from app.models.user import User, Profile
from app.models.extended import MedicineReminder, SOSLog, ReminderLog
from app.schemas.extended import MedicineReminderCreate, MedicineReminderResponse, SOSLogResponse, ReminderLogCreate, ReminderLogResponse
from app.middleware.deps import get_current_user

router = APIRouter(prefix="/api/extended", tags=["extended"])

# --- Medicine Reminders ---

@router.get("/reminders/logs", response_model=List[ReminderLogResponse])
async def get_reminder_logs(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ReminderLog).filter(ReminderLog.user_id == current_user.id).order_by(ReminderLog.timestamp.desc()))
    return result.scalars().all()

@router.get("/reminders", response_model=List[MedicineReminderResponse])
async def get_reminders(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MedicineReminder).filter(MedicineReminder.user_id == current_user.id))
    return result.scalars().all()

@router.post("/reminders", response_model=MedicineReminderResponse)
async def create_reminder(reminder_data: MedicineReminderCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    new_reminder = MedicineReminder(user_id=current_user.id, **reminder_data.model_dump())
    db.add(new_reminder)
    await db.commit()
    await db.refresh(new_reminder)
    return new_reminder

@router.delete("/reminders/{id}")
async def delete_reminder(id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MedicineReminder).filter(MedicineReminder.id == id, MedicineReminder.user_id == current_user.id))
    reminder = result.scalars().first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    await db.delete(reminder)
    await db.commit()
    return {"detail": "Reminder deleted"}

@router.post("/reminders/{id}/log", response_model=ReminderLogResponse)
async def log_reminder(id: str, log_data: ReminderLogCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MedicineReminder).filter(MedicineReminder.id == id, MedicineReminder.user_id == current_user.id))
    reminder = result.scalars().first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    new_log = ReminderLog(
        reminder_id=id,
        user_id=current_user.id,
        action=log_data.action
    )
    db.add(new_log)
    
    # if it's a one-time reminder and it's taken or skipped, we might want to mark it inactive
    reminder.status = "completed"
    
    # Create HealthHistory record for unified timeline
    from app.models.health import HealthHistory
    
    action_text = log_data.action.capitalize()
    time_text = f" at {reminder.reminder_time}" if action_text == "Taken" else ""
    history_desc = f"{reminder.medicine_name} — {action_text}{time_text}"
    
    new_history = HealthHistory(
        user_id=current_user.id,
        record_type="medicine_reminder",
        description=history_desc
    )
    db.add(new_history)
    
    await db.commit()
    await db.refresh(new_log)
    return new_log

# --- SOS Notify ---

@router.post("/sos/notify", response_model=SOSLogResponse)
async def notify_sos(latitude: Optional[float] = None, longitude: Optional[float] = None, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Get Emergency Contact
    result = await db.execute(select(Profile).filter(Profile.user_id == current_user.id))
    profile = result.scalars().first()
    
    if not profile or not profile.emergency_contact_email:
        raise HTTPException(status_code=400, detail="No emergency contact email on file")
        
    location_link = None
    if latitude and longitude:
        location_link = f"https://www.google.com/maps/search/?api=1&query={latitude},{longitude}"

    # Prepare Email
    sender_email = os.getenv("SMTP_USERNAME", "noreply@healthmate.com")
    receiver_email = profile.emergency_contact_email
    subject = "SOS / Emergency Alert - HealthMate"
    
    body = f"SOS Alert from HealthMate\n\n"
    body += f"User: {current_user.name}\n"
    body += f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
    if location_link:
        body += f"Last Known Location: {location_link}\n"
    else:
        body += "Last Known Location: Not Available\n"
        
    body += "\nThis is an automated alert. The user has triggered an SOS request and may need immediate assistance."

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    # Send Email via SMTP
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if smtp_server and smtp_port:
        try:
            server = smtplib.SMTP(smtp_server, int(smtp_port))
            server.starttls()
            if smtp_user and smtp_password:
                server.login(smtp_user, smtp_password)
            server.send_message(msg)
            server.quit()
        except Exception as e:
            print(f"SMTP Error: {e}")
            raise HTTPException(status_code=500, detail="Failed to send SOS email alert.")
    else:
        # Fallback for local testing if SMTP not configured, just print to console
        print(f"\n--- SOS EMAIL SIMULATION (SMTP Not Configured) ---")
        print(f"TO: {receiver_email}")
        print(f"MESSAGE:\n{body}")
        print(f"--------------------------------------------------\n")
    
    # Log the SOS
    new_sos = SOSLog(
        user_id=current_user.id,
        channel="email_simulation",
        status="sent",
        location_link=location_link
    )
    db.add(new_sos)
    await db.commit()
    await db.refresh(new_sos)
    return new_sos

# --- Nearby Hospitals ---

class HospitalResponse(BaseModel):
    id: str
    name: str
    address: str
    distance: str
    phone: str
    status: str
    emergency: bool

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth radius in km
    lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
    lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

@router.get("/hospitals/nearby", response_model=List[HospitalResponse])
async def get_nearby_hospitals(lat: float, lng: float, radius: int = 5000, current_user: User = Depends(get_current_user)):
    query = f"""[out:json];(node["amenity"="hospital"](around:{radius},{lat},{lng});node["amenity"="clinic"](around:{radius},{lat},{lng});way["amenity"="hospital"](around:{radius},{lat},{lng});way["amenity"="clinic"](around:{radius},{lat},{lng}););out center;"""
    
    endpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter",
        "https://z.overpass-api.de/api/interpreter"
    ]
    
    data = None
    for endpoint in endpoints:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    endpoint,
                    params={"data": query},
                    headers={"User-Agent": "HealthMate/1.0"},
                    timeout=15.0,
                )
                response.raise_for_status()
                data = response.json()
                break
        except Exception as e:
            print(f"Overpass API error on {endpoint}: {e}")
            continue
            
    if not data:
        raise HTTPException(status_code=502, detail="Failed to fetch hospital data from OSM")
        
    hospitals = []
    for idx, element in enumerate(data.get("elements", [])):
        tags = element.get("tags", {})
        
        name = tags.get("name", "Unknown Facility")
        
        address_parts = []
        if "addr:street" in tags:
            address_parts.append(tags["addr:street"])
        if "addr:city" in tags:
            address_parts.append(tags["addr:city"])
            
        address = ", ".join(address_parts) if address_parts else "Address not available"
        
        phone = tags.get("phone") or tags.get("contact:phone") or tags.get("phone:emergency") or "Not Available"
        
        emergency_tag = tags.get("emergency", "no")
        emergency = emergency_tag == "yes"
        
        el_lat = element.get("lat") or element.get("center", {}).get("lat")
        el_lon = element.get("lon") or element.get("center", {}).get("lon")
        
        if el_lat and el_lon:
            dist_km = haversine(lat, lng, el_lat, el_lon)
            distance_str = f"{dist_km:.1f} km"
        else:
            dist_km = 999.0
            distance_str = "Unknown distance"
            
        status = "Open 24/7" if emergency else "Open"
        
        hospitals.append({
            "id": str(element.get("id", idx)),
            "name": name,
            "address": address,
            "distance": distance_str,
            "phone": phone,
            "status": status,
            "emergency": emergency,
            "_raw_dist": dist_km
        })
        
    hospitals.sort(key=lambda x: x["_raw_dist"])
    
    for h in hospitals:
        del h["_raw_dist"]
        
    return hospitals[:20]


@router.get("/hospitals/geocode", response_model=List[HospitalResponse])
async def get_hospitals_by_location_query(query: str, radius: int = 5000, current_user: User = Depends(get_current_user)):
    """Geocode a user-entered location string and return nearby hospitals."""
    if not query or not query.strip():
        raise HTTPException(status_code=400, detail="Location query cannot be empty")

    # Step 1: Geocode the query using Nominatim (free, no API key)
    try:
        async with httpx.AsyncClient() as client:
            geocode_resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": query.strip(), "format": "json", "limit": 1},
                headers={"User-Agent": "HealthMate/1.0"},
                timeout=10.0,
            )
            geocode_resp.raise_for_status()
            geocode_data = geocode_resp.json()
    except Exception as e:
        print(f"Nominatim geocoding error: {e}")
        raise HTTPException(status_code=502, detail="Failed to geocode location")

    if not geocode_data:
        raise HTTPException(status_code=404, detail="Could not find the specified location. Try a more specific address.")

    lat = float(geocode_data[0]["lat"])
    lng = float(geocode_data[0]["lon"])

    # Step 2: Reuse the existing hospital lookup
    return await get_nearby_hospitals(lat=lat, lng=lng, radius=radius, current_user=current_user)

