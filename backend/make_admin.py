import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
EMAIL = "dharshanganesh102006@gmail.com"

async def make_admin():
    print("Promoting user to admin...")
    try:
        engine = create_async_engine(DATABASE_URL)
        async with engine.connect() as conn:
            await conn.execute(text(f"UPDATE users SET is_admin = True WHERE email = '{EMAIL}';"))
            await conn.commit()
            print(f"✅ User {EMAIL} is now an admin.")
        await engine.dispose()
    except Exception as e:
        print(f"❌ Failed: {e}")

if __name__ == "__main__":
    asyncio.run(make_admin())
