import mysql.connector
from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import utils

app = FastAPI()

# Enable CORS to allow React to access APIs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to MySQL database 
def get_db():
    conn = mysql.connector.connect(
        host="localhost",
        user="root",                # MySQL user
        password="root",            # MySQL password
        database="testnegozio"      # MySQL DB name
    )
    try:
        yield conn
    finally:
        conn.close()

def split_table_name(table_name):
    t_name, sep, rt_name = table_name.rpartition("_")
    return t_name, rt_name

# EXPOSED API'S:
# Get all the tables to show in the sidebar
@app.get("/plain_tables")
def get_tables_plain(db = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    tables = utils.get_object_definition_records(cursor)
    
    cursor.close()
    return tables

@app.get("/tables")
def get_tables(db = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    tables = utils.get_object_definition_records_join_rt(cursor)
    structure = utils.group_object_definition_by_category(tables)

    cursor.close()
    return structure


# Get all the records of an object
@app.get("/{table_name}")
def get_table_records(table_name: str, db = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    utils.check_allowed_tables(cursor, table_name)                                                                  # Evaluate input value (Avoid SQLInjection)
    (table_name, record_type_name) = split_table_name(table_name)                                                   # table_name == ObjectName_RecordTypeName

    dict_fields = utils.get_list_view_definition_fields(cursor, [(table_name, record_type_name)])                   # retrieve fields definitions on the list view
    fields = dict_fields.get(utils.get_table_key_from_strings(table_name, record_type_name))

    (fields_text, joins, has_group, group) = utils.build_field_value_select_clause(cursor, fields, table_name)      # retrieve SQL clause from the fields, to extract the values of the fields
    records = utils.build_query(cursor, table_name, record_type_name, fields_text, joins, has_group, group)         # make the query using the clauses created 

    cursor.close()
    return {
        "fields": utils.get_clean_field_names_from_fields(fields),
        "primary_key_name": utils.get_primary_key_from_fields(fields),
        "records": records
    }


# Get all the fields values with their structure of a single record
@app.get("/{table_name}/record/{record_id}")
def get_record_info(table_name: str, record_id: str, db = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    utils.check_allowed_tables(cursor, table_name)                                                              # Evaluate input value (Avoid SQLInjection)
    (table_name, record_type_name) = split_table_name(table_name)                                               # table_name == ObjectName_RecordTypeName
    fields = utils.get_record_layout_definition_fields(cursor, table_name, record_type_name)                    # retrieve fields definitions on the record Layout

    field_structure = utils.get_field_structure_and_value(cursor, table_name, fields, record_id)                # retrive structure and values of the field 

    related_lists = utils.get_related_list_definition_fields(cursor, table_name, record_type_name)              # retrieve all the related list of the object
    tables = utils.get_object_definition_records_join_rt(cursor, [rl["child_object_name"] for rl in related_lists])     # retrieve the description of the child table
    
    tables_dict = {table["key"]: table for table in tables}
    rel_lists = utils.get_related_list_value(cursor, table_name, record_type_name, related_lists, tables_dict)  # create the relatedList structure with values

    cursor.close()
    return { 
        "primary_key_name": utils.get_primary_key_from_fields(fields),
        "field_structure": field_structure, 
        "related_list": rel_lists
    }


# Get all the fields structure of an object
@app.get("/{table_name}/new-record")
def get_new_record_structure(table_name: str, db = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    utils.check_allowed_tables(cursor, table_name)
    (table_name, record_type_name) = split_table_name(table_name)  

    fields = utils.get_record_layout_definition_fields(cursor, table_name, record_type_name, utils.RLD_VISIBLE_AND_EDITABLE_FILTER)     # retrieve fields definitions on the record Layout
    field_structure = utils.get_field_structure(cursor, table_name, fields)                                                             # retrive structure and values of the field 

    cursor.close()
    return field_structure


# Delete a single record
@app.post("/Delete")
async def delete_record(request: Request, db = Depends(get_db)):
    # Read the data from the body
    data = await request.json() 
    table_name = data.get("table")
    record_id = data.get("id")

    cursor = db.cursor(dictionary=True)

    utils.check_allowed_tables(cursor, table_name)                                                              # Evaluate input value (Avoid SQLInjection)
    (table_name, record_type_name) = split_table_name(table_name)                                                       # table_name == ObjectName_RecordTypeName
    primary_key_field = utils.get_primary_keys_from_multiple_objects(cursor, [table_name]).get(table_name)      # get the name of the PK of the object

    result = utils.delete_record_by_id(cursor, db, table_name, record_type_name, primary_key_field, record_id)  # execute the actual delete
    cursor.close()
    return result


# Insert a new record
@app.post("/Insert")
async def update_record(request: Request, db = Depends(get_db)):
    # Read the data from the body
    data = await request.json() 
    table_name = data.get("table")
    record = data.get("record")

    cursor = db.cursor(dictionary=True)

    utils.check_allowed_tables(cursor, table_name)                      # Evaluate input value (Avoid SQLInjection)
    (table_name, record_type_name) = split_table_name(table_name)       # table_name == ObjectName_RecordTypeName

    result = utils.insert_new_record(cursor, db, table_name, [record])  # execute the actual insert
    cursor.close()
    return result


# Update a single record
@app.post("/Update")
async def update_record(request: Request, db = Depends(get_db)):
    # Read the data from the body
    data = await request.json() 
    table_name = data.get("table")
    record_id = data.get("id")
    field_structure = data.get("field")

    cursor = db.cursor(dictionary=True)

    utils.check_allowed_tables(cursor, table_name)                                                                              # Evaluate input value (Avoid SQLInjection)
    (table_name, record_type_name) = split_table_name(table_name)                                                                       # table_name == ObjectName_RecordTypeName
    primary_key_field = utils.get_primary_keys_from_multiple_objects(cursor, [table_name]).get(table_name)                      # get the name of the PK of the object
    

    result = utils.update_record_by_id(cursor, db, table_name, record_type_name, field_structure, primary_key_field, record_id) # execute the actual update
    cursor.close()
    return result



###############################################
# SETUP
###############################################

# Insert a new table in the database
@app.post("/new-object")
async def create_new_object(request: Request, db = Depends(get_db)):
    # Read the data from the body
    data = await request.json() 
    object_data = data.get("data")

    cursor = db.cursor(dictionary=True)

    result = utils.create_new_object(cursor, db, object_data)

    cursor.close()
    return result

    """
        Per cancellare il test:
        
        DROP TABLE aaa;
        DELETE FROM object_definition WHERE object_name = 'aaa';
        DELETE FROM record_type_definition WHERE object_name = 'aaa';
        DELETE FROM field_definition WHERE object_name = 'aaa';
    """

# Get the structure of the table
@app.get("/setup/{table_name}")
async def get_object_definition(table_name: str, db = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
        
    utils.check_allowed_tables(cursor, table_name, utils.get_basic_table_key)       
    tables = utils.get_object_definition_records(cursor, [table_name])
    
    cursor.close()
    return tables[0] if len(tables) > 0 else {}

# Delete a single table
@app.post("/setup/home/Delete")
async def delete_object(request: Request, db = Depends(get_db)):
    # Read the data from the body
    data = await request.json() 
    table_name = data.get("table")

    cursor = db.cursor(dictionary=True)

    utils.check_allowed_tables(cursor, table_name, utils.get_basic_table_key)
    result = utils.delete_object(cursor, db, table_name)

    cursor.close()
    return result

# Update a single table
@app.post("/setup/home/Update")
async def update_object(request: Request, db = Depends(get_db)):
    # Read the data from the body
    data = await request.json() 
    table_name = data.get("table")
    field_structure = data.get("field")

    cursor = db.cursor(dictionary=True)

    utils.check_allowed_tables(cursor, table_name, utils.get_basic_table_key)
    result = utils.update_record_by_id(cursor, db, "object_definition", None, field_structure, "object_name", table_name)
    cursor.close()

    return {}

# Get all the fields structure for the creation of a new field
@app.get("/setup/field/new/structure")
async def get_field_creation_structure(db = Depends(get_db)):
    field_types = {}
    for ft in utils.FieldTypes:
        field_types[ft.name] = ft.value

    cursor = db.cursor(dictionary=True)
    tables = utils.get_object_definition_records(cursor)

    fields = utils.get_field_names_grouped_by_objects(
        cursor, 
        tables, 
        ["object_name", "record_type_name", "field_name", "field_type"],
        True
    )
    grouped_fields = {}
    grouped_fields_rollup = {}
    grouped_rt = {}
    for row in fields:
        grouped_fields.setdefault(row["object_name"], set()).add(row["field_name"])

        if row["field_type"] == utils.FieldTypes.NUMBER.value:
            grouped_fields_rollup.setdefault(row["object_name"], set()).add(row["field_name"])
        grouped_rt.setdefault(row["object_name"], set()).add(row["record_type_name"])

    cursor.close()
    return {
        "field_types": field_types,
        "lookup_options": tables,
        "fields_options": grouped_fields,
        "fields_options_rollup": grouped_fields_rollup,
        "rt_options": grouped_rt
    }

# Get all the fields of an object
@app.get("/setup/{table_name}/fields")
async def get_object_fields_record(table_name: str, db = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
        
    utils.check_allowed_tables(cursor, table_name, utils.get_basic_table_key)       

    fields = ["field_name", "field_type", "reference_object"]
    records = utils.get_field_names_grouped_by_objects(
        cursor, 
        [{"object_name": table_name}], 
        fields,
        False
    )

    cursor.close()
    return {
        "fields": [field.replace("_", " ") for field in fields],
        "primary_key_name": "field_name",
        "records": records
    }

# Insert a new field
@app.post("/setup/{table_name}/field/new")
async def create_new_field(request: Request, db = Depends(get_db)):
    # Read the data from the body
    data = await request.json() 
    table_name = data.get("table")
    field_data = data.get("record")

    cursor = db.cursor(dictionary=True)

    result = utils.create_new_field(cursor, db, table_name, field_data)

    cursor.close()
    return result




# Get all the values of the field with their structure
@app.post("/setup/{table_name}/fields/{field_name}")
async def get_field_info(request: Request, table_name: str, field_name: str, db = Depends(get_db)):
    # Read the data from the body
    data = await request.json() 
    list_fields_by_type = data.get("listFields")

    cursor = db.cursor(dictionary=True)
    utils.check_allowed_tables(cursor, table_name, utils.get_basic_table_key)               # Evaluate input value (Avoid SQLInjection)

    field_attributes = utils.get_record_layout_definition_fields(                           # Get the definition of the field
        cursor, 
        table_name, 
        "master", 
        utils.RLD_SINGLE_FIELD_NAME_FILTER, 
        [field_name]
    )
    if not len(field_attributes):
        raise HTTPException(status_code=404, detail=f'Field \'{field_name}\' not found')
    
    field_attributes = field_attributes[0]                                                  # Just 1 record expected
    current_field_type = field_attributes["field_type"]                                     # Get the field type from the field definition
    fields = list(list_fields_by_type[current_field_type].values())                         # Get the list of fields related to the type (Ex: number has the precision, text has the lenght)

    field_structure = utils.setup_get_field_structure_and_value_data(
        cursor, 
        "field_definition", 
        fields, 
        field_name, 
        current_field_type, 
        field_attributes
    )   

    return { 
        "field_type": current_field_type,
        "primary_key_name": utils.get_primary_key_from_fields(fields),
        "field_structure": field_structure
    }

