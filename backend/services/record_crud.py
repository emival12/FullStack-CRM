from __future__ import annotations
import sys
import logging
from mysql.connector import errorcode, IntegrityError
from core.exceptions import raise_server_exception, raise_input_exception, ExceptionKind
from core.models import StandardObjectField, SystemFieldName_FD, SystemFieldName_RLD, FieldTypes, FieldStructureMode, SystemObjects
from db.query_builder import (
    QueryBuilder,
    QueryBuilderComparisonOperator,
    build_insert_query,
    build_update_query,
    build_delete_query
)
from db.db_queries import (
    make_table_key_from_row,
    make_options_key_from_row,
    get_field_divided_by_type,
    get_primary_keys_from_multiple_objects,
    get_picklist_lookup_options,
    get_radio_options,
    get_primary_key_from_fields,
    get_single_record,
    get_object_definition_records_join_rt,
    get_fields_definition,
    get_list_view_definition_fields,
    get_fields_with_label,
    calculate_query_clause
)

logger = logging.getLogger(__name__) 

########## START - Read record structure ##########
def get_field_structure(
    cursor, 
    table_name: str, 
    fields: list[dict], 
    mode: FieldStructureMode = FieldStructureMode.STRUCTURE_ONLY, 
    record_id: str | None = None
) -> dict[str, dict]:
    """
        Build the field structure for a given set of fields, enriched with type-specific metadata needed by the frontend to render inputs. 
        Optionally attaches the current DB values when editing an existing record

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            table_name (str): Name of the database table.
            fields (list[dict]): List of field metadata dictionaries.
            mode (FieldStructureMode): 
                STRUCTURE_ONLY to build an empty form;
                STRUCTURE_AND_DATA to also fetch and attach the current record values;
            record_id (str | None): Primary key value of the record to retrieve (Mandatory when mode is STRUCTURE_AND_DATA)

        Returns:
            dict[str, dict]: A mapping of field names (capitalized) to enriched field metadata dictionaries

        Raises:
            HTTPException 500: If mode is STRUCTURE_AND_DATA and record_id is not provided
    """

    ########### START - PREPROCESS
    # Preprocess all the fields, divide them into category based on type. 
    # Return a dictionary with: radio_fields, picklist_lookup_fields, rollup_fields, formula_fields
    map_field_by_type = get_field_divided_by_type(fields)

    # Preprocess all the lookup/picklist to get the primaryKey of the referenced object
    map_object_primary_key_names = get_primary_keys_from_multiple_objects(
        cursor,
        [ row["reference_object"] for row in map_field_by_type.picklist_lookup_fields ]
    )
    # Preprocess all the lookup/picklist to get the list of available options
    map_picklist_lookup_options = get_picklist_lookup_options(cursor, map_field_by_type.picklist_lookup_fields, map_object_primary_key_names)

    # Preprocess all the radio to get the list of available options
    map_radio_options = get_radio_options(cursor, map_field_by_type.radio_fields)
    ########### END - PREPROCESS


    if mode == FieldStructureMode.STRUCTURE_AND_DATA:
        if not record_id:
            raise_server_exception(logger, "No record Id")

        # Retrieve the record on the DB
        primary_key_field = get_primary_key_from_fields(fields)
        table_alias = QueryBuilder.alias(table_name)
        raw_filters = [f"{table_alias}.{primary_key_field} = %s"]
        raw_params  = [record_id]
        record = get_single_record(cursor, table_name, fields, raw_filters, raw_params)


    # Build the field structure: for each field, copy its metadata and enrich it with type-specific attributes needed by the frontend to render the input correctly
    field_structure = {}
    for row in fields:
        copy_row = row.copy()

        field_type = row[SystemFieldName_FD.FIELD_TYPE]
        if field_type == FieldTypes.NUMBER.value:
            # Derive the max/min allowed value from precision and scale (e.g. precision=7, scale=2 → "99999.99")
            # The frontend uses these bounds for input validation.
            int_part = row[SystemFieldName_FD.NUMERIC_PRECISION]
            dec_part = row[SystemFieldName_FD.NUMERIC_SCALE] or 0

            text_int_part = "9" * (int_part - dec_part)
            text_dec_part = "9" * dec_part
            limit_value = f"{text_int_part}.{text_dec_part}" if dec_part else text_int_part

            copy_row["max_limit_value"] = limit_value
            copy_row["min_limit_value"] = f"-{limit_value}"
        elif field_type == FieldTypes.RADIO.value:
            # Add the empty option to allow the user to deselect the current value
            # The empty option must carry the field identity so the frontend can match it correctly
            options = [
                {
                    "object_name": row[SystemFieldName_FD.OBJECT_NAME],
                    "record_type_name": row[SystemFieldName_FD.RECORD_TYPE_NAME],
                    "field_name": row[SystemFieldName_FD.FIELD_NAME],
                    "option_label": "",
                    "option_key": ""
                }
            ]

            options.extend(map_radio_options.get(make_options_key_from_row(row), []))
            copy_row["options"] = options
        elif field_type in (FieldTypes.PICKLIST.value, FieldTypes.LOOKUP.value):
            # Add the options to allow the user to select a value
            copy_row["options"] = map_picklist_lookup_options.get(make_options_key_from_row(row), [])

        if mode == FieldStructureMode.STRUCTURE_AND_DATA:
            # Attach the current DB value so the frontend can pre-fill the field when editing an existing record
            copy_row["value"] = record[row[SystemFieldName_FD.FIELD_NAME]]

        field_structure[row[SystemFieldName_FD.FIELD_NAME].capitalize()] = copy_row

    return field_structure


