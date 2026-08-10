from __future__ import annotations
import logging
from datetime import datetime
from typing import Callable
from core.exceptions import raise_input_exception, raise_server_exception, ExceptionKind
from core.models import (
    StandardObjectField,
    SystemFieldName_FD, 
    SystemFieldName_OD, 
    SystemFieldName_RTD, 
    SystemFieldName_ROLLD,
    SystemFieldName_UD,
    SystemFieldName_RLD,
    FieldTypes, 
    RldFilterConditions, 
    FieldsByType,
    TriggerDefTiming,
    TriggerDefEvent
)
from db.query_builder import QueryBuilder, QueryBuilderComparisonOperator, QueryBuilderLogicalOperator, QueryBuilderJoinType

logger = logging.getLogger(__name__) 


########## START - Key Builders ##########
# Pure string helpers that build dictionary keys and table aliases used throughout the module.
SEPARATOR = "-"

def make_table_key(object_name: str, record_type_name: str) -> str:
    return f'{object_name}{SEPARATOR}{record_type_name}'

def make_options_key(object_name: str, record_type_name: str, field_name: str) -> str:
    return f'{object_name}{SEPARATOR}{record_type_name}{SEPARATOR}{field_name}'

def make_rollup_key(object_name: str, record_type_name: str, field_name: str, reference_object: str) -> str:
    return f'{object_name}{SEPARATOR}{record_type_name}{SEPARATOR}{field_name}{SEPARATOR}{reference_object}'

def make_table_key_from_row(
    row: dict,
    object_col: str = SystemFieldName_FD.OBJECT_NAME,
    record_type_col: str = SystemFieldName_FD.RECORD_TYPE_NAME,
) -> str:
    return make_table_key(row[object_col], row[record_type_col])

def make_basic_table_key(row: dict, object_col: str = SystemFieldName_FD.OBJECT_NAME) -> str:
    return row[object_col]

def make_options_key_from_row(row: dict) -> str:
    return make_options_key(
        row[SystemFieldName_FD.OBJECT_NAME], 
        row[SystemFieldName_FD.RECORD_TYPE_NAME], 
        row[SystemFieldName_FD.FIELD_NAME]
    )

def make_rollup_key_from_row(row: dict) -> str:
    object_col = SystemFieldName_ROLLD.MASTER_OBJECT_NAME             if SystemFieldName_ROLLD.MASTER_OBJECT_NAME in row        else SystemFieldName_FD.OBJECT_NAME
    record_type_col = SystemFieldName_ROLLD.MASTER_RECORD_TYPE_NAME   if SystemFieldName_ROLLD.MASTER_RECORD_TYPE_NAME in row   else SystemFieldName_FD.RECORD_TYPE_NAME
    field_col = SystemFieldName_ROLLD.MASTER_FIELD_NAME               if SystemFieldName_ROLLD.MASTER_FIELD_NAME in row         else SystemFieldName_FD.FIELD_NAME
    reference_object_col = SystemFieldName_ROLLD.DETAIL_OBJECT_NAME   if SystemFieldName_ROLLD.DETAIL_OBJECT_NAME in row        else SystemFieldName_FD.REFERENCE_OBJECT

    return make_rollup_key(
        row[object_col], 
        row[record_type_col], 
        row[field_col],
        row[reference_object_col]
    )

########## END - Key Builders ##########




########## START    - Core SystemObjects queries ##########
# Direct queries on metadata tables (field_definition, object_definition, etc.). No business logic — raw structural reads from the DB.
def check_allowed_object(cursor, object_name: str) -> None:
    _check_allowed(cursor, object_name, make_basic_table_key)

def check_allowed_table(cursor, table_name: str) -> None:
    _check_allowed(cursor, table_name, make_table_key_from_row)

def _check_allowed(cursor, table_name: str, key_function: Callable[[dict], str]) -> None:
    """
        Check if the given table name is allowed in the database.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            table_name (str): Name of a database table.
            key_function (Callable[[dict], str]): Function used to compute the lookup key from a row

        Returns:
            None

        Raises:
            HTTPException 404: If table_name is not found among the allowed tables.
            HTTPException 500: On any database error.
    """

    od_table_name = "object_definition"
    od_table_alias = QueryBuilder.alias(od_table_name)

    rtd_table_name = "record_type_definition"
    rtd_table_alias = QueryBuilder.alias(rtd_table_name)
    select_fields = [
        f"{od_table_alias}.object_name",
        f"{rtd_table_alias}.record_type_name",
        f"{od_table_alias}.is_single_record_type"
    ]
    join_conditions = [
        (f"{od_table_alias}.object_name", f"{rtd_table_alias}.object_name")
    ]

    try:
        query, params = (
            QueryBuilder(od_table_name, select_fields)
            .add_join(QueryBuilderJoinType.LEFT, rtd_table_name, join_conditions)
            .begin_filter()
                .add(f"{rtd_table_alias}.is_active", QueryBuilderComparisonOperator.EQUAL, 1)
            .end_filter()
            .get_query()
        )
        cursor.execute(query, params)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)

    allowed_tables = { key_function(row) for row in cursor.fetchall() }
    if table_name not in allowed_tables:
        raise_input_exception(404, "INPUT_TABLE_NAME_NOT_FOUND", kind=ExceptionKind.BUSINESS_SHARED)

def get_object_definition_records(cursor, object_names: list[str] | None = None) -> list[dict]:
    """
        Retrieve non-system objects from 'object_definition', optionally filtered by name.
        Enriches each result with a 'key' (object_name) and a 'label' (capitalized object_label).

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            object_names (list[str] | None): If provided, restricts results to these object names.

        Returns:
            list[dict]: Object definition records, each with 'key' and 'label' fields added.

        Raises:
            HTTPException 500: On any database error.
    """

    table_name = "object_definition"
    table_alias = QueryBuilder.alias(table_name)
    select_fields = [
        f"{table_alias}.object_label",
        f"{table_alias}.object_name",
        f"{table_alias}.category",
        f"{table_alias}.sort_order",
        f"{table_alias}.is_system_object",
        f"{table_alias}.is_single_record_type"
    ]
    order_by = [
        f"{table_alias}.sort_order ASC"
    ]

    try:
        query, params = (
            QueryBuilder(table_name, select_fields)
            .begin_filter()
                .add(f"{table_alias}.is_system_object", QueryBuilderComparisonOperator.EQUAL, 0)
                .add_if(object_names, f"{table_alias}.object_name", QueryBuilderComparisonOperator.IN, object_names)
            .end_filter()
            .order_by(order_by)
            .get_query()
        )
        cursor.execute(query, params)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)

    tables = cursor.fetchall()
    for table in tables:
        table["key"] = table[SystemFieldName_OD.OBJECT_NAME]
        table["label"] = table[SystemFieldName_OD.OBJECT_LABEL].capitalize()

    return tables

