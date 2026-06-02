from __future__ import annotations
import re
import logging
from fastapi import HTTPException
from core.models import SystemObjects, SystemFieldName_OD, SystemFieldName_FD, SystemFieldName_ROLLD, SystemFieldName_RTD, FieldTypes, StandardObjectField, MASTER_RECORD_TYPE
from core.exceptions import raise_input_exception, raise_server_exception, log_event
from db.db_queries import (
    make_table_key,
    make_options_key_from_row,
    get_primary_keys_from_multiple_objects,
    get_object_definition_records,
    get_object_definition_records_join_rt,
    get_radio_options,
    get_primary_key_from_fields,
    get_single_record,
    get_next_sort_order,
    get_record_layout_definition_fields,
    get_fields_definition,
    get_rollup_definition_by_master_field
)

from services.record_crud import get_caller_name, execute_query
from db.query_builder import QueryBuilderLogicalOperator, build_delete_query

logger = logging.getLogger(__name__) 

########## START - Base DML System objects ##########
def insert_object_definition_record(cursor, params: list[tuple]) -> None:
    command = """
    INSERT INTO object_definition(object_label, object_name, category, sort_order, is_system_object, is_single_record_type)
    VALUES (%s, %s, %s, %s, %s, %s);
    """
    execute_query(cursor, get_caller_name(), command, params)

def insert_record_type_definition(cursor, params: list[tuple]) -> None:
    command = """
    INSERT INTO record_type_definition(object_name, record_type_name, is_active)
    VALUES (%s, %s, %s);
    """
    execute_query(cursor, get_caller_name(), command, params)

def insert_field_definition(cursor, params: list[tuple]) -> None:
    command = """
    INSERT INTO field_definition(
        object_name,
        record_type_name,
        field_name,
        field_type,
        length,
        numeric_precision,
        numeric_scale,
        reference_object,
        reference_field,
        is_active,
        is_visible,
        is_editable,
        is_required,
        is_primary_key,
        lookup_filter,
        formula_definition
    )
    VALUES
    (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    """
    execute_query(cursor, get_caller_name(), command, params)

def insert_list_view_definition(cursor, params: list[tuple]) -> None:
    command = """
    INSERT INTO list_view_definition(object_name, record_type_name, field_name, sort_order)
    VALUES (%s, %s, %s, %s);
    """
    execute_query(cursor, get_caller_name(), command, params)

def insert_record_layout_definition(cursor, params: list[tuple]) -> None:
    command = """
    INSERT INTO record_layout_definition(object_name, record_type_name, field_name, sort_order)
    VALUES (%s, %s, %s, %s);
    """
    execute_query(cursor, get_caller_name(), command, params)

def insert_rollup_definition(cursor, params: list[tuple]) -> None:
    command = """
    INSERT INTO rollup_definition (
        master_object_name,
        master_record_type_name,
        master_primary_key,
        master_field_name,
        detail_object_name,
        detail_join_key,
        detail_field_name,
        aggregation_function,
        filter_condition
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
    """
    execute_query(cursor, get_caller_name(), command, params)

def insert_related_list_definition(cursor, params: list[tuple]) -> None:
    command = """
    INSERT INTO related_list_definition (
        master_object_name,
        master_record_type_name,
        master_primary_key,
        child_object_name,
        child_record_type_name,
        child_join_key,
        label,
        sort_order,
        filter_condition,
        is_active
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    """
    execute_query(cursor, get_caller_name(), command, params)

def insert_radio_checkbox_options(cursor, params: list[tuple]) -> None:
    command = """
    INSERT INTO radio_checkbox_options(object_name, record_type_name, field_name, sort_order, option_key, option_label, is_active)
    VALUES (%s, %s, %s, %s, %s, %s, %s);
    """
    execute_query(cursor, get_caller_name(), command, params)

########## END - Base DML System objects ##########



########## START - Field Length Calculations ##########
_SQL_LENGTH_RESOLVERS: dict[str, Callable] = {
    FieldTypes.TEXT.value:      lambda length, **_:                         f'VARCHAR ({length})',
    FieldTypes.RADIO.value:     lambda length, **_:                         f'VARCHAR ({length})',
    FieldTypes.CHECKBOX.value:  lambda length, **_:                         f'VARCHAR ({length})',
    FieldTypes.FORMULA.value:   lambda length, **_:                         f'VARCHAR ({length})',
    FieldTypes.IMG.value:       lambda length, **_:                         f'VARCHAR ({length})',
    FieldTypes.NUMBER.value:    lambda length, **_:                         f'DECIMAL ({length})',
    FieldTypes.ROLLUP.value:    lambda length, **_:                         f'DECIMAL ({length})',
    FieldTypes.DATE.value:      lambda **_:                                 f'DATE',
    FieldTypes.DATE_TIME.value: lambda **_:                                 f'DATETIME',
    FieldTypes.AUTO_NUMBER.value:  lambda **_:                              f'INT AUTO_INCREMENT',
    FieldTypes.LOOKUP.value:    lambda reference_field_type, length, **_:   convert_field_type_into_SQL_type(reference_field_type, length).replace(' AUTO_INCREMENT', ''),
    FieldTypes.PICKLIST.value:  lambda reference_field_type, length, **_:   convert_field_type_into_SQL_type(reference_field_type, length).replace(' AUTO_INCREMENT', ''),
}

