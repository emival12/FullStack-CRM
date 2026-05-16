import os
import datetime
import subprocess
import logging
from config import get_correct_path
from core.exceptions import log_event

logger = logging.getLogger(__name__) 

def check_and_run_smart_backup(config):
    try:
        BACKUP_DIR = get_correct_path("backups", is_external=True, dev_folder_path="frontend\src\config")

        # If doens't exist the folder, create it and make a backup
        if not os.path.exists(BACKUP_DIR):
            os.makedirs(BACKUP_DIR, exist_ok=True)
            execute_db_backup(config, BACKUP_DIR)
            return

        # Take all the .sql files in the folder
        backups = [os.path.join(BACKUP_DIR, f) for f in os.listdir(BACKUP_DIR) if f.endswith('.sql')]
        if not backups:
            execute_db_backup(config, BACKUP_DIR)
            return

        # Get the most recent
        latest_backup = max(backups, key=os.path.getctime)
        creation_time = datetime.datetime.fromtimestamp(os.path.getctime(latest_backup))

        # If is older than 7 days make a new one
        if datetime.datetime.now() - creation_time > datetime.timedelta(days=7):
            log_event(logging.INFO, logger, "Last backup is older than 7 days. Starting automatic backup...")
            execute_db_backup(config, BACKUP_DIR)
    except Exception:
        log_event(logging.ERROR, logger, "Startup backup skipped", exc_info=True)

def execute_db_backup(config, backup_dir):
    db_name = config['database']['database']
    user = config['database']['user']
    password = config['database']['password']

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(backup_dir, f"backup_{db_name}_{timestamp}.sql")

    try:
        with open(filename, 'w') as output_file:
            subprocess.run(
                ["mysqldump", f"-u{user}", f"-p{password}", "--add-drop-table", "--databases", db_name],
                stdout=output_file,
                check=True
            )
        log_event(logging.INFO, logger, "Backup created", filename=filename)
    except subprocess.CalledProcessError:
        log_event(logging.ERROR, logger, "Backup failed", exc_info=True)




