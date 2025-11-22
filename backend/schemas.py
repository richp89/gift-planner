from pydantic import BaseModel
from typing import List, Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class ContactBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None

class ContactCreate(ContactBase):
    pass

class Contact(ContactBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class EventBase(BaseModel):
    name: str
    date: Optional[str] = None
    description: Optional[str] = None

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class GiftBase(BaseModel):
    name: str
    description: Optional[str] = None
    amount: float = 0.0
    purchased: bool = False
    url: Optional[str] = None

class GiftCreate(GiftBase):
    pass

class GiftUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    purchased: Optional[bool] = None
    url: Optional[str] = None

class Gift(GiftBase):
    id: int
    event_recipient_id: int

    class Config:
        from_attributes = True

class EventRecipientBase(BaseModel):
    contact_id: int
    budget_limit: float = 0.0
    notes: Optional[str] = None

class EventRecipientCreate(EventRecipientBase):
    pass

class EventRecipientUpdate(BaseModel):
    budget_limit: Optional[float] = None
    notes: Optional[str] = None

class EventRecipient(EventRecipientBase):
    id: int
    event_id: int

    class Config:
        from_attributes = True

class EventRecipientDetail(EventRecipient):
    contact: Contact
    gifts: List[Gift] = []

    class Config:
        from_attributes = True

class EventDetail(Event):
    recipients: List[EventRecipientDetail] = []

    class Config:
        from_attributes = True
