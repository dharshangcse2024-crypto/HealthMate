from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ProfileBase(BaseModel):
    name: Optional[str] = None
    age: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    emergency_contact: Optional[str] = None
    emergency_contact_email: Optional[str] = None
    profile_picture: Optional[str] = None

class ProfileResponse(ProfileBase):
    id: str
    user_id: str
    updated_at: datetime
    is_admin: bool = False
    is_active: bool = True

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    created_at: datetime
    is_admin: bool = False
    is_active: bool = True
    profile: Optional[ProfileResponse] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class DeleteAccountRequest(BaseModel):
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
