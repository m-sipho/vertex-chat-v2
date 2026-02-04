from pydantic import BaseModel
import uuid


class User(BaseModel):
    username: str
    id: uuid.UUID

class Token(BaseModel):
    access_token: str
    access_type: str

class TokenData(BaseModel):
    username: str | None = None