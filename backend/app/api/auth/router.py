from fastapi import APIRouter, HTTPException, Depends
from .schemas import Token, LoginUser
import uuid
from .service import create_access_token
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)
# For production
# @router.post("/login")
# def login(user_details: LoginUser) -> Token:
#     user_id = str(uuid.uuid4())

#     token_data = {"sub": user_details.username, "uid": user_id}

#     access_token_time = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     access_token = create_access_token(data=token_data, expires_delta=access_token_time)

#     return Token(access_token=access_token, access_type="bearer")

# For development
@router.post("/login")
def login(user_details: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user_id = str(uuid.uuid4())

    token_data = {"sub": user_details.username, "uid": user_id}

    access_token_time = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data=token_data, expires_delta=access_token_time)

    return Token(access_token=access_token, access_type="bearer")