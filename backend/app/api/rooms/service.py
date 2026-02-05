import string
import secrets
from fastapi import HTTPException, status
from app.api.auth.schemas import UserData
from app.core.exceptions import (
    NoAvailableRoomError,
    UserAlreadyInRoomError,
    UserAlreadyInAwaitingError,
    UserNotAuthorizedError,
    UserNotFoundError,
    RoomNotFoundError
)
from typing import Optional
import uuid

class RoomManager:
    def __init__(self):
        # Simulate a database for now
        
        # New structure:
        # {
        #     'ROOM_CODE': {
        #         'host_id': 'user_123',
        #         'title': 'Chess Club'
        #         'active_users': {
        #             'user_123': <User Object Mthokozisi>,
        #             'user_740': <User Object Mthokozisi>
        #         },
        #         'pending_users': {
        #             'user_675': <User Object Sipho>
        #         },
        #         'message_history': [
        #             {
        #                 'type': system,
        #                 'message': 'host joined the room'
        #             }
        #         ]
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


    async def create_room(self, title: str, host: UserData):
        '''Logic to save the room and the host'''
        if not host.display_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You must set a display name before creating a room."
            )

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
                    'title': title,
                    'active_users': {
                        host.id: host 
                    },
                    'pending_users': {},
                    'message_history': []
                }
                return {"status": "success", "room_code": code, "message": "Room created successfully."}
        raise NoAvailableRoomError("No available rooms")
    

    async def add_message_to_history(self, room_code: str, username: str, text: str, type: str, timestamp: str = None):
        """Save messages in memory"""
        if timestamp != None:
            message_data = {
                'type': type,
                'user': username,
                'message': text,
                'timestamp': timestamp
            }
        else:
            message_data = {
                'type': type,
                'message': text
            }
        
        # Append to the end of the list
        self._active_rooms[room_code]['message_history'].append(message_data)


    async def get_message_history(self, room_code: str):
        """Get all saved messages from a specific room"""
        if room_code in self._active_rooms:
            return self._active_rooms[room_code]['message_history']
        return []


    async def request_to_join_room(self, user: UserData, room_code):
        '''Logic to add a user to an existing room'''

        if not user.display_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You must set a display name before joining a room."
            )

        count = 0

        # Ensure users can only be in two rooms simultaneously
        for _, room_details in self._active_rooms.items():
            active_users = room_details['active_users']
            pending_users = room_details['pending_users']

            # Collect all rooms where the user is active or pending
            if user.id in active_users:
                count += 1
                
            if user.id in pending_users:
                count += 1

            if count >= 2:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="cannot join more than 2 rooms"
                )


        if room_code not in self._active_rooms:
            raise RoomNotFoundError(f"Room '{room_code}' does not exist.")
        
        room = self._active_rooms[room_code]
        clean_username = user.display_name.strip().lower()

        # Ensure users with the same username are not in the same room
        for user_info in room['active_users'].values():
            if clean_username == user_info.display_name.strip().lower():
                raise UserAlreadyInRoomError(f"'{user.display_name}' already in room.")

        # Ensure users with the same username are not in the same waiting list
        for user_info in room['pending_users'].values():
            if clean_username == user_info.display_name.strip().lower():
                raise UserAlreadyInAwaitingError(f"'{user.display_name}' already awaiting approval.")
        
        # Put them in the waiting room
        room['pending_users'][user.id] = user
        return {"status": "pending", "message": "Waiting for host approval"}
    

    async def approve_user(self, host_id, room_code, target_username):
        '''Logic to approve a pending user'''
        if room_code not in self._active_rooms:
            raise RoomNotFoundError(f"Room '{room_code}' does not exist.")
         
        room = self._active_rooms[room_code]

        if room['host_id'] != host_id:
            raise UserNotAuthorizedError("You are not the host of this room.")
        
        clean_target_username = target_username.strip().lower()
        user_to_approve = None
        
        for user_info in room['pending_users'].values():
            if clean_target_username == user_info.display_name.strip().lower():
                user_to_approve = user_info
                break
        
        if not user_to_approve:
            raise UserNotFoundError(f"'{target_username}' not found on waiting users")
        

        room['active_users'][user_to_approve.id] = user_to_approve
        del room['pending_users'][user_to_approve.id]
        return {"status": "approved", "message": f"'{user_to_approve.display_name}' joined the room"}
    

    async def reject_user(self, host_id, room_code, target_username):
        '''Logic to reject a pending user'''
        if room_code not in self._active_rooms:
            raise RoomNotFoundError(f"Room '{room_code}' does not exist.")
         
        room = self._active_rooms[room_code]

        if room['host_id'] != host_id:
            raise UserNotAuthorizedError(f"You are not the host of room.")
        
        clean_target_username = target_username.strip().lower()
        user_to_reject = None
        
        for user_info in room['pending_users'].values():
            if clean_target_username == user_info.display_name.strip().lower():
                user_to_reject = user_info
                break
        
        if not user_to_reject:
            raise UserNotFoundError(f"'{target_username}' not found on waiting users")
        
        del room['pending_users'][user_to_reject.id]
        return {"status": "removed", "message": f"'{target_username}' is rejected to join"}
    

    async def leave_room(self, user_id, room_code, new_host_id: Optional[uuid.UUID] = None):
        '''Logic for garbage collection'''
        # Check if the room exists
        if room_code not in self._active_rooms:
            raise RoomNotFoundError(f"Room '{room_code}' does not exist.")
        
        room = self._active_rooms[room_code]
        active_users = room['active_users']
        
        # Check user exists in the room
        if user_id not in active_users:
            raise UserNotFoundError(f"You are not in room {room_code}")
        
        user_obj = active_users[user_id]
        username = user_obj.display_name

        # If the person leaving is the host
        if user_id == room['host_id']:
            # Check if there are other people in the room
            if len(active_users) > 1:

                # Check if the host has selected the successor
                if not new_host_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="You are the host. Please select a host before leaving."
                    )
                
                # Check if the selected successor is in the room
                if new_host_id not in active_users:
                    raise UserNotFoundError("The user you selected to be the host is not in this room")
                
                # Check if that successor is not the current host
                if user_id == new_host_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="You cannot assign yourself as a new host if you are leaving"
                    )
                
                # Transfer the crown
                room["host_id"] = new_host_id
                new_host_username = active_users[new_host_id].display_name

                # Remove the old host
                del active_users[user_id]

                return {
                    'status': 'left',
                    'message': f"You left. {new_host_username} is now the host"
                }
            else:
                del self._active_rooms[room_code]
                return {
                    'status': 'deleted',
                    'message': f"Room {room_code} deleted (Host left and room was empty)"
                }
        
        # If just a regular member leaves
        del active_users[user_id]

        # Delete room if its empty
        if not active_users:
            del self._active_rooms[room_code]
            return {
                'status': 'deleted',
                'message': f"Room {room_code} is empty and deleted"
            }
        
        return {'status': 'left', 'message': f"{username} left successfully"}


    async def get_room_state(self, room_code):
        if room_code not in self._active_rooms:
            raise RoomNotFoundError(f"Room '{room_code}' doesn't exist.")
        
        return self._active_rooms[room_code]
    

    async def get_all_rooms_info(self):
        return self._active_rooms