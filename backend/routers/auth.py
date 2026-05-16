from fastapi import APIRouter, Depends, Request
from config import (
    get_cursor_readonly,
    get_current_config,
    get_config_db_name
)
from services.auth_services import (
    login,
    check_user_login
)

router = APIRouter(prefix="/api", tags=["auth"])

@router.post("/login")
async def endpoint_login(request: Request, cursor=Depends(get_cursor_readonly), config=Depends(get_current_config)):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")

    result = login(cursor, get_config_db_name(config), email, password) # raise 500, 401 - INVALID_CREDENTIALS
    return result


@router.post("/check_connection")
async def endpoint_check_user_login(request: Request, cursor=Depends(get_cursor_readonly), config=Depends(get_current_config)):
    data = await request.json()
    email = data.get("email")
    db_name = data.get("db_name")

    check_user_login(cursor, get_config_db_name(config), db_name, email) # raise 500, 401 - DATABASE_CHANGED, 401 - INVALID_SESSION
    return {"status": "ok"}
