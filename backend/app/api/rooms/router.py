from fastapi import APIRouter, status, Depends
from typing import Annotated
from app.api.rooms.dependencies import global_manager
from .schemas import CreateRequest, JoinLeaveRequest, ApproveRequest
from app.api.auth.dependencies import get_current_user
from app.api.auth.schemas import LoginUser, User

router = APIRouter(
    prefix="",
    tags=["Room Manager"]
)

@router.post("/create-room", status_code=status.HTTP_201_CREATED)
async def create_room(current_user: Annotated[User, Depends(get_current_user)]):
    results = await global_manager.create_room(User(username=current_user.username, id=current_user.id))
    return results

@router.post("/join-room", status_code=status.HTTP_202_ACCEPTED)
async def join(request: JoinLeaveRequest, current_user: Annotated[User, Depends(get_current_user)]):
    results = await global_manager.request_to_join_room(User(username=current_user.username, id=current_user.id), request.room_code)
    return results

@router.post("/approve", status_code=status.HTTP_200_OK)
async def approve(request: ApproveRequest, current_user: Annotated[User, Depends(get_current_user)]):
    status = await global_manager.approve_user(current_user.id, request.room_code, request.target_username)
    return status

@router.post("/reject", status_code=status.HTTP_200_OK)
async def reject(request: ApproveRequest, current_user: Annotated[LoginUser, Depends(get_current_user)]):
    status = await global_manager.reject_user(current_user.id, request.room_code, request.target_username)
    return status

@router.get("/room/{room_code}")
async def get_room(room_code: str, current_user: Annotated[LoginUser, Depends(get_current_user)]):
    result = await global_manager.get_room_state(room_code)
    return result

@router.get("/rooms/all")
async def get_all_rooms(current_user: Annotated[LoginUser, Depends(get_current_user)]):
    result = await global_manager.get_all_rooms_info()
    return result