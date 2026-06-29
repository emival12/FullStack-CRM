from fastapi import APIRouter, Depends, UploadFile, File, Form
from core.responses import EnvelopeResponse
from config import get_cursor_readonly, get_cursor
from core.dependencies import get_session_user
from core.exceptions import raise_input_exception
from services.import_services import (
    get_list_of_importable_objects,
    elaborate_import_file
)

router = APIRouter(prefix="/api", tags=["massive_import"], default_response_class=EnvelopeResponse, dependencies=[Depends(get_session_user)])


@router.get("/import")
async def endpoint_get_list_of_importable_objects(cursor=Depends(get_cursor_readonly)):
    result = get_list_of_importable_objects(cursor) # raise 500
    return result

'''
    System:
    500

    Business-shared:
    404 - INPUT_TABLE_NAME_NOT_FOUND

    Business-feature:
    400 - IMPORT_FILE_ENCODING_INVALID
    400 - IMPORT_FILE_PARSE_ERROR                   error: str (errore grezzo)
    400 - IMPORT_FILE_MISSING_RECORD_TYPE_COLUMN
    400 - IMPORT_FILE_MISSING_RECORD_TYPE_VALUE     row: number
    400 - IMPORT_FILE_WITH_MULTIPLE_RECORD_TYPE     record_type_name: array
    400 - IMPORT_FILE_WITH_WRONG_RECORD_TYPE        record_type_name: str
    400 - IMPORT_FILE_MISSING_REQUIRED_FIELDS       columns: array
    400 - IMPORT_FILE_UNKNOWN_FIELDS                columns: array
    400 - IMPORT_FIELD_LENGTH_EXCEEDED              row: number, column: str, max_length: number, actual_length: number
    400 - INPUT_FIELD_INVALID_BOOLEAN               row: number, column: str, accepted_values: array
    400 - INPUT_FIELD_INVALID_NUMBER                row: number, column: str
    400 - INPUT_FIELD_SCALE_EXCEEDED                row: number, column: str, max_length: number, actual_length: number
    400 - INPUT_FIELD_PRECISION_EXCEEDED            row: number, column: str, max_length: number, actual_length: number
    400 - INPUT_FIELD_INVALID_RADIO                 row: number, column: str, actual_value: str
    400 - INPUT_FIELD_INVALID_DATE_FORMAT           row: number, column: str, actual_value: str, expected_format: str
    400 - INPUT_FIELD_INVALID_DATE                  row: number, column: str, actual_value: str
    400 - INPUT_FIELD_INVALID_LOOKUP_PICKLIST       row: number, column: str, actual_value: str
'''
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

    elaborate_import_file(cursor, operation_type, object_name, user_id, file_decoded)
    return {"result": 1}

