from core.models import SystemObjects, SystemFieldName_OD, SystemFieldName_FD, FieldTypes
from core.exceptions import raise_server_exception
from db.dbQueries import (
    check_allowed_tables,
    get_basic_table_key,
    get_table_key_from_strings,
    get_object_definition_records,
    get_fields_definition_by_object_names,
    get_fields_with_label,
    get_fields_definition,
    get_primary_keys_from_multiple_objects,
    get_primary_key_from_fields
)
from services.objectDDL import (
    create_new_object,
    delete_object_ddl,
    delete_field_ddl,
    create_field_ddl,
    get_setup_field_structure
)
from services.recordCRUD import (
    update_record_by_id
)

def create_object(cursor, db, object_data):
    return create_new_object(cursor, db, object_data)

def update_object(cursor, db, table_name: str, field_structure: dict) -> dict:
    check_allowed_tables(cursor, table_name, get_basic_table_key)

    try:
        result = update_record_by_id(cursor, "object_definition", None, field_structure, "object_name", table_name)
        db.commit()
        return result
    except Exception as e:
        db.rollback()
        raise_server_exception(f"update_object: {str(e)}")

def delete_object(cursor, db, table_name: str):
    check_allowed_tables(cursor, table_name, get_basic_table_key)
    return delete_object_ddl(cursor, db, table_name)

def delete_field(cursor, db, table_name: str, field_name: str) -> dict:
    check_allowed_tables(cursor, table_name, get_basic_table_key)

    field_def= get_fields_definition(
        cursor,
        [(table_name, "master")],
        0,
        0,
        field_name
    ).get(get_table_key_from_strings(table_name, "master"))
    if not field_def or not len(field_def):
        raise_server_exception(f'delete_field: Field \'{field_name}\' not found')

    current_field_type = field_def[0]["field_type"]
    return delete_field_ddl(cursor, db, table_name, field_name, current_field_type)

def get_field_creation_structure(cursor) -> dict:
    """
        Build the data structure needed to render the field creation form.

        Retrieves all objects and their field definitions, then groups field names,
        record type names, and rollup-eligible fields by object name.

        Args:
            cursor: Database cursor used to execute SQL queries.

        Returns:
            dict with keys:
                - field_types: all FieldTypes enum values
                - lookup_options: all object definition records
                - fields_options: field names grouped by object name
                - fields_options_rollup: number/formula field names grouped by object name
                - rt_options: record type names grouped by object name
    """

    # Retrieve all the fields for all the objects
    tables = get_object_definition_records(cursor)
    fields = get_fields_definition_by_object_names(cursor, [ t[SystemFieldName_OD.OBJECT_NAME] for t in tables])

    # Divide the fields into multiple set, to show them in the field creation form
    fields_grouped_by_object = {}
    rt_grouped_by_object = {}
    field_options_rollup = {}
    for row in fields:
        object_name = row[SystemFieldName_FD.OBJECT_NAME]
        rt_name = row[SystemFieldName_FD.RECORD_TYPE_NAME]
        field_name = row[SystemFieldName_FD.FIELD_NAME]
        field_type = row[SystemFieldName_FD.FIELD_TYPE]

        fields_grouped_by_object.setdefault(object_name, set()).add(field_name)
        rt_grouped_by_object.setdefault(object_name, set()).add(rt_name)
        if field_type in (FieldTypes.NUMBER.value, FieldTypes.FORMULA.value):
            field_options_rollup.setdefault(object_name, set()).add(field_name)

    return {
        "field_types": { ft.name: ft.value for ft in FieldTypes },
        "lookup_options": tables,
        "fields_options": fields_grouped_by_object,
        "fields_options_rollup": field_options_rollup,
        "rt_options": rt_grouped_by_object
    }

def get_object_definition(cursor, table_name: str) -> dict:
    check_allowed_tables(cursor, table_name, get_basic_table_key)
    tables = get_object_definition_records(cursor, [table_name])

    return tables[0] if tables else {}

_OBJECT_FIELDS_COLUMNS = [
    {SystemFieldName_FD.FIELD_NAME: "field_name",       SystemFieldName_FD.FIELD_TYPE: FieldTypes.TEXT.value},
    {SystemFieldName_FD.FIELD_NAME: "field_type",       SystemFieldName_FD.FIELD_TYPE: FieldTypes.TEXT.value},
    {SystemFieldName_FD.FIELD_NAME: "reference_object", SystemFieldName_FD.FIELD_TYPE: FieldTypes.TEXT.value},
]
def get_object_fields_record(cursor, table_name: str) -> dict:
    """
        Build the data structure needed to render the fields list for a given object.

        Args:
            cursor: Database cursor used to execute SQL queries.
            table_name (str): Name of the object whose fields to retrieve.

        Returns:
            dict with keys:
                - fields: label-ready column definitions for the fields list
                - primary_key_name: name of the primary key field
                - records: all field_definition records for the object (including inactive)
    """
    check_allowed_tables(cursor, table_name, get_basic_table_key)
    records = get_fields_definition_by_object_names(cursor, [table_name], is_active=0)

    return {
        "fields": get_fields_with_label(_OBJECT_FIELDS_COLUMNS),
        "primary_key_name": "field_name",
        "records": records
    }

def create_field(cursor, db, table_name: str, field_data: dict):
    return create_field_ddl(cursor, db, table_name, field_data)

def get_field_info(cursor, table_name: str, field_name: str, list_fields_by_type: dict) -> dict:
    check_allowed_tables(cursor, table_name, get_basic_table_key)

    field_attributes = get_fields_definition(
        cursor,
        [(table_name, "master")],
        0,
        0,
        field_name
    ).get(get_table_key_from_strings(table_name, "master"))
    if not field_attributes or not len(field_attributes):
        raise_server_exception(f'get_field_info: Field \'{field_name}\' not found')

    current_field_type = field_attributes[0][SystemFieldName_FD.FIELD_TYPE]
    fields = list(list_fields_by_type[current_field_type].values())
    pk_field = get_primary_key_from_fields(fields)
    field_structure = get_setup_field_structure(
        cursor,
        SystemObjects.FIELD_DEFINITION,
        fields,
        field_name,
        pk_field,
        current_field_type,
        field_attributes[0]
    )

    object_primary_key_name = get_primary_keys_from_multiple_objects(cursor, [table_name]).get(table_name)
    return {
        "object_primary_key_name": object_primary_key_name,
        "field_type": current_field_type,
        "primary_key_name": pk_field,
        "field_structure": field_structure
    }
