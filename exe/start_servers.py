import subprocess
import time
import os

base_path = r"C:\Users\vale-\Documents\MarkotexDB"
backend_path = base_path + r"\backend"
frontend_path = base_path + r"\frontend"

backend_cmd = "uvicorn main:app --reload"
frontend_cmd = "npm start"

def run_in_new_cmd(title, path, command):
    """
    Apre una nuova finestra cmd, cambia directory e avvia il comando richiesto.
	/k = lascia la finestra aperta dopo l'esecuzione
    """
	
    full_cmd = f'start "{title}" cmd /k "cd /d {path} && {command}"'
    print("Eseguo:", full_cmd)  # Debug
    subprocess.Popen(full_cmd, shell=True)

if __name__ == "__main__":
    print("Avvio backend...")
    run_in_new_cmd("Backend", backend_path, backend_cmd)
    time.sleep(1)  # piccolo ritardo per evitare conflitti

    print("Avvio frontend...")
    run_in_new_cmd("Frontend", frontend_path, frontend_cmd)

    print("Entrambi i server sono stati avviati.")