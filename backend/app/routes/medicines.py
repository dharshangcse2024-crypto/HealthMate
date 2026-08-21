from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
import httpx
import re

from app.database.connection import get_db
from app.models.extended import Medicine
from app.schemas.extended import MedicineResponse, MedicineDetailsResponse

router = APIRouter(prefix="/api/medicines", tags=["Medicines"])

DEFAULT_MEDICINES = [
    "Ibuprofen",
    "Paracetamol",
    "Amoxicillin",
    "Cetirizine",
    "Omeprazole",
    "Acetaminophen",
]

import asyncio

async def fetch_purpose_for_medicine(medicine, client: httpx.AsyncClient):
    search_term = None
    if medicine.composition_primary:
        match = re.match(r"([a-zA-Z\s]+)", medicine.composition_primary)
        if match:
            search_term = match.group(1).strip()
    
    if not search_term:
        search_term = medicine.name.split()[0]
        
    fda_url = f'https://api.fda.gov/drug/label.json?search=active_ingredient:"{search_term}"&limit=1'
    
    try:
        resp = await client.get(fda_url)
        if resp.status_code == 200:
            data = resp.json()
            if "results" in data and len(data["results"]) > 0:
                res = data["results"][0]
                return "\n".join(res.get("purpose", []))
    except:
        pass
    return None

@router.get("/search", response_model=List[MedicineResponse])
async def search_medicines(
    name: str = Query(..., min_length=1, description="Medicine name to search for"),
    db: AsyncSession = Depends(get_db),
):
    """
    Search for medicines by name in the local database.
    """
    clean_name = name.strip().replace("-", " ")
    query = select(Medicine).filter(Medicine.name.ilike(f"%{clean_name}%")).limit(10)
    result = await db.execute(query)
    medicines = result.scalars().all()
    
    # Concurrently fetch purpose from OpenFDA for all results
    async with httpx.AsyncClient(timeout=3.0) as client:
        tasks = [fetch_purpose_for_medicine(med, client) for med in medicines]
        purposes = await asyncio.gather(*tasks)
        
    # Bind the fetched purpose to the response
    for med, purpose in zip(medicines, purposes):
        med.purpose = purpose or med.purpose

    return medicines

@router.get("/defaults", response_model=List[MedicineResponse])
async def get_default_medicines(db: AsyncSession = Depends(get_db)):
    """
    Return a pre-defined set of common medicines for the initial page load.
    """
    query = select(Medicine).filter(Medicine.name.in_(DEFAULT_MEDICINES)).limit(10)
    result = await db.execute(query)
    medicines = result.scalars().all()
    
    # Concurrently fetch purpose from OpenFDA for defaults
    async with httpx.AsyncClient(timeout=3.0) as client:
        tasks = [fetch_purpose_for_medicine(med, client) for med in medicines]
        purposes = await asyncio.gather(*tasks)
        
    for med, purpose in zip(medicines, purposes):
        med.purpose = purpose or med.purpose
        
    return medicines

@router.get("/{medicine_id}/details", response_model=MedicineDetailsResponse)
async def get_medicine_details(medicine_id: str, db: AsyncSession = Depends(get_db)):
    """
    Fetch clinical details (purpose, warnings, side effects) for a medicine from OpenFDA.
    """
    # 1. Fetch medicine from DB
    query = select(Medicine).filter(Medicine.id == medicine_id)
    result = await db.execute(query)
    medicine = result.scalars().first()
    
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    # 2. Extract core active ingredient
    search_term = None
    if medicine.composition_primary:
        # e.g., "Paracetamol (650mg)" -> "Paracetamol"
        match = re.match(r"([a-zA-Z\s]+)", medicine.composition_primary)
        if match:
            search_term = match.group(1).strip()
    
    if not search_term:
        search_term = medicine.name.split()[0] # Fallback to first word of name
        
    # 3. Call OpenFDA API
    fda_url = f'https://api.fda.gov/drug/label.json?search=active_ingredient:"{search_term}"&limit=1'
    
    purpose = medicine.purpose
    warnings = medicine.warnings
    side_effects = medicine.side_effects
    fetched = False
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(fda_url)
            if resp.status_code == 200:
                data = resp.json()
                if "results" in data and len(data["results"]) > 0:
                    res = data["results"][0]
                    # FDA fields are usually lists of strings
                    purpose = "\n".join(res.get("purpose", [])) or purpose
                    warnings = "\n".join(res.get("warnings", []) + res.get("precautions", [])) or warnings
                    side_effects = "\n".join(res.get("adverse_reactions", [])) or side_effects
                    fetched = True
    except Exception as e:
        print(f"OpenFDA API error: {e}")
        pass # Silently fallback to DB defaults if API fails

    return MedicineDetailsResponse(
        id=medicine.id,
        name=medicine.name,
        purpose=purpose,
        warnings=warnings,
        side_effects=side_effects,
        fetched_from_fda=fetched
    )