def convert_field_type_into_SQL_type(field_type: str, length: str, reference_field_type: str | None = None) -> str:
    resolver = _SQL_LENGTH_RESOLVERS.get(field_type)
    if resolver is None:
        raise_server_exception(logger, "Resolver not identified", field_type=field_type)

    return resolver(field_type=field_type, length=length, reference_field_type=reference_field_type)

_FIELD_LENGTH_RESOLVERS: dict[str, Callable] = {
    FieldTypes.TEXT.value:      lambda length, **_:                      (length, length,                   FieldTypes.TEXT.value),
    FieldTypes.NUMBER.value:    lambda precision, scale, **_:            (None,   f'{precision}, {scale}',  FieldTypes.NUMBER.value),
    FieldTypes.CHECKBOX.value:  lambda **_:                              (1,      1,                        FieldTypes.CHECKBOX.value),
    FieldTypes.RADIO.value:     lambda **_:                              (255,    255,                      FieldTypes.RADIO.value),
    FieldTypes.IMG.value:       lambda **_:                              (255,    255,                      FieldTypes.IMG.value),
    FieldTypes.FORMULA.value:   lambda **_:                              (255,    255,                      FieldTypes.FORMULA.value),
    FieldTypes.DATE.value:      lambda **_:                              (None,   None,                     FieldTypes.DATE.value),
    FieldTypes.DATE_TIME.value: lambda **_:                              (None,   None,                     FieldTypes.DATE_TIME.value),
    FieldTypes.ROLLUP.value:    lambda **_:                              (None,   "16, 2",                  FieldTypes.ROLLUP.value),
    FieldTypes.AUTO_NUMBER.value:  lambda **_:                           (None,   None,                     FieldTypes.AUTO_NUMBER.value),
    FieldTypes.LOOKUP.value:    lambda cursor, reference_object, **_:   _resolve_lookup_length(cursor, reference_object),
    FieldTypes.PICKLIST.value:  lambda cursor, reference_object, **_:   _resolve_lookup_length(cursor, reference_object),
}

def _resolve_lookup_length(cursor, reference_object: str) -> tuple[str | None, str | None, str]:
    """Resolve the logical length, SQL length, and field type of the primary key of reference_object."""
    primary_key_reference_object = get_primary_keys_from_multiple_objects(cursor, [reference_object]).get(reference_object)
    field_def = get_fields_definition(
        cursor,
        [(reference_object, "master")],
        0,
        0,
        primary_key_reference_object
    ).get(make_table_key(reference_object, "master"))
    if not field_def:
        raise_server_exception(logger, "Field not found", object_name=reference_object, field_name=primary_key_reference_object)

    related_field = field_def[0]
    reference_field_type = related_field[SystemFieldName_FD.FIELD_TYPE]
    reference_length = related_field[SystemFieldName_FD.LENGTH]
    reference_precision = related_field[SystemFieldName_FD.NUMERIC_PRECISION]
    reference_scale = related_field[SystemFieldName_FD.NUMERIC_SCALE]
    reference_ref_obj = related_field[SystemFieldName_FD.REFERENCE_OBJECT]
    _, sql_length, _ = get_length_based_on_field_type(cursor, reference_field_type, reference_length, reference_precision, reference_scale, reference_ref_obj)

    return (reference_length, sql_length, reference_field_type)

def get_length_based_on_field_type(
    cursor,
    field_type: str,
    field_length: str | None,
    numeric_precision: str | None,
    numeric_scale: str | None,
    reference_object: str | None
) -> tuple[str | None, str | None, str]:
    """
        Determine the logical and SQL-level length of a field based on its type.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            field_type (str): The field type (see FieldTypes enum).
            field_length (str | None): Character length for text fields; None for other types.
            numeric_precision (str | None): Total digits for numeric fields; None otherwise.
            numeric_scale (str | None): Decimal digits for numeric fields; None otherwise.
            reference_object (str | None): Referenced table name for lookup/picklist; None otherwise.

        Returns:
            tuple[str | None, str | None, str]: (logical_length, sql_length, reference_field_type)
    """

    resolver = _FIELD_LENGTH_RESOLVERS.get(field_type)
    if resolver is None:
        raise_server_exception(logger, "Resolver not identified", field_type=field_type)

    return resolver(cursor=cursor, length=field_length, precision=numeric_precision, scale=numeric_scale, reference_object=reference_object)

