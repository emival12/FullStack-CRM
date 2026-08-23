from __future__ import annotations
import logging
from core.exceptions import raise_input_exception, raise_server_exception, log_event, ExceptionKind
from core.models import FieldStructureMode, FieldTypes, SystemFieldName_FD, RldFilterConditions, TriggerDefTiming, TriggerDefEvent
from db.db_queries import (
    SEPARATOR,
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
    get_fields_referencing_object,
)
from db.query_builder import QueryBuilder, QueryBuilderComparisonOperator
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
MAX_RECURSION_DEPTH = 25

def split_table_name(table_name: str) -> tuple[str, str]:
    """Split 'ObjectName-RecordType' into ('ObjectName', 'RecordType') on a special char"""
    t_name, _, rt_name = table_name.rpartition(SEPARATOR)
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

def _normalize_input_record(record: dict) -> dict:
    """
        Lowercase field keys and collapse empty sentinels to None.

        The frontend submits "" (empty text input) and "NULL" (empty select option) for
        unset fields; both are normalized to None so the whole write pipeline
        (formula / trigger / rollup / DB binding) sees a single empty representation.
        Note: 0 and False are preserved — Python == does not coerce them to "" or "NULL".
    """
    normalized = {}
    for k, v in record.items():
        value = None if v == "" or v == "NULL" else v
        normalized[k.lower()] = value
    return normalized

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
    record = _normalize_input_record(record)
    record[SystemFieldName_FD.RECORD_TYPE_NAME] = record_type_name
    record = formula_engine.cast_record_types(record, fields)

    # Run BEFORE INSERT triggers, which may modify raw field values before formula evaluation
    record = trigger_manager.run_triggers(cursor, table_name, TriggerDefTiming.BEFORE, TriggerDefEvent.INSERT, record)

    # Evaluate formulas after the trigger so they see the final field values
    record = formula_engine.evaluate_all_formulas(cursor, fields, record, complex_formula)

    # Actual insert on the DB
    result = insert_new_record(cursor, table_name, record, user_id)

    # Propagate changes upward: refresh any parent rollup fields that depend on this record
    impacted_parents = rollup_engine.get_impacted_parents(cursor, table_name, record)
    if impacted_parents:
        refresh_records(cursor, impacted_parents, user_id)

    # Run AFTER INSERT triggers. AFTER Triggers can only modify other records or make new DML operations
    trigger_manager.run_triggers(cursor, table_name, TriggerDefTiming.AFTER, TriggerDefEvent.INSERT, record)

    log_event(logging.INFO, logger, "Record inserted", object_name=table_name, record_type_name=record_type_name, user_id=user_id)
    return result

def update_record(
    cursor, 
    table_name: str, 
    record_type_name: str, 
    record_id: str, 
    new_record: dict, 
    user_id: str, 
    map_object_primary_key_names: dict = None,
    curr_depth: int = 0,
    upward_refresh_to_skip: tuple = None
) -> dict:
    """
        Update an existing record, then propagate the change to every record derived from it.

        The record is written once, then the children whose cross-object formulas read it are refreshed,
        then the record is written a second time so its rollups see the updated children, and finally the
        parent rollups are refreshed. The second write continues from the record returned by the first,
        so values set by BEFORE UPDATE triggers are not reverted.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            table_name (str): Name of the target table.
            record_type_name (str): Record type name of the record being updated.
            record_id (str): Primary key value of the record to update.
            new_record (dict): Field values to update.
            user_id (str): Id of the user performing the update.
            map_object_primary_key_names (dict | None): Optional pre-fetched map of table name → primary key field name.
                If None, it is fetched from the database.
            curr_depth (int): Internal cascade depth counter. Routers and top-level callers must leave it at 0;
                it is incremented by refresh_records when propagating to other records, and used to enforce
                MAX_RECURSION_DEPTH against cyclic configurations.
            upward_refresh_to_skip (tuple | None): Parent record to leave out of the upward refresh, as
                (table_name, record_type_name, record_id). Set on children so they do not walk back up to the
                record that triggered their refresh; their other parents are still refreshed normally.

        Returns:
            dict: Dictionary containing the number of records updated by the first write.
    """

    if curr_depth >= MAX_RECURSION_DEPTH:
        raise_server_exception(logger, "Max recursion depth reached", object_name=table_name, record_type_name=record_type_name, record_id=record_id)

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

    record, result = execute_record_update(
        cursor,
        table_name,
        record_type_name,
        record_id,
        new_record,
        user_id,
        map_field_by_type,
        primary_key_field,
        old_record,
        fields,
        complex_formula
    )

    # Propagate changes downward: refresh any child formula fields that depend on this record
    impacted_children = rollup_engine.get_impacted_children(cursor, table_name, record)
    if impacted_children:
        refresh_records(cursor, impacted_children, user_id, curr_depth, (table_name, record_type_name, record_id))
        record, _ = execute_record_update(
            cursor,
            table_name,
            record_type_name,
            record_id,
            new_record,
            user_id,
            map_field_by_type,
            primary_key_field,
            record,
            fields,
            complex_formula,
            run_trigger = False
        )

    # Propagate changes upward: refresh any parent rollup fields that depend on this record
    impacted_parents = rollup_engine.get_impacted_parents(cursor, table_name, record, old_record)
    impacted_parents.discard(upward_refresh_to_skip)
    if impacted_parents:
        refresh_records(cursor, impacted_parents, user_id, curr_depth)

    # Run AFTER UPDATE triggers. AFTER Triggers can only modify other records or make new DML operations
    trigger_manager.run_triggers(cursor, table_name, TriggerDefTiming.AFTER, TriggerDefEvent.UPDATE, record)

    log_event(logging.INFO, logger, "Record updated", object_name=table_name, record_type_name=record_type_name, record_id=record_id, user_id=user_id)
    return result

