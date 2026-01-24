from fastapi import Depends, HTTPException, status
from typing import Annotated
from .service import oauth2_scheme
import jwt
from jwt.exceptions import InvalidTokenError
from app.core.config import SECRET_KEY, ALGORITHM
from .schemas import User

def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        username = payload.get("sub")
        uid = payload.get("uid")

        if username is None or uid is None:
            raise credentials_exception
        
        return User(username=username, id=uid)
    except InvalidTokenError:
        raise credentials_exception