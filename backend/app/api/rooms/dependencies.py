from .service import RoomManager
from .websockets import ConnectionManager

global_manager = RoomManager()
global_connection_manager = ConnectionManager()