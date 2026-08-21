import asyncio
import csv
import sys
import os
import urllib.request
import uuid
from typing import Set

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import insert
from app.database import AsyncSessionLocal
from app.models.extended import Medicine

CSV_URL = "https://raw.githubusercontent.com/junioralive/Indian-Medicine-Dataset/main/DATA/indian_medicine_data.csv"

def normalize_name(name: str) -> str:
    if not name:
        return ""
    return name.strip().replace("-", " ")

async def import_data():
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    print("Fetching existing medicine names for deduplication...")
    existing_names: Set[str] = set()
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Medicine.name))
        for row in result.scalars():
            existing_names.add(normalize_name(row).lower())
            
    print(f"Found {len(existing_names)} existing medicines. Downloading CSV...")
    
    # We use urllib to stream the CSV
    req = urllib.request.Request(CSV_URL, headers={'User-Agent': 'Mozilla/5.0'})
    
    total_processed = 0
    total_inserted = 0
    total_skipped = 0
    
    batch_size = 5000
    batch = []
    
    with urllib.request.urlopen(req) as response:
        # The dataset is likely utf-8, but might have some bad characters, use replace
        lines = (line.decode('utf-8', errors='replace') for line in response)
        reader = csv.DictReader(lines)
        
        async with AsyncSessionLocal() as db:
            for row in reader:
                total_processed += 1
                
                raw_name = row.get('name', '')
                comp1 = row.get('short_composition1', '')
                
                if not raw_name or not comp1:
                    total_skipped += 1
                    continue
                    
                norm_name = normalize_name(raw_name)
                if norm_name.lower() in existing_names:
                    total_skipped += 1
                    continue
                
                # Parse price
                price_str = row.get('price(₹)', '').strip()
                price_val = None
                if price_str:
                    try:
                        price_val = float(price_str)
                    except ValueError:
                        pass
                        
                is_discontinued = row.get('Is_discontinued', '').strip().upper() == 'TRUE'
                
                # We need to generate UUIDs automatically, or let the DB default handle it.
                # Since we are using SQLAlchemy insert().values() which bypasses the ORM defaults if we aren't careful,
                # actually SQLAlchemy Core insert DOES execute python defaults! So we just don't provide 'id'.
                
                batch.append({
                    "id": str(uuid.uuid4()),
                    "name": norm_name,
                    "price_inr": price_val,
                    "is_discontinued": is_discontinued,
                    "manufacturer_name": row.get('manufacturer_name', '').strip(),
                    "type": row.get('type', '').strip(),
                    "pack_size_label": row.get('pack_size_label', '').strip(),
                    "composition_primary": comp1.strip(),
                    "composition_secondary": row.get('short_composition2', '').strip() or None,
                })
                
                existing_names.add(norm_name.lower()) # prevent duplicates within the CSV itself
                
                if len(batch) >= batch_size:
                    db.add_all([Medicine(**item) for item in batch])
                    await db.commit()
                    total_inserted += len(batch)
                    batch = []
                    print(f"Processed {total_processed} rows... Inserted {total_inserted}")
                    
            if batch:
                db.add_all([Medicine(**item) for item in batch])
                await db.commit()
                total_inserted += len(batch)
                
    print("\n--- Import Complete ---")
    print(f"Total rows processed: {total_processed}")
    print(f"Total rows inserted:  {total_inserted}")
    print(f"Total rows skipped:   {total_skipped}")

if __name__ == "__main__":
    asyncio.run(import_data())
