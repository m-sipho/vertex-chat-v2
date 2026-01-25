import string
import secrets
from fastapi import HTTPException, status
from app.api.auth.schemas import User
from app.core.exceptions import (
    NoAvailableRoomError,
    UserAlreadyInRoomError,
    UserAlreadyInAwaitingError,
    UserNotAuthorizedError,
    UserNotFoundError,
    RoomNotFoundError
)

class Room_Manager:
    def __init__(self):
        # Simulate a database for now
        
        # New structure:
        # {
        #     'ROOM_CODE': {
        #         'host_id': 'user_123',
        #         'active_users': {
        #             'user_123': <User Object Mthokozisi>,
        #             'user_740': <User Object Mthokozisi>
        #         },
        #         'pending_users': {
        #             'user_675': <User Object Sipho>
        #         }
        #     }
        # }

        # Structure:
        # {  
        #     'ROOM_CODE': {
        #         'host': host_username,
        #         'active_users': ['host_username],
        #         'pending_users': []
        #     }
        # }
        self._active_rooms = {}

    def generate_room_code(self):
        '''Logic to create the room code to survive brute force'''

        # Get random length of password from 8 to 15 inclusive
        length = secrets.choice(range(8, 16))

        alphabet = string.ascii_letters + string.digits
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        return password

    async def create_room(self, host: User):
        '''Logic to save the room and the host'''
        # Check if the user is a host in another room
        for _, room_details in list(self._active_rooms.items()):
            if room_details['host_id'] == host.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You can only host up to one room."
                )
        
        max_retries = 10
        for _ in range(max_retries):
            code = self.generate_room_code()
            if code not in self._active_rooms:
                self._active_rooms[code] = {
                    'host_id': host.id,
                    'active_users': {
                        host.id: host 
                    },
                    'pending_users': {}
                }
                return {"status": "success", "room_code": code, "message": "Room created successfully."}
        raise NoAvailableRoomError("No available rooms")


    async def request_to_join_room(self, user: User, room_code):
        '''Logic to add a user to an existing room'''
        if room_code not in self._active_rooms:
            raise RoomNotFoundError(f"Room '{room_code}' does not exist.")
        
        room = self._active_rooms[room_code]
        clean_username = user.username.strip().lower()

        # Ensure users with the same username are not in the same room
        for user_info in room['active_users'].values():
            if clean_username == user_info.username.strip().lower():
                raise UserAlreadyInRoomError(f"'{user.username}' already in room.")

        # Ensure users with the same username are not in the same waiting list
        for user_info in room['pending_users'].values():
            if clean_username == user_info.username.strip().lower():
                raise UserAlreadyInAwaitingError(f"'{user.username}' already awaiting approval.")
        
        # Put them in the waiting room
        room['pending_users'][user.id] = user
        return {"status": "pending", "message": "Waiting for host approval"}
    
    async def approve_user(self, host_username, room_code, target_username):
        '''Logic to approve a pending user'''
        if room_code not in self._active_rooms:
            raise RoomNotFoundError(f"Room '{room_code}' does not exist.")
         
        room = self._active_rooms[room_code]

        if room['host'] != host_username:
            raise UserNotAuthorizedError(f"'{host_username}' you are not the host of room.")
        
        if target_username in room['pending_users']:
            room['active_users'].append(target_username)
            room['pending_users'].remove(target_username)
            return {"status": "approved", "message": f"'{target_username}' joined the room"}
        
        raise UserNotFoundError(f"'{target_username}' not found on waiting users")
    
    async def reject_user(self, host_username, room_code, target_username):
        '''Logic to approve a pending user'''
        if room_code not in self._active_rooms:
            raise RoomNotFoundError(f"Room '{room_code}' does not exist.")
         
        room = self._active_rooms[room_code]

        if room['host'] != host_username:
            raise UserNotAuthorizedError(f"'{host_username}' you are not the host of room.")
        
        if target_username in room['pending_users']:
            room['pending_users'].remove(target_username)
            return {"status": "removed", "message": f"'{target_username}' is rejected to join"}
        
        raise UserNotFoundError(f"'{target_username}' not found on waiting users")
    
    async def leave_room(self, username, room_code):
        '''Logic for garbage collection'''
        if room_code in self._active_rooms:
            # Check user from active list
            if username in self._active_rooms[room_code]['active_users']:
                self._active_rooms[room_code]['active_users'].remove(username)

                # Check if the room is empty
                if not self._active_rooms[room_code]['active_users']:
                    del self._active_rooms[room_code]
                    return f"Room '{room_code}' is empty. thus DELETED."
                return {"status": "left", "message": f"'{username}' left successfully."}
            raise UserNotFoundError(f"'{username}' is not in room {room_code}.")
        raise RoomNotFoundError(f"Room '{room_code}' doesn't exist.")
    
    async def get_room_state(self, room_code):
        if room_code not in self._active_rooms:
            raise RoomNotFoundError(f"Room '{room_code}' doesn't exist.")
        
        return self._active_rooms[room_code]
    
    async def get_all_rooms_info(self):
        return self._active_rooms