########## END - Field Length Calculations ##########




########## START - Base DDL Operations ##########
_SQL_KEYWORDS = {"drop", "create", "alter", "truncate", "insert", "update", "delete", "grant", "revoke", "union", "into", "select", "from"}
_RESERVED_WORDS = frozenset(_SQL_KEYWORDS | {obj.value for obj in SystemObjects})

_AUTHORIZED_STRING = re.compile(r'^[a-z][a-z0-9_]*$')
_AUTHORIZED_NUMBER = re.compile(r'^\d+(, \d+)?$')

regex_pattern = r"(--|;)|\b(" + "|".join(re.escape(word) for word in _RESERVED_WORDS) + r")\b"
_LOOKUP_FILTER_BLACKLIST = re.compile(regex_pattern, re.IGNORECASE)


def verify_keywords(value_to_check: str, check_type = _AUTHORIZED_STRING) -> str:
    """Validate a SQL identifier against a strict whitelist before interpolation."""

    if not check_type.match(value_to_check) or value_to_check in _RESERVED_WORDS:
        raise_server_exception(logger, "DML injection identified", value=value_to_check)

    return value_to_check

def verify_lookup_filter(value_to_check: str | None) -> str | None:
    """Reject lookup_filter values containing dangerous SQL keywords."""
    if not value_to_check:
        return value_to_check

    if _LOOKUP_FILTER_BLACKLIST.search(value_to_check):
        raise_server_exception(logger, "DML injection identified", value=value_to_check)

    return value_to_check

def delete_table(cursor, table_name: str) -> None:
    table_name = verify_keywords(table_name)

    command = f'DROP TABLE IF EXISTS {table_name}'
    execute_query(cursor, get_caller_name(), command)

def create_table(cursor, object_name: str, pk_field_name: str, pk_field_type: str, pk_field_length: str) -> None:
    field_type = convert_field_type_into_SQL_type(pk_field_type, pk_field_length)
    object_name = verify_keywords(object_name)
    pk_field_name = verify_keywords(pk_field_name)

    command = f'''
    CREATE TABLE {object_name} (
        {pk_field_name} {field_type} PRIMARY KEY,
        object_name VARCHAR(255) NOT NULL DEFAULT '{object_name}',
        {StandardObjectField.RECORD_TYPE_NAME} VARCHAR(255) NOT NULL DEFAULT '{MASTER_RECORD_TYPE}',
        {StandardObjectField.CREATE_DATE} DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        {StandardObjectField.LAST_MODIFIED_DATE} DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        {StandardObjectField.LAST_MODIFIED_BY} VARCHAR(255) NOT NULL
    );
    '''
    execute_query(cursor, get_caller_name(), command)

def add_column(cursor, object_name: str, column_name: str, field_type: str, field_length: str, reference_field_type: str, reference_object: str) -> None:
    object_name = verify_keywords(object_name)
    column_name = verify_keywords(column_name)
    field_length = verify_keywords(str(field_length), _AUTHORIZED_NUMBER) if field_length else None
    
    sql_field_type = convert_field_type_into_SQL_type(field_type, field_length, reference_field_type)
    constraint = ""
    if field_type in (FieldTypes.LOOKUP.value, FieldTypes.PICKLIST.value):
        primary_key_reference_object = get_primary_keys_from_multiple_objects(cursor, [reference_object]).get(reference_object)
        reference_object = verify_keywords(reference_object)
        primary_key_reference_object = verify_keywords(primary_key_reference_object)

        constraint = f'''
        , ADD CONSTRAINT fk_{object_name}_{column_name}
        FOREIGN KEY ({column_name}) REFERENCES {reference_object}({primary_key_reference_object})
        ON DELETE SET NULL
        '''

    command = f'''
    ALTER TABLE {object_name}
    ADD {column_name} {sql_field_type} {constraint}
    '''
    execute_query(cursor, get_caller_name(), command)

