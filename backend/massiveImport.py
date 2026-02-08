from fastapi import HTTPException
from enum import Enum
from decimal import Decimal, InvalidOperation
from datetime import datetime
import io
import re
import pandas as pd
import utils

class OperationType(Enum):
    INSERT  = "insert"
    UPDATE  = "update"



########## HELP Method
def raise_input_exception(error_code, error_data):
    detail_error = {
        "error_code": error_code,
        "error_data": error_data
    }
    raise HTTPException(status_code=400, detail=detail_error)

def get_options_map_key(object_name, record_type_name, col):
    return f'{object_name}_{record_type_name}_{col}'

##########



def elaborate_import_file(db, cursor, operation_type, object_name, user_id, file_decoded):
    """
        Process an imported CSV file for a specified operation type (insert/update)
        Parses the CSV, validates data, and routes to appropriate handlers based on operation type
        
        Args:
            db (MySQLConnection): Database connection for committing transactions
            cursor (MySQLCursor): Cursor used to execute SQL queries
            operation_type (str): Type of operation
            object_name (str): Name of the target object
            user_id (str): Id of the user who is performing the action
            file_decoded (str): CSV file content decoded as a string
    """

    df = pd.read_csv(io.StringIO(file_decoded), delimiter=";")

    if operation_type == OperationType.INSERT.value:
        insert_records(db, cursor, object_name, user_id, df)
    elif operation_type == OperationType.UPDATE.value:
        raise HTTPException(status_code=404, detail=f'Operation Type not yet supported') #TODO

def insert_records(db, cursor, object_name, user_id, df):
    """
        Insert records into the database based on the provided DataFrame after validation.
        Validates columns and rows, and performs batch insert.
        
        Args:
            db (MySQLConnection): Database connection for commit/rollback
            cursor (MySQLCursor): Cursor to execute SQL statements
            object_name (str): Target table name
            user_id (str): Id of the user who is performing the action
            df (pandas.DataFrame): DataFrame containing the records to insert
        
        Raises:
            HTTPException: If validation or database errors occur
    """

    # Take the column on the table on the DB
    table_fields, is_auto_number, is_single_record_type = get_active_field_list(cursor, object_name)

    # Checks if the excel file have the right fields 
    checks_input_columns(table_fields, df)

    df_cols = {col.lower() for col in df.columns}
    df_cols.add(utils.SystemFieldName.LAST_MODIFIED_BY.lower())
    df_cols = set(df_cols)

    params = process_input_rows(cursor, table_fields, is_single_record_type, object_name, user_id, df, df_cols)
    
    # Insert the records
    try:
        command = f'''
        INSERT INTO {object_name} ({", ".join(df_cols)})
        VALUES ({", ".join(["%s"] * len(df_cols))});
        '''
        cursor.executemany(command, params)
        db.commit() 
    except Exception as e:
        db.rollback()

        print('Error in the table insert: ' + str(e))
        raise HTTPException(status_code=500, detail=str(e))

def get_active_field_list(cursor, object_name):
    """
        Retrieve the active field definitions and metadata for a given object
        Excludes auto-number primary keys and record_type_name if the object is single record type
        
        Args:
            cursor (MySQLCursor): Database cursor to execute queries
            object_name (str): Name of the object/table
        
        Returns:
            tuple: A tuple containing:
                - list dict: Active field definitions
                - int: Flag indicating if there is an auto_number primary key
                - int: Flag indicating if the object is single record type
    """

    query = """
        SELECT 
            object_name,
            record_type_name,
            field_name, 
            field_type, 
            length, 
            numeric_precision, 
            numeric_scale,
            reference_object, 
            reference_field, 
            is_required,
            is_primary_key,
            lookup_filter
        FROM field_definition
        WHERE 
            object_name = %s
            AND record_type_name = 'master'
            AND is_active = 1 
        ORDER BY field_name ASC;
    """
    cursor.execute(query, (object_name,))
    fields = cursor.fetchall()

    query = """
        SELECT 
            is_single_record_type
        FROM object_definition
        WHERE 
            object_name = %s
    """
    cursor.execute(query, (object_name,))
    object_def = cursor.fetchall()

    is_single_record_type = object_def[0]["is_single_record_type"]
    is_auto_number = 0
    new_field = []
    for f in fields:
        if f["is_primary_key"] and f["field_type"] == 'auto_number':
            is_auto_number = 1
            continue
        elif f["field_name"] == "record_type_name" and is_single_record_type:
            continue
        new_field.append(f)

    return new_field, is_auto_number, is_single_record_type

