from __future__ import annotations
import logging
from config import get_triggers_folder
from core.exceptions import raise_server_exception, log_event
from core.models import FieldStructureMode, FieldTypes, SystemFieldName_FD, RldFilterConditions
from db.db_queries import (
    check_allowed_table,
    make_table_key,
    get_object_definition_records,
    get_object_definition_records_join_rt,
    group_object_definition_by_category,
    get_list_view_definition_fields,
    get_fields_with_label,
    get_primary_key_from_fields,
    get_records_from_table,
    get_record_layout_definition_fields,
    get_related_list_definition_fields,
    get_fields_definition,
    get_field_divided_by_type,
    get_primary_keys_from_multiple_objects,
    get_single_record,
    get_rollup_definition,
)
from db.query_builder import QueryBuilder
from services.record_crud import (
    get_field_structure,
    get_related_list_records,
    insert_new_record,
    update_record_by_id,
    delete_record_by_id
)
from triggers import trigger_manager
from engines import formula_engine, rollup_engine
  
logger = logging.getLogger(__name__) 

# TODO pensare di unsare un carattere speciale diverso
def split_table_name(table_name: str) -> tuple[str, str]:
    """Split 'ObjectName_RecordType' into ('ObjectName', 'RecordType') on the last underscore."""
    t_name, _, rt_name = table_name.rpartition("_")
    return t_name, rt_name

def validate_and_split_table_name(cursor, table_name: str) -> tuple[str, str]:
    check_allowed_table(cursor, table_name)
    return split_table_name(table_name)




def get_tables_plain(cursor) -> list[dict]:
    return get_object_definition_records(cursor)

def get_tables(cursor) -> dict[str, list]:
    tables = get_object_definition_records_join_rt(cursor)
    return group_object_definition_by_category(tables)

def get_table_records(cursor, table_name: str, record_type_name: str) -> dict:
    """
        Retrieve records and field metadata for the list view of a given object and record type.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            table_name (str): Object name identifying the target table.
            record_type_name (str): Record type name used to filter the list view definition.

        Returns:
            dict: A dictionary with keys 'fields', 'primary_key_name', and 'records'.
    """

    dict_fields = get_list_view_definition_fields(cursor, [(table_name, record_type_name)])
    obj_key = make_table_key(table_name, record_type_name)
    fields = dict_fields.get(obj_key, None)
    if not fields:
        raise_server_exception(logger, "No fields found", obj_key=obj_key)

    records = get_records_from_table(cursor, table_name, record_type_name, fields)
    return {
        "fields": get_fields_with_label(fields),
        "primary_key_name": get_primary_key_from_fields(fields),
        "records": records
    }

def get_new_record_structure(cursor, table_name: str, record_type_name: str) -> dict[str, dict]:
    fields = get_record_layout_definition_fields(cursor, table_name, record_type_name, RldFilterConditions.VISIBLE_AND_EDITABLE)
    return get_field_structure(cursor, table_name, fields)

def get_record(cursor, table_name: str, record_type_name: str, record_id: str) -> dict:
    """
        Retrieve the full record detail view, including field structure and related lists.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            table_name (str): Object name identifying the target table.
            record_type_name (str): Record type name used to filter the list view definition.
            record_id (str): Primary key value of the record to retrieve.

        Returns:
            dict: A dictionary with keys 'primary_key_name', 'field_structure', and 'related_list'.
    """

    fields = get_record_layout_definition_fields(cursor, table_name, record_type_name)
    field_structure = get_field_structure(cursor, table_name, fields, FieldStructureMode.STRUCTURE_AND_DATA, record_id)

    related_lists = get_related_list_definition_fields(cursor, table_name, record_type_name)
    rel_lists = get_related_list_records(
        cursor,
        table_name,
        record_id,
        related_lists
    )

    return {
        "primary_key_name": get_primary_key_from_fields(fields),
        "field_structure": field_structure,
        "related_list": rel_lists
    }

