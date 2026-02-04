from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from .schemas import CreateUser
from .services import create_user


router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: CreateUser, db: AsyncSession = Depends(get_db)):
    return await create_user(user_data=user_data, db=db)
