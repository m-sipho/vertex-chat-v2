from pydantic import BaseModel

class CreateRequest(BaseModel):
    host_username: str

class JoinLeaveRequest(BaseModel):
    username: str
    room_code: str

class ApproveRequest(BaseModel):
    host_username: str
    room_code: str
    target_username: str