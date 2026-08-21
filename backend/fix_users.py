import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def fix_users():
    print("Fixing NULL values for is_active and is_admin...")
    try:
        engine = create_async_engine(DATABASE_URL)
        async with engine.connect() as conn:
            # Set is_active = True for all users where it is NULL
            await conn.execute(text("UPDATE users SET is_active = True WHERE is_active IS NULL;"))
            
            # Set is_admin = False for all users where it is NULL
            await conn.execute(text("UPDATE users SET is_admin = False WHERE is_admin IS NULL;"))
            
            # Ensure the specific user is admin
            await conn.execute(text("UPDATE users SET is_admin = True WHERE email = 'dharshanganesh102006@gmail.com';"))
            
            await conn.commit()
            print("Successfully updated existing users.")
        await engine.dispose()
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(fix_users())
