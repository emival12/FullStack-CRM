from __future__ import annotations
from fastapi import HTTPException
from enum import Enum
from decimal import Decimal, InvalidOperation
from datetime import datetime
import io
import re
import pandas as pd
import logging
from core.exceptions import raise_input_exception, raise_server_exception, log_event
from core.models import MASTER_RECORD_TYPE, SystemFieldName_OD, SystemFieldName_RTD, SystemFieldName_FD, FieldTypes, StandardObjectField
from db.db_queries import (
    check_allowed_object,
    get_user_definition_record,
    make_table_key,
    make_options_key,
    make_basic_table_key,
    get_object_definition_records,
    get_object_definition_records_join_rt,
    get_primary_keys_from_multiple_objects,
    get_field_divided_by_type,
    get_radio_options,
    get_picklist_lookup_options,
    get_fields_definition,
)
from db.query_builder import build_insert_query

logger = logging.getLogger(__name__) 

class OperationType(Enum):
    INSERT  = "insert"
    UPDATE  = "update"


def get_list_of_importable_objects(cursor):
    tables = get_object_definition_records(cursor)
    options_tables = []
    for t in tables:
        options_tables.append({
            "reference_field": t["label"],
            "id": t["key"],
        })

    return options_tables


########## HELP Method
def _raise_input_exception(error_code, error_data = None):
    raise_input_exception(400, error_code, error_data)

##########


def elaborate_import_file(cursor, operation_type: str, object_name: str, user_id: str, file_decoded: str) -> None:
    """
        Process an imported CSV file for a specified operation type (insert/update).
        Validates that the object is importable and that the user_id corresponds to an
        active user, then parses the CSV and routes to the appropriate handler.

        Args:
            cursor (MySQLCursor): Cursor used to execute SQL queries
            operation_type (str): Type of operation
            object_name (str): Name of the target object
            user_id (str): Id of the user who is performing the action; must match an active
                user record. Failure raises a generic 500 (defensive: the value is set by the
                frontend and never exposed to the end user, so an invalid id implies bypass).
            file_decoded (str): CSV file content decoded as a string
    """

    check_allowed_object(cursor, object_name)
    user = get_user_definition_record(cursor, user_id=user_id)
    if not user:
        raise_server_exception(logger, "Invalid user id", user_id=user_id)

    try:
        df = pd.read_csv(io.StringIO(file_decoded), delimiter=";", keep_default_na=False, na_values=[''], dtype=str)
    except Exception as err:
        _raise_input_exception("IMPORT_FILE_PARSE_ERROR", {"error": str(err)})

    if operation_type == OperationType.INSERT.value:
        insert_records(cursor, object_name, user_id, df)
    elif operation_type == OperationType.UPDATE.value:
        raise HTTPException(status_code=404, detail=f'Operation Type not yet supported') #TODO

def insert_records(cursor, object_name: str, user_id: str, df: pd.DataFrame) -> None:
    """
        Insert records into the database based on the provided DataFrame after validation.
        Validates columns and rows, and performs batch insert.
        
        Args:
            cursor (MySQLCursor): Cursor to execute SQL statements
            object_name (str): Target table name
            user_id (str): Id of the user who is performing the action
            df (pandas.DataFrame): DataFrame containing the records to insert
        
        Raises:
            HTTPException: If validation or database errors occur
    """
    
    df.columns = df.columns.str.lower()
    df_active_cols = [col for col in df.columns if not col.startswith("skip_") and col != StandardObjectField.LAST_MODIFIED_BY]

    # Resolve the record type from the CSV and validate it against the object's record types
    record_type_name, is_single_record_type = verify_record_type(cursor, object_name, df)

    # Load the field definitions that the imported rows must conform to
    fields = get_fields_to_check(cursor, object_name, record_type_name, is_single_record_type)

    # Validate that the CSV columns match the expected fields
    checks_input_columns(fields, df_active_cols)

    # Build the parameter tuples for the batch insert (last_modified_by is appended per row)
    insert_cols = df_active_cols + [StandardObjectField.LAST_MODIFIED_BY]
    params = process_input_rows(cursor, fields, object_name, record_type_name, user_id, df, insert_cols)

    # Execute the batch insert. Triggers are intentionally bypassed for mass imports.
    try:
        query = build_insert_query(object_name, insert_cols)
        cursor.executemany(query, params)
        log_event(logging.INFO, logger, "Massive insert completed", object_name=object_name, record_type_name=record_type_name, user_id=user_id, record_count=len(params))
    except Exception:
        raise_server_exception(logger, "Massive insert failed", query=query)


