from fastapi import HTTPException
from enum import Enum, auto

"""
Python naming convention:
    - Classes:   PascaleCase    (Ex. Main)
    - Functions: snake_case     (Ex. get_object_definition_records_join_rt)
    - Variables: snake_case     (Ex. get_object_definition_records_join_rt)
"""

class FieldTypes(Enum):
    TEXT     = "text"
    NUMBER   = "number"
    LOOKUP   = "lookup"
    PICKLIST = "picklist"
    ROLLUP   = "rollup"
    RADIO    = "radio"
    CHECKBOX = "checkbox"

class FieldStructureMode(Enum):
    STRUCTURE_ONLY = auto()
    STRUCTURE_AND_DATA = auto()

########## BASE Query
def get_object_definition_records(cursor, object_names=None):
    """
        Retrieve all the records from the 'object_definition' table

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries
            object_names (list[str], optional): List of object names to filter by. 
                If None, all active objects are returned.

        Returns:
            list[dict]: A list of dictionaries, each containing information about an object definition 
                (e.g. object_name, record_type_name, category, etc.)
    """

    filter_object_name = ""
    params = ()
    if object_names:
        filter_object_name = f'WHERE od.object_name IN ({", ".join(["%s"] * len(object_names))})'
        params = tuple(object_names)

    query = f'''
    SELECT od.object_label, od.object_name, od.category, od.sort_order, od.is_system_object, od.is_single_record_type
    FROM object_definition od
    {filter_object_name}
    ORDER BY od.sort_order ASC;
    '''
    cursor.execute(query, params)
    tables = cursor.fetchall()

    for table in tables:
        table["key"] =  table["object_name"]
        table["label"] = table["object_label"].capitalize() 

    return tables

def get_object_definition_records_join_rt(cursor, object_names=None):
    """
        Retrieve all active records from the 'object_definition' table

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries
            object_names (list[str], optional): List of object names to filter by. 
                If None, all active objects are returned.

        Returns:
            list[dict]: A list of dictionaries, each containing information about an object definition 
                (e.g. object_name, record_type_name, category, etc.)
    """

    filter_object_name = ""
    params = ()
    if object_names:
        filter_object_name = f'AND od.object_name IN ({", ".join(["%s"] * len(object_names))})'
        params = tuple(object_names)

    query = f'''
    SELECT od.object_label, od.object_name, rtd.record_type_name, od.category, od.sort_order, od.is_system_object, od.is_single_record_type
    FROM object_definition od
    LEFT JOIN record_type_definition rtd ON od.object_name = rtd.object_name
    WHERE rtd.is_active = 1 {filter_object_name}
    ORDER BY od.sort_order ASC;
    '''
    cursor.execute(query, params)
    tables = cursor.fetchall()

    for table in tables:
        table["key"] =  get_table_key(table)
        table["label"] = table["object_label"].capitalize() if table["is_single_record_type"] else table["record_type_name"].capitalize()  

    return tables

def get_list_view_definition_fields(cursor, list_params):
    """
        Retrieve all active and visible fields defined in the list views for a specific set of (object_name, record_type_name) pairs.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            list_params (list[tuple[str, str]]): List of tuples, each containing 
                (object_name, record_type_name) pairs to filter the list view fields.

        Returns:
            dict: A dictionary mapping each object-record_type combination key to its corresponding field definition.
                Values are dictionaries with field metadata (e.g. field_name, field_type, reference_object, reference_field, etc.).

        Example:
            list_params = [
                ("account", "Cliente"),
                ("order", "Standard")
            ]

            # Returned structure example:
            {
                "account_Cliente": {...},
                "order_Standard": {...}
            }
    """

    if len(list_params) == 0:
        return {}

    placeholders = ", ".join(["(%s, %s)"] * len(list_params))
    
    flat_params = []
    for obj_name, record_type in list_params:
        flat_params.extend([obj_name, record_type])

    query = f'''
    SELECT 
        fd.object_name, 
        fd.record_type_name, 
        fd.field_name, 
        fd.field_type, 
        fd.reference_object, 
        fd.reference_field, 
        fd.is_primary_key, 
        fd.lookup_filter
    FROM list_view_definition lvd
    JOIN field_definition fd 
        ON lvd.object_name = fd.object_name 
        AND lvd.record_type_name = fd.record_type_name 
        AND lvd.field_name = fd.field_name
    WHERE 
        (fd.object_name, fd.record_type_name) IN ({placeholders})
        AND fd.is_active = 1 
        AND fd.is_visible = 1
    ORDER BY lvd.sort_order ASC;
    '''
    cursor.execute(query, tuple(flat_params))

    result = {}
    for row in cursor.fetchall():
        key = get_table_key(row)
        result.setdefault(key, []).append(row)

    return result

RLD_VISIBLE_AND_EDITABLE_FILTER = "((fd.is_visible = 1 AND fd.is_editable = 1) OR fd.field_name = 'record_type_name')"
RLD_SINGLE_FIELD_NAME_FILTER = f'fd.is_visible = 1 AND fd.field_name = %s'
def get_record_layout_definition_fields(cursor, table_name, record_type_name, where_additional_condition=None, where_additional_params=[]):
    """
        Return all active and visible fields defined in the record layout for a specific object

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries
            table_name (str): Name of a database table
            record_type_name (str): Name of a record type of the table
            where_additional_condition (str): Condition to add in the filter (likely one of the constant on top) 
            where_additional_params (list): List of values to use add in the condition filter

        Returns:
            list[dict]: A list of dictionaries, each containing metadata for fields included in the record layout definition
    """

    if not where_additional_condition:
        where_additional_condition = "fd.is_visible = 1"

    query = f'''
    SELECT 
        fd.object_name, 
        fd.record_type_name,  
        fd.field_name, 
        fd.field_type, 
        fd.length, 
        fd.numeric_precision, 
        fd.numeric_scale, 
        fd.reference_object, 
        fd.reference_field, 
        fd.is_editable, 
        fd.is_required, 
        fd.is_primary_key, 
        fd.lookup_filter
    FROM record_layout_definition rvd
    JOIN field_definition fd 
        ON rvd.object_name = fd.object_name 
        AND rvd.record_type_name = fd.record_type_name 
        AND rvd.field_name = fd.field_name
    WHERE 
        fd.object_name = %s 
        AND fd.record_type_name = %s 
        AND fd.is_active = 1 
        AND {where_additional_condition}
    ORDER BY rvd.sort_order ASC;
    '''
    cursor.execute(query, [table_name, record_type_name, *where_additional_params])
    return cursor.fetchall()

