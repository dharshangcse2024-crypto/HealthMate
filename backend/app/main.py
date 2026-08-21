import asyncio
import sys
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.scheduler import start_scheduler, stop_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()

app = FastAPI(title="HealthMate API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routes import auth, profile, health, chat, extended, medicines, admin

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(extended.router)
app.include_router(medicines.router)
app.include_router(admin.router)

@app.get("/")
async def root():
    return {"message": "Welcome to HealthMate API"}
