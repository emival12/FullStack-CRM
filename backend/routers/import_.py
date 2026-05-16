from fastapi import APIRouter, Depends, UploadFile, File, Form
from config import get_cursor_readonly, get_cursor
from core.exceptions import raise_input_exception

from services.import_services import (
    get_list_of_importable_objects,
    elaborate_import_file
)

router = APIRouter(prefix="/api", tags=["massive_import"])


@router.get("/import")
async def endpoint_get_list_of_importable_objects(cursor=Depends(get_cursor_readonly)):
    result = get_list_of_importable_objects(cursor) # raise 500
    return result


@router.post("/import/upload")
async def import_records_from_csv(
    operation_type: str = Form(...),
    object_name: str = Form(...),
    user_id: str = Form(...),
    file: UploadFile = File(...),
    cursor=Depends(get_cursor)
):
    file_contents = await file.read()
    try:
        file_decoded = file_contents.decode('utf-8')
    except Exception as err:
        raise_input_exception(400, "IMPORT_FILE_ENCODING_INVALID")

    elaborate_import_file(cursor, operation_type, object_name, user_id, file_decoded) # raise 500, 404-INPUT_TABLE_NAME_NOT_FOUND, 400-IMPORT_FILE_PARSE_ERROR, 400 with multiple codes, 404 - Operation Type not yet supported (Temporaneo)
    return {"result": 1}