def get_object_definition_records_join_rt(cursor, object_names: list[str] | None = None, take_active_rt: int = 1) -> list[dict]:
    """
        Retrieve non-system objects joined with their record types, optionally filtered by name.
        Enriches each result with a 'key' (object_name + record_type_name) and a 'label'
        (object_label for single-record-type objects, record_type_name otherwise).

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            object_names (list[str] | None): If provided, restricts results to these object names.
            take_active_rt (int): If 1, restricts results to active record types only. Default 1.

        Returns:
            list[dict]: Object definition records joined with record types, each with 'key' and 'label' fields added.

        Raises:
            HTTPException 500: On any database error.
    """

    od_table_name = "object_definition"
    od_table_alias = QueryBuilder.alias(od_table_name)

    rtd_table_name = "record_type_definition"
    rtd_table_alias = QueryBuilder.alias(rtd_table_name)
    select_fields = [
        f"{od_table_alias}.object_label",
        f"{od_table_alias}.object_name",
        f"{rtd_table_alias}.record_type_name",
        f"{rtd_table_alias}.is_active",
        f"{od_table_alias}.category",
        f"{od_table_alias}.sort_order",
        f"{od_table_alias}.is_system_object",
        f"{od_table_alias}.is_single_record_type"
    ]
    join_conditions = [
        (f"{od_table_alias}.object_name", f"{rtd_table_alias}.object_name")
    ]
    order_by = [
        f"{od_table_alias}.sort_order ASC"
    ]

    try:
        query, params = (
            QueryBuilder(od_table_name, select_fields)
            .add_join(QueryBuilderJoinType.LEFT, rtd_table_name, join_conditions)
            .begin_filter()
                .add(f"{od_table_alias}.is_system_object", QueryBuilderComparisonOperator.EQUAL, 0)
                .add_if(take_active_rt, f"{rtd_table_alias}.is_active", QueryBuilderComparisonOperator.EQUAL, take_active_rt)
                .add_if(object_names, f"{od_table_alias}.object_name", QueryBuilderComparisonOperator.IN, object_names)
            .end_filter()
            .order_by(order_by)
            .get_query()
        )
        cursor.execute(query, params)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)


    tables = cursor.fetchall()
    for table in tables:
        table["key"] = make_table_key_from_row(table)
        table["label"] = table[SystemFieldName_OD.OBJECT_LABEL].capitalize() if table[SystemFieldName_OD.IS_SINGLE_RECORD_TYPE] else table[SystemFieldName_RTD.RECORD_TYPE_NAME].capitalize()

    return tables

def get_list_view_definition_fields(cursor, list_params: list[tuple[str, str]]) -> dict[str, list[dict]]:
    """
        Retrieve all active and visible fields defined in the list views for a specific set of (object_name, record_type_name) pairs.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            list_params (list[tuple[str, str]]): List of (object_name, record_type_name) pairs to filter on.

        Returns:
            dict[str, list[dict]]: A dictionary mapping each object-record_type key to its list of field definitions.

        Raises:
            HTTPException 500: On any database error.
    """

    if not list_params:
        return {}

    lvd_table_name = "list_view_definition"
    lvd_table_alias = QueryBuilder.alias(lvd_table_name)

    fd_table_name = "field_definition"
    fd_table_alias = QueryBuilder.alias(fd_table_name)
    select_fields = [
        f"{fd_table_alias}.object_name",
        f"{fd_table_alias}.record_type_name",
        f"{fd_table_alias}.field_name",
        f"{fd_table_alias}.field_type",
        f"{fd_table_alias}.reference_object",
        f"{fd_table_alias}.reference_field",
        f"{fd_table_alias}.is_primary_key",
        f"{fd_table_alias}.lookup_filter",
        f"{fd_table_alias}.formula_definition"
    ]
    join_conditions = [
        (f"{lvd_table_alias}.object_name", f"{fd_table_alias}.object_name"),
        (f"{lvd_table_alias}.record_type_name", f"{fd_table_alias}.record_type_name"),
        (f"{lvd_table_alias}.field_name", f"{fd_table_alias}.field_name")
    ]
    order_by = [
        f"{lvd_table_alias}.sort_order ASC"
    ]

    try:
        query, params = (
            QueryBuilder(lvd_table_name, select_fields)
            .add_join(QueryBuilderJoinType.INNER, fd_table_name, join_conditions)
            .begin_filter()
                .add(f"{fd_table_alias}.is_active", QueryBuilderComparisonOperator.EQUAL, 1)
                .add(f"{fd_table_alias}.is_visible", QueryBuilderComparisonOperator.EQUAL, 1)
                .add_tuple_in(
                    [f"{fd_table_alias}.object_name", f"{fd_table_alias}.record_type_name"],
                    list_params
                )
            .end_filter()
            .order_by(order_by)
            .get_query()
        )
        cursor.execute(query, params)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)

    result = {}
    for row in cursor.fetchall():
        key = make_table_key_from_row(row)
        result.setdefault(key, []).append(row)

    return result