def delete_column(cursor, table_name: str, column_name: str, field_type: str):
    table_name = verify_keywords(table_name)
    column_name = verify_keywords(column_name)

    constraint = f'''DROP CONSTRAINT fk_{table_name}_{column_name} ''' if field_type in (FieldTypes.LOOKUP.value, FieldTypes.PICKLIST.value) else ""
    command = f'''
    ALTER TABLE {table_name}
    {constraint}
    DROP COLUMN {column_name};
    '''
    execute_query(cursor, get_caller_name(), command)
########## END - Base DDL Operations ##########



########## START - New Object Creation ##########
def _build_system_metadata_params(
    object_label: str,
    object_name: str,
    object_category: str,
    category_sort_order: int,
    pk_field_name: str,
    pk_field_type: str,
    pk_field_length: int | None,
    is_primary_key_text: int
) -> dict[str, list[tuple]]:
    """
        Build the parameter lists needed to insert all system metadata for a new object.

        Produces one list of tuples per system table:
        object_definition, record_type_definition, field_definition (5 standard fields),
        list_view_definition (PK only), and record_layout_definition (PK + audit fields).

        Args:
            object_label: Human-readable label for the object.
            object_name: Internal table name of the object.
            object_category: Category grouping for the object in the UI.
            category_sort_order: Sort position within the category.
            pk_field_name: Name of the primary key field.
            pk_field_type: FieldType value of the primary key (text or auto_number).
            pk_field_length: Length of the PK field; None when the type has no fixed length.
            is_primary_key_text: 1 if the PK is a text field (editable/required), 0 otherwise.

        Returns:
            Dict mapping system table names to their list-of-tuple insert params.
    """
    
    # Define a new object_definition with the values used in the form, with only 1 record type and non_system_object
    object_definition_params = [
        (
            object_label,               # object_label
            object_name,                # object_name
            object_category,            # category
            category_sort_order,        # sort_order
            0,                          # is_system_object
            1                           # is_single_record_type
        )
    ]

    # Define the master record_type and active 
    record_type_definition_params = [
        (
            object_name,                # object_name
            MASTER_RECORD_TYPE,        # record_type_name
            1                           # is_active
        )
    ]

    # Define 5 fields:
    #   - Primary key -> with the type indicated in the form (AutoNumber / Text), active
    #   - Record Type -> of type text, active and required
    #   - Create Date -> of type DateTime, active and visibile (not required becasue is auto calculated)
    #   - Last Modified Date -> of type DateTime, active and visibile (not required becasue is auto calculated)
    #   - Last Modified By -> Lookup to system_object "user_definition" on id "email", active and visibile (not required becasue is auto calculated)
    #                               Generally is not possible make lookup to system_objects, this is the only exception
    field_definition_params = [
        (
            object_name,                        # object_name
            MASTER_RECORD_TYPE,                # record_type_name
            pk_field_name,                      # field_name
            pk_field_type,                      # field_type
            pk_field_length,                    # length
            None,                               # numeric_precision
            None,                               # numeric_scale
            None,                               # reference_object
            None,                               # reference_field
            1,                                  # is_active
            1,                                  # is_visible
            is_primary_key_text,                # is_editable
            is_primary_key_text,                # is_required
            1,                                  # is_primary_key
            None,                               # lookup_filter
            None                                # formula_description
        ),
        (
            object_name,
            MASTER_RECORD_TYPE,
            StandardObjectField.RECORD_TYPE_NAME,
            FieldTypes.TEXT.value,
            255,
            None,
            None,
            None,
            None,
            1,
            0,
            0,
            1,
            0,
            None,
            None
        ),
        (
            object_name,
            MASTER_RECORD_TYPE,
            StandardObjectField.CREATE_DATE,
            FieldTypes.DATE_TIME.value,
            None,
            None,
            None,
            None,
            None,
            1,
            1,
            0,
            0,
            0,
            None,
            None
        ),
        (
            object_name,
            MASTER_RECORD_TYPE,
            StandardObjectField.LAST_MODIFIED_DATE,
            FieldTypes.DATE_TIME.value,
            None,
            None,
            None,
            None,
            None,
            1,
            1,
            0,
            0,
            0,
            None,
            None
        ),
        (
            object_name,
            MASTER_RECORD_TYPE,
            StandardObjectField.LAST_MODIFIED_BY,
            FieldTypes.LOOKUP.value,
            255,
            None,
            None,
            "user_definition",
            "email",
            1,
            1,
            0,
            0,
            0,
            None,
            None
        ),
    ]

    # Define a base list_view_defintion with only the primary key field as first element
    list_view_definition_params = [
        (
            object_name,                # object_name
            MASTER_RECORD_TYPE,        # record_type_name
            pk_field_name,              # field_name
            1                           # sort_order
        )
    ]

    # Define a base layout_defintion with Primary key, Create Date, Last Modified Date, Last Modified By
    layout_definition_params = [
        (
            object_name,            # object_name
            MASTER_RECORD_TYPE,    # record_type_name
            pk_field_name,          # field_name
            1                       # sort_order
        ),
        (
            object_name,            
            MASTER_RECORD_TYPE,               
            StandardObjectField.CREATE_DATE,         
            2                      
        ),
        (
            object_name,            
            MASTER_RECORD_TYPE,               
            StandardObjectField.LAST_MODIFIED_DATE,         
            3                      
        ),
        (
            object_name,            
            MASTER_RECORD_TYPE,               
            StandardObjectField.LAST_MODIFIED_BY,         
            4                   
        )
    ]

    return {
        "object_definition": object_definition_params,
        "record_type_definition": record_type_definition_params,
        "field_definition": field_definition_params,
        "list_view_definition": list_view_definition_params,
        "layout_definition": layout_definition_params
    }