def insert_record(cursor, table_name: str, record_type_name: str, record: dict, user_id: str) -> dict:
    """
        Insert a new record into the given table, evaluating formulas and triggers, then refreshing parent rollups.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            table_name (str): Name of the target table.
            record_type_name (str): Record type name of the new record.
            record (dict): Field values for the new record.
            user_id (str): Id of the user performing the insert.

        Returns:
            dict: Dictionary containing the number of records inserted.
    """

    # Load all field definitions for this object (including hidden fields)
    obj_key = make_table_key(table_name, record_type_name)
    fields = get_fields_definition(cursor, [(table_name, record_type_name)], is_visible=0).get(obj_key, [])
    if not fields:
        raise_server_exception(logger, "No fields found", obj_key=obj_key)

    map_field_by_type = get_field_divided_by_type(fields)

    # Determine which fields need to be fetched from the DB to resolve complex formula dependencies
    fields_to_retrieve = [row for row in fields if row[SystemFieldName_FD.FIELD_TYPE] != FieldTypes.FORMULA.value]
    already_extracted = {row[SystemFieldName_FD.FIELD_NAME].lower() for row in fields_to_retrieve}
    complex_formula = formula_engine.extract_formula_dependencies(map_field_by_type.formula_fields, already_extracted, fields_to_retrieve)

    # Normalize keys, inject record type, and cast values to their declared types
    record = {k.lower(): v for k, v in record.items()}
    record[SystemFieldName_FD.RECORD_TYPE_NAME] = record_type_name
    record = formula_engine.cast_record_types(record, fields)

    # Run BEFORE INSERT triggers, which may modify raw field values before formula evaluation
    record = trigger_manager.run_triggers(cursor, get_triggers_folder(), table_name, "BEFORE", "INSERT", record)

    # Evaluate formulas after the trigger so they see the final field values
    record = formula_engine.evaluate_all_formulas(cursor, fields, record, complex_formula)

    # Actual insert on the DB
    result = insert_new_record(cursor, table_name, record, user_id)

    # Propagate changes upward: refresh any parent rollup fields that depend on this record
    impacted_parents = rollup_engine.get_impacted_parents(cursor, table_name, record)
    if impacted_parents:
        refresh_parents(cursor, impacted_parents, user_id)

    # Run AFTER INSERT triggers. AFTER Triggers can only modify other records or make new DML operations
    trigger_manager.run_triggers(cursor, get_triggers_folder(), table_name, "AFTER", "INSERT", record)

    log_event(logging.INFO, logger, "Record inserted", object_name=table_name, record_type_name=record_type_name, user_id=user_id)
    return result

