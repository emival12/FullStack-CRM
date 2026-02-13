import os
import datetime
import subprocess


def check_and_run_smart_backup(config, backup_dir, log_message):
    # If doens't exist the folder, create it and make a backup 
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir, exist_ok=True)
        execute_db_backup(config, backup_dir, log_message)
        return

    # Take all the .sql files in the folder
    backups = [os.path.join(backup_dir, f) for f in os.listdir(backup_dir) if f.endswith('.sql')]
    if not backups:
        execute_db_backup(config, backup_dir, log_message)
        return

    # Get the most recent
    latest_backup = max(backups, key=os.path.getctime)
    creation_time = datetime.datetime.fromtimestamp(os.path.getctime(latest_backup))
    
    # If is older than 7 days make a new one 
    if datetime.datetime.now() - creation_time > datetime.timedelta(days=7):
        log_message("Backup più vecchio di 7 giorni. Avvio backup automatico...")
        execute_db_backup(config, backup_dir, log_message)

def execute_db_backup(config, backup_dir, log_message):
    db_name = config['database']['database']
    user = config['database']['user']
    password = config['database']['password']
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(backup_dir, f"backup_{db_name}_{timestamp}.sql")
    command = f'mysqldump -u {user} -p"{password}" --add-drop-table --databases {db_name} > "{filename}"'
    
    try:
        subprocess.run(command, shell=True, check=True)
        log_message(f"Backup eseguito con successo: {filename}")
    except subprocess.CalledProcessError as e:
        log_message(f"Errore durante il backup: {e}")




