from fastapi import APIRouter, status, Depends, WebSocket, Query, WebSocketDisconnect
from typing import Annotated
from app.api.rooms.dependencies import global_manager
from .schemas import CreateRequest, JoinLeaveRequest, ApproveRequest, LeaveRequest
from app.api.auth.dependencies import get_current_user
from app.api.auth.schemas import UserData
from .dependencies import global_connection_manager as ws_manager
from datetime import datetime, timezone
import jwt
from jwt.exceptions import InvalidTokenError
from app.core.config import SECRET_KEY, ALGORITHM
import json
from .websockets import logger

router = APIRouter(
    prefix="",
    tags=["Room Manager"]
)

@router.post("/create-room", status_code=status.HTTP_201_CREATED)
async def create_room(current_user: Annotated[UserData, Depends(get_current_user)]):
    results = await global_manager.create_room(UserData(display_name=current_user.display_name, id=current_user.id))
    return results

@router.post("/join-room", status_code=status.HTTP_202_ACCEPTED)
async def join(request: JoinLeaveRequest, current_user: Annotated[UserData, Depends(get_current_user)]):
    results = await global_manager.request_to_join_room(UserData(username=current_user.username, id=current_user.id), request.room_code)
    return results

@router.post("/approve", status_code=status.HTTP_200_OK)
async def approve(request: ApproveRequest, current_user: Annotated[UserData, Depends(get_current_user)]):
    status = await global_manager.approve_user(current_user.id, request.room_code, request.target_username)
    return status

@router.post("/reject", status_code=status.HTTP_200_OK)
async def reject(request: ApproveRequest, current_user: Annotated[UserData, Depends(get_current_user)]):
    status = await global_manager.reject_user(current_user.id, request.room_code, request.target_username)
    return status

@router.post("/leave-room", status_code=status.HTTP_200_OK)
async def leave_room(request: LeaveRequest, current_user: Annotated[UserData, Depends(get_current_user)]):
    status = await global_manager.leave_room(current_user.id, request.room_code, request.new_host_id)
    return status

@router.get("/room/{room_code}")
async def get_room(room_code: str, current_user: Annotated[UserData, Depends(get_current_user)]):
    result = await global_manager.get_room_state(room_code)
    return result

@router.get("/rooms/all")
async def get_all_rooms(current_user: Annotated[UserData, Depends(get_current_user)]):
    result = await global_manager.get_all_rooms_info()
    return result

@router.websocket("/ws/{room_code}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, token: str = Query(...)):

    try:
        # Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get('sub')
        id = payload.get('id')

        # Check the token is valid
        if username is None or id is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        user = UserData(username=username, id=id)
    except InvalidTokenError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # Check if the room exists
    if room_code not in global_manager._active_rooms:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # Check if the user is in active_users
    if user.id not in global_manager._active_rooms[room_code]['active_users']:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return


    # Connect a websocket
    await ws_manager.connect(websocket=websocket, room_code=room_code)

    try:
        history = await global_manager.get_message_history(room_code)
        await ws_manager.send_personal_message(history, websocket)
    except Exception as e:
        logger.error(f"Error syncing history: {e}")

    # Broadcast online presence
    await ws_manager.broadcast_presence(room_code, user.username, 'online')

    join_msg = f"{user.username} joined the room"
    await ws_manager.broadcast_system_message(room_code, join_msg)
    await global_manager.add_message_to_history(room_code, user.username, join_msg, "system")

    try:
        while True:
            data = await websocket.receive_text()
            
            try:
                event = json.loads(data)
            except json.JSONDecodeError:
                logger.warning(f"Wrong JSON format received from {user.username}: {data}")
                continue

            event_type = event.get("type")
            if not event_type:
                logger.warning(f"Missing 'type' field in data from {user.username}")
                continue

            try:
                # Check if its a regular message
                if event_type == 'chat':
                    message = event.get('message')
                    if not message:
                        continue # Ignore empty messages

                    current_time = datetime.now(timezone.utc).isoformat()

                    # Broadcast message to the room
                    await ws_manager.broadcast_chat_message(room_code, user.username, message, current_time)

                    # Save the message in memeory
                    await global_manager.add_message_to_history(room_code, user.username, message, "chat", current_time)

                elif event_type == 'typing':
                    ws_manager.broadcast_typing(room_code, user.username, websocket)

                elif event_type == 'presence_update':
                    presence_status = event.get('status')
                    if not presence_status:
                        continue # Do not change the status
                    await ws_manager.broadcast_presence(room_code, user.username, presence_status)

                else:
                    logger.error(f"Unknown event type '{event_type}' from {user.username}")
                    await ws_manager.send_personal_message([
                    {
                        "type": "error",
                        "message": f"Unknown event: {event_type}"
                    }
                ], websocket)

            except Exception as e:
                logger.error(f"Error processing image: {e}")
                await ws_manager.send_personal_message([
                    {
                        "type": "error",
                        "message": "Server error processing your request."
                    }
                ], websocket)
            
    except WebSocketDisconnect:
        leave_msg = f"{user.username} left the room"
        await ws_manager.broadcast_system_message(room_code, leave_msg)
        await ws_manager.broadcast_presence(room_code, user.username, 'online')
        await global_manager.add_message_to_history(room_code, user.username, leave_msg, "system")

        await ws_manager.disconnect(websocket, room_code)
    