def _insert_object_system_metadata(cursor, sys_metadata_params: dict) -> None:
    insert_object_definition_record(cursor, sys_metadata_params.get("object_definition"))
    insert_record_type_definition(cursor, sys_metadata_params.get("record_type_definition"))
    insert_field_definition(cursor, sys_metadata_params.get("field_definition"))
    insert_list_view_definition(cursor, sys_metadata_params.get("list_view_definition"))
    insert_record_layout_definition(cursor, sys_metadata_params.get("layout_definition"))

def create_new_object(cursor, object_data: dict) -> dict:
    """
        Create a new CRM object: DDL table creation + all system metadata records.

        Executes `CREATE TABLE` followed by inserts into the five system tables
        (object_definition, record_type_definition, field_definition,
        list_view_definition, record_layout_definition).
        On failure, rolls back the DB transaction and attempts a `DROP TABLE`
        to compensate for the non-transactional DDL statement.

        Args:
            cursor: Database cursor used to execute SQL statements.
            object_data: Form payload containing object_label, object_name, category,
                        sort_order, id_field_name, and id_field_type.

        Returns:
            {"result": 1} on success.

        Raises:
            HTTPException: 500 if any step fails.
    """

    id_name_form_field = "id_field_name"
    id_type_form_field = "id_field_type"
    sort_order_form_field = "sort_order"

    # Extract the object infos from the input
    object_label = object_data[SystemFieldName_OD.OBJECT_LABEL].lower()
    object_name = object_data[SystemFieldName_OD.OBJECT_NAME].lower()
    object_category = object_data[SystemFieldName_OD.CATEGORY]
    category_sort_order = int(object_data[sort_order_form_field])
    pk_field_name = object_data[id_name_form_field].lower()
    pk_field_type = object_data[id_type_form_field]

    # if the pk is a text the default length is 255, is editable and required
    pk_field_length = 255 if pk_field_type == FieldTypes.TEXT.value else None
    is_primary_key_text = 1 if pk_field_type == FieldTypes.TEXT.value else 0

    # Create the params for all the system_object needed
    sys_metadata_params = _build_system_metadata_params(
        object_label, 
        object_name, 
        object_category, 
        category_sort_order, 
        pk_field_name, 
        pk_field_type, 
        pk_field_length, 
        is_primary_key_text
    )

    _insert_object_system_metadata(cursor, sys_metadata_params)
    create_table(cursor, object_name, pk_field_name, pk_field_type, pk_field_length)
    return {"result": 1}

########## END - New Object Creation ##########



########## START - Delete ##########
def _delete_object_system_metadata(cursor, table_name: str) -> None:
    """
        Delete all system metadata rows associated with a CRM object.

        Only object_definition and field_definition are deleted explicitly:
            - object_definition: the object row itself (matched by object_name).
            - field_definition: rows where object_name OR reference_object matches,
                to clean up lookup fields on other objects that pointed to this one.

        All other system tables (record_type_definition, list_view_definition,
        related_list_definition, etc.) are cleaned up automatically via ON DELETE CASCADE from object_definition.

        Args:
            cursor: Active database cursor.
            table_name (str): Name of the CRM object being deleted.
    """
    
    od_where_filter = [f"{SystemFieldName_OD.OBJECT_NAME} = %s"]
    od_params = [table_name]
    query = build_delete_query(SystemObjects.OBJECT_DEFINITION, od_where_filter)
    execute_query(cursor, f'{get_caller_name()}: {SystemObjects.OBJECT_DEFINITION}', query, [tuple(od_params)])

    fd_where_filter = [*od_where_filter, f"{SystemFieldName_FD.REFERENCE_OBJECT} = %s"]
    fd_params = [*od_params, table_name]
    query = build_delete_query(SystemObjects.FIELD_DEFINITION, fd_where_filter, QueryBuilderLogicalOperator.OR)
    execute_query(cursor, f'{get_caller_name()}: {SystemObjects.FIELD_DEFINITION}', query, [tuple(fd_params)])

