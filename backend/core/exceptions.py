import sys
import logging
from fastapi import HTTPException


def raise_input_exception(status_code: int, error_code: str, error_data=None) -> None:
    raise HTTPException(
        status_code=status_code,
        detail={"error_code": error_code, "error_data": error_data}
    )

def raise_server_exception(logger: logging.Logger, msg: str, **context) -> None:
    logger.exception(msg, extra={"context": context}, stacklevel=2)
    raise_input_exception(500, "ADMIN_ERROR")

def log_event(level: int, logger: logging.Logger, msg: str, exc_info: bool = False, **context) -> None:
    logger.log(level, msg, extra={"context": context}, stacklevel=2, exc_info=exc_info)