from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, Date
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    
    contacts = relationship("Contact", back_populates="owner", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="owner", cascade="all, delete-orphan")

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="contacts")

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    date = Column(String, nullable=True)
    description = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="events")
    recipients = relationship("EventRecipient", back_populates="event", cascade="all, delete-orphan")

class EventRecipient(Base):
    __tablename__ = "event_recipients"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    contact_id = Column(Integer, ForeignKey("contacts.id"))
    budget_limit = Column(Float, default=0.0)
    notes = Column(String, nullable=True)
    
    event = relationship("Event", back_populates="recipients")
    contact = relationship("Contact")
    gifts = relationship("Gift", back_populates="recipient", cascade="all, delete-orphan")

class Gift(Base):
    __tablename__ = "gifts"

    id = Column(Integer, primary_key=True, index=True)
    event_recipient_id = Column(Integer, ForeignKey("event_recipients.id"))
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    amount = Column(Float, default=0.0)
    purchased = Column(Boolean, default=False)
    url = Column(String, nullable=True)
    
    recipient = relationship("EventRecipient", back_populates="gifts")
