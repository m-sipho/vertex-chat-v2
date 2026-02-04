from pydantic import BaseModel
import uuid


class UserData(BaseModel):
    display_name: str | None = None
    id: uuid.UUID

class Token(BaseModel):
    access_token: str
    access_type: str

class TokenData(BaseModel):
    username: str | None = None