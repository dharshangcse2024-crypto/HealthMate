from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime
from app.database.connection import AsyncSessionLocal
from sqlalchemy.future import select
from app.models.extended import MedicineReminder
from app.models.user import Profile, User
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

scheduler = AsyncIOScheduler()

async def check_and_send_reminders():
    # Run every minute to check if there are reminders for the current time
    now = datetime.now()
    current_time_str = now.strftime("%H:%M")
    
    async with AsyncSessionLocal() as db:
        # Find active reminders whose reminder_time matches current_time_str
        # Note: We only check HH:MM. If we also care about start_date/end_date, we should filter those.
        result = await db.execute(
            select(MedicineReminder, User, Profile)
            .join(User, MedicineReminder.user_id == User.id)
            .outerjoin(Profile, User.id == Profile.user_id)
            .filter(MedicineReminder.status == 'active')
            .filter(MedicineReminder.reminder_time == current_time_str)
        )
        
        records = result.all()
        
        for reminder, user, profile in records:
            # Check if within start_date and end_date if they exist
            if reminder.start_date and now.date() < reminder.start_date.date():
                continue
            if reminder.end_date and now.date() > reminder.end_date.date():
                continue
            
            # Check days of the week if frequency is specific_days
            if reminder.frequency == 'specific_days' and reminder.days_of_week:
                # Map Python weekday() to Mon, Tue, etc.
                days_map = {0: 'Mon', 1: 'Tue', 2: 'Wed', 3: 'Thu', 4: 'Fri', 5: 'Sat', 6: 'Sun'}
                current_day = days_map[now.weekday()]
                if current_day not in reminder.days_of_week.split(','):
                    continue

            # Send notification
            send_reminder_email(user, profile, reminder)

def send_reminder_email(user, profile, reminder):
    receiver_email = user.email # Normally user email for medicine
    
    if not receiver_email:
        print(f"Cannot send reminder to {user.name}, no email.")
        return
        
    sender_email = os.getenv("SMTP_USERNAME", "noreply@healthmate.com")
    subject = f"Medicine Reminder: Time to take {reminder.medicine_name}"
    
    body = f"Hello {user.name},\n\n"
    
    food_instruction = ""
    if reminder.food_instruction == "before_food":
        food_instruction = " (Before Food)"
    elif reminder.food_instruction == "after_food":
        food_instruction = " (After Food)"
    elif reminder.food_instruction == "with_food":
        food_instruction = " (With Food)"
        
    body += f"This is your reminder to take your medicine: {reminder.medicine_name} at {reminder.reminder_time}{food_instruction}.\n\n"
    body += "Stay healthy!\nHealthMate"

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

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
            print(f"Sent reminder email to {receiver_email} for {reminder.medicine_name}")
        except Exception as e:
            print(f"SMTP Error: {e}")
    else:
        print(f"\n--- REMINDER EMAIL SIMULATION ---")
        print(f"TO: {receiver_email}")
        print(f"MESSAGE:\n{body}")
        print(f"---------------------------------\n")

def start_scheduler():
    scheduler.add_job(check_and_send_reminders, 'cron', minute='*')
    scheduler.start()

def stop_scheduler():
    scheduler.shutdown()