def checks_input_columns(table_fields, df):
    """
        Validate that the DataFrame columns match the required and allowed fields in the database.
        Checks for missing required fields and unknown fields.
        
        Args:
            table_fields (list): List of field definition dictionaries from the database
            df (pandas.DataFrame): DataFrame containing imported data

        Raises:
            HTTPException: If required columns are missing or unknown columns are present
    """

    # Create the list of required fields and the total fields for the object
    db_fields = []
    required_fields = []
    for field in table_fields:
        field_name = field["field_name"].lower()

        if field["is_required"]:
            required_fields.append(field_name)
        db_fields.append(field_name)


    sorted_db_fields = set(sorted(db_fields))
    sorted_required_fields = set(sorted(required_fields))
    sorted_cols = set(sorted(df.columns))

    # Check if all the required field are been inserted
    missing_required_fields = sorted_required_fields.difference(sorted_cols)
    if len(missing_required_fields) > 0:
        raise_input_exception("IMPORT_FILE_MISSING_REQUIRED_FIELDS", {"columns": list(missing_required_fields)})

    # Check if all the field inserted exist
    inexisting_field = sorted_cols.difference(sorted_db_fields)
    if len(inexisting_field) > 0:
        raise_input_exception("IMPORT_FILE_UNKNOWN_FIELDS", {"columns": list(inexisting_field)})

