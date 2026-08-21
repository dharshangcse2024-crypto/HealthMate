import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

# In production, use os.getenv("DATABASE_URL")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./healthmate.db")
# If postgres: "postgresql+asyncpg://user:password@localhost/healthmate"
# For local dev fallback, we use sqlite if no DATABASE_URL is provided.

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
