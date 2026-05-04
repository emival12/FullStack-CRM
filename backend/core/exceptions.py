import sys
import logging
from fastapi import HTTPException


def raise_input_exception(status_code: int, error_code: str, error_data=None) -> None:
    raise HTTPException(
        status_code=status_code,
        detail={"error_code": error_code, "error_data": error_data}
    )

def raise_server_exception(msg: str) -> None:
    log_error_message(f"ERROR: {msg}")
    raise_input_exception(500, "ADMIN_ERROR")

def is_prod_environment() -> bool:
    return getattr(sys, 'frozen', False)

def log_error_message(msg: str) -> None:
    if is_prod_environment():
        logging.error(msg)
    else:
        print(msg)


# TODO Deprecated gradualmente sostituire tutto con raise_server_exception
def log_err_and_throw_exception(msg: str, throw_exc: bool = True) -> None:
    log_error_message(msg)
    if throw_exc and is_prod_environment():
        raise Exception(f"ERROR: {msg}")