def get_rollup_definition(cursor, fields):
    """
        Retrieve all rollup definitions from the fields

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries
            fields (list[dict]): List of dictionaries containing field metadata (already filtered by type)

        Returns:
            dict: A dictionary mapping each rollup field to its definition.
              Keys are strings in the format:
                "{master_object_name}_{record_type_name}_{field_name}_{detail_object_name}".
                Values are dictionaries containing rollup metadata (aggregation, filter, etc.)
    """

    master_object_names = []
    master_record_type_names = []
    master_field_names = []
    detail_object_names = []
    for row in fields:
        master_object_names.append(row["object_name"]) 
        master_record_type_names.append(row["record_type_name"]) 
        master_field_names.append(row["field_name"]) 
        detail_object_names.append(row["reference_object"])

    if len(master_object_names) == 0 or len(master_record_type_names) == 0 or len(master_field_names) == 0 or len(detail_object_names) == 0:
        return {}

    placeholders_master_object_names = ", ".join(["%s"] * len(master_object_names))
    placeholders_master_record_type_names = ", ".join(["%s"] * len(master_record_type_names))
    placeholders_master_field_names = ", ".join(["%s"] * len(master_field_names))
    placeholders_detail_object_names = ", ".join(["%s"] * len(detail_object_names))

    query = f'''
    SELECT 
        master_object_name, 
        master_record_type_name, 
        master_primary_key, 
        master_field_name, 
        detail_object_name, 
        detail_join_key, 
        detail_field_name, 
        aggregation_function, 
        filter_condition
    FROM rollup_definition
    WHERE 
        master_object_name IN ( {placeholders_master_object_names} ) 
        AND master_record_type_name IN ( {placeholders_master_record_type_names} ) 
        AND master_field_name IN ( {placeholders_master_field_names} )
        AND detail_object_name IN ( {placeholders_detail_object_names} )
    '''

    # Unpack the lists and concatenate them all into a single giant tuple
    params = (                                      
        *master_object_names,
        *master_record_type_names,
        *master_field_names,
        *detail_object_names,
    )
    cursor.execute(query, params)
    return { get_rollup_map_key(row): row for row in cursor.fetchall() }

def get_checkbox_radio_options(cursor, fields):
    """
        Retrieve all option entries for fields of type checkbox and radio

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries
            fields (list[dict]): List of dictionaries containing field metadata (already filtered by type)

        Returns:
            dict: A dictionary mapping each checkbox/radio field to its available options.
              Keys are strings in the format:
                "{object_name}_{record_type_name}_{field_name}".
                Values are dictionaries containing options metadata (option_label, option_key, etc.)
    """

    lookup_filter = []
    params = []
    for row in fields:
        params.extend([row["object_name"], row["record_type_name"], row["field_name"]])
        extra_filter = f'AND {row["lookup_filter"]}' if row["lookup_filter"] else ""
        lookup_filter.append(f'(is_active = 1 AND object_name = %s AND record_type_name = %s AND field_name = %s {extra_filter})')

    if len(lookup_filter) == 0:
        return {}

    query = f'''
    SELECT object_name, record_type_name, field_name, option_label, option_key
    FROM radio_checkbox_options
    {"WHERE " + " OR ".join(lookup_filter)}
    ORDER BY sort_order ASC;
    '''
    cursor.execute(query, tuple(params))

    result = {}
    for row in cursor.fetchall():
        key = get_options_map_key(row)
        result.setdefault(key, []).append(row)

    return result

def get_picklist_lookup_options(cursor, fields, map_object_primary_key_names):
    """
        Retrieve all option entries for fields of type picklist and lookup

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries
            fields (list[dict]): List of dictionaries containing field metadata (already filtered by type)
            map_object_primary_key_names (dict): Dictionary where each key is an object name and each value is the corresponding primary key field name
                returned by 'get_primary_keys_from_multiple_objects()'

        Returns:
            dict: A dictionary mapping each picklist/lookup field to its available options.
              Keys are strings in the format:
                "{object_name}_{record_type_name}_{field_name}".
                Values are dictionaries containing options metadata (reference_field, id, etc.)
    """
    result = {}
    for row in fields:
        key = get_options_map_key(row)

        query = f'''
        SELECT {row["reference_field"]} reference_field, {map_object_primary_key_names.get(row["reference_object"])} id
        FROM {row["reference_object"]}
        {"WHERE " + row["lookup_filter"] if row["lookup_filter"] else ""}
        '''
        cursor.execute(query)
        result[key] = cursor.fetchall()

    return result

def get_related_list_definition_fields(cursor, table_name, record_type_name):
    """
        Return all active and visible fields defined in the related list of a specific object

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries
            table_name (str): Name of a database table
            record_type_name (str): Name of a record type of the table

        Returns:
            list[dict]: A list of dictionaries, each containing field metadata for the related list
    """

    query = """
    SELECT 
        rld.master_object_name, 
        rld.master_record_type_name, 
        rld.master_primary_key, 
        rld.child_object_name, 
        rld.child_record_type_name, 
        rld.child_join_key, 
        rld.label, 
        rld.sort_order, 
        rld.filter_condition, 
        rld.is_active
    FROM related_list_definition rld
    WHERE 
        rld.master_object_name = %s 
        AND rld.master_record_type_name = %s 
        AND rld.is_active = 1
    ORDER BY rld.sort_order ASC;
    """
    cursor.execute(query, (table_name, record_type_name))
    return cursor.fetchall()

########## END - BASE Query


########## HELP Method
def get_alias(table_name):
    return f'{table_name}__tab'

def get_basic_table_key(row, object_name="object_name"):
    return f'{row[object_name]}'

def get_table_key(row, object_name="object_name", record_type_name="record_type_name"):
    return f'{row[object_name]}_{row[record_type_name]}'

def get_table_key_from_strings(object_name, record_type_name):
    return f'{object_name}_{record_type_name}'

def get_rollup_map_key(row):
    object_field_name = "master_object_name" if "master_object_name" in row else "object_name"
    record_type_field_name = "master_record_type_name" if "master_record_type_name" in row else "record_type_name"
    field_name = "master_field_name" if "master_field_name" in row else "field_name"
    reference_object_field_name = "detail_object_name" if "detail_object_name" in row else "reference_object"

    return f'{row[object_field_name]}_{row[record_type_field_name]}_{row[field_name]}_{row[reference_object_field_name]}'

def get_options_map_key(row):
    return f'{row["object_name"]}_{row["record_type_name"]}_{row["field_name"]}'

def get_primary_key_from_fields(fields):
    return next((field["field_name"] for field in fields if field["is_primary_key"]), None)

def get_clean_field_names_from_fields(fields):
    return [field["field_name"].replace("_", " ") for field in fields]

def check_allowed_tables(cursor, table_name, key_function=get_table_key):
    """
        Check if the given table name is allowed in the database

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries
            table_name (str): Name of a database table
            key_function (function, optional): function used to calculate the key

        Returns:
            None

        Raises:
            HTTPException: if the table_name is not found in the allowed tables
    """

    query = """
    SELECT od.object_name, rtd.record_type_name, od.is_single_record_type 
    FROM object_definition od
    LEFT JOIN record_type_definition rtd ON od.object_name = rtd.object_name
    WHERE rtd.is_active = 1;
    """
    cursor.execute(query)

    allowed_tables = { key_function(row) for row in cursor.fetchall() }
    if table_name not in allowed_tables:
        raise HTTPException(status_code=404, detail=f'Table \'{table_name}\' not found')

def get_primary_keys_from_multiple_objects(cursor, object_names):
    """
        Return a dictionary mapping each object name to its primary key field

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries
            object_names (list[str]): List of object names to retrieve primary keys for

        Returns:
            dict: Dictionary where each key is an object name and each value is the corresponding primary key field name
    """
    
    if len(object_names) == 0:
        return {}

    placeholders = ", ".join(["%s"] * len(object_names))
    query = f'''
    SELECT 
        object_name, 
        field_name
    FROM field_definition
    WHERE 
        object_name IN ( {placeholders} ) 
        AND is_active = 1 
        AND is_primary_key = 1;
    '''
    cursor.execute(query, tuple(object_names))

    return { row["object_name"]: row["field_name"] for row in cursor.fetchall() }

