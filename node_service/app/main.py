import os
import uuid
import hashlib
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from persistence import models
from persistence.database import engine, get_db
from pydantic import BaseModel

from algorithms.lamport_clock import clock
from algorithms.mutual_exclusion import mutex
from algorithms.leader_election import election
from messaging.publisher import publish_event

try:
    models.Base.metadata.create_all(bind=engine)
except Exception:
    pass

app = FastAPI()

from messaging.consumer import start_consumer


@app.on_event("startup")
def startup_event():
    start_consumer()
    election.start()


NODE_ID = os.getenv("NODE_ID", "default-node")


@app.get("/health")
def health_check():
    return {"status": "ok", "node_id": NODE_ID}


@app.get("/node/info")
def get_node_info():
    return {
        "node_id": NODE_ID,
        "logical_time": clock.get_time(),
        "is_coordinator": election.is_coordinator,
        "coordinator_id": election.coordinator_id
    }


@app.post("/internal/election/message")
def receive_election_message(msg: dict):
    return election.receive_message(msg)


@app.post("/internal/coordination/message")
def receive_coordination_message(msg: dict):
    mutex.receive_message(msg)
    return {"status": "received"}


# ─── Reservations ─────────────────────────────────────────────────────────────

@app.post("/internal/reservation-request")
def handle_reservation_request(payload: dict, db: Session = Depends(get_db)):
    """
    Acquire distributed mutex (Lamport), check for overlapping reservations,
    and write atomically. At most ONE active (confirmed) reservation per resource
    at any point in time.
    """
    mutex.request_cs()
    try:
        current_time = clock.increment()

        resource_id = payload.get("resource_id")
        start_time = payload.get("start_time")
        end_time = payload.get("end_time")
        student_id = payload.get("student_id")
        request_id = payload.get("request_id")

        # Verify resource exists and is active
        resource = db.query(models.Resource).filter(
            models.Resource.id == resource_id,
            models.Resource.active == True
        ).first()
        if not resource:
            return {"status": "rejected", "reason": "Resource not found or inactive"}

        # Overlap check: only one confirmed reservation per resource window
        overlapping = db.query(models.Reservation).filter(
            models.Reservation.resource_id == resource_id,
            models.Reservation.status == "confirmed",
            models.Reservation.start_time < end_time,
            models.Reservation.end_time > start_time
        ).first()

        if overlapping:
            return {"status": "rejected", "reason": "Resource is already reserved for that time slot"}

        res_id = str(uuid.uuid4())
        new_res = models.Reservation(
            id=res_id,
            resource_id=resource_id,
            student_id=student_id,
            start_time=start_time,
            end_time=end_time,
            status="confirmed",
            request_id=request_id,
            created_by_node=NODE_ID,
            logical_timestamp=current_time
        )

        db.add(new_res)
        try:
            db.commit()
            publish_event("ReservationConfirmed", {
                "reservation_id": res_id,
                "resource_id": resource_id,
                "logical_timestamp": current_time,
                "node_id": NODE_ID
            })
        except Exception as e:
            db.rollback()
            return {"status": "rejected", "reason": str(e)}
    finally:
        mutex.release_cs()

    return {"status": "confirmed", "reservation_id": res_id, "logical_timestamp": current_time}


@app.get("/internal/reservations")
def get_reservations(db: Session = Depends(get_db)):
    reservations = db.query(models.Reservation).all()
    return reservations


@app.delete("/internal/reservations/{res_id}")
def delete_reservation(res_id: str, db: Session = Depends(get_db)):
    res = db.query(models.Reservation).filter(models.Reservation.id == res_id).first()
    if res:
        res.status = "cancelled"
        db.commit()
    return {"status": "ok"}


# ─── Resources ────────────────────────────────────────────────────────────────

@app.get("/internal/resources")
def get_resources(db: Session = Depends(get_db)):
    resources = db.query(models.Resource).all()
    return resources


@app.post("/internal/resources")
def create_resource(payload: dict, db: Session = Depends(get_db)):
    """Admin creates a new lab/resource."""
    resource_id = payload.get("id") or str(uuid.uuid4())
    existing = db.query(models.Resource).filter(models.Resource.id == resource_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Resource with that ID already exists")

    new_resource = models.Resource(
        id=resource_id,
        name=payload.get("name", "Unnamed Resource"),
        type=payload.get("type", "General"),
        location=payload.get("location", ""),
        capacity=int(payload.get("capacity", 1)),
        active=True
    )
    db.add(new_resource)
    db.commit()
    db.refresh(new_resource)
    return {"status": "created", "id": new_resource.id, "name": new_resource.name}


@app.delete("/internal/resources/{resource_id}")
def delete_resource(resource_id: str, db: Session = Depends(get_db)):
    """Deactivate a resource (soft delete)."""
    resource = db.query(models.Resource).filter(models.Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    resource.active = False
    db.commit()
    return {"status": "deactivated", "id": resource_id}


# ─── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


@app.post("/internal/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    hashed = hashlib.sha256(req.password.encode()).hexdigest()
    if hashed != user.password_hash:
        raise HTTPException(status_code=400, detail="Incorrect password")

    return {"id": user.id, "email": user.email, "role": user.role, "name": user.name}


# ─── Users ────────────────────────────────────────────────────────────────────

@app.get("/internal/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role, "created_at": u.created_at} for u in users]
