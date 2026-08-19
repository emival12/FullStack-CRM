import os
import logging
import importlib.util
from fastapi import HTTPException
from core.exceptions import raise_server_exception, log_event
from core.models import TriggerDefTiming, TriggerDefEvent
from db.db_queries import get_trigger_definition

logger = logging.getLogger(__name__) 

_trigger_module_cache: dict[tuple[str, float], object] = {}

def _load_trigger_module(key: tuple[str, float]) -> object:
    """
        Returns the trigger module at file_path, loading it from disk only when the file's mtime is newer than the cached version.
    """

    if key in _trigger_module_cache:
        return _trigger_module_cache[key]

    file_path, mtime = key
    try:
        spec = importlib.util.spec_from_file_location("dynamic_trigger", file_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        _trigger_module_cache[key] = module
        return module
    except Exception:
        raise_server_exception(logger, "Fatal error in Module import", file_path=file_path)

def run_triggers(cursor, triggers_dir: str, object_name: str, timing: TriggerDefTiming, event: TriggerDefEvent, record: dict) -> dict:
    """
        Loads and executes the active trigger for the given object, timing, and event, if any.

        Queries trigger_definition for an active trigger, dynamically imports the corresponding .py file from triggers_dir, and calls its execute(cursor, record) function.
        If the trigger returns a non-None value, it replaces the record.

        Args:
            cursor: Database cursor
            triggers_dir (str): Filesystem path to the triggers/ folder
            object_name (str): Name of the object triggering the event
            timing (TriggerDefTiming): Trigger timing
            event (TriggerDefEvent): Trigger event
            record (dict): The record being processed, passed to the trigger

        Returns:
            dict: The record, potentially modified by the trigger

        Raises:
            HTTPException: Propagated unchanged when the trigger deliberately rejects the write,
                so its domain-specific error code reaches the client instead of a generic 500.
            HTTPException 500: If the trigger fails unexpectedly, or if the module cannot be imported.
    """

    # trigger_definition PK is (object_name, trigger_event, trigger_timing) — at most 1 trigger per object
    active_triggers = get_trigger_definition(cursor, object_name, timing, event)
    if not active_triggers:
        return record

    file_name = f"{object_name}_{timing}_{event}.py"
    file_path = os.path.join(triggers_dir, file_name)
    if not os.path.exists(file_path):
        log_event(logging.ERROR, logger, "Trigger file not found", file_path=file_path)
        return record

    module = _load_trigger_module((file_path, os.path.getmtime(file_path)))
    try:
        result = module.execute(cursor, record)
        if result is not None:
            record = result
    except HTTPException:
        raise
    except Exception:
        raise_server_exception(logger, "Fatal error in Trigger execution", file_name=file_name)

    return record