def update_record(cursor, table_name: str, record_type_name: str, record_id: str, new_record: dict, user_id: str, map_object_primary_key_names: dict = None) -> dict:
    """
        Update an existing record, recalculating rollups and formulas, running triggers, then refreshing parent rollups.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            table_name (str): Name of the target table.
            record_type_name (str): Record type name of the record being updated.
            record_id (str): Primary key value of the record to update.
            new_record (dict): Field values to update.
            user_id (str): Id of the user performing the update.
            map_object_primary_key_names (dict | None): Optional pre-fetched map of table name → primary key field name.
                If None, it is fetched from the database.

        Returns:
            dict: Dictionary containing the number of records updated.
    """

    if not map_object_primary_key_names:
        map_object_primary_key_names = get_primary_keys_from_multiple_objects(cursor, [table_name])

    # Load all field definitions for this object (including hidden fields)
    obj_key = make_table_key(table_name, record_type_name)
    fields = get_fields_definition(cursor, [(table_name, record_type_name)], is_visible=0).get(obj_key, [])
    if not fields:
        raise_server_exception(logger, "No fields found", obj_key=obj_key)

    map_field_by_type = get_field_divided_by_type(fields)

    # Determine which fields need to be fetched from the DB to resolve complex formula dependencies
    fields_to_retrieve = [row for row in fields if row[SystemFieldName_FD.FIELD_TYPE] != FieldTypes.FORMULA.value]
    already_extracted = {row[SystemFieldName_FD.FIELD_NAME].lower() for row in fields_to_retrieve}
    complex_formula = formula_engine.extract_formula_dependencies(map_field_by_type.formula_fields, already_extracted, fields_to_retrieve)

    # Retrieve the current values of the records (the ones on the BD, not the changed one)
    primary_key_field = map_object_primary_key_names.get(table_name)
    if primary_key_field is None:
        raise_server_exception(logger, "No primary_key resolved", object_name=table_name)

    table_alias = QueryBuilder.alias(table_name)
    raw_filters = [f"{table_alias}.{primary_key_field} = %s"]
    raw_params  = [record_id]
    old_record = get_single_record(cursor, table_name, fields, raw_filters, raw_params)

    # Calculate the rollup values of the record
    rollup_map = get_rollup_definition(cursor, map_field_by_type.rollup_fields)
    rollup_values = rollup_engine.calculate_record_rollups(cursor, table_name, primary_key_field, record_id, map_field_by_type.rollup_fields, rollup_map)

    # Normalize keys, inject new values, and cast values to their declared types
    new_record = {k.lower(): v for k, v in new_record.items()}
    record = {**old_record}
    record.update(new_record)
    record.update(rollup_values)
    record = formula_engine.cast_record_types(record, fields)

    # Run BEFORE UPDATE triggers, which may modify raw field values before formula evaluation
    record = trigger_manager.run_triggers(cursor, get_triggers_folder(), table_name, "BEFORE", "UPDATE", record)

    # Evaluate formulas after the trigger so they see the final field values
    record = formula_engine.evaluate_all_formulas(cursor, fields, record, complex_formula)

    # Actual Update on the DB
    result = update_record_by_id(cursor, table_name, record_type_name, record, primary_key_field, record_id, user_id)

    # Propagate changes upward: refresh any parent rollup fields that depend on this record
    impacted_parents = rollup_engine.get_impacted_parents(cursor, table_name, record, old_record)
    if impacted_parents:
        refresh_parents(cursor, impacted_parents, user_id)

    # Run AFTER UPDATE triggers. AFTER Triggers can only modify other records or make new DML operations
    trigger_manager.run_triggers(cursor, get_triggers_folder(), table_name, "AFTER", "UPDATE", record)

    log_event(logging.INFO, logger, "Record updated", object_name=table_name, record_type_name=record_type_name, record_id=record_id, user_id=user_id)
    return result

def refresh_parents(cursor, impacted_parents: set, user_id: str) -> None:
    """
        Recalculates rollup and formula fields for all impacted parent records and persists them.

        Pre-fetches primary key names for all impacted objects in a single query, then for each
        parent calls update_record which recalculates rollup aggregations, re-evaluates formula
        fields, and persists the result.

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query
            impacted_parents (set): Set of tuples (parent_table, parent_record_type, parent_id)
            user_id (str): Id of the user who triggered the cascade
    """

    objects_list = list(set(p_table for p_table, _, _ in impacted_parents if p_table))
    map_object_primary_key_names = get_primary_keys_from_multiple_objects(cursor, objects_list)

    for p_table, p_rt, p_id in impacted_parents:
        _ = update_record(cursor, p_table, p_rt, p_id, {}, user_id, map_object_primary_key_names)

def delete_record(cursor, table_name: str, record_type_name: str, record_id: str) -> dict:
    primary_key_field = get_primary_keys_from_multiple_objects(cursor, [table_name]).get(table_name)
    if primary_key_field is None:
        raise_server_exception(logger, "Empty primary key", object_name=table_name, record_type_name=record_type_name)
  
    result = delete_record_by_id(cursor, table_name, record_type_name, primary_key_field, record_id)
    log_event(logging.WARNING, logger, "Record deleted", object_name=table_name, record_type_name=record_type_name, record_id=record_id)
    return result
