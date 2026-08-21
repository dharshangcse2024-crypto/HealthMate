import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.models.user import User

def send_password_reset_email(user: User, token: str):
    receiver_email = user.email
    
    if not receiver_email:
        print(f"Cannot send reset email to {user.name}, no email.")
        return
        
    sender_email = os.getenv("SMTP_USERNAME", "noreply@healthmate.com")
    subject = "Password Reset Request"
    
    # We will get the frontend URL from an env var, or default to localhost:5173
    frontend_url = os.getenv("VITE_FRONTEND_URL", "http://localhost:5173")
    reset_link = f"{frontend_url}/reset-password?token={token}"
    
    body = f"Hello {user.name},\n\n"
    body += "You have requested to reset your password for HealthMate.\n"
    body += f"Please click on the following link to reset your password:\n{reset_link}\n\n"
    body += "If you did not request this, please ignore this email.\n\n"
    body += "Thanks,\nHealthMate Team"

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
            print(f"Sent password reset email to {receiver_email}")
        except Exception as e:
            print(f"SMTP Error: {e}")
    else:
        print(f"\n--- PASSWORD RESET EMAIL SIMULATION ---")
        print(f"TO: {receiver_email}")
        print(f"MESSAGE:\n{body}")
        print(f"---------------------------------------\n")
