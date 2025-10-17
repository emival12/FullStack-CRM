import mysql.connector
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

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


# EXPOSED API'S:
# Get all the tables to show in the sidebar
@app.get("/tables")
def get_tables(db = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    query = """
    SELECT od.object_name, rtd.record_type_name, od.category, od.sort_order, od.is_system_object, od.is_single_record_type
    FROM object_definition od
    LEFT JOIN record_type_definition rtd ON od.object_name = rtd.object_name
    WHERE rtd.is_active = 1
    ORDER BY od.sort_order ASC;
    """
    cursor.execute(query)
    tables = cursor.fetchall()

    for table in tables:
        table["key"] =  get_table_key(table)
        table["label"] = table["object_name"].capitalize() if table["is_single_record_type"] else table["record_type_name"].capitalize() 

    structure = dict()
    for table in tables:
        is_single_rt = table["is_single_record_type"]
        cat = table["category"].capitalize()
        obj_name = table["object_name"].capitalize()

        # if doesn't exist create the Category 
        if cat not in structure:
            structure[cat] = [] if is_single_rt else dict()

        if is_single_rt:
            structure[cat].append(table) # if is single RT append the tables inside the Category 
        else:
            # if doesn't exist create the object container of the RTs 
            if obj_name not in structure[cat]:
                structure[cat][obj_name] = []

            structure[cat][obj_name].append(table) # if is multi RT append the tables inside the object container 

    cursor.close()
    return structure

def get_table_key(row):
    return row["object_name"] + '_' + row["record_type_name"]


# Get all the records of an object
@app.get("/table/{table_name}")
def get_table_records(table_name: str, db = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    
    # Check if the table in input is a correct table (Avoid SQLInjection, corner case quasi inutile)
    check_allowed_tables(cursor, table_name)
    
    # table_name is ObjectName_RecordTypeName
    (table_name, record_type_name) = table_name.split("_")

    # get the list of the field active for that specific object and record type
    query = """
    SELECT object_name, field_name, field_type, reference_object
    FROM field_definition
    WHERE object_name = %s AND record_type_name = %s AND is_active = 1 AND is_visible = 1;
    """
    cursor.execute(query, (table_name, record_type_name))
    fields = cursor.fetchall()
    fields_text = ",".join(row["field_name"] for row in fields)

    # get records (take only the active fields)
    query = "SELECT " + fields_text + " FROM " + table_name + " WHERE record_type_name = %s;"
    cursor.execute(query, (record_type_name,))
    records = cursor.fetchall()

    cursor.close()
    return records


def check_allowed_tables(cursor, table_name):
    query = """
    SELECT od.object_name, rtd.record_type_name, od.is_single_record_type 
    FROM object_definition od
    LEFT JOIN record_type_definition rtd ON od.object_name = rtd.object_name
    WHERE rtd.is_active = 1;
    """
    cursor.execute(query)

    allowed_tables = []
    for row in cursor.fetchall():
        allowed_tables.append(get_table_key(row))
    
    if table_name not in set(allowed_tables):
        raise HTTPException(status_code=404, detail="Table not found")