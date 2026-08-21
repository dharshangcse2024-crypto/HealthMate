import asyncio
import httpx
import sys
import os

# Add backend directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import AsyncSessionLocal
from app.models.extended import Medicine
from seed_medicines import fetch_fda_label, _extract_field

DEFAULT_MEDICINES = [
    "Ibuprofen",
    "Paracetamol",
    "Amoxicillin",
    "Cetirizine",
    "Omeprazole",
    "Acetaminophen",
]

async def seed_defaults():
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    async with httpx.AsyncClient() as client:
        async with AsyncSessionLocal() as db:
            for name in DEFAULT_MEDICINES:
                existing = await db.execute(select(Medicine).filter(Medicine.name == name))
                if existing.scalars().first():
                    print(f"Skipping '{name}' (already in DB)")
                    continue
                    
                print(f"Fetching details for '{name}'...")
                label = await fetch_fda_label(client, name)
                
                if label:
                    openfda = label.get("openfda", {})
                    
                    generic_name = (openfda.get("generic_name") or [""])[0]
                    purpose = _extract_field(label, "indications_and_usage", "purpose", "description")
                    dosage_form = (openfda.get("route") or [""])[0] 
                    if not dosage_form:
                        dosage_form = (openfda.get("dosage_and_administration") or [""])[0][:100]
                    
                    warnings = _extract_field(label, "warnings", "warnings_and_cautions", "do_not_use", "stop_use")
                    side_effects = _extract_field(label, "adverse_reactions", "information_for_patients")
                    active_ingredients = (openfda.get("substance_name") or [""])[0]
                    
                    med = Medicine(
                        name=name,
                        generic_name=generic_name,
                        purpose=purpose or "Detailed usage information not available.",
                        dosage_form=dosage_form or "Unknown",
                        side_effects=side_effects or "Consult a healthcare professional.",
                        warnings=warnings or "Please consult a doctor or pharmacist before use.",
                        active_ingredients=active_ingredients
                    )
                    
                    db.add(med)
                    await db.commit()
                    print(f"  -> Successfully inserted '{name}'.")
                else:
                    print(f"  -> No FDA label found for '{name}'. Skipping.")
                
                await asyncio.sleep(0.2)

if __name__ == "__main__":
    asyncio.run(seed_defaults())
