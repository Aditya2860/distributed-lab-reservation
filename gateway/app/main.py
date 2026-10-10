import os
import random
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

NODES = []
if os.getenv("NODE_A_URL"): NODES.append(os.getenv("NODE_A_URL"))
if os.getenv("NODE_B_URL"): NODES.append(os.getenv("NODE_B_URL"))
if os.getenv("NODE_C_URL"): NODES.append(os.getenv("NODE_C_URL"))

if not NODES:
    NODES = ["http://localhost:8001", "http://localhost:8002", "http://localhost:8003"]

def get_random_node():
    return random.choice(NODES)

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta

# Mock SECRET_KEY for dev
SECRET_KEY = "super-secret-key-for-dev"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    # We will forward this to one of the nodes to check DB
    node = get_random_node()
    try:
        response = requests.post(f"{node}/internal/auth/login", json={"email": form_data.username, "password": form_data.password}, timeout=5)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        
        user = response.json()
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode = {"sub": user["email"], "role": user["role"], "id": user["id"], "name": user["name"]}
        expire = datetime.utcnow() + access_token_expires
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        
        return {"access_token": encoded_jwt, "token_type": "bearer", "user": user}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Error authenticating: {str(e)}")

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception

@app.get("/resources")
def get_resources(current_user: dict = Depends(get_current_user)):
    node = get_random_node()
    try:
        response = requests.get(f"{node}/internal/resources", timeout=5)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Error communicating with node: {str(e)}")

@app.post("/reservations")
def create_reservation(payload: dict, current_user: dict = Depends(get_current_user)):
    """Forward reservation to a node. Tries each node once in random order."""
    
    # Override student_id with authenticated user's ID
    if current_user["role"] == "STUDENT":
        payload["student_id"] = current_user["id"]
    
    nodes = NODES.copy()
    random.shuffle(nodes)
    last_error = "No nodes available"
    for node in nodes:
        try:
            # 30s timeout: node must acquire Lamport mutex (up to 10s) + DB write
            response = requests.post(
                f"{node}/internal/reservation-request",
                json=payload,
                timeout=30
            )
            if response.status_code == 200:
                return response.json()
            last_error = f"Node returned {response.status_code}: {response.text}"
        except Exception as e:
            last_error = str(e)
            continue
    raise HTTPException(status_code=503, detail=f"All nodes failed. Last error: {last_error}")

@app.get("/reservations")
def get_reservations(current_user: dict = Depends(get_current_user)):
    node = get_random_node()
    try:
        response = requests.get(f"{node}/internal/reservations", timeout=5)
        response.raise_for_status()
        res = response.json()
        if current_user["role"] == "STUDENT":
            return [r for r in res if r["student_id"] == current_user["id"]]
        return res
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Error communicating with node: {str(e)}")

@app.delete("/reservations/{res_id}")
def cancel_reservation(res_id: str, current_user: dict = Depends(get_current_user)):
    node = get_random_node()
    try:
        response = requests.delete(f"{node}/internal/reservations/{res_id}", timeout=5)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Error communicating with node: {str(e)}")

@app.get("/users")
def get_users(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")
    node = get_random_node()
    try:
        response = requests.get(f"{node}/internal/users", timeout=5)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Error communicating with node: {str(e)}")

@app.get("/cluster/nodes")
def get_cluster_nodes():
    return {"nodes": NODES}

@app.get("/cluster/info")
def get_cluster_info():
    info = []
    for node in NODES:
        try:
            res = requests.get(f"{node}/node/info", timeout=2)
            if res.status_code == 200:
                data = res.json()
                data["node_url"] = node
                info.append(data)
            else:
                info.append({"node_id": node, "node_url": node, "status": "down"})
        except:
            info.append({"node_id": node, "node_url": node, "status": "down"})
    return {"cluster": info}

@app.get("/cluster/leader")
def get_cluster_leader():
    for node in NODES:
        try:
            res = requests.get(f"{node}/node/info", timeout=2)
            if res.status_code == 200:
                data = res.json()
                if data.get("is_coordinator"):
                    return {"leader": data}
        except:
            pass
    return {"leader": None}
