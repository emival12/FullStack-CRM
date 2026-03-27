import os
import sys
import configparser
import mysql.connector
import json
import logging
from fastapi import FastAPI, APIRouter, Depends, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import utils
import massiveImport
import backup_manager
import trigger_manager


app = FastAPI()
# Enable CORS to allow React to access APIs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000", "http://127.0.0.1:8000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_correct_path(file_name, is_external=False, dev_folder_path = None):
    if getattr(sys, 'frozen', False):
        # PRODUCTION   
        if is_external:
            base_path = os.path.dirname(sys.executable) # find the path of the EXE file  
        else:
            base_path = sys._MEIPASS                    # use the internal folder of the EXE 
    else:
        # DEVELOPMENT
        base_path = os.path.dirname(os.path.abspath(__file__)) # find the path of main.py
        if dev_folder_path:
            base_path =  os.path.join(os.path.dirname(base_path), dev_folder_path)

    return os.path.join(base_path, file_name)

def log_message(msg):
    if getattr(sys, 'frozen', False):
        logging.error(msg)
        return True 
    else:
        print(msg)
        return False

def log_err_and_throw_exception(msg, same_msg = True, throw_exc = True):
    is_prod = log_message(msg)
    if throw_exc and is_prod:
        raise Exception(msg if same_msg else msg.split(":")[0])

def get_config():
    CONFIG_PATH = get_correct_path("config.ini", is_external=True)
    
    if not os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, 'w') as f:
            f.write("[database]\nuser=root\npassword=\ndatabase=\n")
        log_err_and_throw_exception(f'Configuration file NOT FOUND in: {CONFIG_PATH}. Default file created', throw_exc = True)

    config = configparser.ConfigParser()
    config.read(CONFIG_PATH)
    return config

def get_current_config():
    return get_config() # Get the configuration file (outside the .exe) 

def get_triggers_folder():
    triggers_dir = get_correct_path("triggers", is_external=True)
    if not os.path.exists(triggers_dir):
        os.makedirs(triggers_dir)

    return triggers_dir

# Connect to MySQL database 
def get_db(config = Depends(get_current_config)):  
    conn = None
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user=config['database']['user'],             # MySQL user
            password=config['database']['password'],     # MySQL password
            database=config['database']['database']      # MySQL DB name
        )
        yield conn
    except mysql.connector.Error as err:
        log_err_and_throw_exception(f'Error on the database: {err}', False)
    finally:
        if conn and conn.is_connected():
            conn.close()

def split_table_name(table_name):
    t_name, sep, rt_name = table_name.rpartition("_")
    return t_name, rt_name

# EXPOSED API'S:
utils_router = APIRouter(prefix="/api", tags=["utils"])

###############################################
# UTILS
###############################################
# Try to login with a user
@utils_router.post("/login")
async def login_user(request: Request, db = Depends(get_db), config = Depends(get_current_config)):
    # Read the data from the body
    data = await request.json() 
    email = data.get("email")
    password = data.get("password")

    cursor = db.cursor(dictionary=True)
    result = utils.login_user(cursor, email, password)
    result["db_name"] = config["database"]["database"]
    cursor.close()
    return result

@utils_router.post("/check_connection")
async def check_user_login(request: Request, db = Depends(get_db), config = Depends(get_current_config)):
    # Read the data from the body
    data = await request.json() 
    email = data.get("email")
    db_name = data.get("db_name")

    # If the DB is changed we have to perform the logout
    current_db_in_config = config["database"]["database"]
    if db_name != current_db_in_config:
        utils.raise_input_exception(401, "DATABASE_CHANGED")

    cursor = db.cursor(dictionary=True)
    user_record = utils.get_user_definition_record(cursor, email)
    cursor.close()

    # If the user doens't match we have to perform the logout
    if not user_record or str(user_record["email"]) != str(email):
        utils.raise_input_exception(401, "INVALID_SESSION")

    return {"status": "ok"}


@utils_router.get("/translations/{browser_language}")
async def get_translation_file(browser_language: str):
    TRANSLATION_DIR = get_correct_path("translations", is_external=True, dev_folder_path="frontend\src\config")
    lang_code = browser_language.split("-")[0].lower()  
    file_path = os.path.join(TRANSLATION_DIR, f"{lang_code}.json")
    
    # 1. Check if exist the folder, otherwise create it 
    if not os.path.exists(TRANSLATION_DIR):
        os.makedirs(TRANSLATION_DIR, exist_ok=True)

    # 2. Check if exist the file, otherwise create it 
    if not os.path.exists(file_path):
        with open(file_path, 'w') as f:
            json.dump({}, f)
        log_err_and_throw_exception(f'Translation file NOT FOUND in: {file_path}. Default file created', throw_exc=False)

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as err:
        log_err_and_throw_exception(f'Error on the translation file: {err}', False)