def get_record_layout_definition_fields(
        cursor, 
        table_name: str, 
        record_type_name: str, 
        filter_condition: RldFilterConditions = RldFilterConditions.VISIBLE, 
        is_active: int = 1
) -> list[dict]:
    """
        Return fields defined in the record layout for a specific object and record type.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            table_name (str): Name of the object (database table).
            record_type_name (str): Name of the record type.
            filter_condition (RldFilterConditions): Controls which fields are included.
                - VISIBLE: only fields with is_visible = 1 (default).
                - VISIBLE_AND_EDITABLE: fields with is_visible = 1 AND is_editable = 1, plus 'record_type_name' regardless of editability.
            is_active (int): If 1, restricts results to active fields only. Default 1.

        Returns:
            list[dict]: Field metadata rows ordered by sort_order, each including field_name, field_type, length, precision, scale, reference info, and editability flags.

        Raises:
            HTTPException 500: On any database error.
    """

    rld_table_name = "record_layout_definition"
    rld_table_alias = QueryBuilder.alias(rld_table_name)

    fd_table_name = "field_definition"
    fd_table_alias = QueryBuilder.alias(fd_table_name)
    select_fields = [
        f"{fd_table_alias}.object_name",
        f"{fd_table_alias}.record_type_name",
        f"{fd_table_alias}.field_name",
        f"{fd_table_alias}.field_type",
        f"{fd_table_alias}.length",
        f"{fd_table_alias}.numeric_precision",
        f"{fd_table_alias}.numeric_scale",
        f"{fd_table_alias}.reference_object",
        f"{fd_table_alias}.reference_field",
        f"{fd_table_alias}.is_editable",
        f"{fd_table_alias}.is_required",
        f"{fd_table_alias}.is_primary_key",
        f"{fd_table_alias}.lookup_filter",
        f"{fd_table_alias}.formula_definition"
    ]
    join_conditions = [
        (f"{rld_table_alias}.object_name", f"{fd_table_alias}.object_name"),
        (f"{rld_table_alias}.record_type_name", f"{fd_table_alias}.record_type_name"),
        (f"{rld_table_alias}.field_name", f"{fd_table_alias}.field_name")
    ]
    order_by = [
        f"{rld_table_alias}.sort_order ASC"
    ]

    try:
        qb = QueryBuilder(rld_table_name, select_fields).add_join(QueryBuilderJoinType.INNER, fd_table_name, join_conditions)
        qfb = ( qb.begin_filter()   
            .add(f"{fd_table_alias}.object_name", QueryBuilderComparisonOperator.EQUAL, table_name)
            .add(f"{fd_table_alias}.record_type_name", QueryBuilderComparisonOperator.EQUAL, record_type_name)
            .add_if(is_active, f"{fd_table_alias}.is_active", QueryBuilderComparisonOperator.EQUAL, 1)
        )
        
        if filter_condition == RldFilterConditions.VISIBLE:
            qfb = qfb.add(f"{fd_table_alias}.is_visible", QueryBuilderComparisonOperator.EQUAL, 1)
        elif filter_condition == RldFilterConditions.VISIBLE_AND_EDITABLE:
            qfb = (qfb.begin_and()
                    .add(f"{fd_table_alias}.is_visible", QueryBuilderComparisonOperator.EQUAL, 1)
                    .add(f"{fd_table_alias}.is_editable", QueryBuilderComparisonOperator.EQUAL, 1)
                .end()
            )

        query, params = (
            qfb
            .end_filter()
            .order_by(order_by)
            .get_query()
        )
        cursor.execute(query, params)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)

    return cursor.fetchall()

def get_fields_definition(cursor, list_params: list[tuple[str, str]], is_visible: int = 1, is_active: int = 1, field_name: str | None = None) -> dict[str, list[dict]]:
    """
        Retrieve field definitions for a specific set of (object_name, record_type_name) pairs.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            list_params (list[tuple[str, str]]): List of (object_name, record_type_name) pairs to filter on.
            is_visible (int): If 1, filters only visible fields. If 0, returns all fields regardless of visibility. Defaults to 1.
            is_active (int): If 1, filters only active fields. If 0, returns all fields regardless of active status. Defaults to 1.
            field_name (str | None): If provided, filters to a specific field name. Defaults to None.

        Returns:
            dict[str, list[dict]]: A dictionary mapping each object-record_type key to its list of field definitions.

        Raises:
            HTTPException 500: On any database error.
    """

    if not list_params:
        return {}

    fd_table_name = "field_definition"
    fd_table_alias = QueryBuilder.alias(fd_table_name)
    select_fields = [
        f"{fd_table_alias}.object_name",
        f"{fd_table_alias}.record_type_name",
        f"{fd_table_alias}.field_name",
        f"{fd_table_alias}.field_type",
        f"{fd_table_alias}.length",
        f"{fd_table_alias}.numeric_precision",
        f"{fd_table_alias}.numeric_scale",
        f"{fd_table_alias}.reference_object",
        f"{fd_table_alias}.reference_field",
        f"{fd_table_alias}.is_editable",
        f"{fd_table_alias}.is_required",
        f"{fd_table_alias}.is_primary_key",
        f"{fd_table_alias}.lookup_filter",
        f"{fd_table_alias}.formula_definition"
    ]

    try:
        query, params = (
            QueryBuilder(fd_table_name, select_fields)
            .begin_filter()
                .add_if(is_active, f"{fd_table_alias}.is_active", QueryBuilderComparisonOperator.EQUAL, is_active)
                .add_if(is_visible, f"{fd_table_alias}.is_visible", QueryBuilderComparisonOperator.EQUAL, is_visible)
                .add_tuple_in(
                    [f"{fd_table_alias}.object_name", f"{fd_table_alias}.record_type_name"],
                    list_params
                )
                .add_if(field_name, f"{fd_table_alias}.field_name", QueryBuilderComparisonOperator.EQUAL, field_name)
            .end_filter()
            .get_query()
        )
        cursor.execute(query, params)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)

    result = {}
    for row in cursor.fetchall():
        key = make_table_key_from_row(row)
        result.setdefault(key, []).append(row)

    return result

