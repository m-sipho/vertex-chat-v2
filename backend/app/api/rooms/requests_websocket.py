from fastapi import WebSocket
from typing import Dict, List
import logging

# Configure logging
logger = logging.getLogger("requests")
logger.setLevel(logging.INFO)

handler = logging.StreamHandler()
handler.setLevel(logging.INFO)
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)


class RequestConnectionManager:
    def __init__(self):
        self._active_connections: Dict[str, List[WebSocket]] = {}

    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect a user's WebSocket for receiving request notifications"""
        await websocket.accept()

        if user_id not in self._active_connections:
            self._active_connections[user_id] = []
        self._active_connections[user_id].append(websocket)
        logger.info(f"User {user_id} connected to request notifications")

    
    def disconnect(self, websocket: WebSocket, user_id: str):
        """Disconnect a user's WebSocket"""
        if user_id in self._active_connections:
            if websocket in self._active_connections[user_id]:
                self._active_connections[user_id].remove(websocket)
            if not self._active_connections[user_id]:
                del self._active_connections[user_id]

            logger.info(f"User {user_id} disconnected from request notifications")

    
    async def send_to_user(self, user_id: str, message: dict):
        """Send a message to all of a user's connected WebSockets"""
        if user_id in self._active_connections:
            disconnected = []
            for connection in self._active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to user {user_id}: {e}")
                    disconnected.append(connection)
                
            
            # Clean up disconnected websockets
            for conn in disconnected:
                self.disconnect(conn, user_id)

    
    async def notify_new_request(self, room_owner_id: str, request_data: dict):
        """Notify room owner of a new join request"""
        message = {
            "type": "new_join_request",
            "request": request_data
        }
        await self.send_to_user(room_owner_id, message)
        logger.info(f"Notified user {room_owner_id} of new request from {request_data.get("display_name")}")


    async def notify_request_approved(self, user_id: str, room_code: str, room_title: str):
        """Notify user that their request was approved"""
        message = {
            "type": "request_approved",
            "room_code": room_code,
            "room_title": room_title,
        }
        await self.send_to_user(user_id, message)
        logger.info(f"Notified user {user_id} of approval for room {room_code}")

    
    async def notify_request_rejected(self, user_id: str, room_code: str, room_title: str):
        """Notify user that their request was rejected"""
        message = {
            "type": "request_rejected",
            "room_code": room_code,
            "room_title": room_title
        }
        await self.send_to_user(user_id, message)
        logger.info(f"Notified user {user_id} of rejection for room {room_code}")


    async def notify_request_removed(self, room_owner_id: str, request_id: str, action: str):
        """Notify room owner that a request was handled"""
        message = {
            "type": "request_removed",
            "request_id": request_id,
            "action": action
        }
        await self.send_to_user(room_owner_id, message)
