import os
import sys
import uvicorn
import threading
import webbrowser
import logging
import pystray
from PIL import Image
from pystray import MenuItem as item


# Save the debugLog in the same folder of the exe 
log_file_path = os.path.join(os.path.dirname(sys.executable), "debug_log.txt")

# Logging configuration
logging.basicConfig(
    filename=log_file_path,
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filemode='a' # 'w' overwrite, 'a' append
)

def start_server():
    from main import app 
    logging.info("Initialize the server Uvicorn...")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="debug", log_config=None)

# 2. Open the browser with the url of the app
def open_browser(icon, item):
    webbrowser.open("http://127.0.0.1:8000")

# 3. Close everything
def quit_app(icon, item):
    icon.stop() # Remove the icon
    os._exit(0) # Kills the Process by Id

if __name__ == "__main__":
    # Redirect stdout e stderr on the file log
    log_file = open(log_file_path, "a", buffering=1)
    sys.stdout = log_file
    sys.stderr = log_file

    # Start the server
    server_thread = threading.Thread(target=start_server)
    server_thread.daemon = True # If the main is killed, kill also this thread
    server_thread.start()

    # Open the app
    webbrowser.open("http://127.0.0.1:8000")

    # Create the path for the img: join the internal system folder with the img name
    base_path = getattr(sys, '_MEIPASS', os.path.abspath("."))
    icon_path = os.path.join(base_path, "brand.png")
    image = Image.open(icon_path)
    menu = (
        item('Apri Gestionale', open_browser),
        item('Esci', quit_app)
    )

    icon = pystray.Icon("name", image, "Mio Gestionale", menu)
    icon.run()