def get_fields_definition_by_object_names(cursor, object_names: list[str], is_active: int = 1, record_type_name: str | None = None) -> list[dict]:
    """
        Retrieve field definitions for a list of object names.

        A field is a single physical column, but field_definition holds one row per record type, so without record_type_name the same column comes back once per record type: 
        it is up to the caller to collapse those rows. 
        Pass MASTER_RECORD_TYPE to get one row per column instead, the master being the baseline definition of the object.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            object_names (list[str]): List of object names to retrieve field definitions for.
            is_active (int): If 1, filters only active fields. If 0, returns all fields regardless of active status. Defaults to 1.
            record_type_name (str | None): If provided, restricts results to that record type. Defaults to None (all record types).

        Returns:
            list[dict]: Flat list of field definition rows, each containing object_name,
                record_type_name, field_name, field_type, and reference_object.

        Raises:
            HTTPException 500: On any database error.
    """

    if not object_names:
        return []

    table_name = "field_definition"
    table_alias = QueryBuilder.alias(table_name)
    select_fields = [
        f"{table_alias}.object_name",
        f"{table_alias}.record_type_name",
        f"{table_alias}.field_name",
        f"{table_alias}.field_type",
        f"{table_alias}.reference_object"
    ]
    order_by = [
        f"{table_alias}.field_name ASC"
    ]

    try:
        query, params = (
            QueryBuilder(table_name, select_fields)
            .begin_filter()
                .add(f"{table_alias}.object_name", QueryBuilderComparisonOperator.IN, object_names)
                .add(f"{table_alias}.field_name", QueryBuilderComparisonOperator.NOT_EQUAL, "record_type_name")
                .add_if(record_type_name, f"{table_alias}.record_type_name", QueryBuilderComparisonOperator.EQUAL, record_type_name)
                .add_if(is_active, f"{table_alias}.is_active", QueryBuilderComparisonOperator.EQUAL, is_active)
            .end_filter()
            .order_by(order_by)
            .get_query()
        )
        cursor.execute(query, params)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)

    return cursor.fetchall()

def get_primary_keys_from_multiple_objects(cursor, object_names: list[str]) -> dict[str, str]:
    """
        Return a dictionary mapping each object name to its primary key field.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            object_names (list[str]): List of object names to retrieve primary keys for.

        Returns:
            dict[str, str]: Dictionary where each key is an object name and each value is the corresponding primary key field name.

        Raises:
            HTTPException 500: On any database error.
    """
    if not object_names:
        return {}

    fd_table_name = "field_definition"
    fd_table_alias = QueryBuilder.alias(fd_table_name)
    select_fields = [
        f"{fd_table_alias}.object_name",
        f"{fd_table_alias}.field_name",
    ]

    try:
        query, params = (
            QueryBuilder(fd_table_name, select_fields)
            .begin_filter()
                .add(f"{fd_table_alias}.is_active", QueryBuilderComparisonOperator.EQUAL, 1)
                .add(f"{fd_table_alias}.is_primary_key", QueryBuilderComparisonOperator.EQUAL, 1)
                .add(f"{fd_table_alias}.object_name", QueryBuilderComparisonOperator.IN, object_names)
            .end_filter()
            .get_query()
        )
        cursor.execute(query, params)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)

    return { row[SystemFieldName_FD.OBJECT_NAME]: row[SystemFieldName_FD.FIELD_NAME] for row in cursor.fetchall() }

def get_related_list_definition_fields(cursor, table_name: str, record_type_name: str) -> list[dict]:
    """
        Return all active related list definitions for a specific object and record type.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            table_name (str): Name of the object (database table).
            record_type_name (str): Name of the record type.

        Returns:
            list[dict]: A list of dictionaries, each containing related list metadata ordered by sort_order.

        Raises:
            HTTPException 500: On any database error.
    """

    rld_table_name = "related_list_definition"
    rld_table_alias = QueryBuilder.alias(rld_table_name)
    select_fields = [
        f"{rld_table_alias}.master_object_name",
        f"{rld_table_alias}.master_record_type_name",
        f"{rld_table_alias}.child_object_name",
        f"{rld_table_alias}.child_record_type_name",
        f"{rld_table_alias}.child_primary_key",
        f"{rld_table_alias}.child_join_key",
        f"{rld_table_alias}.label",
        f"{rld_table_alias}.sort_order",
        f"{rld_table_alias}.filter_condition",
        f"{rld_table_alias}.is_active"
    ]
    order_by = [
        f"{rld_table_alias}.sort_order ASC"
    ]

    try:
        query, params = (
            QueryBuilder(rld_table_name, select_fields)
            .begin_filter()
                .add(f"{rld_table_alias}.master_object_name", QueryBuilderComparisonOperator.EQUAL, table_name)
                .add(f"{rld_table_alias}.master_record_type_name", QueryBuilderComparisonOperator.EQUAL, record_type_name)
                .add(f"{rld_table_alias}.is_active", QueryBuilderComparisonOperator.EQUAL, 1)
            .end_filter()
            .order_by(order_by)
            .get_query()
        )
        cursor.execute(query, params)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)

    return cursor.fetchall()

def get_trigger_definition(cursor, object_name: str, timing: TriggerDefTiming, event: TriggerDefEvent) -> list[dict]:
    """
        Returns active trigger definitions matching the given object, timing, and event.

        Args:
            cursor: DB cursor
            object_name (str): Name of the CRM object
            timing (TriggerDefTiming): Trigger timing
            event (TriggerDefEvent): Trigger event

        Returns:
            list[dict]: Matching rows from trigger_definition
    """
    table_name = "trigger_definition"
    table_alias = QueryBuilder.alias(table_name)
    select_fields = [
        f"{table_alias}.object_name",
        f"{table_alias}.trigger_timing",
        f"{table_alias}.trigger_event",
        f"{table_alias}.is_active"
    ]

    try:
        query, params = (
            QueryBuilder(table_name, select_fields)
            .begin_filter()
                .add(f"{table_alias}.object_name", QueryBuilderComparisonOperator.EQUAL, object_name)
                .add(f"{table_alias}.trigger_timing", QueryBuilderComparisonOperator.EQUAL, timing)
                .add(f"{table_alias}.trigger_event", QueryBuilderComparisonOperator.EQUAL, event)
                .add(f"{table_alias}.is_active", QueryBuilderComparisonOperator.EQUAL, 1)
            .end_filter()
            .get_query()
        )
        cursor.execute(query, params)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)

    return cursor.fetchall()

