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

RXNORM_ALLCONCEPTS_URL = "https://rxnav.nlm.nih.gov/REST/allconcepts.json"
OPENFDA_BASE = "https://api.fda.gov/drug/label.json"

HTTP_TIMEOUT = 15.0

async def fetch_rxnorm_concepts(client: httpx.AsyncClient):
    print("Fetching RxNorm concepts (this may take a moment)...")
    names = set()
    
    for tty in ["IN", "BN"]:
        resp = await client.get(RXNORM_ALLCONCEPTS_URL, params={"tty": tty})
        resp.raise_for_status()
        data = resp.json()
        
        concepts = data.get("minConceptGroup", {}).get("minConcept", [])
        print(f"Found {len(concepts)} concepts for TTY={tty}.")
        for c in concepts:
            if c.get("name"):
                names.add(c["name"])
                
    return list(names)

def _extract_field(label: dict, *keys: str) -> str:
    for key in keys:
        val = label.get(key)
        if val:
            if isinstance(val, list):
                val = val[0]
            if isinstance(val, str) and val.strip():
                return val.strip()
    return ""

async def fetch_fda_label(client: httpx.AsyncClient, drug_name: str) -> dict | None:
    # Try brand_name first
    search_term = f'openfda.brand_name:"{drug_name}"'
    
    for attempt in range(3):
        try:
            resp = await client.get(
                OPENFDA_BASE,
                params={"search": search_term, "limit": 1},
                timeout=HTTP_TIMEOUT
            )
            
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                if results:
                    return results[0]
            elif resp.status_code == 404:
                # Not found, try generic_name
                search_term = f'openfda.generic_name:"{drug_name}"'
                resp = await client.get(
                    OPENFDA_BASE,
                    params={"search": search_term, "limit": 1},
                    timeout=HTTP_TIMEOUT
                )
                if resp.status_code == 200:
                    results = resp.json().get("results", [])
                    if results:
                        return results[0]
                elif resp.status_code == 404:
                    return None
            elif resp.status_code == 429:
                # Rate limit
                await asyncio.sleep(2 ** attempt)
                continue
                
        except Exception as e:
            if attempt == 2:
                print(f"Error fetching {drug_name}: {e}")
            await asyncio.sleep(1)
            
    return None

async def seed_medicines(batch_size: int = 50):
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    async with httpx.AsyncClient() as client:
        all_drug_names = await fetch_rxnorm_concepts(client)
        
        # Limit to batch_size
        drug_names = all_drug_names[:batch_size]
        print(f"Processing batch of {len(drug_names)} drugs (out of {len(all_drug_names)} total)...")
        
        async with AsyncSessionLocal() as db:
            inserted_count = 0
            skipped_count = 0
            
            for name in drug_names:
                existing = await db.execute(select(Medicine).filter(Medicine.name == name))
                if existing.scalars().first():
                    print(f"Skipping '{name}' (already in DB)")
                    skipped_count += 1
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
                    inserted_count += 1
                    print(f"  -> Successfully inserted '{name}'.")
                else:
                    print(f"  -> No FDA label found for '{name}'. Skipping.")
                    
                await asyncio.sleep(0.2)
                
            print(f"\nSeeding complete! Inserted: {inserted_count}, Skipped (Existing): {skipped_count}.")

if __name__ == "__main__":
    asyncio.run(seed_medicines(batch_size=50))
