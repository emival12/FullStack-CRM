import os
import importlib.util

from core.exceptions import raise_server_exception, log_error_message
from db.dbQueries import (
    get_trigger_definition
)

def run_triggers(cursor, triggers_dir: str, object_name: str, timing: str, event: str, record: dict) -> dict:
    """
        Loads and executes the active trigger for the given object, timing, and event, if any.

        Queries trigger_definition for an active trigger, dynamically imports the corresponding .py file from triggers_dir, and calls its execute(cursor, record) function.
        If the trigger returns a non-None value, it replaces the record.

        Args:
            cursor: Database cursor
            triggers_dir (str): Filesystem path to the triggers/ folder
            object_name (str): Name of the object triggering the event
            timing (str): Trigger timing — "BEFORE" or "AFTER"
            event (str): Trigger event — "INSERT", "UPDATE", or "DELETE"
            record (dict): The record being processed, passed to the trigger

        Returns:
            dict: The record, potentially modified by the trigger
    """
    # trigger_definition PK is (object_name, trigger_event, trigger_timing) — at most 1 trigger per object
    active_triggers = get_trigger_definition(cursor, object_name, timing, event)
    file_name = f"{object_name}_{timing}_{event}.py"
    file_path = os.path.join(triggers_dir, file_name)

    for trig in active_triggers:
        if not os.path.exists(file_path):
            log_error_message(f"run_triggers: trigger file not found: {file_name}")
            continue

        try:
            spec = importlib.util.spec_from_file_location("dynamic_trigger", file_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            result = module.execute(cursor, record)
            if result is not None:
                record = result

        except Exception as e:
            raise_server_exception(f"Fatal error in the trigger {file_name}: {e}")

    return record
