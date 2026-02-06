import bcrypt

def generate_hash():
    password = input("Inserisci la password da hashare: ")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    
    print("\n--- RISULTATO ---")
    print(hashed.decode('utf-8'))
    print("-----------------\n")

if __name__ == "__main__":
    generate_hash()


# Launch in cmd: python hash_tool.py