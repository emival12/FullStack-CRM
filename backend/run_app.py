import os
import sys
# write some logs in case the app crash before the logging method is started
crash_log_path = os.path.join(os.path.dirname(sys.executable), "crash_log.txt")
try:
    sys.stdout = open(crash_log_path, "a", buffering=1)
    sys.stderr = sys.stdout
except Exception:
    pass

import uvicorn
import threading
import webbrowser
import pystray
from PIL import Image
from pystray import MenuItem as item

def start_server():
    from main import app 
    uvicorn.run(app, host="0.0.0.0", port=8000, log_config=None)

# 2. Open the browser with the url of the app
def open_browser(icon, item):
    webbrowser.open("http://127.0.0.1:8000")

# 3. Close everything
def quit_app(icon, item):
    icon.stop() # Remove the icon
    os._exit(0) # Kills the Process by Id

if __name__ == "__main__":
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