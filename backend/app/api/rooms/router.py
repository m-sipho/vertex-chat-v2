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
from sqlalchemy import select
from app.api.users.models import User
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from .dependencies import global_request_manager

router = APIRouter(
    prefix="",
    tags=["Room Manager"]
)

@router.post("/create-room", status_code=status.HTTP_201_CREATED)
async def create_room(title: str, current_user: Annotated[UserData, Depends(get_current_user)]):
    results = await global_manager.create_room(title, UserData(display_name=current_user.display_name, id=current_user.id))
    return results

@router.post("/join-room", status_code=status.HTTP_202_ACCEPTED)
async def join(request: JoinLeaveRequest, current_user: Annotated[UserData, Depends(get_current_user)]):
    """
    Request to join a room
    - Adds the request to pending requests
    - Send real time notification to room owner via WebSocket
    """

    timestamp = datetime.now(timezone.utc).isoformat() + "Z",

    results = await global_manager.request_to_join_room(UserData(display_name=current_user.display_name, id=current_user.id, request_time=str(timestamp[0])), request.room_code)

    # Get room info to send notification
    room_state = await global_manager.get_room_state(request.room_code)
    if room_state:
        request_data = {
            "room_code": request.room_code,
            "room_title": room_state.get("title"),
            "user_id": str(current_user.id),
            "display_name": current_user.display_name,
            "timestamp": timestamp,
            "status": "pending"
        }

        # Send real time notification to room owner
        await global_request_manager.notify_new_request(room_owner_id=room_state["host_id"], request_data=request_data)

    return results

@router.post("/approve", status_code=status.HTTP_200_OK)
async def approve(request: ApproveRequest, current_user: Annotated[UserData, Depends(get_current_user)]):
    """
    Approve a join request
    - Add user to the room
    - Send real time notification to the requester
    - Notify the room owner that the request was handled
    """
    status = await global_manager.approve_user(current_user.id, request.room_code, request.target_username)

    # Get the room state
    room_state = await global_manager.get_room_state(request.room_code)

    if room_state:
        # Notify user their request was approved
        await global_request_manager.notify_request_approved(
            user_id=status["user_id"],
            room_code=request.room_code,
            room_title=room_state["title"]
        )

        request_id = f"{status["user_id"]}_{request.room_code}"

        # Notify room owner that request is handled
        await global_request_manager.notify_request_removed(
            room_owner_id=current_user.id,
            request_id=request_id,
            action="approved"
        )

        # Get all active members
        members_info = room_state["active_users"]
        if members_info:
            all_members_ids = [id for id in members_info]
        else:
            all_members_ids = []
        
        await global_request_manager.broadcast_to_rooms(
            room_code=request.room_code,
            exclude_ids=[current_user.id, status["user_id"]],
            all_members_ids=all_members_ids
        )

    return status

@router.post("/reject", status_code=status.HTTP_200_OK)
async def reject(request: ApproveRequest, current_user: Annotated[UserData, Depends(get_current_user)]):
    """
    Reject a join request
    - Remove the request
    - Send a real time notification to the requester
    - Notify the room owner that the request was handled
    """
    status = await global_manager.reject_user(current_user.id, request.room_code, request.target_username)

    # Get the room state
    room_state = await global_manager.get_room_state(request.room_code)

    if room_state:
        # Notify user their request was rejected
        await global_request_manager.notify_request_rejected(
            user_id=status["user_id"],
            room_code=request.room_code,
            room_title=room_state["title"]
        )
    
    request_id = f"{status["user_id"]}_{request.room_code}"

    # Notify room owner that request is handled
    await global_request_manager.notify_request_removed(
        room_owner_id=current_user.id,
        request_id=request_id,
        action="rejected"
    )

    return status

@router.get("/pending-requests", status_code=status.HTTP_200_OK)
async def pending_requests(current_user: Annotated[UserData, Depends(get_current_user)]):
    result = await global_manager.get_pending_requests_for_user(current_user.id)
    return result

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

@router.get("/rooms/user")
async def get_all_rooms_in(current_user: Annotated[UserData, Depends(get_current_user)]):
    result = await global_manager.get_all_rooms_in(current_user.id)
    return result

