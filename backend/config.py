from __future__ import annotations
import os
import sys
import configparser
import mysql.connector
from fastapi import Depends
from core.exceptions import raise_server_exception


def get_correct_path(file_name: str, is_external: bool = False, dev_folder_path: str | None = None) -> str:
    if getattr(sys, 'frozen', False):
        # PRODUCTION
        if is_external:
            base_path = os.path.dirname(sys.executable) # find the path of the EXE file
        else:
            base_path = sys._MEIPASS                    # use the internal folder of the EXE
    else:
        # DEVELOPMENT
        base_path = os.path.dirname(os.path.abspath(__file__)) # find the path of main.py
        if dev_folder_path:
            base_path = os.path.join(os.path.dirname(base_path), dev_folder_path)

    return os.path.join(base_path, file_name)

########## START - Config file ##########
def get_config() -> configparser.ConfigParser:
    CONFIG_PATH = get_correct_path("config.ini", is_external=True)

    if not os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, 'w') as f:
            f.write("[database]\nuser=root\npassword=\ndatabase=\n")
        raise_server_exception(f'Configuration file NOT FOUND in: {CONFIG_PATH}. Default file created')

    config = configparser.ConfigParser()
    config.read(CONFIG_PATH)
    return config

def get_current_config() -> configparser.ConfigParser:
    return get_config()

def get_config_db_name(config: configparser.ConfigParser) -> str:
    return config["database"]["database"]

########## END - Config file ##########



########## START - Trigger folder ##########
def get_triggers_folder() -> str:
    triggers_dir = get_correct_path("triggers", is_external=True)
    if not os.path.exists(triggers_dir):
        os.makedirs(triggers_dir)

    return triggers_dir

########## END - Trigger folder ##########


# Connect to MySQL database
def get_db(config: configparser.ConfigParser = Depends(get_current_config)):
    conn = None
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user=config['database']['user'],         # MySQL user
            password=config['database']['password'], # MySQL password
            database=config['database']['database']  # MySQL DB name
        )
        yield conn
    except mysql.connector.Error as err:
        raise_server_exception(f'Error on the database: {err}')
    finally:
        if conn and conn.is_connected():
            conn.close()