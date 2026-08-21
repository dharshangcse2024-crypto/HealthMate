import asyncio
import httpx
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os

# Database connection
DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/healthmate"

async def check_db():
    print("Checking Database Connection...")
    try:
        engine = create_async_engine(DATABASE_URL)
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version();"))
            version = result.scalar()
            print(f"✅ Database connected successfully: {version}")
        await engine.dispose()
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

async def check_backend():
    print("Checking Backend API...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://127.0.0.1:8000/docs")
            if response.status_code == 200:
                print("✅ Backend API is running and reachable (Swagger UI loaded).")
                return True
            else:
                print(f"❌ Backend API returned status {response.status_code}")
                return False
    except Exception as e:
        print(f"❌ Backend API connection failed: {e}")
        return False

async def main():
    print("================================")
    print("Project Diagnostics")
    print("================================")
    db_ok = await check_db()
    api_ok = await check_backend()
    
    if db_ok and api_ok:
        print("\n🎉 ALL SYSTEMS GO! The project and database are working perfectly.")
    else:
        print("\n⚠️ SOME ISSUES DETECTED. Please review the errors above.")

if __name__ == "__main__":
    asyncio.run(main())
