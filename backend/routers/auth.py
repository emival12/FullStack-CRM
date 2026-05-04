from fastapi import APIRouter, Depends, Request
from config import (
    get_db,
    get_current_config,
    get_config_db_name
)
from services.authServices import (
    login,
    check_user_login
)

router = APIRouter(prefix="/api", tags=["auth"])

@router.post("/login")
async def endpoint_login(request: Request, db=Depends(get_db), config=Depends(get_current_config)):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")

    cursor = db.cursor(dictionary=True)
    result = login(cursor, get_config_db_name(config), email, password)
    cursor.close()

    return result


@router.post("/check_connection")
async def endpoint_check_user_login(request: Request, db=Depends(get_db), config=Depends(get_current_config)):
    data = await request.json()
    email = data.get("email")
    db_name = data.get("db_name")

    cursor = db.cursor(dictionary=True)
    check_user_login(cursor, get_config_db_name(config), db_name, email)
    cursor.close()

    return {"status": "ok"}
