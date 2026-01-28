from .service import Room_Manager
from .websockets import Connection_Manager

global_manager = Room_Manager()
global_connection_manager = Connection_Manager()