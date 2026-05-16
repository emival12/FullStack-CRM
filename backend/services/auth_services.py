import bcrypt
import logging
from core.exceptions import raise_input_exception, log_event
from core.models import SystemFieldName_UD
from db.db_queries import get_user_definition_record

logger = logging.getLogger(__name__) 

def login(cursor, db_name: str, email: str, password: str) -> dict:
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
    user["db_name"] = db_name
    log_event(logging.INFO, logger, "User logged in", user_id=user[SystemFieldName_UD.ID], email=email)
    return user

def check_user_login(cursor, conf_db_name: str, db_name: str, email: str) -> None:
    if conf_db_name != db_name:
        log_event(logging.WARNING, logger, "Unexpected DB", conf_db_name=conf_db_name, db_name=db_name)
        raise_input_exception(401, "DATABASE_CHANGED")

    user_record = get_user_definition_record(cursor, email)
    if not user_record:
        raise_input_exception(401, "INVALID_SESSION")