def get_field_divided_by_type(fields):
    """
        Group fields by their type.

        Args:
            fields (list[dict]): List of field metadata dictionaries.

        Returns:
            dict: A dictionary with three keys:
                - "radio_checkbox_fields": all fields of type RADIO or CHECKBOX
                - "picklist_lookup_fields": all fields of type PICKLIST or LOOKUP
                - "rollup_fields": all fields of type ROLLUP
    """

    result = {
        "radio_checkbox_fields": [],
        "picklist_lookup_fields": [],
        "rollup_fields": [],
    }
    
    for row in fields:
        if row["field_type"] in (FieldTypes.RADIO.value): #, FieldTypes.CHECKBOX.value TODO CHECK
            result["radio_checkbox_fields"].append(row)
        elif row["field_type"] in (FieldTypes.PICKLIST.value, FieldTypes.LOOKUP.value):
            result["picklist_lookup_fields"].append(row)
        elif row["field_type"] == FieldTypes.ROLLUP.value:
            result["rollup_fields"].append(row)

    return result 

def execute_with_transaction(cursor, db, query, params, error_msg, many=False):
    """
        Execute a SQL query safely with commit/rollback and uniform error handling.

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query
            db (MySQLConnection): Database connection object used to commit or rollback changes
            query (str): SQL query string to execute
            params (tuple | list[tuple]): Parameters for the SQL query
            error_msg (str): Message prefix for raised exceptions
            many (bool): Whether to use executemany (for batch operations)

        Returns:
            dict: Dictionary containing the number of rows affected
    """

    try:
        if many:
            cursor.executemany(query, params)
        else:
            cursor.execute(query, params)
        db.commit() 
        return {"result": cursor.rowcount}
    except Exception as e:
        db.rollback()
        print(error_msg + str(e))
        raise HTTPException(status_code=500, detail=str(e))

def convert_into_SQL_field_type(field_type, length):
    if field_type in (FieldTypes.TEXT.value, FieldTypes.RADIO.value, FieldTypes.CHECKBOX.value, FieldTypes.LOOKUP.value, FieldTypes.PICKLIST.value):
        return f'VARCHAR ({length})'
    elif field_type in (FieldTypes.NUMBER.value, FieldTypes.ROLLUP.value):
        return f'FLOAT ({length})'


########## END - HELP Method



def group_object_definition_by_category(tables):
    """
        Groups object definitions by category and record type.
        This function organizes a list of object definition records into a hierarchical structure by category. 
        Each category contains a list of objects, where:
            - Single-record-type objects are listed directly
            - Multi-record-type objects are grouped under their object name

        Args:
            tables (list[dict]): A list of object definition records 
                returned by 'get_object_definition_records_join_rt()'

        Returns:
            dict: A dictionary where each key is a category name (capitalized),
                    and each value is a list containing:
                        - Dictionaries representing single-record-type objects, or
                        - A mapping '{object_name: [record_types...]}' for multi-record-type objects.

        Example:
            Input:
                [
                    {"object_name": "account", "record_type_name": "Cliente", "category": "Anagrafica", "is_single_record_type": 0},
                    {"object_name": "account", "record_type_name": "Fornitore", "category": "Anagrafica", "is_single_record_type": 0},
                    {"object_name": "zone", "record_type_name": "Master", "category": "Ausiliari", "is_single_record_type": 1}
                ]

            Output:
                {
                    "Anagrafica": [
                        {
                            "Account": [
                                {"object_name": "account", "record_type_name": "Cliente", ...},
                                {"object_name": "account", "record_type_name": "Fornitore", ...}
                            ]
                        }
                    ],
                    "Ausiliari": [
                        {"object_name": "user", "record_type_name": "Master", ...}
                    ]
                }
    """

    # Groups object definitions by object name
    map_object_RT = dict()
    for table in tables:
        obj_name = table["object_name"].capitalize()
        map_object_RT.setdefault(obj_name, []).append(table) #setdefault = If the key exist return the value otherwise return the second param


    processed_objects = set()
    grouped_structure = dict()
    for table in tables:
        cat = table["category"].capitalize()
        obj_name = table["object_name"].capitalize()
        is_single_rt = table["is_single_record_type"]

        grouped_structure.setdefault(cat, [])

        if obj_name not in processed_objects:
            list_tables = map_object_RT[obj_name]
            if is_single_rt:
                grouped_structure[cat].extend(list_tables) #extend = Add the element of the list specified in the original list
            else:
                grouped_structure[cat].append({obj_name: list_tables})

            processed_objects.add(obj_name)
    
    return grouped_structure

def build_field_value_select_clause(cursor, fields, table_name, map_object_primary_key_names=None):
    """
        Build the SQL SELECT field list and related clauses.

            - A text with the structre of SQL Fields clause
            - A list with the SQL Join clauses
            - A boolean to identify if there is a SQL Group By clause
            - A text with the structre of SQL Group By clause

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries
            fields (list[dict]): List of dictionaries containing field metadata
                returned by 'get_list_view_definition_fields()'
            table_name (str): Name of a database table
            map_object_primary_key_names (dict, optional): dictionary where each key is an object name and each value is the corresponding primary key field name 

        Returns:
            tuple[str, list[str], bool, str]: A 4-element tuple containing:
                - str: SQL fields clause (comma-separated list of fields)
                - list[str]: List of SQL JOIN clauses
                - bool: Whether a GROUP BY clause is required
                - str: The SQL GROUP BY clause (empty if not applicable)
    """
    # Preprocess all the lookup/picklist to get the primaryKey of the referenced object
    if not map_object_primary_key_names:
        map_object_primary_key_names = get_primary_keys_from_multiple_objects(
            cursor,
            [ row["reference_object"] for row in fields if row["field_type"] in (FieldTypes.PICKLIST.value, FieldTypes.LOOKUP.value)]
        )

    # Preprocess all the rollup to get the rollup defintion record of the field
    map_field_by_type = get_field_divided_by_type(fields)
    map_record_info_rollup_record = get_rollup_definition(cursor, map_field_by_type["rollup_fields"])


    has_group = False
    exclude_from_group = []

    joins = []
    field_syntax_list = []
    fields_text = ""
    for idx, row in enumerate(fields):
        fieldSyntax = ""
        if row["field_type"] in (FieldTypes.RADIO.value, FieldTypes.CHECKBOX.value):
            (fieldSyntax, join_clause) = build_field_join_clause(
                table_name,                             # 
                row["field_name"],                      # table_field
                "radio_checkbox_options",               # join_table_name
                "option_key",                           # join_field
                "option_label"                          # join_reference_field
            )
            joins.append(join_clause)
        elif row["field_type"] in (FieldTypes.PICKLIST.value, FieldTypes.LOOKUP.value):
            join_table_name = row["reference_object"]
            pk_field_name = map_object_primary_key_names.get(row['reference_object'])

            (fieldSyntax, join_clause) = build_field_join_clause(
                table_name,                     # 
                row["field_name"],              # table_field
                join_table_name,                # join_table_name
                pk_field_name,                  # join_field
                row["reference_field"]          # join_reference_field
            )
            joins.append(join_clause)
        elif row["field_type"] in (FieldTypes.ROLLUP.value):
            rollup_definition = map_record_info_rollup_record.get(get_rollup_map_key(row))            
            (fieldSyntax, join_clause) = build_field_join_clause_aggregated(
                table_name,                                             # 
                rollup_definition["master_primary_key"],                # table_field
                row["reference_object"],                                # join_table_name
                rollup_definition["detail_join_key"],                   # join_field
                rollup_definition["aggregation_function"],              # aggregation_function
                rollup_definition["detail_field_name"],                 # detail_field
                rollup_definition["master_field_name"]                  # master_field
            )
            joins.append(join_clause)

            has_group = True
            exclude_from_group.append(fieldSyntax)
        else:
            table_name_alias = get_alias(table_name)
            fieldSyntax = f'{table_name_alias}.{row["field_name"]}'

        field_syntax_list.append(fieldSyntax)

    fields_text = ", ".join(field_syntax_list)
    group = build_group_by_clause(field_syntax_list, exclude_from_group) if has_group else ""
    return (fields_text, joins, has_group, group)

