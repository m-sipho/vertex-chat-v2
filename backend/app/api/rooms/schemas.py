from pydantic import BaseModel
from typing import Optional

class CreateRequest(BaseModel):
    host_username: str

class JoinLeaveRequest(BaseModel):
    room_code: str

class ApproveRequest(BaseModel):
    room_code: str
    target_username: str

class LeaveRequest(BaseModel):
    room_code: str
    new_host_id: Optional[str] = None