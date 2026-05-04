from fastapi import APIRouter, Depends, Request

from config import get_db
from services.recordServices import (
    validate_and_split_table_name,
    get_tables_plain,
    get_tables,
    get_table_records,
    get_new_record_structure,
    get_record,
    insert_record,
    update_record,
    delete_record,
)



router = APIRouter(prefix="/api", tags=["data"])

@router.get("/plain_tables")
def endpoint_get_tables_plain(db=Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    result = get_tables_plain(cursor)

    cursor.close()
    return result

@router.get("/tables")
def endpoint_get_tables(db=Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    result = get_tables(cursor)

    cursor.close()
    return result

@router.post("/insert")
async def endpoint_insert_record(request: Request, db=Depends(get_db)):
    data = await request.json()
    table_name = data.get("table")
    record = data.get("record")
    user = data.get("user")

    cursor = db.cursor(dictionary=True)

    (table_name, record_type_name) = validate_and_split_table_name(cursor, table_name)
    result = insert_record(cursor, db, table_name, record_type_name, record, user["id"])

    cursor.close()
    return result

@router.post("/update")
async def endpoint_update_record(request: Request, db=Depends(get_db)):
    data = await request.json()
    table_name = data.get("table")
    record_id = data.get("id")
    user = data.get("user")
    field_structure = data.get("field")

    cursor = db.cursor(dictionary=True)

    (table_name, record_type_name) = validate_and_split_table_name(cursor, table_name)
    result = update_record(cursor, db, table_name, record_type_name, record_id, field_structure, user["id"])

    cursor.close()
    return result

@router.post("/delete")
async def endpoint_delete_record(request: Request, db=Depends(get_db)):
    data = await request.json()
    table_name = data.get("table")
    record_id = data.get("id")

    cursor = db.cursor(dictionary=True)

    (table_name, record_type_name) = validate_and_split_table_name(cursor, table_name)
    result = delete_record(cursor, db, table_name, record_type_name, record_id)

    cursor.close()
    return result

@router.get("/{table_name}")
def endpoint_get_table_records(table_name: str, db=Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    (table_name, record_type_name) = validate_and_split_table_name(cursor, table_name)
    result = get_table_records(cursor, table_name, record_type_name)

    cursor.close()
    return result

@router.get("/{table_name}/new-record")
def endpoint_get_new_record_structure(table_name: str, db=Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    (table_name, record_type_name) = validate_and_split_table_name(cursor, table_name)
    result = get_new_record_structure(cursor, table_name, record_type_name)

    cursor.close()
    return result

@router.get("/{table_name}/record")
def endpoint_get_record(table_name: str, record_id: str, db=Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    (table_name, record_type_name) = validate_and_split_table_name(cursor, table_name)
    result = get_record(cursor, table_name, record_type_name, record_id)

    cursor.close()
    return result

