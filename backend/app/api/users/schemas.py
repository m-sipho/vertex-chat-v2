from pydantic import BaseModel
from typing import Optional
import uuid

class CreateUser(BaseModel):
    username: str
    password: str
    display_name: Optional[str] = None

class UserID(BaseModel):
    id: uuid.UUID