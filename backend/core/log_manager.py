import os
import sys
import logging
from logging.handlers import TimedRotatingFileHandler
from config import get_correct_path

class ContextFormatter(logging.Formatter):
    def format(self, record):
        log_message = super().format(record)
        
        context = getattr(record, "context", None)
        if context:
            context_str = "; ".join(f"{k}={v}" for k, v in context.items())
            log_message = f"{log_message} [{context_str}]"
            
        return log_message

def setup_logging():
    LOG_DIR = get_correct_path("logs", is_external=True, dev_folder_path="frontend\src\config")
    log_file_path = os.path.join(LOG_DIR, f"debug_log.log")

    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR, exist_ok=True)

    # Output Format
    log_format = ContextFormatter('%(asctime)s - %(levelname)-8s - [%(name)s.%(funcName)s:%(lineno)d] - %(message)s')

    logger = logging.getLogger()
    if logger.handlers:
        return
        
    logger.setLevel(logging.INFO)
    for noisy in ("mysql.connector", "uvicorn.access"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    if getattr(sys, 'frozen', False):
        # Handler for PROD (in the file)
        file_handler = TimedRotatingFileHandler(
            log_file_path, 
            when="D",           # "D" means Days
            interval=1,         # 1 each day
            backupCount=90,     # Keep the last 90 days
            encoding='utf-8'
        )
        file_handler.setFormatter(log_format)
        logger.addHandler(file_handler)
    else:
        # Handler for DEV (in the console)
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(log_format)
        logger.addHandler(console_handler)