def get_related_list_records(cursor, table_name: str, record_id: str, related_lists: list[dict]) -> list[dict]:
    """
        Retrieve data and structure for all related lists of a specific table and record.

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query.
            table_name (str): Name of the parent object whose related lists are being retrieved.
            record_id (str): Primary key value of the parent record to filter child records by.
            related_lists (list[dict]): List of related_list_definition rows for this object.

        Returns:
            list[dict]: A list of dictionaries, each representing one related list with its
                label, table metadata, field definitions, primary key name, and matching records.
    """

    child_object_names = []         # List of child_object_name use to retrieve the respective object_definition record
    params_tables = []              # Pairs (child_object_name, child_record_types) use to retrieve the fields
    for rl in related_lists:
        child_object_names.append(rl[SystemFieldName_RLD.CHILD_OBJECT_NAME])
        params_tables.append((rl[SystemFieldName_RLD.CHILD_OBJECT_NAME], rl[SystemFieldName_RLD.CHILD_RECORD_TYPE_NAME]))

    # Retrieve information about the objects
    tables = get_object_definition_records_join_rt(cursor, child_object_names)
    tables_dict = {table["key"]: table for table in tables}

    # Retrieve all the fields for each (object_name, record_type_name) pairs of the child objects
    # Retrieve both: all the fields AND only the visible fields
    dict_all_fields = get_fields_definition(cursor, params_tables)
    dict_layout_fields = get_list_view_definition_fields(cursor, params_tables)


    # Calculate the list of all the needed objects and precalculate a map of {object_name: primary_key_field_name}
    list_object = [table_name]
    for rl in related_lists:
        fields = dict_all_fields.get(make_table_key_from_row(rl, SystemFieldName_RLD.CHILD_OBJECT_NAME, SystemFieldName_RLD.CHILD_RECORD_TYPE_NAME), [])
        for row in fields:
            if row[SystemFieldName_FD.FIELD_TYPE] in (FieldTypes.PICKLIST.value, FieldTypes.LOOKUP.value):
                list_object.append(row[SystemFieldName_FD.REFERENCE_OBJECT])
    map_object_primary_key_names = get_primary_keys_from_multiple_objects(cursor, list_object)


    # Build and execute a query for each related list
    rel_lists = []
    for related_list in related_lists:
        child_table_name = related_list[SystemFieldName_RLD.CHILD_OBJECT_NAME]
        child_record_type_name = related_list[SystemFieldName_RLD.CHILD_RECORD_TYPE_NAME]
        table_key = make_table_key_from_row(related_list, SystemFieldName_RLD.CHILD_OBJECT_NAME, SystemFieldName_RLD.CHILD_RECORD_TYPE_NAME)

        # Calculate the join clause based on all the fields of the object
        all_fields = dict_all_fields.get(table_key, [])
        (_, joins) = calculate_query_clause(cursor, child_table_name, all_fields, map_object_primary_key_names)

        # Calculate the select clause based only on the fields in the layout of the object
        layout_fields = dict_layout_fields.get(table_key, [])
        (select_fields, _) = calculate_query_clause(cursor, child_table_name, layout_fields, map_object_primary_key_names)

        # Retrieve the related records
        try:
            child_table_alias = QueryBuilder.alias(child_table_name)
            order_by = [
                f"{child_table_alias}.{StandardObjectField.CREATE_DATE} DESC"
            ]

            qb = QueryBuilder(child_table_name, select_fields)
            for (join_type, join_table, join_conditions, alias) in joins:
                qb.add_join(join_type, join_table, join_conditions, alias)
            
            query, params = (qb
                .begin_filter()
                    .add(f"{child_table_alias}.{StandardObjectField.RECORD_TYPE_NAME}", QueryBuilderComparisonOperator.EQUAL, child_record_type_name)
                    .add(f"{child_table_alias}.{related_list[SystemFieldName_RLD.CHILD_JOIN_KEY]}", QueryBuilderComparisonOperator.EQUAL, record_id)
                .end_filter()
                .order_by(order_by)
                .get_query()
            )
            cursor.execute(query, params)
        except Exception as e:
            raise_server_exception(logger, "DB query failed", query=query)

        related_records = cursor.fetchall()
        rel_lists.append({
            "label": related_list[SystemFieldName_RLD.LABEL].capitalize(),
            "table":  tables_dict.get(table_key),
            "fields": get_fields_with_label(layout_fields),
            "primary_key_name": get_primary_key_from_fields(layout_fields),
            "records": related_records
        })

    return rel_lists

