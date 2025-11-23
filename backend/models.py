from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, Date, Enum
from sqlalchemy.orm import relationship
from database import Base
import enum

class FriendRequestStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class PermissionLevel(str, enum.Enum):
    READ = "read"
    WRITE = "write"
    ADMIN = "admin"  # Can delete and manage sharing

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    
    contacts = relationship("Contact", back_populates="owner", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="owner", cascade="all, delete-orphan")
    sent_friend_requests = relationship("FriendRequest", foreign_keys="FriendRequest.from_user_id", back_populates="from_user")
    received_friend_requests = relationship("FriendRequest", foreign_keys="FriendRequest.to_user_id", back_populates="to_user")

class FriendRequest(Base):
    __tablename__ = "friend_requests"

    id = Column(Integer, primary_key=True, index=True)
    from_user_id = Column(Integer, ForeignKey("users.id"))
    to_user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default=FriendRequestStatus.PENDING.value)
    
    from_user = relationship("User", foreign_keys=[from_user_id], back_populates="sent_friend_requests")
    to_user = relationship("User", foreign_keys=[to_user_id], back_populates="received_friend_requests")

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="contacts")
    shares = relationship("ContactShare", back_populates="contact", cascade="all, delete-orphan")

class ContactShare(Base):
    __tablename__ = "contact_shares"

    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"))
    shared_with_user_id = Column(Integer, ForeignKey("users.id"))
    permission = Column(String, default=PermissionLevel.READ.value)
    
    contact = relationship("Contact", back_populates="shares")
    shared_with = relationship("User")

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    date = Column(String, nullable=True)
    description = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="events")
    recipients = relationship("EventRecipient", back_populates="event", cascade="all, delete-orphan")
    shares = relationship("EventShare", back_populates="event", cascade="all, delete-orphan")

class EventShare(Base):
    __tablename__ = "event_shares"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    shared_with_user_id = Column(Integer, ForeignKey("users.id"))
    permission = Column(String, default=PermissionLevel.READ.value)
    
    event = relationship("Event", back_populates="shares")
    shared_with = relationship("User")

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