def verify_record_type(cursor, object_name: str, df: pd.DataFrame) -> tuple[str, int]:
    tables = get_object_definition_records_join_rt(cursor, [object_name])

    is_single_record_type = tables[0][SystemFieldName_OD.IS_SINGLE_RECORD_TYPE]
    acceptable_record_types = {t[SystemFieldName_RTD.RECORD_TYPE_NAME] for t in tables}
    record_type_name = None

    if is_single_record_type:
        record_type_name = MASTER_RECORD_TYPE
    else:
        if StandardObjectField.RECORD_TYPE_NAME not in df.columns:
            _raise_input_exception("IMPORT_FILE_MISSING_RECORD_TYPE_COLUMN")

        for idx, row in enumerate(df.itertuples()):
            curr_record_type_name = getattr(row, StandardObjectField.RECORD_TYPE_NAME)
            if pd.isna(curr_record_type_name) or str(curr_record_type_name).strip() == "":
                _raise_input_exception("IMPORT_FILE_MISSING_RECORD_TYPE_VALUE", {"row": idx + 1})
                
            curr_record_type_name = curr_record_type_name.lower()
            if not record_type_name:
                record_type_name = curr_record_type_name
            
            if record_type_name != curr_record_type_name:
                _raise_input_exception("IMPORT_FILE_WITH_MULTIPLE_RECORD_TYPE", { "record_type_name": [curr_record_type_name, record_type_name] })
    
    if record_type_name not in acceptable_record_types:
        _raise_input_exception("IMPORT_FILE_WITH_WRONG_RECORD_TYPE", { "record_type_name": record_type_name })
    
    return record_type_name, is_single_record_type

def get_fields_to_check(cursor, object_name: str, record_type_name: str, is_single_record_type: int) -> list[dict]:
    fields = get_fields_definition(cursor, [(object_name, record_type_name)], is_visible=0).get(make_table_key(object_name, record_type_name))

    # Auto-number PKs are assigned by the DB; record_type_name is implicit for single-RT objects.
    fields_to_insert = []
    for f in fields:
        if f[SystemFieldName_FD.IS_PRIMARY_KEY] and f[SystemFieldName_FD.FIELD_TYPE] == FieldTypes.AUTO_NUMBER.value:
            continue
        elif f[SystemFieldName_FD.FIELD_NAME] == StandardObjectField.RECORD_TYPE_NAME and is_single_record_type:
            continue
        fields_to_insert.append(f)

    return fields_to_insert

def checks_input_columns(fields: list[dict], df_active_cols: list[str]) -> None:
    """
        Validate that the CSV columns match the required and allowed fields in the database.
        Checks for missing required fields and unknown fields.

        Args:
            fields (list[dict]): List of field definition dictionaries from the database.
            df_active_cols (list[str]): Active CSV columns to validate (already lowercased,
                excluding skip_ columns and last_modified_by).

        Raises:
            HTTPException: If required columns are missing or unknown columns are present.
    """

    # Partition the field definitions into "all" and "required" sets
    all_fields = []
    required_fields = []
    for f in fields:
        field_name = f[SystemFieldName_FD.FIELD_NAME].lower()

        if f[SystemFieldName_FD.IS_REQUIRED]:
            required_fields.append(field_name)
        all_fields.append(field_name)


    set_all_fields = set(all_fields)
    set_required_fields = set(required_fields)
    active_cols = set(df_active_cols)

    # Reject if any required field is missing from the CSV
    missing_required_fields = set_required_fields.difference(active_cols)
    if len(missing_required_fields) > 0:
        _raise_input_exception("IMPORT_FILE_MISSING_REQUIRED_FIELDS", {"columns": list(missing_required_fields)})

    # Reject if the CSV contains columns that are not defined on the object
    inexisting_field = active_cols.difference(set_all_fields)
    if len(inexisting_field) > 0:
        _raise_input_exception("IMPORT_FILE_UNKNOWN_FIELDS", {"columns": list(inexisting_field)})

