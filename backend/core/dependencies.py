from fastapi import Depends
from fastapi.security import HTTPBearer
from config import get_cursor_readonly
from core.exceptions import raise_input_exception
from services.auth_services import get_current_user

def get_session_user(cursor=Depends(get_cursor_readonly), creds=Depends(HTTPBearer(auto_error=False))):
    """
        Authenticate the request from its Bearer token and return the current user.

        Raises:
            HTTPException 401: INVALID_SESSION when the Authorization header is missing or malformed
    """
    if not creds:
        raise_input_exception(401, "INVALID_SESSION")
    
    print(creds.credentials)
    return get_current_user(cursor, creds.credentials)