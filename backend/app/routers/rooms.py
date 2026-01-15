from fastapi import APIRouter, status
from ..services.instance import global_manager
from ..schemas import CreateRequest, JoinLeaveRequest, ApproveRequest

router = APIRouter(
    prefix="/rooms",
    tags=["Room Manager"]
)

@router.post("/create-room", status_code=status.HTTP_201_CREATED)
async def create_room(request: CreateRequest):
    results = await global_manager.create_room(request.host_username)
    return results

@router.post("/join-room")
async def join(request: JoinLeaveRequest):
    results = await global_manager.request_to_join_room(request.username, request.room_code)
    return results

@router.post("/approve")
async def approve(request: ApproveRequest):
    status = await global_manager.approve_user(request.host_username, request.room_code, request.target_username)
    return status

@router.post("/reject")
async def reject(request: ApproveRequest):
    status = await global_manager.reject_user(request.host_username, request.room_code, request.target_username)
    return status