def execute_record_update(
    cursor, 
    table_name: str, 
    record_type_name: str, 
    record_id: str, 
    new_record: dict, 
    user_id: str, 
    map_field_by_type: dict,
    primary_key_field: str,
    old_record: dict,
    fields: dict,
    complex_formula: dict,
    run_trigger: bool = True
) -> tuple[dict, dict]:
    """
        Recalculate the rollup and formula fields of a record and persist it.

        Shared by both writes of update_record. The first one runs the BEFORE UPDATE triggers; the second
        is called with run_trigger False so they do not fire twice for a single user action.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            table_name (str): Name of the target table.
            record_type_name (str): Record type name of the record being updated.
            record_id (str): Primary key value of the record to update.
            new_record (dict): Field values to update.
            user_id (str): Id of the user performing the update.
            map_field_by_type (FieldsByType): Field definitions of the object grouped by type.
            primary_key_field (str): Primary key column name of the object.
            old_record (dict): Base state the record is rebuilt from. The second write passes the record
                returned by the first, not the pre-update state, so trigger changes are not reverted.
            fields (list[dict]): All active field definitions for the object and record type.
            complex_formula (dict): Lookup dependency map returned by extract_formula_dependencies.
            run_trigger (bool): Whether to run the BEFORE UPDATE triggers.

        Returns:
            tuple[dict, dict]: The record as persisted, and the number of records updated.
    """

    # Calculate the rollup values of the record
    rollup_map = get_rollup_definition(cursor, map_field_by_type.rollup_fields)
    rollup_values = rollup_engine.calculate_record_rollups(cursor, table_name, primary_key_field, record_id, map_field_by_type.rollup_fields, rollup_map)

    # Normalize keys, inject new values, and cast values to their declared types
    new_record = _normalize_input_record(new_record)
    record = {**old_record}
    record.update(new_record)
    record.update(rollup_values)
    record = formula_engine.cast_record_types(record, fields)

    # Run BEFORE UPDATE triggers, which may modify raw field values before formula evaluation
    if run_trigger:
        record = trigger_manager.run_triggers(cursor, table_name, TriggerDefTiming.BEFORE, TriggerDefEvent.UPDATE, record)

    # Evaluate formulas after the trigger so they see the final field values
    record = formula_engine.evaluate_all_formulas(cursor, fields, record, complex_formula)

    # Actual Update on the DB
    result = update_record_by_id(cursor, table_name, record_type_name, record, primary_key_field, record_id, user_id)

    return record, result

