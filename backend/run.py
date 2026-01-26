import os
import uvicorn

# CONFIGURATION
HOST = "127.0.0.1"
PORT = 8000
RELOAD = True

def print_banner():
    print(r"""
__     __        _            
\ \   / /__ _ __| |_ _____  __
 \ \ / / _ \ '__| __/ _ \ \/ /
  \ V /  __/ |  | ||  __/>  < 
   \_/ \___|_|   \__\___/_/\_\
        Vertex Chat App
""")
    
if __name__ == "__main__":
    # Clear termminal window for a fresh start
    os.system('cls' if os.name =='nt' else 'clear')

    print_banner()

    # Start the server
    print(f"[*] Starting Uvicorn Server on http://{HOST}:{PORT}")

    try:
        uvicorn.run(
            "main:app",
            host=HOST,
            port=PORT,
            reload=RELOAD,
            log_level='info',
            access_log=True
        )
    except KeyboardInterrupt:
        print("\n[!] Server stopped by user.")