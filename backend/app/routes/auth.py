from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import secrets

from app.database.connection import get_db
from app.models.user import User, Profile, PasswordResetToken
from app.models.health import HealthHistory, Consent
from app.models.extended import MedicineReminder, SOSLog
from app.schemas.user import UserCreate, UserResponse, Token, ProfileResponse, ChangePasswordRequest, DeleteAccountRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.utils.email import send_password_reset_email
from app.middleware.deps import get_current_user
from sqlalchemy import delete
from app.utils.auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests
import os

class GoogleToken(BaseModel):
    token: str

GOOGLE_CLIENT_ID = os.getenv("VITE_GOOGLE_CLIENT_ID", "YOUR_GOOGLE_CLIENT_ID")

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == user_data.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(name=user_data.name, email=user_data.email, password_hash=hashed_password)
    db.add(new_user)
    await db.flush() # flush to get user id
    
    # Create empty profile
    new_profile = Profile(user_id=new_user.id)
    db.add(new_profile)
    
    await db.commit()
    await db.refresh(new_user)
    
    return UserResponse(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        created_at=new_user.created_at,
        profile=ProfileResponse(
            id=new_profile.id,
            user_id=new_profile.user_id,
            updated_at=new_profile.updated_at
        )
    )

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == form_data.username))
    user = result.scalars().first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google", response_model=Token)
async def google_auth(token_data: GoogleToken, db: AsyncSession = Depends(get_db)):
    try:
        # Verify the access token via Google UserInfo API
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token_data.token}"}
            )
            if response.status_code != 200:
                raise ValueError("Invalid Google token")
            idinfo = response.json()
            
        email = idinfo.get("email")
        name = idinfo.get("name")
        
        if not email:
            raise HTTPException(status_code=400, detail="Google token missing email")

        # Check if user exists
        result = await db.execute(select(User).filter(User.email == email))
        user = result.scalars().first()

        if not user:
            # Create user if doesn't exist
            # Generate a random password hash since they use Google to login
            hashed_password = get_password_hash(os.urandom(16).hex())
            new_user = User(name=name or email.split('@')[0], email=email, password_hash=hashed_password)
            db.add(new_user)
            await db.flush()
            
            # Create profile
            new_profile = Profile(user_id=new_user.id)
            db.add(new_profile)
            
            await db.commit()
            await db.refresh(new_user)
            user = new_user
            
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is deactivated")

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
        
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

@router.patch("/password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(password_data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    if len(password_data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long")
        
    current_user.password_hash = get_password_hash(password_data.new_password)
    db.add(current_user)
    await db.commit()
    
    return {"message": "Password updated successfully"}

@router.delete("/account")
async def delete_account(
    account_data: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(account_data.password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect password")
        
    # Manually cascade delete since DB relations might not have ON DELETE CASCADE
    user_id = current_user.id
    
    await db.execute(delete(Profile).where(Profile.user_id == user_id))
    await db.execute(delete(HealthHistory).where(HealthHistory.user_id == user_id))
    await db.execute(delete(Consent).where(Consent.user_id == user_id))
    await db.execute(delete(MedicineReminder).where(MedicineReminder.user_id == user_id))
    await db.execute(delete(SOSLog).where(SOSLog.user_id == user_id))
    
    # Finally delete the user
    await db.execute(delete(User).where(User.id == user_id))
    
    await db.commit()
    
    return {"message": "Account and all associated data deleted successfully"}

@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).filter(User.email == request.email))
    user = result.scalars().first()
    
    if not user:
        # To prevent email enumeration, we return success even if user not found
        return {"message": "If that email is registered, a password reset link will be sent."}
        
    # Delete any existing reset tokens for this user
    await db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id))
    
    # Generate new token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)
    
    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at
    )
    db.add(reset_token)
    await db.commit()
    
    # Send email
    send_password_reset_email(user, token)
    
    return {"message": "If that email is registered, a password reset link will be sent."}

@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(PasswordResetToken).filter(PasswordResetToken.token == request.token))
    reset_token = result.scalars().first()
    
    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    if reset_token.expires_at < datetime.utcnow():
        await db.execute(delete(PasswordResetToken).where(PasswordResetToken.id == reset_token.id))
        await db.commit()
        raise HTTPException(status_code=400, detail="Reset token has expired")
        
    # Find user and update password
    user_result = await db.execute(select(User).filter(User.id == reset_token.user_id))
    user = user_result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long")
        
    user.password_hash = get_password_hash(request.new_password)
    db.add(user)
    
    # Delete token
    await db.execute(delete(PasswordResetToken).where(PasswordResetToken.id == reset_token.id))
    await db.commit()
    
    return {"message": "Password has been reset successfully"}