def get_rollup_definitions_by_detail_object(cursor, table_name: str) -> list[dict]:
    """
        Returns all active rollup definitions where the given table is the detail (child) object.
        Joins rollup_definition with field_definition to filter out inactive master fields.

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query.
            table_name (str): Name of the detail object table to filter by.

        Returns:
            list[dict]: Rows with master_object_name, master_record_type_name, and detail_join_key.
    """
    rd_table_name = "rollup_definition"
    rd_table_alias = QueryBuilder.alias(rd_table_name)

    fd_table_name = "field_definition"
    fd_table_alias = QueryBuilder.alias(fd_table_name)
    select_fields = [
        f"{rd_table_alias}.master_object_name",
        f"{rd_table_alias}.master_record_type_name",
        f"{rd_table_alias}.detail_join_key",
    ]
    join_conditions = [
        (f"{rd_table_alias}.master_field_name", f"{fd_table_alias}.field_name"),
        (f"{rd_table_alias}.master_object_name", f"{fd_table_alias}.object_name"),
        (f"{rd_table_alias}.master_record_type_name", f"{fd_table_alias}.record_type_name"),
    ]

    try:
        query, params = (
            QueryBuilder(rd_table_name, select_fields)
            .add_join(QueryBuilderJoinType.INNER, fd_table_name, join_conditions)
            .begin_filter()
                .add(f"{rd_table_alias}.detail_object_name", QueryBuilderComparisonOperator.EQUAL, table_name)
                .add(f"{fd_table_alias}.is_active", QueryBuilderComparisonOperator.EQUAL, 1)
            .end_filter()
            .get_query()
        )
        cursor.execute(query, params)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)

    return cursor.fetchall()

def get_fields_referencing_object(cursor, table_name:str) -> list[dict]:
    """
        Retrieve the lookup/picklist fields of other objects that reference the given object.

        Used as a pre-check before deleting an object: the object cannot be dropped while a
        foreign key from another object's lookup/picklist still points to it. Self-references
        are excluded, since dropping the table also removes its own constraints.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            table_name (str): Name of the referenced object to find incoming references to.

        Returns:
            list[dict]: One row per referencing field (object_name, field_name and related metadata).
                Empty when no other object references the given one.

        Raises:
            HTTPException 500: On any database error.
    """

    fd_table_name = "field_definition"
    fd_table_alias = QueryBuilder.alias(fd_table_name)
    select_fields = [
        f"{fd_table_alias}.object_name",
        f"{fd_table_alias}.record_type_name",
        f"{fd_table_alias}.field_name",
    ]

    try:
        query, params = (
            QueryBuilder(fd_table_name, select_fields)
            .begin_filter()
                .add(f"{fd_table_alias}.reference_object", QueryBuilderComparisonOperator.EQUAL, table_name)
                .add(f"{fd_table_alias}.object_name", QueryBuilderComparisonOperator.NOT_EQUAL, table_name)
                .add(f"{fd_table_alias}.field_type", QueryBuilderComparisonOperator.IN, [FieldTypes.LOOKUP.value, FieldTypes.PICKLIST.value])
            .end_filter()
            .get_query()
        )
        cursor.execute(query, params)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)

    return cursor.fetchall()

########## START    - Core SystemObjects queries -> Filtred by field Type ##########
# Same pattern as above, but methods receive fields already pre-filtered by type (rollup, radio, etc.).

def get_radio_options(cursor, fields: list[dict]) -> dict[str, list[dict]]:
    """
        Retrieve all option entries for fields of type checkbox and radio.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            fields (list[dict]): List of dictionaries containing field metadata (already filtered by type).

        Returns:
            dict[str, list[dict]]: A dictionary mapping each radio field key to its available options.

        Raises:
            HTTPException 500: On any database error.
    """

    if not fields:
        return {}

    rco_table_name = "radio_checkbox_options"
    rco_table_alias = QueryBuilder.alias(rco_table_name)
    select_fields = [
        f"{rco_table_alias}.object_name",
        f"{rco_table_alias}.record_type_name",
        f"{rco_table_alias}.field_name",
        f"{rco_table_alias}.option_label",
        f"{rco_table_alias}.option_key"
    ]
    order_by = [
        f"{rco_table_alias}.sort_order ASC"
    ]

    try:
        raw_filters = []
        raw_params = []
        for row in fields:
            raw_filter = f"{rco_table_alias}.is_active = %s AND {rco_table_alias}.object_name = %s AND {rco_table_alias}.record_type_name = %s AND {rco_table_alias}.field_name = %s"
            if row[SystemFieldName_FD.LOOKUP_FILTER]:
                raw_filter += f" AND {row[SystemFieldName_FD.LOOKUP_FILTER]}"

            raw_filters.append(f"({raw_filter})")
            raw_params.extend([1, row[SystemFieldName_FD.OBJECT_NAME], row[SystemFieldName_FD.RECORD_TYPE_NAME], row[SystemFieldName_FD.FIELD_NAME]])

        query, params = (
            QueryBuilder(rco_table_name, select_fields, QueryBuilderLogicalOperator.OR)
            .begin_filter()
                .add_raw(raw_filters, raw_params)
            .end_filter()
            .order_by(order_by)
            .get_query()
        )
        cursor.execute(query, params)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)

    result = {}
    for row in cursor.fetchall():
        key = make_options_key_from_row(row)
        result.setdefault(key, []).append(row)

    return result

