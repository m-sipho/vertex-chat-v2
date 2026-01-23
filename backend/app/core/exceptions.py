class VertexError(Exception):
    '''Base class for other exceptions'''
    pass

class NoAvailableRoomError(VertexError):
    pass

class UserAlreadyInRoomError(VertexError):
    pass

class UserAlreadyInAwaitingError(VertexError):
    pass

class UserNotAuthorizedError(VertexError):
    pass

class UserNotFoundError(VertexError):
    pass

class RoomNotFoundError(VertexError):
    pass