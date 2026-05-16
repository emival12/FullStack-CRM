from core.log_manager import setup_logging
setup_logging() # Inizialize the logging of the app


import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routers import auth, assets, records, setup, import_
from config import get_correct_path, get_current_config
import backup_manager



app = FastAPI()
# Enable CORS to allow React to access APIs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(assets.router)
app.include_router(import_.router)
app.include_router(setup.router)
app.include_router(records.router)


###############################################
# PRODUCTION
###############################################
BUILD_DIR = get_correct_path("build", dev_folder_path="frontend")

app.mount("/static", StaticFiles(directory=os.path.join(BUILD_DIR, "static")), name="static")

@app.get("/{catchall:path}")
async def serve_react_app(request: Request, catchall: str):
    file_path = os.path.join(BUILD_DIR, catchall)

    if os.path.isfile(file_path):
        return FileResponse(file_path)

    return FileResponse(os.path.join(BUILD_DIR, "index.html"))


@app.on_event("startup")
async def startup_event():
    backup_manager.check_and_run_smart_backup(get_current_config())