def get_rollup_definition(cursor, fields: list[dict]) -> dict[str, dict]:
    """
        Retrieve all rollup definitions for the given fields.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            fields (list[dict]): List of field metadata dictionaries (already filtered by rollup type).

        Returns:
            dict[str, dict]: A dictionary mapping each rollup key to its rollup definition row.

        Raises:
            HTTPException 500: On any database error.
    """

    if not fields:
        return {}

    master_object_names = []
    master_record_type_names = []
    master_field_names = []
    detail_object_names = []
    for row in fields:
        master_object_names.append(row[SystemFieldName_FD.OBJECT_NAME])
        master_record_type_names.append(row[SystemFieldName_FD.RECORD_TYPE_NAME])
        master_field_names.append(row[SystemFieldName_FD.FIELD_NAME])
        detail_object_names.append(row[SystemFieldName_FD.REFERENCE_OBJECT])

    table_name = "rollup_definition"
    table_alias = QueryBuilder.alias(table_name)
    select_fields = [
        f"{table_alias}.master_object_name",
        f"{table_alias}.master_record_type_name",
        f"{table_alias}.master_primary_key",
        f"{table_alias}.master_field_name",
        f"{table_alias}.detail_object_name",
        f"{table_alias}.detail_join_key",
        f"{table_alias}.detail_field_name",
        f"{table_alias}.aggregation_function",
        f"{table_alias}.filter_condition"
    ]

    try:
        query, params = (
            QueryBuilder(table_name, select_fields)
            .begin_filter()
                .add(f"{table_alias}.master_object_name", QueryBuilderComparisonOperator.IN, master_object_names)
                .add(f"{table_alias}.master_record_type_name", QueryBuilderComparisonOperator.IN, master_record_type_names)
                .add(f"{table_alias}.master_field_name", QueryBuilderComparisonOperator.IN, master_field_names)
                .add(f"{table_alias}.detail_object_name", QueryBuilderComparisonOperator.IN, detail_object_names)
            .end_filter()
            .get_query()
        )
        cursor.execute(query, params)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)

    return { make_rollup_key_from_row(row): row for row in cursor.fetchall() }

def get_rollup_definition_by_master_field(cursor, master_field_name: str):
    table_name = "rollup_definition"
    table_alias = QueryBuilder.alias(table_name)
    select_fields = [
        f"{table_alias}.master_object_name",
        f"{table_alias}.master_record_type_name",
        f"{table_alias}.master_primary_key",
        f"{table_alias}.master_field_name",
        f"{table_alias}.detail_object_name",
        f"{table_alias}.detail_join_key",
        f"{table_alias}.detail_field_name",
        f"{table_alias}.aggregation_function",
        f"{table_alias}.filter_condition"
    ]

    try:
        query, params = (
            QueryBuilder(table_name, select_fields)
            .begin_filter()
                .add(f"{table_alias}.master_field_name", QueryBuilderComparisonOperator.EQUAL, master_field_name)
            .end_filter()
            .get_query()
        )
        cursor.execute(query, params)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)

    return cursor.fetchall()

def get_picklist_lookup_options(cursor, fields: list[dict], map_object_primary_key_names: dict[str, str]) -> dict[str, list[dict]]:
    """
        Retrieve all option entries for fields of type picklist and lookup.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            fields (list[dict]): List of field metadata dictionaries (already filtered by type).
            map_object_primary_key_names (dict[str, str]): Maps each object name to its primary key field name.

        Returns:
            dict[str, list[dict]]: A dictionary mapping each picklist/lookup field key to its available options.

        Raises:
            HTTPException 500: On any database error.
    """
    result = {}
    for row in fields:
        key = make_options_key_from_row(row)

        table_name = row[SystemFieldName_FD.REFERENCE_OBJECT]
        table_alias = QueryBuilder.alias(table_name)
        select_fields = [
            f"{table_alias}.{row[SystemFieldName_FD.REFERENCE_FIELD]} reference_field",
            f"{table_alias}.{map_object_primary_key_names.get(table_name)} id"
        ]

        try:
            qb = QueryBuilder(table_name, select_fields)
            if row[SystemFieldName_FD.LOOKUP_FILTER]:
                qb = qb.begin_filter().add_raw([row[SystemFieldName_FD.LOOKUP_FILTER]]).end_filter()

            query, params = (qb.get_query())
            cursor.execute(query, params)
        except Exception as e:
            raise_server_exception(logger, "DB query failed", query=query)

        result[key] = cursor.fetchall()

    return result

########## END      - Core SystemObjects queries -> Filtred by field Type ##########
########## END      - Core SystemObjects queries ##########



########## START - Auth ##########
# Authentication queries: user record retrieval.

def get_user_definition_record(cursor, email: str | None = None, user_id: str | None = None) -> dict | None:
    """
        Retrieve an active user record joined with its profile, looked up by email or id.
        Exactly one of `email` or `user_id` must be provided; passing both is allowed and
        applies an AND filter (consistency check). The query always filters is_active = 1,
        so a disabled user returns None even if the identifier matches.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            email (str | None): The user's email address. Defaults to None.
            user_id (str | None): The user's primary key id. Defaults to None.

        Returns:
            dict | None: The user row including profile_name, or None if not found
                or the user is inactive.

        Raises:
            HTTPException 500: If both `email` and `user_id` are None/empty, or on any
                database error.
    """
    if not email and not user_id:
        raise_server_exception(logger, "Missing both email and id")


    ud_table_name = "user_definition"
    ud_table_alias = QueryBuilder.alias(ud_table_name)

    upd_table_name = "user_profile_definition"
    upd_table_alias = QueryBuilder.alias(upd_table_name)
    select_fields = [
        f"{ud_table_alias}.id",
        f"{ud_table_alias}.email",
        f"{ud_table_alias}.password",
        f"{upd_table_alias}.profile_name"
    ]
    join_conditions = [
        (f"{upd_table_alias}.id", f"{ud_table_alias}.profile_id")
    ]

    try:
        query, params = (
            QueryBuilder(ud_table_name, select_fields)
            .add_join(QueryBuilderJoinType.INNER, upd_table_name, join_conditions)
            .begin_filter()
                .add_if(email, f"{ud_table_alias}.email", QueryBuilderComparisonOperator.EQUAL, email)
                .add_if(user_id, f"{ud_table_alias}.id", QueryBuilderComparisonOperator.EQUAL, user_id)
                .add(f"{ud_table_alias}.is_active", QueryBuilderComparisonOperator.EQUAL, 1)
            .end_filter()
            .get_query()
        )
        cursor.execute(query, params)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)

    return cursor.fetchone()

