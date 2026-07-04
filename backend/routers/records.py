from fastapi import APIRouter, Depends, Request
from core.responses import EnvelopeResponse
from config import get_cursor_readonly, get_cursor
from core.dependencies import get_session_user
from services.record_services import (
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


router = APIRouter(prefix="/api", tags=["data"], default_response_class=EnvelopeResponse, dependencies=[Depends(get_session_user)])

@router.get("/plain_tables")
def endpoint_get_tables_plain(cursor=Depends(get_cursor_readonly)):
    result = get_tables_plain(cursor) # raise 500
    return result

@router.get("/tables")
def endpoint_get_tables(cursor=Depends(get_cursor_readonly)):
    result = get_tables(cursor) # raise 500
    return result

@router.post("/insert")
async def endpoint_insert_record(request: Request, cursor=Depends(get_cursor), user=Depends(get_session_user)):
    data = await request.json()
    table_name = data.get("table")
    record = data.get("record")

    (table_name, record_type_name) = validate_and_split_table_name(cursor, table_name)      # raise 500, 404-INPUT_TABLE_NAME_NOT_FOUND
    result = insert_record(cursor, table_name, record_type_name, record, user["id"])        # raise 500, 422-BROKEN_FORMULA
    return result

@router.post("/update")
async def endpoint_update_record(request: Request, cursor=Depends(get_cursor), user=Depends(get_session_user)):
    data = await request.json()
    table_name = data.get("table")
    record_id = data.get("id")
    field_structure = data.get("field")

    (table_name, record_type_name) = validate_and_split_table_name(cursor, table_name)                       # raise 500, 404-INPUT_TABLE_NAME_NOT_FOUND
    result = update_record(cursor, table_name, record_type_name, record_id, field_structure, user["id"])     # raise 500, 422-BROKEN_FORMULA, 404-INPUT_RECORD_ID_NOT_FOUND
    return result

@router.post("/delete")
async def endpoint_delete_record(request: Request, cursor=Depends(get_cursor)):
    data = await request.json()
    table_name = data.get("table")
    record_id = data.get("id")

    (table_name, record_type_name) = validate_and_split_table_name(cursor, table_name)   # raise 500, 404-INPUT_TABLE_NAME_NOT_FOUND
    result = delete_record(cursor, table_name, record_type_name, record_id)              # raise 500
    return result

@router.get("/{table_name}")
def endpoint_get_table_records(table_name: str, cursor=Depends(get_cursor_readonly)):
    (table_name, record_type_name) = validate_and_split_table_name(cursor, table_name)  # raise 500, 404-INPUT_TABLE_NAME_NOT_FOUND
    result = get_table_records(cursor, table_name, record_type_name)                    # raise 500
    return result

@router.get("/{table_name}/new-record")
def endpoint_get_new_record_structure(table_name: str, cursor=Depends(get_cursor_readonly)):
    (table_name, record_type_name) = validate_and_split_table_name(cursor, table_name)  # raise 500, 404-INPUT_TABLE_NAME_NOT_FOUND
    result = get_new_record_structure(cursor, table_name, record_type_name)             # raise 500
    return result

@router.get("/{table_name}/record")
def endpoint_get_record(table_name: str, record_id: str, cursor=Depends(get_cursor_readonly)):
    (table_name, record_type_name) = validate_and_split_table_name(cursor, table_name)  # raise 500, 404-INPUT_TABLE_NAME_NOT_FOUND
    result = get_record(cursor, table_name, record_type_name, record_id)                # raise 500, 404-INPUT_RECORD_ID_NOT_FOUND
    return result