def process_input_rows(cursor, fields, is_single_record_type, object_name, user_id, df, df_cols):
    """
        Validate each row in the DataFrame according to field definitions. 
        Performs type checks, length checks, lookup validation, and raises exceptions on errors and prepares the parameters for batch insert into the database
        
        Args:
            cursor (MySQLCursor): Database cursor
            fields (list): List of active field definitions
            is_single_record_type (int): Flag indicating single record type
            object_name (str): Name of the target object/table
            df (pandas.DataFrame): DataFrame with input records
            df_cols (set): columns of input Dataframe
        
        Returns:
            list of tuple: parameters for batch insert into the database
        
        Raises:
            HTTPException: If any validation error occurs
    """
    fields_dict = {f["field_name"]: f for f in fields}

    # Preprocess all the lookup/picklist to get the primaryKey of the referenced object
    map_object_primary_key_names = utils.get_primary_keys_from_multiple_objects(
        cursor,
        [ row["reference_object"] for row in fields if row["field_type"] in (utils.FieldTypes.PICKLIST.value, utils.FieldTypes.LOOKUP.value)]
    )

    # Preprocess all the checkbox/radio to get the option values
    map_field_by_type = utils.get_field_divided_by_type(fields)

    map_checkbox_radio_options = utils.get_checkbox_radio_options(cursor, map_field_by_type["radio_fields"])
    map_checkbox_radio_index = {
        field_name: {opt["option_key"] for opt in options} for field_name, options in map_checkbox_radio_options.items()
    }

    map_picklist_lookup_options = utils.get_picklist_lookup_options(cursor, map_field_by_type["picklist_lookup_fields"], map_object_primary_key_names)
    map_picklist_lookup_index = {
        field_name: {str(opt["id"]) for opt in options} for field_name, options in map_picklist_lookup_options.items()
    }

    params = []
    for idx, row in enumerate(df.itertuples()):
        record_type_name = "master" if is_single_record_type else getattr(row, "record_type_name")

        if idx in (3, 4, 5, 6, 7, 8, 9, 10, 11):
            continue;

        new_record = []
        for col in df_cols:
            if utils.SystemFieldName.LAST_MODIFIED_BY.lower() == col:
                value = str(user_id)
            else:
                # Get the value of the cell
                raw_value = getattr(row, col)
                if pd.isna(raw_value) or str(raw_value).strip() == "":
                    value = None
                else:
                    value = str(raw_value).strip().lower()

            # Get the definition of the field on the DB
            field_definition = fields_dict[col]
            field_type = field_definition["field_type"]

            if field_type in (utils.FieldTypes.TEXT.value):
                field_length = field_definition["length"]
                if len(value) > field_length:
                    raise_input_exception(
                        "IMPORT_FIELD_LENGTH_EXCEEDED", 
                        {
                            "row": idx+1,
                            "column": col,
                            "max_length": field_length,
                            "actual_length": len(value)
                        }
                    )
            elif field_type in (utils.FieldTypes.CHECKBOX.value):
                accepted_values = {
                    "0": 0,
                    "false": 0,
                    "1": 1,
                    "true": 1,
                }

                if value not in accepted_values:
                    raise_input_exception(
                        "INPUT_FIELD_INVALID_BOOLEAN", 
                        {
                            "row": idx+1,
                            "column": col,
                            "accepted_values": list(accepted_values.keys()),
                        }
                    )      

                value = accepted_values[value]
            elif field_type in (utils.FieldTypes.NUMBER.value):
                # Check if is a number
                value = value.replace(",", ".")
                try:
                    value = Decimal(value)
                except (InvalidOperation, TypeError):
                    raise_input_exception(
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
                    raise_input_exception(
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
                    raise_input_exception(
                        "INPUT_FIELD_PRECISION_EXCEEDED", 
                        {
                            "row": idx+1,
                            "column": col,
                            "max_length": max_integer_digits,
                            "actual_length": digits_count
                        }
                    )
            elif field_type in (utils.FieldTypes.ROLLUP.value):
                raise_input_exception(
                    "IMPORT_FIELD_ROLLUP_UNAUTHORIZED", 
                    {
                        "row": idx+1,
                        "column": col,
                    }
                )      
            elif field_type in (utils.FieldTypes.RADIO.value):
                if value not in map_checkbox_radio_index[get_options_map_key(object_name, record_type_name, col)]:
                    raise_input_exception(
                    "INPUT_FIELD_INVALID_RADIO", 
                    {
                        "row": idx+1,
                        "column": col,
                        "actual_value": value
                    }
                ) 
            elif field_type in (utils.FieldTypes.DATE.value, utils.FieldTypes.DATE_TIME.value):
                if value:   
                    is_date_type = True if field_type == utils.FieldTypes.DATE.value else False
                    expected_format = "YYYY-MM-DD" if is_date_type else "YYYY-MM-DDTHH:MM:SS"
                    format_to_check = "%Y-%m-%d" if is_date_type else "%Y-%m-%dt%H:%M:%S"
                    regex_pattern = "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" if is_date_type else "^[0-9]{4}-[0-9]{2}-[0-9]{2}t[0-9]{2}:[0-9]{2}:[0-9]{2}$"

                    if not re.match(regex_pattern, value):
                        raise_input_exception(
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
                        raise_input_exception(
                            "INPUT_FIELD_INVALID_DATE",
                            {
                                "row": idx+1,
                                "column": col,
                                "actual_value": value,
                            }
                        )
            elif field_type in (utils.FieldTypes.PICKLIST.value, utils.FieldTypes.LOOKUP.value):
                if value not in map_picklist_lookup_index[get_options_map_key(object_name, record_type_name, col)]:
                    raise_input_exception(
                    "INPUT_FIELD_INVALID_LOOKUP_PICKLIST", 
                    {
                        "row": idx+1,
                        "column": col,
                        "actual_value": value
                    }
                )  
            
            new_record.append(value)
        params.append(tuple(new_record))
        
    return params 







