from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from .schemas import CreateUser, UserID
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
    
    # Check if the password has at least 8 characters
    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password needs 8+ characters"
        )
    
    cleaned_display_name = user_data.display_name.replace(" ", "_")
    
    new_user = User(
        username=user_data.username,
        password=Hash.get_password_hashed(user_data.password),
        display_name=cleaned_display_name,
    )

    # Save to the database
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return {"message": "User created successfully"}

async def change_display_name(display_name: str, current_user: UserID, db: AsyncSession):
    query = select(User).where(User.id == current_user.id)
    result = await db.execute(query)

    existing_user = result.scalars().first()

    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not authorized to alter display name"
        )
    
    cleaned_display_name = display_name.replace(" ", "_")
    
    existing_user.display_name = cleaned_display_name
    db.add(existing_user)
    await db.commit()
    await db.refresh(existing_user)
    return {"message": "Display name updated successfully"}