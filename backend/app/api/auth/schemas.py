from pydantic import BaseModel
import uuid


class UserData(BaseModel):
    display_name: str | None = None
    id: uuid.UUID

class LoginResponse(BaseModel):
    access_token: str
    access_type: str
    display_name: str
    avatar_seed: str

class TokenData(BaseModel):
    username: str | None = None