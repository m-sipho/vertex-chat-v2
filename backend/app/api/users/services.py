from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from .schemas import CreateUser
from sqlalchemy import select
from app.api.users.models import User
from app.api.auth.utils import Hash

async def create_user(user_data: CreateUser, db: AsyncSession):
    # Check for existing user
    query = select(User).where(User.username == user_data.username)
    result = await db.execute(query)

    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken"
        )
    
    new_user = User(
        username=user_data.username,
        password=Hash.get_password_hashed(user_data.password),
        display_name=user_data.display_name,
    )

    # Save to the database
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return {"message": "User created successfully"}