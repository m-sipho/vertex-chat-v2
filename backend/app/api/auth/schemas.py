from pydantic import BaseModel


class LoginUser(BaseModel):
    username: str

class User(BaseModel):
    username: str
    id: str # UUID

class Token(BaseModel):
    access_token: str
    access_type: str