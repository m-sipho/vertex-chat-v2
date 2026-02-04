from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from .schemas import CreateUser, UserID
from .services import create_user, change_display_name
from app.api.auth.dependencies import get_current_user
from typing import Annotated


router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: CreateUser, db: AsyncSession = Depends(get_db)):
    return await create_user(user_data=user_data, db=db)

@router.post("/set-display-name", status_code=status.HTTP_200_OK)
async def set_display_name(display_name: str, current_user: Annotated[UserID, Depends(get_current_user)],  db: AsyncSession = Depends(get_db)):
    return await change_display_name(display_name, current_user, db)
