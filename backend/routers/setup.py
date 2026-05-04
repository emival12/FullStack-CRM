from fastapi import APIRouter, Depends, Request
from config import get_db
from services.setupServices import (
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

router = APIRouter(prefix="/api/setup", tags=["setup"])


@router.post("/new-object")
async def endopoint_create_object(request: Request, db=Depends(get_db)):
    data = await request.json()
    object_data = data.get("data")

    cursor = db.cursor(dictionary=True)
    result = create_object(cursor, db, object_data)
    cursor.close()

    return result

@router.post("/home/update")
async def endpoint_update_object(request: Request, db=Depends(get_db)):
    data = await request.json()
    table_name = data.get("table")
    field_structure = data.get("field")

    cursor = db.cursor(dictionary=True)
    result = update_object(cursor, db, table_name, field_structure)
    cursor.close()

    return result

@router.post("/home/delete")
async def endpoint_delete_object(request: Request, db=Depends(get_db)):
    data = await request.json()
    table_name = data.get("table")

    cursor = db.cursor(dictionary=True)
    result = delete_object(cursor, db, table_name)
    cursor.close()

    return result

@router.post("/fields/delete")
async def endpoint_delete_field(request: Request, db=Depends(get_db)):
    data = await request.json()
    table_name = data.get("table")
    field_name = data.get("fieldName")

    cursor = db.cursor(dictionary=True)
    result = delete_field(cursor, db, table_name, field_name)
    cursor.close()

    return result

@router.get("/field/new/structure")
def endpoint_get_field_creation_structure(db=Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    result = get_field_creation_structure(cursor)
    cursor.close()

    return result

@router.get("/{table_name}")
def endpoint_get_object_definition(table_name: str, db=Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    result = get_object_definition(cursor, table_name)
    cursor.close()

    return result

@router.get("/{table_name}/fields")
def endpoint_get_object_fields_record(table_name: str, db=Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    result = get_object_fields_record(cursor, table_name)
    cursor.close()

    return result

@router.post("/{table_name}/field/new")
async def endpoint_create_field(request: Request, db=Depends(get_db)):
    data = await request.json()
    table_name = data.get("table")
    field_data = data.get("record")

    cursor = db.cursor(dictionary=True)
    result = create_field(cursor, db, table_name, field_data)
    cursor.close()

    return result

@router.post("/{table_name}/fields/{field_name}")
async def endpoint_get_field_info(request: Request, table_name: str, field_name: str, db=Depends(get_db)):
    data = await request.json()
    list_fields_by_type = data.get("listFields")

    cursor = db.cursor(dictionary=True)
    result = get_field_info(cursor, table_name, field_name, list_fields_by_type)
    cursor.close()

    return result
