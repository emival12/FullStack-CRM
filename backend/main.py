from core.log_manager import setup_logging
setup_logging() # Inizialize the logging of the app


import os
import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse
from core.exceptions import log_event
from routers import auth, assets, records, setup, import_
from config import get_correct_path, get_current_config
import backup_manager

logger = logging.getLogger(__name__)

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
app.include_router(auth.router)
app.include_router(assets.router)
app.include_router(import_.router)
app.include_router(setup.router)
app.include_router(records.router)


###############################################
# PRODUCTION
###############################################
BUILD_DIR = get_correct_path("dist", dev_folder_path="frontend")
BUILD_DIR_REAL = os.path.realpath(BUILD_DIR)

@app.get("/{catchall:path}")
async def serve_react_app(request: Request, catchall: str):
    # Handle typo in the paths
    if catchall.startswith("api/"): 
        raise HTTPException(404, "Path not found")

    file_path = os.path.realpath(os.path.join(BUILD_DIR, catchall))

    # Prevents request to other internal paths 
    if file_path != BUILD_DIR_REAL and not file_path.startswith(BUILD_DIR_REAL + os.sep):
        log_event(logging.WARNING, logger, "Blocked access to reserved file", file_path=file_path, requested_path=catchall, client_ip=request.client.host)
        return FileResponse(os.path.join(BUILD_DIR, "index.html"))

    if os.path.isfile(file_path):
        return FileResponse(file_path)

    return FileResponse(os.path.join(BUILD_DIR, "index.html"))


@app.on_event("startup")
async def startup_event():
    backup_manager.check_and_run_smart_backup(get_current_config())
