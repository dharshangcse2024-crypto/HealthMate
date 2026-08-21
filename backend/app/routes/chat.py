import os
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from app.models.user import User
from app.middleware.deps import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from app.database.connection import get_db
from app.models.extended import ChatSession, ChatMessage
from app.schemas.extended import ChatSessionResponse, ChatMessageResponse, ChatSessionUpdateRequest
from typing import Optional

# Import the new GenAI SDK
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key and genai else None

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

class SymptomCheckRequest(BaseModel):
    symptoms: List[str]

class DrugInteractionRequest(BaseModel):
    medicines: List[str]

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_sessions(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(ChatSession).filter(ChatSession.user_id == current_user.id).order_by(desc(ChatSession.updated_at))
    result = await db.execute(query)
    sessions = result.scalars().all()
    return sessions

@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_session(session_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    result = await db.execute(query)
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    msg_query = select(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at)
    msg_result = await db.execute(msg_query)
    messages = msg_result.scalars().all()
    
    session_dict = {
        "id": session.id,
        "user_id": session.user_id,
        "title": session.title,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
        "messages": messages
    }
    return session_dict

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    result = await db.execute(query)
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    await db.delete(session)
    await db.commit()
    return {"status": "success"}

@router.put("/sessions/{session_id}", response_model=ChatSessionResponse)
async def update_session(session_id: str, request: ChatSessionUpdateRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    result = await db.execute(query)
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session.title = request.title
    session.updated_at = __import__('datetime').datetime.utcnow()
    await db.commit()
    await db.refresh(session)
    
    # We don't need to return messages here, just the session info
    session_dict = {
        "id": session.id,
        "user_id": session.user_id,
        "title": session.title,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
        "messages": []
    }
    return session_dict

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured or SDK missing")
        
    system_instruction = """
    You are an AI healthcare assistant named HealthMate. 
    You are intended to help users understand symptoms, obtain preliminary health information, 
    and provide general health recommendations.
    IMPORTANT: You must NOT claim to be a doctor, confirm diagnoses, or provide prescriptions. 
    Always advise the user to consult a qualified medical professional for serious conditions.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=request.message,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction
            )
        )
        
        # Database logic
        session_id = request.session_id
        if not session_id:
            # Create a new session
            new_session = ChatSession(
                user_id=current_user.id,
                title=request.message[:50] + ("..." if len(request.message) > 50 else "")
            )
            db.add(new_session)
            await db.commit()
            await db.refresh(new_session)
            session_id = new_session.id
        else:
            # Verify session belongs to user and update timestamp
            query = select(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
            result = await db.execute(query)
            session = result.scalar_one_or_none()
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
            session.updated_at = __import__('datetime').datetime.utcnow()
        
        # Save user message
        user_msg = ChatMessage(session_id=session_id, is_user=True, content=request.message)
        # Save AI message
        ai_msg = ChatMessage(session_id=session_id, is_user=False, content=response.text)
        
        db.add_all([user_msg, ai_msg])
        await db.commit()
        
        return {"response": response.text, "session_id": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/symptom-check")
async def symptom_check(request: SymptomCheckRequest, current_user: User = Depends(get_current_user)):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    if not request.symptoms:
        raise HTTPException(status_code=400, detail="No symptoms provided")

    system_instruction = """
    You are an AI symptom analyzer. You will receive a list of symptoms.
    You must return a JSON response matching exactly this structure:
    {
        "prediction": "The most likely common condition or 'Unknown'",
        "prediction_score": "A confidence percentage like '85%'",
        "recommendations": "General advice (rest, hydrate, see a doctor, etc.)"
    }
    IMPORTANT: You must output ONLY valid JSON.
    """

    prompt = f"Symptoms: {', '.join(request.symptoms)}"

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json"
            )
        )
        # Parse the JSON response
        result = json.loads(response.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/drug-interaction")
async def drug_interaction(request: DrugInteractionRequest, current_user: User = Depends(get_current_user)):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    if len(request.medicines) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 medicines to check interactions")

    system_instruction = """
    You are an AI drug interaction checker. You will receive a list of medicines.
    Identify any known severe, moderate, or minor drug interactions between any pairs in the list.
    You must return a JSON response matching exactly this structure:
    {
        "interactions": [
            {
                "pair": "Medicine A - Medicine B",
                "severity": "High" | "Moderate" | "Low",
                "description": "Brief explanation of the interaction"
            }
        ]
    }
    If there are no known interactions, return an empty list for "interactions".
    IMPORTANT: You must output ONLY valid JSON.
    """

    prompt = f"Medicines: {', '.join(request.medicines)}"

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json"
            )
        )
        # Parse the JSON response
        result = json.loads(response.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
