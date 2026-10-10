import subprocess
import os
import time
import sys

def start_process(name, cmd, env, cwd):
    print(f"Starting {name}...")
    # use shell=True on windows for npm
    is_win = sys.platform == 'win32'
    use_shell = is_win and cmd[0] == 'npm'
    return subprocess.Popen(cmd, env=env, cwd=cwd, shell=use_shell)

if __name__ == "__main__":
    base_env = os.environ.copy()
    
    # 1. Start Node A
    env_a = base_env.copy()
    env_a.update({"NODE_ID": "node-a", "PORT": "8001", "OTHER_NODES": "http://localhost:8002,http://localhost:8003"})
    p_a = start_process("Node A", [sys.executable, "-m", "uvicorn", "main:app", "--port", "8001"], env_a, "./node_service/app")
    time.sleep(1.5)
    
    # 2. Start Node B
    env_b = base_env.copy()
    env_b.update({"NODE_ID": "node-b", "PORT": "8002", "OTHER_NODES": "http://localhost:8001,http://localhost:8003"})
    p_b = start_process("Node B", [sys.executable, "-m", "uvicorn", "main:app", "--port", "8002"], env_b, "./node_service/app")
    time.sleep(1.5)
    
    # 3. Start Node C
    env_c = base_env.copy()
    env_c.update({"NODE_ID": "node-c", "PORT": "8003", "OTHER_NODES": "http://localhost:8001,http://localhost:8002"})
    p_c = start_process("Node C", [sys.executable, "-m", "uvicorn", "main:app", "--port", "8003"], env_c, "./node_service/app")
    
    # 4. Start Gateway
    env_gw = base_env.copy()
    env_gw.update({
        "NODE_A_URL": "http://localhost:8001",
        "NODE_B_URL": "http://localhost:8002",
        "NODE_C_URL": "http://localhost:8003"
    })
    p_gw = start_process("Gateway", [sys.executable, "-m", "uvicorn", "main:app", "--port", "8000"], env_gw, "./gateway/app")
    
    # 5. Start Frontend
    env_front = base_env.copy()
    env_front.update({"VITE_API_URL": "http://localhost:8000"})
    p_front = start_process("Frontend", ["npm", "run", "dev", "--", "--port", "3000"], env_front, "./frontend")
    
    print("\n==============================================")
    print("All services started! Access the UI at:")
    print("http://localhost:3000")
    print("==============================================\n")
    print("Press Ctrl+C to stop all services.")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopping all services...")
        for p in [p_a, p_b, p_c, p_gw, p_front]:
            p.terminate()
        sys.exit(0)
