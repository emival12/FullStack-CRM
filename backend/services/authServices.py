from core.exceptions import raise_input_exception
from db.dbQueries import (
    login_user,
    get_user_definition_record
)

def login(cursor, db_name: str, email: str, password: str) -> dict:
    result = login_user(cursor, email, password)
    result["db_name"] = db_name

    return result

def check_user_login(cursor, conf_db_name: str, db_name: str, email: str) -> None:
    if conf_db_name != db_name:
        raise_input_exception(401, "DATABASE_CHANGED")

    user_record = get_user_definition_record(cursor, email)

    if not user_record:
        raise_input_exception(401, "INVALID_SESSION")