def build_field_join_clause(table_name, table_field, join_table_name, join_field, join_reference_field):
    join_table_alias = get_alias(join_table_name)
    table_name_alias = get_alias(table_name)

    join_clause = f'LEFT JOIN {join_table_name} {join_table_alias} ON {table_name_alias}.{table_field} = {join_table_alias}.{join_field}'
    fieldSyntax = f'{join_table_alias}.{join_reference_field} {table_field}'

    return (fieldSyntax, join_clause)

def build_field_join_clause_aggregated(table_name, table_field, join_table_name, join_field, aggregation_function, detail_field, master_field):
    join_table_alias = get_alias(join_table_name)
    table_name_alias = get_alias(table_name)

    join_clause = f'LEFT JOIN {join_table_name} {join_table_alias} ON {table_name_alias}.{table_field} = {join_table_alias}.{join_field}'
    fieldSyntax = f'{aggregation_function}({join_table_alias}.{detail_field}) {master_field}'

    return (fieldSyntax, join_clause)

def build_group_by_clause(field_syntax_list, exclude_from_group):
    """
        Return a SQL GROUP BY clause using only non-aggregated fields

        Args:
            field_syntax_list (list[str]): Comma-separated list of field names (optionally with aliases)
            exclude_from_group (list[str]): List of field names to exclude from grouping (aggregated fields)

        Returns:
            str: A SQL GROUP BY clause string
    """

    fields_to_group = []
    for f in field_syntax_list:
        if f not in exclude_from_group:
            splitted_f = f.split() 
            if len(splitted_f) > 1:
                f = splitted_f[0]  # if have an alias take only the real name

            fields_to_group.append(f.strip())

    return f' GROUP BY {", ".join(fields_to_group)}'

def build_query(cursor, table_name, record_type_name, fields_text, joins, has_group, group):
    """
        Build and execute an SQL SELECT statement for the specified table and record type

        This function assembles a dynamic query using components generated by 
        'build_field_value_select_clause()' (fields, joins, grouping information)

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query
            table_name (str): Name of the database table to query
            record_type_name (str): Record type name of the table
            fields_text (str): Comma-separated list of SQL fields to select
            joins (list[str]): List of SQL JOIN clauses
            has_group (bool): Whether a GROUP BY clause is required
            group (str): The GROUP BY clause, or an empty string if not applicable

        Returns:
            list[dict]: Query results as a list of dictionaries
    """

    table_name_alias = get_alias(table_name)
    query = f'''
        SELECT {fields_text} 
        FROM {table_name} {table_name_alias}
        {" ".join(joins) if joins else ""}
        WHERE {table_name_alias}.record_type_name = %s
        {group + ";" if has_group else ";"}
    '''
    cursor.execute(query, (record_type_name,))
    return cursor.fetchall()



def get_field_structure(cursor, table_name, fields):
    return get_field_structure_and_value_data(
        cursor,
        table_name,
        fields,
        FieldStructureMode.STRUCTURE_ONLY
    )

def get_field_structure_and_value(cursor, table_name, fields, record_id):
    return get_field_structure_and_value_data(
        cursor,
        table_name,
        fields,
        FieldStructureMode.STRUCTURE_AND_DATA,
        record_id
    )

def get_field_structure_and_value_data(cursor, table_name, fields, mode, record_id=None):
    """
        Retrieve the full structure and optionally the values for all fields of a given record.

        This function enriches field metadata with the current record values and,
        where applicable, preloads options for picklist/lookup/radio/checkbox fields
        and calculates rollup values dynamically.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            table_name (str): Name of the database table.
            fields (list[dict]): List of dictionaries containing field metadata
                returned by 'get_list_view_definition_fields()'.
            mode (enum): Enum used to understan which kind of operation must be performed
            record_id (str, optional): Primary key value of the record to retrieve.

        Returns:
            dict: A mapping of field names (capitalized) to dictionaries containing:
                - field metadata (type, reference, options, etc.)
                - current value for the given record
    """

    # Preprocess all the lookup/picklist to get the primaryKey of the referenced object
    map_object_primary_key_names = get_primary_keys_from_multiple_objects(
        cursor,
        [ row["reference_object"] for row in fields if row["field_type"] in (FieldTypes.PICKLIST.value, FieldTypes.LOOKUP.value)]
    )

    # Preprocess all the checkbox/radio to get the option values
    map_field_by_type = get_field_divided_by_type(fields)

    map_checkbox_radio_options = get_checkbox_radio_options(cursor, map_field_by_type["radio_checkbox_fields"])
    map_picklist_lookup_options = get_picklist_lookup_options(cursor, map_field_by_type["picklist_lookup_fields"], map_object_primary_key_names)
    
    # If is needed only the structure the Rollup (readOnly fields) and the record values are useless
    if mode == FieldStructureMode.STRUCTURE_AND_DATA:
        primary_key_field = get_primary_key_from_fields(fields)
        record = get_single_record(cursor, table_name, fields, record_id, primary_key_field)

        map_record_info_rollup_record = get_rollup_definition(cursor, map_field_by_type["rollup_fields"])


    field_structure = {}
    for row in fields:
        copy_row = row.copy()

        if row["field_type"] in (FieldTypes.NUMBER.value):
            limit_value = f'{"9" * row["numeric_precision"]}.{"9" * row["numeric_scale"] if row["numeric_scale"] else ""}'
            copy_row["max_limit_value"] = limit_value
            copy_row["min_limit_value"] = "-" + limit_value
        elif row["field_type"] in (FieldTypes.RADIO.value):
            options = [
                {
                    "object_name": row["object_name"],
                    "record_type_name": row["record_type_name"],
                    "field_name": row["field_name"],
                    "option_label": "",
                    "option_key": ""
                }
            ]
            
            options.extend(map_checkbox_radio_options.get(get_options_map_key(row)))
            copy_row["options"] = options
        elif row["field_type"] in (FieldTypes.PICKLIST.value, FieldTypes.LOOKUP.value):
            copy_row["options"] = map_picklist_lookup_options.get(get_options_map_key(row))
        
        if mode == FieldStructureMode.STRUCTURE_AND_DATA:
            if row["field_type"] in (FieldTypes.ROLLUP.value):
                rollup_definition = map_record_info_rollup_record.get(get_rollup_map_key(row))   
                (fieldSyntax, join_clause) = build_field_join_clause_aggregated(
                    table_name,                                             # 
                    rollup_definition["master_primary_key"],                # table_field
                    row["reference_object"],                                # join_table_name
                    rollup_definition["detail_join_key"],                   # join_field
                    rollup_definition["aggregation_function"],              # aggregation_function
                    rollup_definition["detail_field_name"],                 # detail_field
                    rollup_definition["master_field_name"]                  # master_field
                )

                table_name_alias = get_alias(table_name)
                query = f'''
                SELECT {fieldSyntax}
                FROM {table_name} {table_name_alias}
                {join_clause}
                WHERE {table_name_alias}.{primary_key_field} = %s
                '''
                cursor.execute(query, (record_id,))
                rollup_record = cursor.fetchone()
                record[row["field_name"]] = rollup_record[rollup_definition["master_field_name"]]  # Save the calculated value into the respective field

            copy_row["value"] = record[row["field_name"]]
        field_structure[row["field_name"].capitalize()] = copy_row
        
    return field_structure

