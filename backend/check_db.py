import asyncio
from app.database.connection import AsyncSessionLocal
from sqlalchemy.future import select
from app.models.user import Profile

async def run():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Profile))
        profiles = result.scalars().all()
        print([(p.user_id, p.emergency_contact_email) for p in profiles])

asyncio.run(run())
