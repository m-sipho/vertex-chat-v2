from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.rooms.router import router as rooms_router
from app.api.auth.router import router as auth_router
from app.core.exceptions import (
    NoAvailableRoomError,
    UserAlreadyInRoomError,
    UserAlreadyInAwaitingError,
    UserNotAuthorizedError,
    UserNotFoundError,
    RoomNotFoundError
)
from contextlib import asynccontextmanager
from app.core.database import Base, engine
from app.api.users.models import User

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

    await engine.dispose()


app = FastAPI(title="Vertex Backend", lifespan=lifespan)

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(NoAvailableRoomError)
async def server_full_handler(request: Request, exc: NoAvailableRoomError):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"message": str(exc)}
    )

@app.exception_handler(UserAlreadyInRoomError)
async def user_in_room_conflict_handler(request: Request, exc: UserAlreadyInRoomError):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"message": str(exc)}
    )

@app.exception_handler(UserAlreadyInAwaitingError)
async def user_in_awaiting_handler(request: Request, exc: UserAlreadyInAwaitingError):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"message": str(exc)}
    )

@app.exception_handler(UserNotAuthorizedError)
async def unauthorized_handler(request: Request, exc: UserNotAuthorizedError):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"message": str(exc)}
        )

@app.exception_handler(UserNotFoundError)
async def user_not_found_handler(request: Request, exc: UserNotFoundError):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"message": str(exc)}
    )

@app.exception_handler(RoomNotFoundError)
async def room_not_found_handler(request: Request, exc: RoomNotFoundError):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"message": str(exc)}
    )

app.include_router(auth_router)
app.include_router(rooms_router)

@app.get("/")
async def root():
    return {"message": "Hello world"}