def get_single_record(cursor, table_name, fields, record_id, primary_key_field=None, record_type_name=None):
    """
        Return a single database record by its primary key

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries
            table_name (str): Name of a database table
            fields (list[dict]): List of dictionaries containing field metadata
            record_id (str): Primary key value of the record to retrieve
            primary_key_field (str): Name of the field Primary key
            record_type_name (str, optional): Record type name to further filter the query

        Returns:
            dict: Dictionary representing the record, or None if not found
    """

    fields_text = ", ".join(row["field_name"] for row in fields)
    primary_key_field = get_primary_key_from_fields(fields) if not primary_key_field else primary_key_field

    query = f'''
    SELECT {fields_text}
    FROM {table_name}
    WHERE {primary_key_field} = %s {"AND record_type_name = '" + record_type_name + "';"  if record_type_name else ";"}
    '''
    cursor.execute(query, (record_id,))
    record = cursor.fetchone()

    if not record:
        raise HTTPException(status_code=500, detail=f'Record \'{record_id}\' not found')
    return record

def get_related_list_value(cursor, table_name, record_type_name, related_lists, tables_dict):
    """
        Retrieve data and structure for all related lists of a specific table and record type

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query
            table_name (str): Name of the database table to query
            record_type_name (str): Record type name of the table
            related_lists (list[dict]): List of dictionaries defining related lists
            tables_dict (dict): dictionary containing information about an object definition 

        Returns:
            list[dict]: A list of dictionaries, each representing one related list.
                Each dictionary includes:
                    - "label" (str): Display name of the related list.
                    - "table" (dict): Object definition metadata from tables_dict.
                    - "fields" (list[str]): Field names to display in the related list.
                    - "primary_key_name" (str): The primary key field of the child table.
                    - "records" (list[dict]): List of records retrieved by the built query
    """

    # Retrieve all the fields for each (object_name, record_type_name) pairs of the child objects 
    params_tables = [(rl["child_object_name"], rl["child_record_type_name"]) for rl in related_lists]
    dict_fields = get_list_view_definition_fields(cursor, params_tables)

    # Precalculate a map of {object_name: primary_key_field_name}. In this way the query is done 1 time
    list_object = []
    for rl in related_lists:
        fields = dict_fields.get(get_table_key(rl, "child_object_name", "child_record_type_name"))
        for row in fields:
            if row["field_type"] in (FieldTypes.PICKLIST.value, FieldTypes.LOOKUP.value):
                list_object.append(row["reference_object"])

    map_object_primary_key_names = get_primary_keys_from_multiple_objects(cursor, list_object)


    # Build and execute a query for each related list
    rel_lists = []
    for related_list in related_lists:
        child_table_name = related_list["child_object_name"]
        child_record_type_name = related_list["child_record_type_name"]

        fields = dict_fields.get(get_table_key(related_list, "child_object_name", "child_record_type_name"))

        (fields_text, joins, has_group, group) = build_field_value_select_clause(cursor, fields, child_table_name)
        related_records = build_query(cursor, child_table_name, child_record_type_name, fields_text, joins, has_group, group)
 
        tempDictionary = {
            "label": related_list['label'].capitalize(),
            "table":  tables_dict.get(get_table_key(related_list, "child_object_name", "child_record_type_name")),
            "fields": get_clean_field_names_from_fields(fields),
            "primary_key_name": get_primary_key_from_fields(fields),
            "records": related_records
        }
        rel_lists.append(tempDictionary)
    
    return rel_lists



def delete_record_by_id(cursor, db, table_name, record_type_name, primary_key_field, record_id):
    """
        Delete a record from a given table by record type and record id

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query
            table_name (str): Name of the database table to query
            record_type_name (str): Record type name of the table
            primary_key_field (str): Name of the table's primary key field
            record_id (str): Primary key value identifying the record to delete

        Returns:
            dict: Dictionary containing the number of records deleted
        
        Raises:
            HTTPException: If a database error occurs during deletion
    """

    params = [record_id] + ([record_type_name] if record_type_name else [])

    query = f'''
    DELETE FROM {table_name} 
    WHERE {primary_key_field} = %s {"AND record_type_name = %s;" if record_type_name else ";" }
    '''

    return execute_with_transaction(cursor, db, query, params, "Error deleting record: ")

def insert_new_record(cursor, db, table_name, records):
    """
        Insert a series of record of the same table

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query
            db (MySQLConnection): Database connection object used to commit or rollback changes
            table_name (str): Name of the database table to query
            records (list[dict]): List of dictionaries, each representing a record to insert

        Returns:
            dict: Dictionary containing the number of records deleted
        
        Raises:
            HTTPException: If a database error occurs during deletion
    """

    field_list = ', '.join(records[0].keys())
    placeholders = ", ".join(["%s"] * len(records[0].keys()))
    params = [tuple(None if v == "" else v for v in r.values()) for r in records]

    query = f'''
    INSERT INTO {table_name} ({field_list})
    VALUES ({placeholders})
    '''

    return execute_with_transaction(cursor, db, query, params, "Error inserting record: ", True)

def update_record_by_id(cursor, db, table_name, record_type_name, field_structure, primary_key_field, record_id):
    """
        Update a record from a given table by record type and record id

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query
            table_name (str): Name of the database table to query
            record_type_name (str): Record type name of the table
            field_structure (dict): Dictionary with all the field to update {field_name: field_value, ...}
            primary_key_field (str): Name of the table's primary key field
            record_id (str): Primary key value identifying the record to delete

        Returns:
            dict: Dictionary containing the number of records deleted
        
        Raises:
            HTTPException: If a database error occurs during update
    """

    set_clause = ", ".join([f'{field_name} = %s' for field_name in field_structure.keys()])                     # create the clause (Es: Name = %s, Costo = %s, ...)

    values_params = [None if field_value == "" else field_value for field_value in field_structure.values()]    # prepare the list of values to be placed in the %s
    params = values_params + [record_id] + ([record_type_name] if record_type_name else [])                     # add at the end of the params the WHERE filter

    query = f'''
    UPDATE {table_name}
    SET {set_clause}
    WHERE {primary_key_field} = %s {"AND record_type_name = %s;" if record_type_name else ";" }
    '''
    return execute_with_transaction(cursor, db, query, params, "Error updating record: ")