@router.get("/rooms/pending")
async def get_all_rooms_pending_in(current_user: Annotated[UserData, Depends(get_current_user)]):
    result = await global_manager.get_all_rooms_pending_in(current_user.id)
    return result


# REQUEST WEBSOCKET
@router.websocket("/ws/requests")
async def request_websocket_endpoint(websocket: WebSocket, db: AsyncSession = Depends(get_db), token: str = Query(...)):
    """
    WebSocket for real time join request notifications.
    User connect to this to receive notifications about:
    - New join requests (if they are the room owner)
    - Request approvals/rejections (if they requested to join)
    """

    try:
        # Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")

        # Query the database for the user
        query = select(User).where(User.username == username)
        result = await db.execute(query)
        user_result = result.scalars().first()

        if not user_result:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # display_name = user_result.display_name
        user_id = user_result.id

        if username is None or user_id is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
    except InvalidTokenError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # Connect the user
    await global_request_manager.connect(websocket, user_id)

    try:
        # Send all pending requests for rooms they own
        pending_requests = await global_manager.get_pending_requests_for_user(user_id)
        if pending_requests:
            await websocket.send_json({
                "type": "initial_requests",
                "requests": pending_requests
            })

        while True:
            data = await websocket.receive_text()

            try:
                event = json.loads(data)
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON from user {user_id}: {data}")
                continue

            event_type = event.get("type")

            if event_type == "get_pending_requests":
                # User requested current pending requests
                pending_requests = await global_manager.get_pending_requests_for_user(user_id)
                await websocket.send_json({
                    "type": "pending_requests",
                    "requests": pending_requests
                })

            else:
                logger.warning(f"Unknown event type from user {user_id}: {event_type}")

    except WebSocketDisconnect:
        global_request_manager.disconnect(websocket, user_id)
        logger.info(f"User {user_id} disconnected from request notifications")
    except Exception as e:
        logger.error(f"Error in request WebSocket for user {user_id}: {e}")
        global_request_manager.disconnect(websocket, user_id)



@router.websocket("/ws/{room_code}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, db: AsyncSession = Depends(get_db), token: str = Query(...)):

    try:
        # Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get('sub')
        
        # Query the database for the user
        query = select(User).where(User.username == username)
        result = await db.execute(query)
        user_result = result.scalars().first()

        if not user_result:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        display_name = user_result.display_name
        user_id = user_result.id


        # Check the token is valid
        if username is None or user_id is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        user = UserData(display_name=display_name, id=user_id)
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
    await ws_manager.broadcast_presence(room_code, user.display_name, 'online')

    join_msg = f"{user.display_name} joined the room"
    await ws_manager.broadcast_system_message(room_code, join_msg)
    await global_manager.add_message_to_history(room_code, user.display_name, join_msg, "system")

    try:
        while True:
            data = await websocket.receive_text()
            
            try:
                event = json.loads(data)
            except json.JSONDecodeError:
                logger.warning(f"Wrong JSON format received from {user.display_name}: {data}")
                continue

            event_type = event.get("type")
            if not event_type:
                logger.warning(f"Missing 'type' field in data from {user.display_name}")
                continue

            try:
                # Check if its a regular message
                if event_type == 'chat':
                    message = event.get('message')
                    if not message:
                        continue # Ignore empty messages

                    current_time = datetime.now(timezone.utc).isoformat()

                    # Broadcast message to the room
                    await ws_manager.broadcast_chat_message(room_code, user.display_name, message, current_time)

                    # Save the message in memeory
                    await global_manager.add_message_to_history(room_code, user.display_name, message, "chat", current_time)

                elif event_type == 'typing':
                    ws_manager.broadcast_typing(room_code, user.display_name, websocket)

                elif event_type == 'presence_update':
                    presence_status = event.get('status')
                    if not presence_status:
                        continue # Do not change the status
                    await ws_manager.broadcast_presence(room_code, user.display_name, presence_status)

                else:
                    logger.error(f"Unknown event type '{event_type}' from {user.display_name}")
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
        leave_msg = f"{user.display_name} left the room"
        await ws_manager.broadcast_system_message(room_code, leave_msg)
        await ws_manager.broadcast_presence(room_code, user.display_name, 'offline')
        await global_manager.add_message_to_history(room_code, user.display_name, leave_msg, "system")

        await ws_manager.disconnect(websocket, room_code)
    