def process_input_rows(cursor, fields: list[dict], object_name: str, record_type_name: str, user_id: str, df: pd.DataFrame, df_cols: list[str]) -> list[tuple]:
    """
        Validate each row in the DataFrame according to field definitions.
        Performs type checks, length checks, lookup validation, and prepares parameters for batch insert.

        Args:
            cursor (MySQLCursor): Database cursor.
            fields (list[dict]): List of active field definitions.
            object_name (str): Name of the target object/table.
            record_type_name (str): Record type of the import, used to look up picklist/radio options.
            user_id (str): Id of the user performing the import, appended as last_modified_by on each row.
            df (pd.DataFrame): DataFrame with input records.
            df_cols (list[str]): Columns to include in each insert row, in order
                (includes last_modified_by as the last column).

        Returns:
            list[tuple]: Parameters for batch insert into the database.

        Raises:
            HTTPException: If any validation error occurs.
    """
    fields_dict = {f[SystemFieldName_FD.FIELD_NAME]: f for f in fields}

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
    map_picklist_lookup_index = {
        field_name: {str(opt["id"]) for opt in options} for field_name, options in map_picklist_lookup_options.items()
    }

    # Preprocess all the radio to get the list of available options
    map_radio_options = get_radio_options(cursor, map_field_by_type.radio_fields)
    map_checkbox_radio_index = {
        field_name: {opt["option_key"] for opt in options} for field_name, options in map_radio_options.items()
    }
    ########### END - PREPROCESS

    params = []
    for idx, row in enumerate(df.itertuples()):
        new_record = []
        for col in df_cols:
            if StandardObjectField.LAST_MODIFIED_BY == col:
                continue # added at the end
            else:
                # Get the value of the cell
                raw_value = getattr(row, col)
                if pd.isna(raw_value) or str(raw_value).strip() == "":
                    value = None
                    new_record.append(value)
                    continue
                else:
                    value = str(raw_value).strip()

            # Get the definition of the field on the DB
            field_definition = fields_dict[col]
            field_type = field_definition[SystemFieldName_FD.FIELD_TYPE]

            if field_type == FieldTypes.TEXT.value:
                field_length = field_definition[SystemFieldName_FD.LENGTH]
                if len(value) > field_length:
                    _raise_input_exception(
                        "IMPORT_FIELD_LENGTH_EXCEEDED", 
                        {
                            "row": idx+1,
                            "column": col,
                            "max_length": field_length,
                            "actual_length": len(value)
                        }
                    )
            elif field_type == FieldTypes.CHECKBOX.value:
                accepted_values = {
                    "0": 0,
                    "false": 0,
                    "1": 1,
                    "true": 1,
                }

                value = value.lower()
                if value not in accepted_values:
                    _raise_input_exception(
                        "INPUT_FIELD_INVALID_BOOLEAN", 
                        {
                            "row": idx+1,
                            "column": col,
                            "accepted_values": list(accepted_values.keys()),
                        }
                    )      

                value = accepted_values[value]
            elif field_type == FieldTypes.NUMBER.value:
                # Check if is a number
                value = value.replace(",", ".")
                try:
                    value = Decimal(value)
                    value = value.normalize()
                except (InvalidOperation, TypeError):
                    _raise_input_exception(
                        "INPUT_FIELD_INVALID_NUMBER", 
                        {
                            "row": idx+1,
                            "column": col,
                        }
                    )  

                sign, digits, exp = value.as_tuple()
                digits_count = len(digits)
                decimal_digits = -exp if exp < 0 else 0
                integer_digits = digits_count - decimal_digits

                # Check scale
                scale = field_definition["numeric_scale"] or 0
                if decimal_digits > scale:
                    _raise_input_exception(
                        "INPUT_FIELD_SCALE_EXCEEDED", 
                        {
                            "row": idx+1,
                            "column": col,
                            "max_length": scale,
                            "actual_length": decimal_digits
                        }
                    )
                    
                # Check precision
                precision = field_definition["numeric_precision"]
                max_integer_digits = precision - scale
                if integer_digits > max_integer_digits: 
                    _raise_input_exception(
                        "INPUT_FIELD_PRECISION_EXCEEDED", 
                        {
                            "row": idx+1,
                            "column": col,
                            "max_length": max_integer_digits,
                            "actual_length": integer_digits
                        }
                    ) 
            elif field_type == FieldTypes.RADIO.value:
                value = value.lower()
                if value not in map_checkbox_radio_index.get(make_options_key(object_name, record_type_name, col), set()):
                    _raise_input_exception(
                    "INPUT_FIELD_INVALID_RADIO", 
                    {
                        "row": idx+1,
                        "column": col,
                        "actual_value": value
                    }
                ) 
            elif field_type in (FieldTypes.DATE.value, FieldTypes.DATE_TIME.value):
                value = value.lower()
                if value:
                    is_date_type = True if field_type == FieldTypes.DATE.value else False
                    expected_format = "YYYY-MM-DD" if is_date_type else "YYYY-MM-DDTHH:MM:SS"
                    format_to_check = "%Y-%m-%d" if is_date_type else "%Y-%m-%dt%H:%M:%S"
                    regex_pattern = "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" if is_date_type else "^[0-9]{4}-[0-9]{2}-[0-9]{2}t[0-9]{2}:[0-9]{2}:[0-9]{2}$"

                    if not re.match(regex_pattern, value):
                        _raise_input_exception(
                            "INPUT_FIELD_INVALID_DATE_FORMAT",
                            {
                                "row": idx+1,
                                "column": col,
                                "actual_value": value,
                                "expected_format": expected_format
                            }
                        )
                    
                    try:
                        datetime.strptime(value, format_to_check)
                    except ValueError:
                        _raise_input_exception(
                            "INPUT_FIELD_INVALID_DATE",
                            {
                                "row": idx+1,
                                "column": col,
                                "actual_value": value,
                            }
                        )
            elif field_type in (FieldTypes.PICKLIST.value, FieldTypes.LOOKUP.value):
                if value not in map_picklist_lookup_index.get(make_options_key(object_name, record_type_name, col), set()):
                    _raise_input_exception(
                    "INPUT_FIELD_INVALID_LOOKUP_PICKLIST", 
                    {
                        "row": idx+1,
                        "column": col,
                        "actual_value": value
                    }
                )  
            
            new_record.append(value)
        
        if any(new_record):
            new_record.append(str(user_id)) # Insert last modifyByUser
            params.append(tuple(new_record))
        
    return params 