###############################################
# SETUP
###############################################

def create_new_object(cursor, db, object_data):
    """
        Create a new table in the database and create al the record for the SystemObjects

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query
            db (MySQLConnection): Database connection object used to commit or rollback changes
            object_data (dict): Dictionary with all the information to create the table

        Returns:
            int: 1 if everything is gone well
        
        Raises:
            HTTPException: If a database error occurs
    """
    
    object_label = object_data["Object_label"].lower()
    object_name = object_data["Object_name"].lower()
    pk_field_name = object_data["Id_field_name"].lower()
    pk_field_length = 255 if object_data["Id_field_type"] == FieldTypes.TEXT.value else None        # apply default lenght if is a text
    pk_numeric_precision = 5 if object_data["Id_field_type"] == FieldTypes.NUMBER.value else None   # apply default lenght if is a number
    pk_field_type = object_data["Id_field_type"]
    
    try:
        params = [
            (   
                object_label,                   # object_label
                object_name,                    # object_name
                object_data["Category"],        # category
                int(object_data["Sort_order"]), # sort_order
                0,                              # is_system_object
                1                               # is_single_record_type
            )
        ]
        insert_object_definition_record(cursor, params)         #Create the object_definition

        params = [
            (
                object_name,                # object_name
                "master",                   # record_type_name
                1                           # is_active
            )
        ]
        insert_record_type_definition(cursor, params)           #Create the record_type_definition

        params = [
            (
                object_name,                        # object_name
                "master",                           # record_type_name
                pk_field_name,                      # field_name
                pk_field_type,                      # field_type
                pk_field_length,                    # length
                pk_numeric_precision,               # numeric_precision
                None,                               # numeric_scale
                None,                               # reference_object
                None,                               # reference_field
                1,                                  # is_active
                1,                                  # is_visible
                1,                                  # is_editable
                1,                                  # is_required
                1,                                  # is_primary_key
                None                                # lookup_filter
            ),
            (
                object_name,
                "master",
                "record_type_name",
                "picklist",
                255,
                None,
                None,
                "record_type_definition",
                "record_type_name",
                1,
                0,
                0,
                1,
                0,
                f'object_name = \'{object_name}\' AND is_active = 1'
            )
        ]
        insert_field_definition(cursor, params)                 #Create the field_definition

        params = [
            (
                object_name,                # object_name
                "master",                   # record_type_name
                pk_field_name,              # field_name
                1                           # sort_order
            )
        ]
        insert_list_view_definition(cursor, params)             #Create the list_view_definition

        params = [
            (
                object_name,            # object_name
                "master",               # record_type_name
                pk_field_name,          # field_name
                1                       # sort_order
            )
        ]
        insert_record_layout_definition(cursor, params)         #Create the record_layout_definition
    
        field_length = pk_field_length if pk_field_length else pk_numeric_precision
        create_table(cursor, object_data, object_name, pk_field_name, pk_field_type, field_length)
        db.commit() 
        return {"result": 1}
    except Exception as e:
        db.rollback()

        # The creation of a table cannot be rollbacked so in case of error must be executed an actual delete
        try:
            delete_table(cursor, object_name)
        except Exception as e_d:
            print('Error in the DROP: ' + str(e_d))
            pass

        print('Error in the table create: ' + str(e))
        raise HTTPException(status_code=500, detail=str(e))

def delete_object(cursor, db, table_name):
    """
        Delete a table in the database and all the record for the SystemObjects

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query
            db (MySQLConnection): Database connection object used to commit or rollback changes
            table_name (str): name of the table

        Returns:
            int: 1 if everything is gone well
        
        Raises:
            HTTPException: If a database error occurs
    """

    try:

        filter_fields = ["object_name"]
        params = [table_name]
        delete_record(cursor, "object_definition", filter_fields, params)
        delete_record(cursor, "field_definition", filter_fields + ["reference_object"], params + params, " OR ")
        delete_record(cursor, "radio_checkbox_options", filter_fields, params)
        delete_record(cursor, "list_view_definition", filter_fields, params)
        delete_record(cursor, "record_layout_definition", filter_fields, params)
        delete_record(cursor, "record_type_definition", filter_fields, params)
    
        delete_record(cursor, "rollup_definition", ["master_object_name", "detail_object_name"], params + params, " OR ")
        delete_record(cursor, "related_list_definition", ["master_object_name", "child_object_name"], params + params, " OR ")
    
        delete_table(cursor, table_name)
        db.commit() 
        return {"result": 1}
    except Exception as e:
        db.rollback()
        
        print('Error in the table delete: ' + str(e))
        raise HTTPException(status_code=500, detail=str(e))

def get_field_names_grouped_by_objects(cursor, tables, fields, only_active):
    """
        Retrieve the specified fields for a given list of objects 

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query
            tables (list[dict]): A list of dictionaries, each containing information about an object definition
            fields (list[str]): A list of field names
            only_active (bool): Use to understand if is need the filter on is_active field

        Returns:
            dict[str, list[str]]: A dictionary where each key is an object name and the value is a list 
                of active field names belonging to that object.  
    """

    object_names = [ t["object_name"] for t in tables ]
    placeholders = ", ".join(["%s"] * len(object_names))

    fields_text = ", ".join(fields)

    query = f'''
    SELECT 
        {fields_text}
    FROM field_definition
    WHERE 
        object_name IN ( {placeholders} ) 
        AND field_name != 'record_type_name'
        {"AND is_active = 1" if only_active else ""}
    GROUP BY 
        {fields_text}
    ORDER BY field_name ASC;
    '''
    cursor.execute(query, tuple(object_names))    
    return cursor.fetchall()

