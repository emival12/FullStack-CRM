from fastapi import APIRouter, Depends, UploadFile, File, Form
from config import get_db
from core.exceptions import raise_input_exception

from services.importServices import (
    get_list_of_importable_objects,
    elaborate_import_file
)

router = APIRouter(prefix="/api", tags=["massive_import"])


@router.get("/import")
async def endpoint_get_list_of_importable_objects(db=Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    result = get_list_of_importable_objects(cursor)
    cursor.close()

    return result


@router.post("/import/upload")
async def import_records_from_csv(
    operation_type: str = Form(...),
    object_name: str = Form(...),
    user_id: str = Form(...),
    file: UploadFile = File(...),
    db=Depends(get_db)
):
    file_contents = await file.read()
    try:
        file_decoded = file_contents.decode('utf-8')
    except Exception as err:
        raise_input_exception(400, "IMPORT_FILE_ENCODING_INVALID")

    cursor = db.cursor(dictionary=True)
    elaborate_import_file(db, cursor, operation_type, object_name, user_id, file_decoded)
    cursor.close()

    return {"result": 1}
