from .service import RoomManager
from .websockets import ConnectionManager
from .requests_websocket import RequestConnectionManager

global_manager = RoomManager()
global_connection_manager = ConnectionManager()

global_request_manager = RequestConnectionManager()