def create_new_field(cursor, db, object_name, field_data):
    """
        Create a new field for a specific table and generate all required SystemObject records.
        This method handles every step involved in adding a new field to a custom object:
            - Determining the correct logical and SQL-level length based on the field type.
            - Creating the field definition.
            - Adding the field to the record layout.
            - Creating additional auxiliary system records for special field types
            - Physically adding the column to the database table.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL statements.
            db (MySQLConnection): Database connection used to commit or rollback transactions.
            object_name (str): Name of the table where the field will be created.
            field_data (dict): Dictionary containing all required information to create the field.

        Returns:
            dict: {"result": 1} if the process completes successfully.

        Raises:
            HTTPException: If a database error occurs
    """
    
    field_name = field_data["field_name"].replace(" ", "_").lower()
    field_type = field_data["field_type"]
    field_length = field_data["length"] if "length" in field_data else None
    numeric_precision = field_data["numeric_precision"] if "numeric_precision" in field_data else None
    numeric_scale = field_data["numeric_scale"] if "numeric_scale" in field_data else None
    reference_object = field_data["reference_object"] if "reference_object" in field_data else None
    reference_object_record_type = field_data["reference_object_record_type"] if "reference_object_record_type" in field_data else None
    reference_field = field_data["reference_field"] if "reference_field" in field_data else None
    lookup_filter = field_data["lookup_filter"] if "lookup_filter" in field_data else None
    aggregation_function = field_data["aggregation_function"] if "aggregation_function" in field_data else None

    options_values = field_data["options_values"].split("\n") if "options_values" in field_data else None
    try:
        field_length, sql_length = get_length_based_on_field_type(cursor, field_type, field_length, numeric_precision, numeric_scale, reference_object, reference_field)
        params = [
            (
                object_name,                        # object_name
                "master",                           # record_type_name
                field_name,                         # field_name
                field_type,                         # field_type
                field_length,                       # length
                numeric_precision,                  # numeric_precision
                numeric_scale,                      # numeric_scale
                reference_object,                   # reference_object
                reference_field,                    # reference_field
                field_data["is_active"],            # is_active
                field_data["is_visible"],           # is_visible
                field_data["is_editable"],          # is_editable
                field_data["is_required"],          # is_required
                0,                                  # is_primary_key
                lookup_filter                       # lookup_filter
            ),
        ]
        insert_field_definition(cursor, params)                 # Create the field_definition

        next_order = get_next_sort_order(cursor, "record_layout_definition", ["object_name"], [object_name])
        params = [
            (
                object_name,            # object_name
                "master",               # record_type_name
                field_name,             # field_name
                next_order+1            # sort_order
            )
        ]
        insert_record_layout_definition(cursor, params)         # Create the record_layout_definition


        # Create the ausiliar System object for the special types (ex: radio_checkbox_options, rollup_definition, related_list_definition, ..)
        data = {
            "object_name": object_name,
            "field_name": field_name,
            "reference_object": reference_object,
            "reference_object_rt": reference_object_record_type,
            "reference_field": reference_field,
            "aggregation_function": aggregation_function,
            "lookup_filter": lookup_filter,
            "options_values": options_values,
        }
        insert_ausiliar_extra_system_object(cursor, field_type, data)       
  
        # Create the actual field
        add_column(                
            cursor, 
            object_name, 
            field_name, 
            field_type, 
            sql_length
        )  
        db.commit() 
        return {"result": 1}
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()

        print('Error in the table create: ' + str(e))
        raise HTTPException(status_code=500, detail=str(e))

def get_length_based_on_field_type(cursor, field_type, field_length, numeric_precision, numeric_scale, reference_object, reference_field):
    """
        Determine the logical and SQL-level length of a field based on its type and configuration

        Args:
            cursor (MySQLCursor): Database cursor used to execute the SQL query
            field_type (str): The type of the field.
            field_length (str): The length provided by the user in the UI (can be None).
            numeric_precision (str): Number of digits before the decimal point provided by the user (can be None).
            numeric_scale (str): Number of digits after the decimal point provided by the user (can be None).
            reference_object (str): Name of the table referenced by the field (can be None).
            reference_field (str): Name of the field referenced by the field (can be None).

        Returns:
            tuple: A tuple containing:
                - int | None: The logical field length to store in the `field_definition` table.
                - int | str: The length definition used in the actual SQL column type. This may be a single integer
                            or a "precision, scale" pair for numeric fields.
    """
    

    if field_type == FieldTypes.TEXT.value:   
        return (field_length, field_length)                         # A text has already the field length setted from the user input
    elif field_type == FieldTypes.NUMBER.value:
        return (None, f'{numeric_precision}, {numeric_scale}')      # A number has a field length empty but an SQL length composed by the precision + scale
    elif field_type == FieldTypes.CHECKBOX.value:
        return (1, 1)                                               # A bool needs just one bit
    elif field_type == FieldTypes.RADIO.value:
         return (255, 255)                                          # A radio is a text with a specific set of values
    elif field_type in (FieldTypes.LOOKUP.value, FieldTypes.PICKLIST.value, FieldTypes.ROLLUP.value):
        query = f'''
        SELECT 
            length, 
            numeric_precision, 
            numeric_scale
        FROM field_definition
        WHERE 
            object_name = %s 
            AND field_name = %s;
        '''
        cursor.execute(query, (reference_object, reference_field))
        related_field = cursor.fetchall()[0]

        sql_length = related_field['length'] if related_field['length'] else f'{related_field["numeric_precision"]}, {related_field["numeric_scale"]}'
        return (related_field['length'], sql_length)                # Pointer fields inherit their length from the reference field

def insert_ausiliar_extra_system_object(cursor, field_type, data):
    """
        Create auxiliary system object records based on the field type.

        This method inserts additional system-level records required for specific field types. 
        For example, RADIO fields generate option entries, while ROLLUP fields create rollup configuration and related list definitions.

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            field_type (str): The type of the field.
            data (dict): A dictionary containing all required values for processing.
                        Expected keys include:
                        - "object_name"
                        - "field_name"
                        - "reference_object"
                        - "options_values" (for RADIO fields)
                        - "reference_field", "aggregation_function",
                        - "lookup_filter", "reference_object_rt" (for ROLLUP fields)

        Returns:
            None: The function performs one or more INSERT operations and does not return a value.

        Raises:
            HTTPException: If a database error occurs
    """

    object_name = data["object_name"]
    field_name = data["field_name"]
    reference_object = data["reference_object"]
    
    if field_type == FieldTypes.RADIO.value:
        radio_checkbox_options_params = []
        for idx, option in enumerate(data["options_values"]):
            radio_checkbox_options_params.append(
                (
                    object_name,
                    "master",
                    field_name,
                    idx,
                    option.replace(" ", "_").lower()[:255],
                    option[:255],
                    1
                )
            )

        insert_radio_checkbox_options(cursor, radio_checkbox_options_params)    # Create the radio options (must be created after the field for FK references)
    elif field_type == FieldTypes.ROLLUP.value: 
        query = f'''
        SELECT 
            field_name
        FROM field_definition
        WHERE 
            object_name = %s 
            AND field_type = "lookup"
            AND reference_object = %s
            AND is_active = 1
        '''
        cursor.execute(query, (reference_object, object_name))
        detail_join_key = cursor.fetchall()
        if len(detail_join_key) <= 0:
            raise HTTPException(status_code=500, detail="Missing lookup field")
        
        detail_join_key = detail_join_key[0]["field_name"]
        primary_key_field = get_primary_keys_from_multiple_objects(cursor, [object_name]).get(object_name)
        rollup_def_params = [
            (
                object_name,
                'master',
                primary_key_field,  # master_primary_key
                field_name,
                reference_object,
                detail_join_key,    # detail_join_key
                data["reference_field"], 
                data["aggregation_function"],
                data["lookup_filter"]
            )
        ]
        insert_rollup_definition(cursor, rollup_def_params)                 # Create the structure definition of the rollup field


        next_order = get_next_sort_order(
            cursor, 
            "related_list_definition", 
            ["master_object_name", "master_record_type_name", "child_object_name"],
            [(object_name, 'master', reference_object)]
        )
        reference_object_label = get_object_definition_records(cursor, [reference_object])[0]["label"]
        related_list_def_params = [
            (
                object_name,                # master_object_name
                'master',                   # master_record_type_name
                primary_key_field,          # master_primary_key
                reference_object,           # child_object_name
                data["reference_object_rt"],# child_record_type_name
                detail_join_key,            # detail_join_key
                reference_object_label,     # label
                next_order+1,               # sort_order
                None,                       # filter_condition
                1                           # is_active
            )   
        ]
        insert_related_list_definition(cursor, related_list_def_params)     # Create the related list definition



########## END - BASE DML System objects
def create_table(cursor, object_data, object_name, pk_field_name, pk_field_type, pk_field_length):
    field_type = convert_into_SQL_field_type(pk_field_type, pk_field_length)     # get the SQL field type

    command = f'''
    CREATE TABLE {object_name} (
    {pk_field_name} {field_type} PRIMARY KEY,
    object_name VARCHAR(255) NOT NULL DEFAULT '{object_name}',
    record_type_name VARCHAR(255) NOT NULL DEFAULT 'master'
    );
    '''
    cursor.execute(command)

