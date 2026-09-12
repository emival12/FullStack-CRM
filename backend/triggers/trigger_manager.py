import os
import logging
import importlib.util
from types import MappingProxyType
from fastapi import HTTPException
from config import get_triggers_folder
from core.exceptions import raise_server_exception, log_event
from core.models import TriggerDefTiming, TriggerDefEvent
from db.db_queries import get_trigger_definition

logger = logging.getLogger(__name__) 

_trigger_module_cache: dict[tuple[str, float], object] = {}

def load_module(file_name: str) -> object:
    """
        Returns the module named file_name (extension included) from the triggers folder.

        Entry point for trigger files that need a shared helper: call it inside execute(),
        never at module level, so the helper is re-resolved on every run instead of being
        frozen into the cached trigger module.
    """

    triggers_dir = get_triggers_folder()
    file_path = os.path.join(triggers_dir, file_name)
    return _load_trigger_module((file_path, os.path.getmtime(file_path)))

def _load_trigger_module(key: tuple[str, float]) -> object:
    """
        Returns the module at file_path, loading it from disk only when the file's mtime is newer than the cached version.
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

def run_triggers(cursor, object_name: str, timing: TriggerDefTiming, event: TriggerDefEvent, record: dict, old_record: dict = None) -> dict:
    """
        Loads and executes the active trigger for the given object, timing, and event, if any.

        Queries trigger_definition for an active trigger, dynamically imports the corresponding .py file from the triggers folder, and calls its execute(cursor, record, old_record) function.
        If the trigger returns a non-None value, it replaces the record.

        Args:
            cursor: Database cursor
            object_name (str): Name of the object triggering the event
            timing (TriggerDefTiming): Trigger timing
            event (TriggerDefEvent): Trigger event
            record (dict): The record being processed, passed to the trigger
            old_record (dict | None): The record as stored before the write. Required for every event
                except INSERT, where it is None. Handed to the trigger as a read-only view: the caller
                keeps using it after the trigger runs, so a trigger must not be able to alter it.

        Returns:
            dict: The record, potentially modified by the trigger

        Raises:
            HTTPException: Propagated unchanged when the trigger deliberately rejects the write,
                so its domain-specific error code reaches the client instead of a generic 500.
            HTTPException 500: If the trigger fails unexpectedly, or if the module cannot be imported.
    """

    if event != TriggerDefEvent.INSERT and old_record is None:
        raise_server_exception(logger, "Update trigger without old_record", object_name=object_name, timing=timing, event=event)

    triggers_dir = get_triggers_folder()

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
    read_only_old_record = MappingProxyType(old_record) if old_record is not None else None
    try:
        result = module.execute(cursor, record, read_only_old_record)
        if result is not None:
            record = result
    except HTTPException:
        raise
    except Exception:
        raise_server_exception(logger, "Fatal error in Trigger execution", file_name=file_name)

    return record