def delete_object_ddl(cursor, table_name: str) -> dict:
    """
        Drop the physical table and remove all associated system metadata.

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query.
            table_name (str): Name of the CRM object to delete.

        Returns:
            dict: {"result": 1} on success.

        Raises:
            HTTPException: If a database error occurs.
    """

    _delete_object_system_metadata(cursor, table_name)
    delete_table(cursor, table_name)
    return {"result": 1}

def delete_field_ddl(cursor, table_name, field_name, current_field_type):
    delete_column(cursor, table_name, field_name, current_field_type)

    where_filter = [f"{SystemFieldName_FD.OBJECT_NAME} = %s", f"{SystemFieldName_FD.FIELD_NAME} = %s"]
    params = [table_name, field_name]
    query = build_delete_query(SystemObjects.FIELD_DEFINITION, where_filter)
    execute_query(cursor, f'{get_caller_name()}: {SystemObjects.FIELD_DEFINITION}', query, [tuple(params)])
    return {"result": 1}


########## END - Delete ##########



########## START - New Field Creation ##########
def _build_field_system_metadata_params(
    cursor,
    object_name: str,
    record_type: str,
    field_name: str,
    field_type: str,
    field_length: str | None,
    numeric_precision: str | None,
    numeric_scale: str | None,
    reference_object: str | None,
    reference_field: str | None,
    is_active: str,
    is_visible: str,
    is_editable: str,
    is_required: str,
    is_primary_key: str,
    lookup_filter: str | None,
    formula_definition: str | None,
    next_order: str,
    reference_object_record_type: str | None,
    aggregation_function: str | None,
    options_values: list[str] | None,
) -> dict[str, list[tuple]]:

    # Row for field_definition — all field properties submitted from the form
    field_definition_params = [
        (
            object_name,
            record_type,
            field_name,
            field_type,
            field_length,
            numeric_precision,
            numeric_scale,
            reference_object,
            reference_field,
            is_active,
            is_visible,
            is_editable,
            is_required,
            is_primary_key,
            lookup_filter,
            formula_definition
        ),
    ]

    # Row for record_layout_definition — links the field to its sort position in the layout
    record_layout_params = [
        (
            object_name,
            record_type,
            field_name,
            next_order
        )
    ]


    # Rows for radio/checkbox option values — one row per option
    radio_checkbox_options_params = []
    for idx, option in enumerate(options_values):
        clamped_option = option[:255]
        radio_checkbox_options_params.append(
            (
                object_name,
                record_type,
                field_name,
                idx,                                        # sort_order
                clamped_option.replace(" ", "_").lower(),   # option_key
                clamped_option,                             # option_label
                1                                           # is_active
            )
        )
    
    # Row for related_list_definition — object_name is the child object (lookup points from child to master)
    related_list_def_params = []
    if field_type == FieldTypes.LOOKUP.value:
        # Fetch child object PK and label, and the next sort order for the related list
        child_object_pk_field = get_primary_keys_from_multiple_objects(cursor, [object_name]).get(object_name)
        child_object_label = get_object_definition_records(cursor, [object_name])[0]["label"]
        next_order_rl = get_next_sort_order(
            cursor, 
            "related_list_definition", 
            [f"(child_object_name, child_record_type_name) = (%s, %s)"], 
            [object_name, record_type]
        )

        reference_obj_rt = get_object_definition_records_join_rt(cursor, [reference_object], 0)
        for rt in reference_obj_rt:
            related_list_def_params.append((
                reference_object,                               # master_object_name
                rt[SystemFieldName_RTD.RECORD_TYPE_NAME],       # master_record_type_name
                child_object_pk_field,                          # child_primary_key (sul db si chiama master_primary_key, è un errore)
                object_name,                                    # child_object_name
                record_type,                                    # child_record_type_name
                field_name,                                     # detail_join_key
                child_object_label,                             # label
                next_order_rl,                                  # sort_order
                None,                                           # filter_condition
                1                                               # is_active
            ))



    # Row for rollup_definition — object_name is the master object (rollup aggregates values from childs)
    rollup_def_params = []
    if field_type == FieldTypes.ROLLUP.value: 
        # Fetch the lookup field on the detail object (reference_object) that points to object_name
        detail_lookup_field_name = get_lookup_field_definition(                                                                                                                                                         
            cursor,                                                                                                                                                                                            
            "field_definition",                               
            [
                "object_name = %s",
                "field_type = %s",
                "reference_object = %s",
                "is_active = 1"
            ],
            [reference_object, FieldTypes.LOOKUP.value, object_name]
        )

        # TODO Bug: il record type del child non viene salvato, in casi estremamente rari e specifici potrebbe portare errori
        master_object_pk_field = get_primary_keys_from_multiple_objects(cursor, [object_name]).get(object_name)
        rollup_def_params.append((
            object_name,                        # master_object_name
            record_type,                        # master_record_type_name
            master_object_pk_field,             # master_primary_key
            field_name,                         # master_field_name
            reference_object,                   # detail_object_name
            detail_lookup_field_name,           # detail_join_key
            reference_field,                    # detail_field_name
            aggregation_function,               # aggregation_function
            lookup_filter                       # filter_condition
        ))


    ausiliar_sys_object_params = {
        "radio_checkbox_options_params":    radio_checkbox_options_params,
        "related_list_def_params":          related_list_def_params,
        "rollup_def_params":                rollup_def_params
    }

    return {
        "field_type":                   field_type,
        "field_definition_params":      field_definition_params,
        "record_layout_params":         record_layout_params,
        "ausiliar_sys_object_params":   ausiliar_sys_object_params
    }

