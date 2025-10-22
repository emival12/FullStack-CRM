import mysql.connector
from fastapi import FastAPI, Depends, Request, HTTPException
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
            structure[cat] = []

        if is_single_rt:
            structure[cat].append(table) # if is single RT append the tables inside the Category 
        else:
            # if doesn't exist create the object container of the RTs 
            if len(structure[cat]) == 0 or obj_name not in structure[cat][len(structure[cat])-1]:
                structure[cat].append({obj_name: []})

            structure[cat][len(structure[cat])-1][obj_name].append(table) # if is multi RT append the tables inside the object container 

    cursor.close()
    return structure

def get_table_key(row):
    return row["object_name"] + '_' + row["record_type_name"]



# Get all the records of an object
@app.get("/{table_name}")
def get_table_records(table_name: str, db = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    
    # Check if the table in input is a correct table (Avoid SQLInjection, corner case quasi inutile)
    check_allowed_tables(cursor, table_name)
    
    # table_name is ObjectName_RecordTypeName
    (table_name, record_type_name) = table_name.split("_")

    # get the list of the LIST VIEW fields active for that specific object and record type
    query = """
    SELECT fd.object_name, fd.record_type_name, fd.field_name, fd.field_type, fd.reference_object, fd.reference_field, fd.is_primary_key
    FROM list_view_definition lvd
    JOIN field_definition fd ON 
        lvd.object_name = fd.object_name AND 
        lvd.record_type_name = fd.record_type_name AND 
        lvd.field_name = fd.field_name
    WHERE fd.object_name = %s AND fd.record_type_name = %s AND fd.is_active = 1 AND fd.is_visible = 1
    ORDER BY lvd.sort_order ASC;
    """
    cursor.execute(query, (table_name, record_type_name))
    fields = cursor.fetchall()

    # get the list of fields name, join clauses and group clause
    alias_table_name = table_name[0]
    (fields_text, joins, group) = get_fields_text(cursor, fields, alias_table_name)

    # get records
    query = "SELECT " + fields_text + " FROM " + table_name + ' ' + alias_table_name
    query += (" " + " ".join(joins) if joins else "") + " WHERE " + alias_table_name + "." + "record_type_name = %s"
    query += (group + ";" if group else ";")
    cursor.execute(query, (record_type_name,))
    records = cursor.fetchall()

    cursor.close()
    return {
        "fields": [field["field_name"].replace("_", " ") for field in fields],
        "primary_key_name": next((field["field_name"] for field in fields if field["is_primary_key"]), None),
        "records": records
    }

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

# Starting from a list of field the method create 2 output:
#   - A text with all the field needed to be extracted 
#   - A list with all the joins clause to add to a query
#   - A text with all the field to add in the GROUP BY clause 
def get_fields_text(cursor, fields, alias_table_name):
    object_primary_key_names = get_object_primary_keys(
        cursor,
        fields,
        lambda row: row["reference_object"] is not None
    )

    joins = []
    group = ""
    remove_from_group = []
    fields_text = ""
    for idx, row in enumerate(fields):
        fieldSyntax = ""
        if row["reference_object"] and (row["field_type"] == "picklist" or row["field_type"] == "lookup"):
            # If is a linked fields we have to:
            #   - insert a JOIN clause and match the current FK saved in field name with the actual PK saved in the map created before
            #   - add to the list of the field to retrieve the field reference field located in the other object
            alias_join_table = row["reference_object"][0]
            join_table_name = row["reference_object"]

            table_field = alias_table_name + "." + row["field_name"]
            join_field = alias_join_table + "." + object_primary_key_names.get(join_table_name)
            join_clause = "JOIN " + join_table_name + " " + alias_join_table + " ON " + table_field + " = " + join_field
            joins.append(join_clause)

            fieldSyntax = alias_join_table + "." + row["reference_field"] + " " + row["field_name"]
        elif row["reference_object"] and row["field_type"] == "rollup":
            query = """
            SELECT master_object_name, master_record_type_name, master_primary_key, master_field_name, 
                detail_object_name, detail_join_key, detail_field_name, aggregation_function, filter_condition
            FROM rollup_definition
            WHERE master_object_name = %s AND master_record_type_name = %s AND master_field_name = %s 
                AND detail_object_name = %s
            """
            cursor.execute(query, (row["object_name"], row["record_type_name"], row["field_name"], row["reference_object"]))
            rollup_definition = cursor.fetchall()[0]
            
            alias_join_table = row["reference_object"][0]
            join_table_name = row["reference_object"]

            table_field = alias_table_name + "." + rollup_definition["master_primary_key"]
            join_field = alias_join_table + "." + rollup_definition["detail_join_key"]
            join_clause = "LEFT JOIN " + join_table_name + " " + alias_join_table + " ON " + table_field + " = " + join_field
            joins.append(join_clause)

            fieldSyntax = rollup_definition["aggregation_function"] + "(" + alias_join_table + "." + rollup_definition["detail_field_name"] + ") " + rollup_definition["master_field_name"]
            group = " GROUP BY "
            remove_from_group.append(fieldSyntax)
        else:
            # If is a normal field we have to add it to the list of the field to retrive
            fieldSyntax = alias_table_name + "." + row["field_name"]

        fields_text += (", " if idx != 0 else "") + fieldSyntax


    # If there is a group clause create the list of field to group
    if group:
        fields = [f.strip() for f in fields_text.split(",")]
        group_fields = []
        for f in fields:
            if f in remove_from_group:
                continue

            parts = f.split() #if contains an alia take only the first part
            if len(parts) > 1:
                f = parts[0]
            group_fields.append(f)

        group += ", ".join(group_fields)

    return (fields_text, joins, group)



# Get a map with the primary key for each object that respect the condition
def get_object_primary_keys(cursor, fields, object_condition):
    # Get the list of the object linked through a lookup/picklist
    object_names = [row["reference_object"] for row in fields if object_condition(row)]

    if len(object_names) == 0:
        return {}

    # Generate N strings %s to add in the query
    placeholders = ", ".join(["%s"] * len(object_names))
    query = """
    SELECT object_name, field_name
    FROM field_definition
    WHERE object_name IN (""" + placeholders + ") AND is_active = 1 AND is_primary_key = 1;"
    cursor.execute(query, tuple(object_names))

    # Create a dictionary with the structure { "tableName": "keyName" } 
    #In this way we can access directly the key name without loop
    return {row["object_name"]: row["field_name"] for row in cursor.fetchall()}



# Get all the fields with their structure
@app.get("/{table_name}/record/{record_id}")
def get_table_records(table_name: str, record_id: str, db = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    # Check if the table in input is a correct table (Avoid SQLInjection, corner case quasi inutile)
    check_allowed_tables(cursor, table_name)

    # table_name is ObjectName_RecordTypeName
    (table_name, record_type_name) = table_name.split("_")

    # get the list of the fields active for that specific object and record type
    query = """
    SELECT fd.object_name, fd.record_type_name,  fd.field_name, fd.field_type, fd.length, fd.numeric_precision, fd.numeric_scale, fd.reference_object, fd.reference_field, 
        fd.is_editable, fd.is_required, fd.is_primary_key, fd.lookup_filter
    FROM record_layout_definition rvd
    JOIN field_definition fd ON 
        rvd.object_name = fd.object_name AND 
        rvd.record_type_name = fd.record_type_name AND 
        rvd.field_name = fd.field_name
    WHERE fd.object_name = %s AND fd.record_type_name = %s AND fd.is_active = 1 AND fd.is_visible = 1
    ORDER BY rvd.sort_order ASC;
    """
    cursor.execute(query, (table_name, record_type_name))
    fields = cursor.fetchall()

    ### SECTION: Retrieve records
    # get the list of fields name
    fields_text = ", ".join(row["field_name"] for row in fields)
    
    # get records
    primary_key_field = next((field["field_name"] for field in fields if field["is_primary_key"]), None)
    query = "SELECT " + fields_text + " FROM " + table_name + " WHERE record_type_name = %s AND " + primary_key_field + " = %s;"
    cursor.execute(query, (record_type_name, record_id))
    record = cursor.fetchall()[0]

    ### SECTION: Retrieve Field Structure. For the picklist/lookup take also the pair (key, value) to show the picklist choice
    object_primary_key_names = get_object_primary_keys(
        cursor,
        fields,
        lambda row: row["field_type"] == "picklist" or row["field_type"] == "lookup"
    )

    field_structure = {}
    for row in fields:
        copy_row = row.copy()
        copy_row.pop("field_name")
        if row["field_type"] == "picklist" or row["field_type"] == "lookup":
            fields_to_retrieve = row["reference_field"]  + " reference_field, " + object_primary_key_names.get(row["reference_object"]) + ' id'
            query = "SELECT " + fields_to_retrieve + " FROM " + row["reference_object"] + (" WHERE " + row["lookup_filter"] if row["field_type"] == "lookup" else "") + ";"
            print(query)
            cursor.execute(query)
            nested_records = cursor.fetchall()
            copy_row["options"] = nested_records
        elif row["field_type"] == "rollup":
            query = """
            SELECT master_object_name, master_record_type_name, master_primary_key, master_field_name, 
                detail_object_name, detail_join_key, detail_field_name, aggregation_function, filter_condition
            FROM rollup_definition
            WHERE master_object_name = %s AND master_record_type_name = %s AND master_field_name = %s 
                AND detail_object_name = %s
            """
            cursor.execute(query, (row["object_name"], row["record_type_name"], row["field_name"], row["reference_object"]))
            rollup_definition = cursor.fetchall()[0]
            
            alias_table_name = table_name[0]
            alias_join_table = row["reference_object"][0]
            join_table_name = row["reference_object"]

            table_field = alias_table_name + "." + rollup_definition["master_primary_key"]
            join_field = alias_join_table + "." + rollup_definition["detail_join_key"]
            join_clause = " JOIN " + join_table_name + " " + alias_join_table + " ON " + table_field + " = " + join_field

            rollup_field = rollup_definition["aggregation_function"] + "(" + alias_join_table + "." + rollup_definition["detail_field_name"] + ") " + rollup_definition["master_field_name"]
            query = "SELECT " + rollup_field + " FROM " + table_name + ' ' + alias_table_name + join_clause + " WHERE " + primary_key_field + " = %s;"

            cursor.execute(query, (record_id,))
            rollup_record = cursor.fetchall()[0]
            record[row["field_name"]] = rollup_record[rollup_definition["master_field_name"]]

        copy_row["value"] = record[row["field_name"]]
        field_structure[row["field_name"].capitalize()] = copy_row

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

    # Check if the table in input is a correct table (Avoid SQLInjection, corner case quasi inutile)
    check_allowed_tables(cursor, table_name)

    # table_name is ObjectName_RecordTypeName
    (table_name, record_type_name) = table_name.split("_")

    # get primary field name
    query = """
    SELECT field_name, is_primary_key
    FROM field_definition
    WHERE object_name = %s AND record_type_name = %s AND is_active = 1 AND is_primary_key = 1;
    """
    cursor.execute(query, (table_name, record_type_name))
    fields = cursor.fetchall()
    primary_key_field = next((field["field_name"] for field in fields if field["is_primary_key"]), None)

    query="DELETE FROM " + table_name + " WHERE record_type_name = %s AND " + primary_key_field + " = %s;"
    try:
        cursor.execute(query, (record_type_name, record_id))
        db.commit() 
        return {"result": cursor.rowcount}
    except Exception as e:
        db.rollback()
        print('Error: ' + str(e))
        raise HTTPException(status_code=500, detail=str(e))


# Update a single record
@app.post("/Update")
async def update_record(request: Request, db = Depends(get_db)):
    # Read the data from the body
    data = await request.json() 
    table_name = data.get("table")
    record_id = data.get("id")
    field_structure = data.get("field")

    cursor = db.cursor(dictionary=True)

    # Check if the table in input is a correct table (Avoid SQLInjection, corner case quasi inutile)
    check_allowed_tables(cursor, table_name)

    # table_name is ObjectName_RecordTypeName
    (table_name, record_type_name) = table_name.split("_")

    # get primary field name
    query = """
    SELECT field_name, is_primary_key
    FROM field_definition
    WHERE object_name = %s AND record_type_name = %s AND is_active = 1 AND is_primary_key = 1;
    """
    cursor.execute(query, (table_name, record_type_name))
    fields = cursor.fetchall()
    primary_key_field = next((field["field_name"] for field in fields if field["is_primary_key"]), None)


    columnList = ", ".join(key + " = '" + str(value) + "'" if value != 'NULL' else key + " = " + str(value) for key, value in field_structure.items())
    query = (
        "UPDATE " + table_name +
        " SET " + columnList +
        " WHERE record_type_name = %s AND " + primary_key_field + " = %s;"
    )
    try:
        cursor.execute(query, (record_type_name, record_id))
        db.commit() 
        return {"result": cursor.rowcount}
    except Exception as e:
        db.rollback()
        print('Error: ' + str(e))
        raise HTTPException(status_code=500, detail=str(e))


# Get all the fields structure
@app.get("/{table_name}/new-record")
def get_table_records(table_name: str, db = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    # Check if the table in input is a correct table (Avoid SQLInjection, corner case quasi inutile)
    check_allowed_tables(cursor, table_name)

    # table_name is ObjectName_RecordTypeName
    (table_name, record_type_name) = table_name.split("_")

    # get the list of the fields active for that specific object and record type
    query = """
    SELECT fd.object_name, fd.record_type_name,  fd.field_name, fd.field_type, fd.length, fd.numeric_precision, fd.numeric_scale, fd.reference_object, fd.reference_field, 
        fd.is_editable, fd.is_required, fd.is_primary_key, fd.lookup_filter
    FROM record_layout_definition rvd
    RIGHT JOIN field_definition fd ON 
        rvd.object_name = fd.object_name AND 
        rvd.record_type_name = fd.record_type_name AND 
        rvd.field_name = fd.field_name
    WHERE fd.object_name = %s AND fd.record_type_name = %s AND fd.is_active = 1 AND ((fd.is_visible = 1 AND fd.is_editable = 1)  OR fd.field_name = 'record_type_name') 
    ORDER BY rvd.sort_order ASC;
    """
    cursor.execute(query, (table_name, record_type_name))
    fields = cursor.fetchall()

    ### SECTION: Retrieve Field Structure. For the picklist/lookup take also the pair (key, value) to show the picklist choice
    object_primary_key_names = get_object_primary_keys(
        cursor,
        fields,
        lambda row: row["field_type"] == "picklist" or row["field_type"] == "lookup"
    )
    object_primary_key_names['record_type_definition'] = 'record_type_name'

    field_structure = {}
    for row in fields:
        copy_row = row.copy()
        copy_row.pop("field_name")
        if row["field_type"] == "picklist" or row["field_type"] == "lookup":
            fields_to_retrieve = row["reference_field"]  + " reference_field, " + object_primary_key_names.get(row["reference_object"]) + ' id'
            query = "SELECT " + fields_to_retrieve + " FROM " + row["reference_object"] + (" WHERE " + row["lookup_filter"] if row["field_type"] == "lookup" else "") + ";"
            cursor.execute(query)
            nested_records = cursor.fetchall()
            copy_row["options"] = nested_records
        #elif row["field_type"] == "rollup":    The rollup is always readOnly is not needed in the creation

        field_structure[row["field_name"].capitalize()] = copy_row

    cursor.close()
    return field_structure


# Insert a new record
@app.post("/Insert")
async def update_record(request: Request, db = Depends(get_db)):
    # Read the data from the body
    data = await request.json() 
    table_name = data.get("table")
    record = data.get("record")

    cursor = db.cursor(dictionary=True)

    # Check if the table in input is a correct table (Avoid SQLInjection, corner case quasi inutile)
    check_allowed_tables(cursor, table_name)

    # table_name is ObjectName_RecordTypeName
    (table_name, record_type_name) = table_name.split("_")

    field_list = ', '.join(record.keys())
    new_record = "(" + ",".join("'" + v + "'" for v in record.values()) + ")"
    query = "INSERT INTO " + table_name + "(" + field_list + ")" + " VALUES " + new_record + ";"

    try:
        cursor.execute(query)
        db.commit() 
        return {"result": cursor.rowcount}
    except Exception as e:
        db.rollback()
        print('Error: ' + str(e))
        raise HTTPException(status_code=500, detail=str(e))