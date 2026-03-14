from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from botocore.exceptions import ClientError
from .dependencies import assets_service
from app.api.rooms.dependencies import global_manager
from typing import Annotated
from app.api.auth.schemas import UserData
from app.api.auth.dependencies import get_current_user
from datetime import datetime, timezone


router = APIRouter(prefix="/assets", tags=["Assets"])

@router.post("/upload/{room_code}")
async def upload(room_code: str, current_user: Annotated[UserData, Depends(get_current_user)], file: UploadFile = File(...)):
    try:
        result = await assets_service.upload_to_s3(file, room_code)

        # await global_manager.add_message_to_history(room_code, current_user.display_name, result["filename"], "image", current_user.avatar_seed, current_time)
        # self, room_code: str, username: str, text: str, type: str, avatar_seed: str = None, timestamp: str = None

        return {"message": "Image uploaded successfully", "data": result}
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to upload"
        )
