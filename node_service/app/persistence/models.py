from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="STUDENT")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Resource(Base):
    __tablename__ = "resources"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String)
    location = Column(String)
    capacity = Column(Integer)
    active = Column(Boolean, default=True)

class Reservation(Base):
    __tablename__ = "reservations"
    
    id = Column(String, primary_key=True, index=True)
    resource_id = Column(String, ForeignKey("resources.id"))
    student_id = Column(String)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    status = Column(String, default="pending")
    request_id = Column(String, unique=True, index=True)
    created_by_node = Column(String)
    logical_timestamp = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
