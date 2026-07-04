import bcrypt
import secrets
import logging
from datetime import datetime
from core.exceptions import raise_input_exception, log_event, ExceptionKind
from core.models import SystemFieldName_UD
from db.db_queries import (
    get_user_definition_record,
    get_user_definition_record_by_token
)
from services.object_ddl import insert_user_session, delete_expired_sessions

logger = logging.getLogger(__name__) 

def login(cursor, email: str, password: str) -> dict:
    user = get_user_definition_record(cursor, email)
    try:
        is_password_valid = user and bcrypt.checkpw(password.encode("utf-8"), user[SystemFieldName_UD.PASSWORD].encode("utf-8"))
    except (ValueError, AttributeError, TypeError):
        log_event(logging.WARNING, logger, "Corrupted password hash", email=email)
        is_password_valid = False

    if not is_password_valid:
        log_event(logging.WARNING, logger, "Failed login attempt", email=email)
        raise_input_exception(401, "INVALID_CREDENTIALS")

    user.pop(SystemFieldName_UD.PASSWORD)
    log_event(logging.INFO, logger, "User logged in", user_id=user[SystemFieldName_UD.ID], email=email)

    delete_expired_sessions(cursor)

    token = secrets.token_urlsafe(32)
    now = datetime.now()
    insert_user_session(cursor, [(token, user[SystemFieldName_UD.ID], datetime(now.year, now.month, now.day, 23, 59, 59))])
    return {
        "token": token, 
        "user": user
    }

def get_current_user(cursor, token: str) -> dict:
    user = get_user_definition_record_by_token(cursor, token)
    if not user:
        raise_input_exception(401, "INVALID_SESSION", kind=ExceptionKind.BUSINESS_SHARED)

    return user

