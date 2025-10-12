import mysql.connector
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS to allow React to access APIs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to MySQL database 
db = mysql.connector.connect(
    host="localhost",
    user="root",            # MySQL user
    password="root",        # MySQL password
    database="testnegozio"  # MySQL DB name
)


# All the API exposed to React
@app.get("/prodotti")
def get_prodotti():
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM prodotti")
    rows = cursor.fetchall()
    return rows