def add_column(cursor, object_name, column_name, field_type, field_length):
    sql_field_type = convert_into_SQL_field_type(field_type, field_length)     # get the SQL field type
    
    # for Lookup fields there isn't a real contraint (from the DB point of view is a simple field unrelated) this because we can link also to non Id field 
    command = f'''
    ALTER TABLE {object_name}
    ADD {column_name} {sql_field_type}
    '''
    cursor.execute(command)

def delete_table(cursor, table_name):
    command = f'DROP TABLE IF EXISTS {table_name}'
    cursor.execute(command)

def insert_object_definition_record(cursor, params):
    command = """
    INSERT INTO object_definition(object_label, object_name, category, sort_order, is_system_object, is_single_record_type)
    VALUES (%s, %s, %s, %s, %s, %s);
    """
    cursor.executemany(command, params)

def insert_record_type_definition(cursor, params):
    command = """
    INSERT INTO record_type_definition(object_name, record_type_name, is_active)
    VALUES (%s, %s, %s);
    """
    cursor.executemany(command, params)

def insert_field_definition(cursor, params):
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
        lookup_filter
    )
    VALUES 
    (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    """
    cursor.executemany(command, params)

def insert_list_view_definition(cursor, params):
    command = """
    INSERT INTO list_view_definition(object_name, record_type_name, field_name, sort_order)
    VALUES (%s, %s, %s, %s);
    """
    cursor.executemany(command, params)

def insert_record_layout_definition(cursor, params):
    command = """
    INSERT INTO record_layout_definition(object_name, record_type_name, field_name, sort_order)
    VALUES (%s, %s, %s, %s);
    """
    cursor.executemany(command, params)

def insert_rollup_definition(cursor, params):
    command = """
    INSERT INTO rollup_definition (master_object_name, master_record_type_name, master_primary_key, master_field_name, 
        detail_object_name, detail_join_key, detail_field_name, aggregation_function, filter_condition)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
    """
    cursor.executemany(command, params)

def insert_related_list_definition(cursor, params):
    command = """
    INSERT INTO related_list_definition (master_object_name, master_record_type_name, master_primary_key, child_object_name, 
        child_record_type_name, child_join_key, label, sort_order, filter_condition, is_active)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    """
    cursor.executemany(command, params)

def get_next_sort_order(cursor, system_object_name, field_to_filter, params):
    where_filter = f'({", ".join(field_to_filter)})'
    placeholders = f'{", ".join(["%s"] * len(field_to_filter))}'
    flat_params = params

    if len(field_to_filter) > 1:
        placeholders = ",".join([f'({placeholders})'] * len(params))

        flat_params = []
        for t in params:
            flat_params.extend(t)

    query = f'''
    SELECT MAX(sort_order) sort_order
    FROM {system_object_name}
    WHERE {where_filter} IN ({placeholders});
    '''

    cursor.execute(query, tuple(flat_params,))
    order = cursor.fetchone()["sort_order"]
    return order if order else 1

def delete_record(cursor, table_name, fields_to_filter, params, operator=" AND "):
    if not fields_to_filter:
        raise ValueError("Missing field filters")

    placeholders = operator.join(f'{f} = %s' for f in fields_to_filter)

    command = f'''
    DELETE FROM {table_name} 
    WHERE {placeholders}
    '''
    cursor.execute(command, params)

def insert_radio_checkbox_options(cursor, params):
    command = """
    INSERT INTO radio_checkbox_options(object_name, record_type_name, field_name, sort_order, option_key, option_label, is_active)
    VALUES (%s, %s, %s, %s, %s, %s, %s);
    """
    cursor.executemany(command, params)
########## END - BASE DML System objects



def setup_get_field_structure_and_value_data(cursor, table_name, fields, record_id, current_field_type, field_attributes):
    """
        Retrieve the full structure and the values for all a specific fields.
        This function enriches field metadata with the current record values 

        Args:
            cursor (MySQLCursor): Database cursor used to execute SQL queries.
            table_name (str): Name of the database table.
            fields (list[dict]): List of dictionaries containing field metadata
            record_id (str): Primary key value of the record to retrieve.
            current_field_type (str): Type of the field
            field_attributes (dict): Definition of the field on the table field_definition 

        Returns:
            dict: A mapping of field names (capitalized) to dictionaries containing:
                - field metadata (type, reference, options, etc.)
                - current value for the given record
    """
    # THOSE ARE THE FIELD NAME USED IN THE K_Setup.js
    FIELD_NAME_REFERENCE_OBJECT_RECORD_TYPE = "reference_object_record_type"
    FIELD_NAME_AGGREGATION_FUNCTION = "aggregation_function"
    FIELD_NAME_OPTIONS_VALUES = "options_values"

    primary_key_field = get_primary_key_from_fields(fields)

    real_fields = fields
    if current_field_type in (FieldTypes.ROLLUP.value, FieldTypes.RADIO.value):
        # Calculate the correct set of fields to query
        # The real fields are the one on the field_definition table, the ausiliar are all the field derivated from other tables
        ausiliar_record_fields = {FIELD_NAME_REFERENCE_OBJECT_RECORD_TYPE, FIELD_NAME_AGGREGATION_FUNCTION, FIELD_NAME_OPTIONS_VALUES} 
        real_fields = []
        ausiliar_fields = []
        for f in fields:
            if f["field_name"] in ausiliar_record_fields:
                ausiliar_fields.append(f)
            else:
                real_fields.append(f)

    # Get the record infos
    record = get_single_record(cursor, table_name, real_fields, record_id, primary_key_field)    

    # Calculate the ausiliar fields
    if current_field_type == FieldTypes.ROLLUP.value:
        query = f'''
        SELECT aggregation_function, master_record_type_name
        FROM rollup_definition
        WHERE 
            master_field_name = '{record_id}';
        '''
        cursor.execute(query)
        result_records = cursor.fetchall()
        record[FIELD_NAME_AGGREGATION_FUNCTION] = result_records[0]["aggregation_function"]
        record[FIELD_NAME_REFERENCE_OBJECT_RECORD_TYPE] = result_records[0]["master_record_type_name"]

        reference_object_record_type_options = []
        for r in result_records:
            element = {"id": r["master_record_type_name"], "reference_field": r["master_record_type_name"].capitalize()}
            reference_object_record_type_options.append(element)
    elif current_field_type == FieldTypes.RADIO.value:
        map_checkbox_radio_options = get_checkbox_radio_options(cursor, [field_attributes])

        list_values = map_checkbox_radio_options.get(get_options_map_key(field_attributes))
        values = "\n".join(elem["option_key"] for elem in list_values)
        record[FIELD_NAME_OPTIONS_VALUES] = values

    field_structure = {}
    for row in fields:
        copy_row = row.copy()
        copy_row["value"] = record[row["field_name"]]

        if row["field_name"] in (FIELD_NAME_REFERENCE_OBJECT_RECORD_TYPE, ):
            copy_row['options'] = reference_object_record_type_options
            
        field_structure[row["field_name"].capitalize()] = copy_row

    return field_structure