@utils_router.get("/images/{image_name}")
async def get_image_file(image_name: str):
    IMG_DIR = get_correct_path("imgs", is_external=True, dev_folder_path="frontend\src\config")
    file_path = os.path.join(IMG_DIR, image_name)
    
    # 1. Check if exist the folder, otherwise create it 
    if not os.path.exists(IMG_DIR):
        os.makedirs(IMG_DIR, exist_ok=True)

    # 2. Check if exist the file, otherwise create it 
    if not os.path.exists(file_path):
        raise utils.raise_input_exception(404, "IMAGE_NOT_FOUND") 

    return FileResponse(file_path)



###############################################
# MASSIVE IMPORT
###############################################
massive_import_router = APIRouter(prefix="/api", tags=["massive_import"])

# Get the list of all the tables in options syntax
@massive_import_router.get("/import")
async def get_list_of_importable_objects(db = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
        
    tables = utils.get_object_definition_records(cursor)

    options_tables = []
    for t in tables:
        options_tables.append({
            "reference_field": t["label"],
            "id": t["key"],
        })

    cursor.close()
    return options_tables

# Import records from a CSV file
@massive_import_router.post("/import/upload")
async def import_records_from_csv(
    operation_type: str = Form(...),
    object_name: str = Form(...),
    user_id: str = Form(...),
    file: UploadFile = File(...),
    db = Depends(get_db)
):
    file_contents = await file.read()
    try:
        file_decoded = file_contents.decode('utf-8')
    except Exception as err:
        utils.raise_input_exception(400, "IMPORT_FILE_ENCODING_INVALID")

    cursor = db.cursor(dictionary=True)
    massiveImport.elaborate_import_file(db, cursor, operation_type, object_name, user_id, file_decoded)
    cursor.close()

    return {"result": 1}


###############################################
# DATABASE
###############################################
data_router = APIRouter(prefix="/api", tags=["data"])

# Get all the tables to show in the sidebar
@data_router.get("/plain_tables")
def get_tables_plain(db = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    tables = utils.get_object_definition_records(cursor)
    
    cursor.close()
    return tables

@data_router.get("/tables")
def get_tables(db = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    tables = utils.get_object_definition_records_join_rt(cursor)
    structure = utils.group_object_definition_by_category(tables)

    cursor.close()
    return structure

# Get all the records of an object
@data_router.get("/{table_name}")
def get_table_records(table_name: str, db = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    utils.check_allowed_tables(cursor, table_name)                                                       # Evaluate input value (Avoid SQLInjection)
    (table_name, record_type_name) = split_table_name(table_name)                                        # table_name == ObjectName_RecordTypeName

    dict_fields = utils.get_list_view_definition_fields(cursor, [(table_name, record_type_name)])        # retrieve fields definitions on the list view
    fields = dict_fields.get(utils.get_table_key_from_strings(table_name, record_type_name))

    (fields_text, joins, group) = utils.build_field_value_select_clause(cursor, fields, table_name)      # retrieve SQL clause from the fields, to extract the values of the fields
    records = utils.build_query(cursor, table_name, record_type_name, fields_text, joins, group) # make the query using the clauses created 

    cursor.close()
    return {
        "fields": utils.get_clean_field_names_from_fields(fields),
        "primary_key_name": utils.get_primary_key_from_fields(fields),
        "records": records
    }

# Get all the fields values with their structure of a single record
@data_router.get("/{table_name}/record")
def get_record_info(table_name: str, record_id: str, db = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    utils.check_allowed_tables(cursor, table_name)                                                              # Evaluate input value (Avoid SQLInjection)
    (table_name, record_type_name) = split_table_name(table_name)                                               # table_name == ObjectName_RecordTypeName
    fields = utils.get_record_layout_definition_fields(cursor, table_name, record_type_name)                    # retrieve fields definitions on the record Layout

    field_structure = utils.get_field_structure_and_value(cursor, table_name, fields, record_id)                # retrive structure and values of the field 

    related_lists = utils.get_related_list_definition_fields(cursor, table_name, record_type_name)              # retrieve all the related list of the object
    related_list_key_field_map = { rl["child_object_name"]: rl["child_join_key"] for rl in related_lists}
    tables = utils.get_object_definition_records_join_rt(cursor, [rl["child_object_name"] for rl in related_lists])     # retrieve the description of the child table
    
    tables_dict = {table["key"]: table for table in tables}
    rel_lists = utils.get_related_list_value(                                                                   # create the relatedList structure with values
        cursor, 
        table_name, 
        record_id, 
        record_type_name, 
        related_lists, 
        related_list_key_field_map, 
        tables_dict
    )  

    cursor.close()
    return { 
        "primary_key_name": utils.get_primary_key_from_fields(fields),
        "field_structure": field_structure, 
        "related_list": rel_lists
    }

# Get all the fields structure of an object
@data_router.get("/{table_name}/new-record")
def get_new_record_structure(table_name: str, db = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    utils.check_allowed_tables(cursor, table_name)
    (table_name, record_type_name) = split_table_name(table_name)  

    fields = utils.get_record_layout_definition_fields(cursor, table_name, record_type_name, utils.RLD_VISIBLE_AND_EDITABLE_FILTER)     # retrieve fields definitions on the record Layout
    field_structure = utils.get_field_structure(cursor, table_name, fields)                                                             # retrive structure and values of the field 

    cursor.close()
    return field_structure

# Delete a single record
@data_router.post("/delete")
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
@data_router.post("/insert")
async def update_record(request: Request, db = Depends(get_db)):
    # Read the data from the body
    data = await request.json() 
    table_name = data.get("table")
    record = data.get("record")
    user = data.get("user")

    cursor = db.cursor(dictionary=True)

    utils.check_allowed_tables(cursor, table_name)                              # Evaluate input value (Avoid SQLInjection)
    (table_name, record_type_name) = split_table_name(table_name)               # table_name == ObjectName_RecordTypeName

    record["record_type_name"] = record_type_name
    map_object_primary_key_names = utils.get_primary_keys_from_multiple_objects(cursor, [table_name])
    primary_key_field = map_object_primary_key_names.get(table_name)

    record, complex_formula = trigger_manager.get_record_for_processing(
        cursor, 
        table_name, 
        record_type_name, 
        primary_key_field,
        record=record
    )
    record = trigger_manager.process_system_formulas(cursor, table_name, record, complex_formula)
    record = trigger_manager.run_triggers(cursor, get_triggers_folder(), table_name, "BEFORE", "INSERT", record, log_err_and_throw_exception)
    result = utils.insert_new_record(cursor, db, table_name, [record], user["id"])    # execute the actual insert

    new_id = result.get("last_row_id")
    record["id"] = new_id 
    impacted_parents = trigger_manager.get_impacted_parents(cursor, table_name, new_id, record)
    if impacted_parents:
        trigger_manager.refresh_parents(cursor, db, impacted_parents, user["id"])

    trigger_manager.run_triggers(cursor, get_triggers_folder(), table_name, "AFTER", "INSERT", record, log_err_and_throw_exception)

    cursor.close()
    return result

# Update a single record
@data_router.post("/update")
async def update_record(request: Request, db = Depends(get_db)):
    # Read the data from the body
    data = await request.json() 
    table_name = data.get("table")
    record_id = data.get("id")
    user = data.get("user")
    field_structure = data.get("field")

    cursor = db.cursor(dictionary=True)

    utils.check_allowed_tables(cursor, table_name)                                                                              # Evaluate input value (Avoid SQLInjection)
    (table_name, record_type_name) = split_table_name(table_name)                                                               # table_name == ObjectName_RecordTypeName
    primary_key_field = utils.get_primary_keys_from_multiple_objects(cursor, [table_name]).get(table_name)                      # get the name of the PK of the object
    
    fields = utils.get_record_layout_definition_fields(cursor, table_name, record_type_name)
    old_record = utils.get_single_record(cursor, table_name, fields, [primary_key_field], [record_id])
    current_record, complex_formula = trigger_manager.get_record_for_processing(
        cursor, 
        table_name, 
        record_type_name, 
        primary_key_field=primary_key_field, 
        record_id=record_id, 
        record=field_structure
    )
    current_record = trigger_manager.process_system_formulas(cursor, table_name, current_record, complex_formula)
    current_record = trigger_manager.run_triggers(cursor, get_triggers_folder(), table_name, "BEFORE", "UPDATE", current_record, log_err_and_throw_exception)
    result = utils.update_record_by_id(
        cursor, 
        db, 
        table_name, 
        record_type_name, 
        current_record, 
        primary_key_field, 
        record_id,
        user["id"]
    ) 

    impacted_parents = trigger_manager.get_impacted_parents(cursor, table_name, record_id, current_record, old_record)
    if impacted_parents:
        trigger_manager.refresh_parents(cursor, db, impacted_parents, user["id"])

    trigger_manager.run_triggers(cursor, get_triggers_folder(), table_name, "AFTER", "UPDATE", current_record, log_err_and_throw_exception)

    cursor.close()
    return result



###############################################
# SETUP
###############################################
setup_router = APIRouter(prefix="/api/setup", tags=["setup"])

# Get all the fields structure for the creation of a new field
@setup_router.get("/field/new/structure")
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

        if row["field_type"] in (utils.FieldTypes.NUMBER.value, utils.FieldTypes.FORMULA.value):
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

# Get the structure of the table
@setup_router.get("/{table_name}")
async def get_object_definition(table_name: str, db = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
        
    utils.check_allowed_tables(cursor, table_name, utils.get_basic_table_key)       
    tables = utils.get_object_definition_records(cursor, [table_name])
    
    cursor.close()
    return tables[0] if len(tables) > 0 else {}

# Get all the fields of an object
@setup_router.get("/{table_name}/fields")
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
        "fields": utils.get_clean_field_names_from_fields(fields, False),
        "primary_key_name": "field_name",
        "records": records
    }


# Insert a new table in the database
@setup_router.post("/new-object")
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

# Delete a single table
@setup_router.post("/home/delete")
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
@setup_router.post("/home/update")
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

# Delete a field from an object
@setup_router.post("/fields/delete")
async def delete_field(request: Request, db = Depends(get_db)):
    # Read the data from the body
    data = await request.json() 
    table_name = data.get("table")
    field_name = data.get("fieldName")

    cursor = db.cursor(dictionary=True)
    utils.check_allowed_tables(cursor, table_name, utils.get_basic_table_key)               # Evaluate input value (Avoid SQLInjection)

    field_attributes = utils.get_field_definition_by_field_name(cursor, table_name, field_name)   # Get the definition of the field
    current_field_type = field_attributes["field_type"]                                     # Get the field type from the field definition

    result = utils.delete_field_from_table(cursor, db, table_name, field_name, current_field_type)
    cursor.close()
    return result

# Insert a new field
@setup_router.post("/{table_name}/field/new")
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
@setup_router.post("/{table_name}/fields/{field_name}")
async def get_field_info(request: Request, table_name: str, field_name: str, db = Depends(get_db)):
    # Read the data from the body
    data = await request.json() 
    list_fields_by_type = data.get("listFields")

    cursor = db.cursor(dictionary=True)
    utils.check_allowed_tables(cursor, table_name, utils.get_basic_table_key)                       # Evaluate input value (Avoid SQLInjection)

    field_attributes = utils.get_field_definition_by_field_name(cursor, table_name, field_name)     # Get the definition of the field
    current_field_type = field_attributes["field_type"]                                             # Get the field type from the field definition

    fields = list(list_fields_by_type[current_field_type].values())                                 # Get the list of fields related to the type (Ex: number has the precision, text has the lenght)
    field_structure = utils.setup_get_field_structure_and_value_data(
        cursor, 
        "field_definition", 
        fields, 
        field_name, 
        current_field_type, 
        field_attributes
    )   

    object_primary_key_name = utils.get_primary_keys_from_multiple_objects(cursor, [table_name]).get(table_name)
    cursor.close()
    return { 
        "object_primary_key_name": object_primary_key_name,
        "field_type": current_field_type,
        "primary_key_name": utils.get_primary_key_from_fields(fields),
        "field_structure": field_structure
    }



app.include_router(utils_router)
app.include_router(massive_import_router)
app.include_router(setup_router) 
app.include_router(data_router)


###############################################
# PRODUCTION
###############################################
# Get the build directory 
BUILD_DIR = get_correct_path("build", dev_folder_path="frontend")

# Mount static files
app.mount("/static", StaticFiles(directory=os.path.join(BUILD_DIR, "static")), name="static")

@app.get("/{catchall:path}")
async def serve_react_app(request: Request, catchall: str):
    file_path = os.path.join(BUILD_DIR, catchall)
    
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    
    return FileResponse(os.path.join(BUILD_DIR, "index.html"))




@app.on_event("startup")
async def startup_event():
    config = get_current_config()
    BACKUP_DIR = get_correct_path("backups", is_external=True, dev_folder_path="frontend\src\config")
    
    backup_manager.check_and_run_smart_backup(config, BACKUP_DIR, log_message)