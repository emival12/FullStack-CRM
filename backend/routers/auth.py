from fastapi import APIRouter, Depends, Request
from core.responses import EnvelopeResponse
from config import get_cursor
from core.dependencies import get_session_user
from services.auth_services import login


router = APIRouter(prefix="/api", tags=["auth"], default_response_class=EnvelopeResponse)

@router.post("/login")
async def endpoint_login(request: Request, cursor=Depends(get_cursor)):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")

    result = login(cursor, email, password) # raise 500, 401 - INVALID_CREDENTIALS, 409 - DUPLICATE_PK
    return result


@router.post("/current_user")
async def endpoint_get_current_user(user=Depends(get_session_user)):
    return user