def _insert_field_system_metadata(cursor, sys_metadata_params: dict) -> None:
    insert_field_definition(cursor, sys_metadata_params.get("field_definition_params"))
    insert_record_layout_definition(cursor, sys_metadata_params.get("record_layout_params"))

    field_type = sys_metadata_params.get("field_type")
    if field_type in (FieldTypes.RADIO.value, FieldTypes.LOOKUP.value, FieldTypes.ROLLUP.value):
        params = sys_metadata_params.get("ausiliar_sys_object_params")
        if field_type == FieldTypes.RADIO.value:
            insert_radio_checkbox_options(cursor, params.get("radio_checkbox_options_params"))
        elif field_type == FieldTypes.LOOKUP.value:
            insert_related_list_definition(cursor, params.get("related_list_def_params"))
        elif field_type == FieldTypes.ROLLUP.value:
            insert_rollup_definition(cursor, params.get("rollup_def_params"))

def create_field_ddl(cursor, object_name: str, field_data: dict):
    """
        Create a new field for a specific table and generate all required SystemObject records.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL statements.
            object_name (str): Name of the table where the field will be created.
            field_data (dict): Dictionary containing all required information to create the field.

        Returns:
            dict: {"result": 1} if the process completes successfully.

        Raises:
            HTTPException: If a database error occurs
    """

    record_type_ref_obj = "reference_object_record_type"
    aggregation_funct = "aggregation_function"
    option_values = "options_values"

    # Extract the field infos from the input
    field_name = field_data[SystemFieldName_FD.FIELD_NAME].replace(" ", "_").lower()
    field_type = field_data[SystemFieldName_FD.FIELD_TYPE]
    is_active = field_data[SystemFieldName_FD.IS_ACTIVE]
    is_editable = field_data[SystemFieldName_FD.IS_EDITABLE]
    is_visible = field_data[SystemFieldName_FD.IS_VISIBLE]
    is_required = field_data[SystemFieldName_FD.IS_REQUIRED]
    field_length = field_data.get(SystemFieldName_FD.LENGTH, None)
    numeric_precision = field_data.get(SystemFieldName_FD.NUMERIC_PRECISION, None)
    numeric_scale = field_data.get(SystemFieldName_FD.NUMERIC_SCALE, None)
    reference_object = field_data.get(SystemFieldName_FD.REFERENCE_OBJECT, None)
    reference_field = field_data.get(SystemFieldName_FD.REFERENCE_FIELD, None)
    lookup_filter = verify_lookup_filter(field_data.get(SystemFieldName_FD.LOOKUP_FILTER, None))
    formula_definition = field_data.get(SystemFieldName_FD.FORMULA_DEFINITION, None) 

    reference_object_record_type = field_data.get(record_type_ref_obj, None)
    aggregation_function = field_data.get(aggregation_funct, None) 
    options_values = field_data.get(option_values, "").split("\n")


    logical_length, sql_length, reference_field_type = get_length_based_on_field_type(
        cursor,
        field_type,
        field_length,
        numeric_precision,
        numeric_scale,
        reference_object
    )

    tables_rt = get_object_definition_records_join_rt(cursor, [object_name], 0)
    next_order = get_next_sort_order(cursor, "record_layout_definition", ["object_name = %s"], [object_name])
    for rt in tables_rt:
        record_type = rt[SystemFieldName_RTD.RECORD_TYPE_NAME]
        is_rt_active = rt[SystemFieldName_RTD.IS_ACTIVE]

        sys_metadata_params = _build_field_system_metadata_params(
            cursor,
            object_name,
            record_type,
            field_name,
            field_type,
            logical_length,
            numeric_precision,
            numeric_scale,
            reference_object,
            reference_field,
            is_active if is_rt_active else is_rt_active,
            is_visible,
            is_editable,
            is_required,
            0,
            lookup_filter,
            formula_definition,
            next_order,
            reference_object_record_type,
            aggregation_function,
            options_values
        )
        _insert_field_system_metadata(cursor, sys_metadata_params)


    # Create the actual column in the SQL table
    add_column(
        cursor,
        object_name,
        field_name,
        field_type,
        sql_length,
        reference_field_type,
        reference_object
    )

    return {"result": 1}


