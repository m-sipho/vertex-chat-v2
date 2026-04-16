from pydantic import BaseModel
import uuid
from typing import Optional


class UserData(BaseModel):
    display_name: str | None = None
    id: uuid.UUID
    request_time: Optional[str] = None
    avatar_seed: Optional[str] = None

class LoginResponse(BaseModel):
    access_token: str
    access_type: str
    display_name: str | None = None
    avatar_seed: str

class TokenData(BaseModel):
    username: str | None = None