def refresh_records(cursor, impacted_records: set, user_id: str, curr_depth: int = 0, upward_refresh_to_skip=None) -> None:
    """
        Recalculates rollup and formula fields for all impacted records and persists them.

        Used for both directions of the cascade: the parents whose rollups aggregate a changed record,
        and the children whose cross-object formulas read it. Pre-fetches primary key names for all
        impacted objects in a single query, then delegates each record to update_record.

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query
            impacted_records (set): Set of tuples (table_name, record_type_name, record_id)
            user_id (str): Id of the user who triggered the cascade
            curr_depth (int): Current cascade depth. Incremented by 1 when delegating to update_record,
                so the guard in update_record can enforce MAX_RECURSION_DEPTH against cyclic configurations.
            upward_refresh_to_skip (tuple | None): Parent record the refreshed records must leave out of
                their own upward refresh. Passed when descending to children, left None when ascending.
    """

    objects_list = list(set(p_table for p_table, _, _ in impacted_records if p_table))
    map_object_primary_key_names = get_primary_keys_from_multiple_objects(cursor, objects_list)

    for p_table, p_rt, p_id in impacted_records:
        _ = update_record(cursor, p_table, p_rt, p_id, {}, user_id, map_object_primary_key_names, curr_depth+1, upward_refresh_to_skip)

def delete_record(cursor, table_name: str, record_type_name: str, record_id: str, user_id: str) -> dict:
    count_records_by_object = count_child_records_by_object(cursor, table_name, record_id)
    if count_records_by_object:
        constraint_fields = [ f"{count} {obj}" for obj, count in count_records_by_object.items()]
        raise_input_exception(409, "OBJECT_REFERENCED_BY_CHILDREN_LOOKUP", {"fields": ", ".join(constraint_fields)}, kind=ExceptionKind.BUSINESS_SHARED)

    primary_key_field = get_primary_keys_from_multiple_objects(cursor, [table_name]).get(table_name)
    if primary_key_field is None:
        raise_server_exception(logger, "Empty primary key", object_name=table_name, record_type_name=record_type_name)
  
    obj_key = make_table_key(table_name, record_type_name)
    fields = get_fields_definition(cursor, [(table_name, record_type_name)], is_visible=0).get(obj_key, [])
    if not fields:
        raise_server_exception(logger, "No fields found", obj_key=obj_key)

    table_alias = QueryBuilder.alias(table_name)
    raw_filters = [f"{table_alias}.{primary_key_field} = %s"]
    raw_params  = [record_id]
    old_record = get_single_record(cursor, table_name, fields, raw_filters, raw_params)
    result = delete_record_by_id(cursor, table_name, record_type_name, primary_key_field, record_id)

    # Propagate changes upward: refresh any parent rollup fields that depend on this record
    impacted_parents = rollup_engine.get_impacted_parents(cursor, table_name, old_record)
    if impacted_parents:
        refresh_records(cursor, impacted_parents, user_id)
        
    log_event(logging.WARNING, logger, "Record deleted", object_name=table_name, record_type_name=record_type_name, record_id=record_id, user_id=user_id)
    return result

def count_child_records_by_object(cursor, table_name: str, record_id: str) -> dict:
    """
        Count, per referencing object, how many records point at the given record through a lookup.
        Pre-check for the deletion of a record: a non-empty result means the record is still referenced and the delete must be refused.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            table_name (str): Name of the object the record belongs to.
            record_id (str): Primary key value of the record being checked.

        Returns:
            dict: Mapping of referencing object name → number of records pointing at this one.
    """

    lookup_definition = get_fields_referencing_object(cursor, table_name)
    lookups = {(l[SystemFieldName_FD.OBJECT_NAME], l[SystemFieldName_FD.FIELD_NAME]) for l in lookup_definition}

    count_records = {}
    for object_name, field_name in lookups:
        table_alias = QueryBuilder.alias(object_name)
        try:
            query, params = (
                QueryBuilder(object_name, ["COUNT(*) AS total"])
                .begin_filter()
                    .add(f"{table_alias}.{field_name}", QueryBuilderComparisonOperator.EQUAL, record_id)
                .end_filter()
                .get_query()
            )
            cursor.execute(query, params)

            total = cursor.fetchone()["total"]
            if total > 0:
                count_records[object_name] = count_records.get(object_name, 0) + total
        except Exception as e:
            raise_server_exception(logger, "DB query failed", query=query)

    return count_records