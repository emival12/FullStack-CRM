import os
import json
from fastapi import APIRouter
from fastapi.responses import FileResponse
import logging
from config import get_correct_path
from core.exceptions import raise_input_exception, raise_server_exception, log_event

logger = logging.getLogger(__name__) 
router = APIRouter(prefix="/api", tags=["assets"])

@router.get("/translations/{browser_language}")
async def endpoint_get_translation_file(browser_language: str):
    TRANSLATION_DIR = get_correct_path("translations", is_external=True, dev_folder_path="frontend\src\config")
    lang_code = browser_language.split("-")[0].lower()
    file_path = os.path.join(TRANSLATION_DIR, f"{lang_code}.json")

    if not os.path.exists(TRANSLATION_DIR):
        os.makedirs(TRANSLATION_DIR, exist_ok=True)

    if not os.path.exists(file_path):
        with open(file_path, 'w') as f:
            json.dump({}, f)
        log_event(logging.WARNING, logger, "Default translation file created", file_path=file_path)

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as err:
        raise_server_exception(logger, "Failed to read translation file", file_path=file_path)


@router.get("/images/{image_name}")
async def endpoint_get_image_file(image_name: str):
    IMG_DIR = get_correct_path("imgs", is_external=True, dev_folder_path="frontend\src\config")
    file_path = os.path.join(IMG_DIR, image_name)

    if not os.path.exists(IMG_DIR):
        os.makedirs(IMG_DIR, exist_ok=True)

    if not os.path.exists(file_path):
        raise_input_exception(404, "IMAGE_NOT_FOUND")

    return FileResponse(file_path)