def get_user_definition_record_by_token(cursor, token: str) -> dict:
    """
        Resolve a session token to its owner user, validating the session in the same query.
        Joins user_session -> user_definition -> user_profile_definition and returns only the user's display fields. 
        The lookup filters on a matching token AND a non-expired session (expires_at > now).

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            token (str): The opaque session token to resolve.

        Returns:
            dict: The user row (id, email, profile_name) when a valid, non-expired session matches the token

        Raises:
            HTTPException 500: On any database error.
    """
    us_table_name = "user_session"
    us_table_alias = QueryBuilder.alias(us_table_name)

    ud_table_name = "user_definition"
    ud_table_alias = QueryBuilder.alias(ud_table_name)

    upd_table_name = "user_profile_definition"
    upd_table_alias = QueryBuilder.alias(upd_table_name)
    select_fields = [
        f"{ud_table_alias}.id",
        f"{ud_table_alias}.email",
        f"{upd_table_alias}.profile_name"
    ]
    join_conditions_ud = [
        (f"{ud_table_alias}.id", f"{us_table_alias}.user_id"),
    ]
    join_conditions_upd = [
        (f"{upd_table_alias}.id", f"{ud_table_alias}.profile_id")
    ]

    try:
        query, params = (
            QueryBuilder(us_table_name, select_fields)
            .add_join(QueryBuilderJoinType.INNER, ud_table_name, join_conditions_ud)
            .add_join(QueryBuilderJoinType.INNER, upd_table_name, join_conditions_upd)
            .begin_filter()
                .add(f"{us_table_alias}.token", QueryBuilderComparisonOperator.EQUAL, token)
                .add(f"{us_table_alias}.expires_at", QueryBuilderComparisonOperator.GREATER_THAN, datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
            .end_filter()
            .get_query()
        )
        cursor.execute(query, params)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)

    return cursor.fetchone()


########## END - Auth ##########



########## START - Record Queries ##########
# Queries that fetch rows from object tables (not system tables).

def get_single_record(cursor, table_name: str, fields: list[dict], raw_filters: list[str], raw_params: list) -> dict:
    """
        Return a single CRM object record matching the given filter conditions.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            table_name (str): Name of the CRM object table to query.
            fields (list[dict]): Field metadata used to build the SELECT clause.
            raw_filters (list[str]): Raw SQL condition strings for the WHERE clause.
            raw_params (list): Bound parameters corresponding to raw_filters.

        Returns:
            dict: The matching record.

        Raises:
            HTTPException 404: If no record matches the given filters.
            HTTPException 500: On any database error.
    """

    table_alias = QueryBuilder.alias(table_name)
    select_fields = [ f"{table_alias}.{row[SystemFieldName_FD.FIELD_NAME]}" for row in fields ]

    try:
        query, params = (
            QueryBuilder(table_name, select_fields)
            .begin_filter()
                .add_raw(raw_filters, raw_params)
            .end_filter()
            .get_query()
        )
        cursor.execute(query, params)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)

    record = cursor.fetchone()
    if not record:
        raise_input_exception(404, "INPUT_RECORD_ID_NOT_FOUND", kind=ExceptionKind.BUSINESS_SHARED)
    
    return record

def get_records_from_table(cursor, table_name: str, record_type_name: str, fields: list[dict]) -> list[dict]:
    """
        Fetch all records from a table, building the SELECT clause from field metadata.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries
            table_name (str): Name of the database table to query
            fields (list[dict]): List of field metadata dictionaries from 'get_list_view_definition_fields()'

        Returns:
            list[dict]: Query results as a list of row dictionaries
    """
    (select_fields, joins) = calculate_query_clause(cursor, table_name, fields)

    try:
        table_alias = QueryBuilder.alias(table_name)
        order_by = [
            f"{table_alias}.{StandardObjectField.CREATE_DATE} DESC"
        ]

        qb = QueryBuilder(table_name, select_fields)
        for (join_type, join_table, join_conditions, alias) in joins:
            qb.add_join(join_type, join_table, join_conditions, alias)
        
        query, params = (qb
            .begin_filter()
                .add(f"{table_alias}.{StandardObjectField.RECORD_TYPE_NAME}", QueryBuilderComparisonOperator.EQUAL, record_type_name)
            .end_filter()
            .order_by(order_by)
            .get_query()
        )
        cursor.execute(query, params)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)

    return cursor.fetchall()

########## END - Record Queries ##########



########## START - Data Helpers ##########
# Utility functions

def get_field_divided_by_type(fields: list[dict]) -> FieldsByType:
    """Group fields by their type into a typed structure."""

    result = FieldsByType()
    for row in fields:
        field_type = row[SystemFieldName_FD.FIELD_TYPE]
        if field_type == FieldTypes.RADIO.value:
            result.radio_fields.append(row)
        elif field_type in (FieldTypes.PICKLIST.value, FieldTypes.LOOKUP.value):
            result.picklist_lookup_fields.append(row)
        elif field_type == FieldTypes.ROLLUP.value:
            result.rollup_fields.append(row)
        elif field_type == FieldTypes.FORMULA.value:
            result.formula_fields.append(row)

    return result

def get_primary_key_from_fields(fields: list[dict]) -> str:

    pk = next((row[SystemFieldName_FD.FIELD_NAME] for row in fields if row[SystemFieldName_FD.IS_PRIMARY_KEY]), None)
    if not pk:
        raise_server_exception(logger, "No primary_key found")

    return pk

