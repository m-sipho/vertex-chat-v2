from pydantic import BaseModel
from typing import Optional

class CreateUser(BaseModel):
    username: str
    password: str
    display_name: Optional[str] = None