########## END - Read record structure ##########



########## START - Transaction ##########
def get_caller_name() -> str:
    """Return the qualified name (module.function) of the function that called this."""
    frame = sys._getframe(1)
    return f"{frame.f_globals['__name__']}.{frame.f_code.co_name}"

def execute_query(cursor, caller: str, query: str, params: list[tuple] | None = None) -> dict:
    """
        Execute a SQL query with uniform error handling.

        Dispatch by params shape:
            - None or empty: cursor.execute(query)        — parameter-less DDL.
            - single tuple:  cursor.execute(query, p[0])  — single-row DML.
            - multiple:      cursor.executemany(query, p) — batch DML.

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query.
            caller (str): Qualified name of the calling function (e.g. "module.func"), included in the error log for traceability.
            query (str): SQL query string to execute.
            params (list[tuple] | None): Parameter tuples to bind. Omit (or pass an empty list/None) for queries without placeholders.

        Returns:
            dict: Dictionary with key 'result' containing the number of rows affected.

        Raises:
            HTTPException 500: If a database error occurs during execution.
    """
    
    try:
        if not params:
            cursor.execute(query)
        elif len(params) > 1:
            cursor.executemany(query, params)
        else:
            cursor.execute(query, params[0])
            
        return {"result": cursor.rowcount}
    except IntegrityError as err:
        if err.errno == errorcode.ER_DUP_ENTRY:
            raise_input_exception(409, "DUPLICATE_PK", kind=ExceptionKind.BUSINESS_SHARED)
        else:
            raise_server_exception(logger, "DB query failed", query=query, caller=caller)
    except Exception as e:
        raise_server_exception(logger, "DB query failed", query=query, caller=caller)

########## END - Transaction ##########



########## START - Insert ##########
_SYSTEM_OBJECT = frozenset({
    SystemObjects.USER_DEFINITION,
    SystemObjects.USER_PROFILE_DEFINITION,
    SystemObjects.OBJECT_DEFINITION,
    SystemObjects.RECORD_TYPE_DEFINITION,
    SystemObjects.FIELD_DEFINITION,
    SystemObjects.LIST_VIEW_DEFINITION,
    SystemObjects.RECORD_LAYOUT_DEFINITION,
    SystemObjects.RELATED_LIST_DEFINITION,
    SystemObjects.RADIO_CHECKBOX_OPTIONS,
    SystemObjects.AGGREGATION_FUNCTION,
    SystemObjects.ROLLUP_DEFINITION,
})

