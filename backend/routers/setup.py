from fastapi import APIRouter, Depends, Request
from core.responses import EnvelopeResponse

from config import get_cursor_readonly, get_cursor
from core.dependencies import get_session_user
from services.setup_services import (
    check_table_existence,
    get_field_creation_structure,
    get_object_definition,
    get_object_fields_record,
    create_object,
    update_object,
    delete_object,
    delete_field,
    create_field,
    get_field_info
)

router = APIRouter(prefix="/api/setup", tags=["setup"], default_response_class=EnvelopeResponse, dependencies=[Depends(get_session_user)])

@router.get("/check-table-existence")
def endpoint_check_table_existence(table_name: str, cursor=Depends(get_cursor_readonly)):
    result = check_table_existence(cursor, table_name)  # raise 500, 404-INPUT_TABLE_NAME_NOT_FOUND
    return result 

@router.post("/new-object")
async def endopoint_create_object(request: Request, cursor=Depends(get_cursor), user=Depends(get_session_user)):
    data = await request.json()
    object_data = data.get("data")

    result = create_object(cursor, object_data, user["id"]) # raise 500, 409-DUPLICATE_PK
    return result

@router.post("/home/update")
async def endpoint_update_object(request: Request, cursor=Depends(get_cursor), user=Depends(get_session_user)):
    data = await request.json()
    table_name = data.get("table")
    field_structure = data.get("field")

    result = update_object(cursor, table_name, field_structure, user["id"])  # raise 500
    return result

@router.post("/home/delete")
async def endpoint_delete_object(request: Request, cursor=Depends(get_cursor), user=Depends(get_session_user)):
    data = await request.json()
    table_name = data.get("table")

    result = delete_object(cursor, table_name, user["id"])  # raise 500, 404-INPUT_TABLE_NAME_NOT_FOUND
    return result

@router.post("/fields/delete")
async def endpoint_delete_field(request: Request, cursor=Depends(get_cursor), user=Depends(get_session_user)):
    data = await request.json()
    table_name = data.get("table")
    field_name = data.get("fieldName")

    result = delete_field(cursor, table_name, field_name, user["id"]) # raise 500, 404-INPUT_TABLE_NAME_NOT_FOUND
    return result

@router.get("/field/new/structure")
def endpoint_get_field_creation_structure(cursor=Depends(get_cursor_readonly)):
    result = get_field_creation_structure(cursor)   # raise 500
    return result

@router.get("/{table_name}")
def endpoint_get_object_definition(table_name: str, cursor=Depends(get_cursor_readonly)):
    result = get_object_definition(cursor, table_name)  # raise 500, 404-INPUT_TABLE_NAME_NOT_FOUND
    return result

@router.get("/{table_name}/fields")
def endpoint_get_object_fields_record(table_name: str, cursor=Depends(get_cursor_readonly)):
    result = get_object_fields_record(cursor, table_name)   # raise 500, 404-INPUT_TABLE_NAME_NOT_FOUND
    return result

@router.post("/{table_name}/field/new")
async def endpoint_create_field(request: Request, cursor=Depends(get_cursor), user=Depends(get_session_user)):
    data = await request.json()
    table_name = data.get("table")
    field_data = data.get("record")

    result = create_field(cursor, table_name, field_data, user["id"]) # raise 500
    return result

@router.post("/{table_name}/fields/{field_name}")
async def endpoint_get_field_info(request: Request, table_name: str, field_name: str, cursor=Depends(get_cursor_readonly)):
    data = await request.json()
    list_fields_by_type = data.get("listFields")

    result = get_field_info(cursor, table_name, field_name, list_fields_by_type)    # raise 500
    return result