def group_object_definition_by_category(tables: list[dict]) -> dict[str, list]:
    """
        Organizes object definition records into a hierarchical structure grouped by category.

        Args:
            tables (list[dict]): Records from get_object_definition_records_join_rt().

        Returns:
            dict[str, list]: Keys are capitalized category names. Each value is a list of
                discriminated entries, each tagged with a "type" field:
                - Leaf (single-record-type object or a record type of a group):
                  {"type": "leaf", ...object definition fields}.
                - Group (multi-record-type object):
                  {"type": "group", "label": object_name, "children": [leaf, ...]}.
    """

    # Groups object definitions by object name
    map_object_RT = {}
    for table in tables:
        obj_name = table[SystemFieldName_OD.OBJECT_NAME].capitalize()
        map_object_RT.setdefault(obj_name, []).append({"type": "leaf", **table})

    processed_objects = set()
    grouped_structure = {}
    for table in tables:
        cat = table[SystemFieldName_OD.CATEGORY].capitalize()
        obj_name = table[SystemFieldName_OD.OBJECT_NAME].capitalize()
        is_single_rt = table[SystemFieldName_OD.IS_SINGLE_RECORD_TYPE]

        grouped_structure.setdefault(cat, [])
        if obj_name not in processed_objects:
            if is_single_rt:
                grouped_structure[cat].extend(map_object_RT[obj_name])
            else:
                grouped_structure[cat].append({"type": "group", "label": obj_name, "children": map_object_RT[obj_name]})

            processed_objects.add(obj_name)

    return grouped_structure

def get_fields_with_label(fields: list[dict] | list[str]) -> list[dict]:
    """
        Converts a list of fields into label-ready dicts with key, label, and field_type.

        Args:
            fields (list[dict] | list[str]): Field records

        Returns:
            list[dict]: Each dict contains 'key' (field name), 'label' (human-readable), and 'field_type' (or None).
    """
    
    new_fields = []
    for field in fields:
        field_name = field[SystemFieldName_FD.FIELD_NAME]
        field_type = field[SystemFieldName_FD.FIELD_TYPE]
        new_fields.append({
            "key": field_name,
            "label": field_name.replace("_", " "),
            "field_type": field_type
        })

    return new_fields

def calculate_query_clause(cursor, table_name: str, fields: list[dict], map_object_primary_key_names: dict | None = None) -> tuple[list[str], list[str]]:
    """
        Build the SELECT field expressions and JOIN clauses from field metadata.

        radio / picklist / lookup fields produce a JOIN to resolve the stored key into a label;
        every other field (checkbox, rollup, plain types) is selected directly from the main table.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries
            table_name (str): Name of the database table
            fields (list[dict]): List of field metadata dictionaries from 'get_list_view_definition_fields()'
            map_object_primary_key_names (dict | None): Map of object name to primary key field name;
                fetched automatically if not provided

        Returns:
            tuple[list[str], list[str]]: A 2-element tuple containing:
                - list[str]: SELECT field expressions
                - list[str]: JOIN clauses in QueryBuilder format (each a 4-tuple with its field-scoped alias)
    """

    ########### START - PREPROCESS
    # Preprocess all the fields, divide them into category based on type. 
    # Return a dictionary with: radio_fields, picklist_lookup_fields, rollup_fields, formula_fields
    map_field_by_type = get_field_divided_by_type(fields)

    # Preprocess all the lookup/picklist to get the primaryKey of the referenced object
    if map_object_primary_key_names is None:
        map_object_primary_key_names = get_primary_keys_from_multiple_objects(
            cursor,
            [ row[SystemFieldName_FD.REFERENCE_OBJECT] for row in map_field_by_type.picklist_lookup_fields ]
        )

    # Preprocess all the rollup definitions
    map_record_info_rollup_record = get_rollup_definition(cursor, map_field_by_type.rollup_fields)
    ########### END - PREPROCESS

    select_fields = []
    joins = []
    table_name_alias = QueryBuilder.alias(table_name)

    # For each field, build the SELECT expression based on its type.
    # radio / picklist / lookup join another table to resolve the stored key into a human-readable label.
    # Every other field (checkbox, rollup, plain types) is selected directly from the main table as its raw stored value.
    for row in fields:
        field_type = row[SystemFieldName_FD.FIELD_TYPE]
        if field_type == FieldTypes.RADIO.value:
            # Join the shared radio_checkbox_options table to resolve the stored key into a human-readable label
            (select_clause, join_clause) = QueryBuilder.build_join_clause(
                table_name,
                row[SystemFieldName_FD.FIELD_NAME],
                "radio_checkbox_options",
                "option_key",
                "option_label"
            )
            select_fields.append(select_clause)
            joins.append(join_clause)
        elif field_type in (FieldTypes.PICKLIST.value, FieldTypes.LOOKUP.value):
            # Join the referenced object table to resolve the stored foreign key into the display field
            join_table_name = row[SystemFieldName_FD.REFERENCE_OBJECT]
            pk_field_name = map_object_primary_key_names.get(row[SystemFieldName_FD.REFERENCE_OBJECT])

            (select_clause, join_clause) = QueryBuilder.build_join_clause(
                table_name,
                row[SystemFieldName_FD.FIELD_NAME],
                join_table_name,
                pk_field_name,
                row[SystemFieldName_FD.REFERENCE_FIELD]
            )
            select_fields.append(select_clause)
            joins.append(join_clause)
        else:
            # Plain field: select directly from the main table
            select_fields.append(f"{table_name_alias}.{row[SystemFieldName_FD.FIELD_NAME]}")

    return (select_fields, joins)

def get_next_sort_order(cursor, sys_object_name: str, raw_filters: list[str], raw_params: list) -> int:

    table_alias = QueryBuilder.alias(sys_object_name)
    select_fields = [ f"MAX({table_alias}.sort_order) sort_order" ]

    try:
        query, params = (
            QueryBuilder(sys_object_name, select_fields)
            .begin_filter()
                .add_raw(raw_filters, raw_params)
            .end_filter()
            .get_query()
        )
        cursor.execute(query, params)
        sort_order = cursor.fetchone()["sort_order"]
        return int(sort_order)+1 if sort_order else 1
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)

    

########## END - Data Helpers ##########



def get_lookup_field_definition(cursor, table_name: str, raw_filters: list[str], raw_params: list) -> list[dict]:

    table_alias = QueryBuilder.alias(table_name)
    select_fields = [ f"{table_alias}.field_name" ]

    try:
        query, params = (
            QueryBuilder(table_name, select_fields)
            .begin_filter()
                .add_raw(raw_filters, raw_params)
            .end_filter()
            .get_query()
        )
        cursor.execute(query, params)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query)

    return cursor.fetchall()