_AUDIT_DB_MANAGED = frozenset({
    StandardObjectField.LAST_MODIFIED_DATE,
    StandardObjectField.CREATE_DATE,
})

def _apply_audit_fields(record: dict, user_id: str, is_sys_object: bool) -> tuple[list[str], list]:
    """
        Filter DB-managed audit fields from a record and build SQL-binding lists.

        Removes DB-managed audit fields (create_date, last_modified_date) from the
        key list. For non-system objects, also ensures last_modified_by is set to
        user_id. Empty strings and "NULL" values are normalised to None.

        Args:
            record (dict): Raw field dict from the caller (INSERT or UPDATE payload).
            user_id (str): Id of the user performing the action.
            is_sys_object (bool): If True, audit user fields are left untouched.

        Returns:
            tuple[list[str], list]: (keys, params) parallel lists ready for SQL binding.
    """
    keys = [k for k in record if k not in _AUDIT_DB_MANAGED]
    if not is_sys_object and StandardObjectField.LAST_MODIFIED_BY not in keys:
        keys.append(StandardObjectField.LAST_MODIFIED_BY)

    params = []
    for k in keys:
        if not is_sys_object and k == StandardObjectField.LAST_MODIFIED_BY:
            params.append(user_id)
        else:
            v = record.get(k)
            params.append(None if v == "" or v == "NULL" else v)

    return keys, params

def insert_new_record(cursor, table_name: str, record: dict, user_id: str) -> dict:
    """
        Insert a single record into the given table.

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query
            db (MySQLConnection): Database connection object used to commit or rollback changes
            table_name (str): Name of the database table to query
            record (dict): Dictionary representing the record to insert
            user_id (str): Id of the user who is performing the action

        Returns:
            dict: Dictionary containing the number of rows inserted and the new record id

        Raises:
            HTTPException: If a database error occurs during insertion
    """
    
    keys, params = _apply_audit_fields(record, user_id, False)
    query = build_insert_query(table_name, keys)
    return execute_query(cursor, "insert_new_record", query, [tuple(params)])

########## END - Insert ##########



########## START - Update ##########
def update_record_by_id(cursor, table_name: str, record_type_name: str | None, record: dict, primary_key_field: str, record_id: str, user_id: str | None = None) -> dict:
    """
        Update a record from a given table by record type and record id

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query
            db (MySQLConnection): Database connection object used to commit or rollback changes
            table_name (str): Name of the database table to query
            record_type_name (str | None): Record type name of the table
            record (dict): Dictionary with all the field to update {field_name: field_value, ...}
            primary_key_field (str): Name of the table's primary key field
            record_id (str): Primary key value identifying the record to update
            user_id (str | None): Id of the user who is performing the action

        Returns:
            dict: Dictionary containing the number of records updated

        Raises:
            HTTPException: If a database error occurs during update
    """

    keys, value_params = _apply_audit_fields(record, user_id, table_name in _SYSTEM_OBJECT)
    query = build_update_query(table_name, keys, primary_key_field, record_type_name is not None)
    params = value_params + [record_id] + ([record_type_name] if record_type_name else [])
    return execute_query(cursor, "update_record_by_id", query, [tuple(params)])

########## END - Update ##########



########## START - Delete ##########
def delete_record_by_id(cursor, table_name: str, record_type_name: str | None, primary_key_field: str, record_id: str) -> dict:
    """
        Delete a record from a given table by record type and record id

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query
            db (MySQLConnection): Database connection object used to commit or rollback changes
            table_name (str): Name of the database table to query
            record_type_name (str | None): Record type name of the table; if None, no record_type_name filter is applied
            primary_key_field (str): Name of the table's primary key field
            record_id (str): Primary key value identifying the record to delete

        Returns:
            dict: Dictionary containing the number of records deleted

        Raises:
            HTTPException: If a database error occurs during deletion
    """

    where_filter = [f"{primary_key_field} = %s"]
    params = [record_id]

    if record_type_name:
        where_filter.append("record_type_name = %s")
        params += [record_type_name]

    query = build_delete_query(table_name, where_filter)
    return execute_query(cursor, "delete_record_by_id", query, [tuple(params)])

########## END - Delete ##########

