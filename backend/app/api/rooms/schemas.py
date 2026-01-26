from pydantic import BaseModel

class CreateRequest(BaseModel):
    host_username: str

class JoinLeaveRequest(BaseModel):
    room_code: str

class ApproveRequest(BaseModel):
    room_code: str
    target_username: str