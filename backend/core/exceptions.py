import sys
import logging
from fastapi import HTTPException
from enum import StrEnum

class ExceptionKind(StrEnum):
    SYSTEM              = "system"
    BUSINESS_SHARED     = "business_shared"
    BUSINESS_FEATURE    = "business_feature"

def raise_input_exception(status_code: int, error_code: str, error_data=None, kind: ExceptionKind = ExceptionKind.BUSINESS_FEATURE) -> None:
    raise HTTPException(
        status_code=status_code,
        detail={"error_code": error_code, "error_data": error_data, "kind": kind}
    )

def raise_server_exception(logger: logging.Logger, msg: str, **context) -> None:
    logger.exception(msg, extra={"context": context}, stacklevel=2)
    raise_input_exception(500, "ADMIN_ERROR", kind=ExceptionKind.SYSTEM)

def log_event(level: int, logger: logging.Logger, msg: str, exc_info: bool = False, **context) -> None:
    logger.log(level, msg, extra={"context": context}, stacklevel=2, exc_info=exc_info)