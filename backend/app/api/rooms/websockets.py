from fastapi import WebSocket
from typing import Dict, List
import asyncio
import logging
from starlette.websockets import WebSocketState

# Configure logging
logger = logging.getLogger("vertex")
logger.setLevel(logging.INFO)

handler = logging.StreamHandler()
handler.setLevel(logging.INFO)
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)

logger.addHandler(handler)

class ConnectionManager:
    def __init__(self):
        """Websockets in a specific room"""
        # Structure
        # {
        #     "Room_code_1": [
        #         <WeSocket Object for Thabang>
        #         <WeSocket Object for Banele>
        #     ],
        #     "Room_code_2": [
        #         <WeSocket Object for Bandile>
        #         <WeSocket Object for Sandile>
        #         <WeSocket Object for Nonhle>
        #     ]
        # }
        self._active_connections: Dict[str, List[WebSocket]] = {}
        self.set_of_locks = [asyncio.Lock() for _ in range(256)] # There will be room collisions if rooms > 256
    

    def _get_lock(self, room_code: str) -> asyncio.Lock:
        """Deterministic way to get a lock for a specific room"""
        lock_index = hash(room_code) % len(self.set_of_locks)
        return self.set_of_locks[lock_index]
    

    async def connect(self, websocket: WebSocket, room_code: str):
        """Accept a new WebSocket connection and register it to a room"""
        await websocket.accept()

        async with self._get_lock(room_code):
            # If this is the first person joining a room, create a list for that room code
            if room_code not in self._active_connections:
                self._active_connections[room_code] = []
            
            self._active_connections[room_code].append(websocket)
        
        client_info = f"client {websocket.client.host}:{websocket.client.port}" if websocket.client else 'unknown'
        logger.info(f"Client {client_info} connected to Room {room_code} | Total: {len(self._active_connections[room_code])}")


    async def disconnect(self, websocket: WebSocket, room_code: str):
        """Remove a WebSocket connection"""

        async with self._get_lock(room_code):
        # Check if the room exists
            if room_code in self._active_connections:
                # Attempt to remove the specific websocket from the list
                if websocket in self._active_connections[room_code]:
                    self._active_connections[room_code].remove(websocket)
                    logger.info(f"Socket disconnected from Room: {room_code}")

                # Garbage collection: If the room has no sockets
                if not self._active_connections[room_code]:
                    del self._active_connections[room_code]
                    logger.info(f"Room: {room_code} empty. Key cleared")
            
        try:
            await websocket.close()
        except Exception:
            pass # Most likely the socket was already closed
        
    
    async def send_personal_message(self, message: list, websocket: WebSocket):
        """Send a message to a specific user"""
        try:
            await websocket.send_json(message)
        except Exception:
            logger.warning("Attempted to send a personal message to a closed socket")
    

    async def _safe_send(self, connection: WebSocket, message: dict, room_code: str):
        """Safely send a message with a strict timeout"""
        # If the websocket is not connected, don't try to send
        if (connection.client_state != WebSocketState.CONNECTED):
            await self.disconnect(connection, room_code)
            return
        
        try:
            await asyncio.wait_for(connection.send_json(message), timeout=10)
        except Exception as e:
            logger.warning(f"Dead socket in {room_code}. Removing... {e}")
            # Remove the broken socket
            await self.disconnect(connection, room_code)
    

    async def _broadcast(self, message: dict, room_code: str, exclude: WebSocket = None):
        """Take a message and send it to everyone in the room"""

        connections_copy = []
        async with self._get_lock(room_code):
            # Only send if the room exists
            if room_code in self._active_connections:
                connections_copy = list(self._active_connections[room_code])

        tasks = []
        # Iterate through every connection in a specific room
        for connection in connections_copy:
            # Skip the sender if provided
            if exclude == connection:
                continue
            
            # Keep a list of coroutines
            tasks.append(self._safe_send(connection, message, room_code))

        if tasks:
            # Function to send all tasks simultaneously
            async def send_all():
                await asyncio.gather(*tasks, return_exceptions=True)
            
            # Broadcast the message to every user in a room without having to wait for another, and in the background
            asyncio.create_task(send_all())
    
    
    async def broadcast_chat_message(self, room_code: str, username: str, avatar_seed: str, text: str, timestamp: str):
        """Sending a usual text message"""
        payload = {
            'type': 'chat',
            'username': username,
            'avatar_seed': avatar_seed,
            'message': text,
            'timestamp': timestamp
            # 'timestamp': datetime.now(timezone.utc).astimezone().isoformat()
        }
        await self._broadcast(payload, room_code)
    

    async def broadcast_system_message(self, room_code: str, message: str):
        """System alert (e.g. Thabang left the room)"""
        payload = {
            'type': 'system',
            'message': message
        }
        await self._broadcast(payload, room_code)

    
    async def broadcast_presence(self, room_code: str, username: str, status: str):
        """Update presence of a user (e.g. 'active' or 'idle')"""
        payload = {
            'type': 'presence_update',
            'username': username,
            'status': status
        }
        await self._broadcast(payload, room_code)

    
    async def broadcast_typing(self, room_code: str, username: str, sender_socket: WebSocket):
        """Typing indicator"""
        payload = {
            'type': 'typing',
            'username': username
        }
        await self._broadcast(payload, room_code, exclude=sender_socket)