########## END - New Field Creation ##########




def get_setup_field_structure(
    cursor,
    table_name: str,
    fields: list[dict],
    record_id: str,
    pk_field: str,
    current_field_type: str,
    field_attributes: dict
) -> dict:
    """
        Retrieve the full structure and the values for a specific field in setup context.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            table_name (str): Name of the database table.
            fields (list[dict]): List of field metadata dicts for the given field type.
            record_id (str): Primary key value of the record to retrieve.
            pk_field (str): Name of the primary key column used to filter the record.
            current_field_type (str): Type of the field (e.g. "rollup", "radio").
            field_attributes (dict): Row from field_definition for the field being retrieved.

        Returns:
            dict: A mapping of field names (capitalized) to dicts containing field metadata and current value.
    """
    # THOSE ARE THE FIELD NAME USED IN THE K_Setup.js and doesn't exist on the DB
    FIELD_NAME_REFERENCE_OBJECT_RECORD_TYPE = "reference_object_record_type"
    FIELD_NAME_AGGREGATION_FUNCTION = "aggregation_function"
    FIELD_NAME_OPTIONS_VALUES = "options_values"

    # for the types ROLLUP and RADIO is mandatory to create a list with the real fields, because in the UI there are also fields not present on the DB
    real_fields = fields.copy()
    if current_field_type in (FieldTypes.ROLLUP.value, FieldTypes.RADIO.value):
        ausiliar_record_fields = {FIELD_NAME_REFERENCE_OBJECT_RECORD_TYPE, FIELD_NAME_AGGREGATION_FUNCTION, FIELD_NAME_OPTIONS_VALUES}
        real_fields = []
        ausiliar_fields = []
        for f in fields:
            if f["field_name"] in ausiliar_record_fields:
                ausiliar_fields.append(f)
            else:
                real_fields.append(f)

    # Retrieve the record
    record = get_single_record(
        cursor, 
        table_name, 
        real_fields, 
        [
            f"{pk_field} = %s",
            "object_name = %s",
            "record_type_name = %s"
        ], 
        [record_id, field_attributes[SystemFieldName_FD.OBJECT_NAME], MASTER_RECORD_TYPE]
    )

    reference_object_record_type_options = []
    if current_field_type == FieldTypes.ROLLUP.value:
        rd_records = get_rollup_definition_by_master_field(cursor, record_id)
        record[FIELD_NAME_AGGREGATION_FUNCTION] = rd_records[0][SystemFieldName_ROLLD.AGGREGATION_FUNCTION]
        record[FIELD_NAME_REFERENCE_OBJECT_RECORD_TYPE] = rd_records[0][SystemFieldName_ROLLD.MASTER_RECORD_TYPE_NAME] #TODO questo è sballato perchè il valore non è mai stato salvato sul db

        for r in rd_records:
            master_rt = r[SystemFieldName_ROLLD.MASTER_RECORD_TYPE_NAME]
            reference_object_record_type_options.append({"id": master_rt, "reference_field": master_rt.capitalize()})
    elif current_field_type == FieldTypes.RADIO.value:
        map_checkbox_radio_options = get_radio_options(cursor, [field_attributes])

        list_values = map_checkbox_radio_options.get(make_options_key_from_row(field_attributes))
        values = "\n".join(elem["option_key"] for elem in list_values)
        record[FIELD_NAME_OPTIONS_VALUES] = values

    field_structure = {}
    for row in fields:
        copy_row = row.copy()
        copy_row["value"] = record[row["field_name"]]

        if row["field_name"] == FIELD_NAME_REFERENCE_OBJECT_RECORD_TYPE:
            copy_row['options'] = reference_object_record_type_options

        field_structure[row["field_name"].capitalize()] = copy_row

    return field_structure

