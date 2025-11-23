from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
import auth
from database import SessionLocal, engine
import os

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gift Planner API")

# CORS middleware - allow frontend origins
allowed_origins_str = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000')
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(',')]

print(f"🔧 ALLOWED_ORIGINS from env: {allowed_origins_str}")
print(f"🔧 ALLOWED_ORIGINS used: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user = auth.verify_token(token, db)
    if user is None:
        raise credentials_exception
    return user

# Health check endpoint
@app.get("/")
def health_check():
    return {"status": "healthy", "message": "Gift Planner API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}

# Auth endpoints
@app.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return auth.create_user(db, user)

@app.post("/token", response_model=schemas.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# Contact endpoints
@app.post("/contacts", response_model=schemas.Contact)
def create_contact(contact: schemas.ContactCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_contact = models.Contact(**contact.dict(), user_id=current_user.id)
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

@app.get("/contacts", response_model=List[schemas.Contact])
def read_contacts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Get own contacts
    own_contacts = db.query(models.Contact).filter(models.Contact.user_id == current_user.id).all()
    
    # Get contacts shared with user
    shared_contacts = db.query(models.Contact).join(models.ContactShare).filter(
        models.ContactShare.shared_with_user_id == current_user.id
    ).all()
    
    # Combine and return unique contacts
    all_contacts = own_contacts + shared_contacts
    return all_contacts[skip:skip+limit]

@app.put("/contacts/{contact_id}", response_model=schemas.Contact)
def update_contact(contact_id: int, contact: schemas.ContactCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_contact = db.query(models.Contact).filter(models.Contact.id == contact_id, models.Contact.user_id == current_user.id).first()
    if not db_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    for key, value in contact.dict().items():
        setattr(db_contact, key, value)
    db.commit()
    db.refresh(db_contact)
    return db_contact

@app.delete("/contacts/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_contact = db.query(models.Contact).filter(models.Contact.id == contact_id, models.Contact.user_id == current_user.id).first()
    if not db_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(db_contact)
    db.commit()
    return {"ok": True}

# Event endpoints
@app.post("/events", response_model=schemas.Event)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_event = models.Event(**event.dict(), user_id=current_user.id)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@app.get("/events", response_model=List[schemas.Event])
def read_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Get own events
    own_events = db.query(models.Event).filter(models.Event.user_id == current_user.id).all()
    
    # Get events shared with user
    shared_events = db.query(models.Event).join(models.EventShare).filter(
        models.EventShare.shared_with_user_id == current_user.id
    ).all()
    
    # Combine and return unique events
    all_events = own_events + shared_events
    return all_events[skip:skip+limit]

@app.get("/events/{event_id}", response_model=schemas.EventDetail)
def read_event(event_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check if user owns the event
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if user has access (owner or shared with)
    if event.user_id != current_user.id:
        share = db.query(models.EventShare).filter(
            models.EventShare.event_id == event_id,
            models.EventShare.shared_with_user_id == current_user.id
        ).first()
        if not share:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return event

@app.put("/events/{event_id}", response_model=schemas.Event)
def update_event(event_id: int, event: schemas.EventCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_event = db.query(models.Event).filter(models.Event.id == event_id, models.Event.user_id == current_user.id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    for key, value in event.dict().items():
        setattr(db_event, key, value)
    db.commit()
    db.refresh(db_event)
    return db_event

@app.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_event = db.query(models.Event).filter(models.Event.id == event_id, models.Event.user_id == current_user.id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(db_event)
    db.commit()
    return {"ok": True}

# Event Recipient endpoints
@app.post("/events/{event_id}/recipients", response_model=schemas.EventRecipient)
def add_recipient_to_event(event_id: int, recipient: schemas.EventRecipientCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    event = db.query(models.Event).filter(models.Event.id == event_id, models.Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db_recipient = models.EventRecipient(**recipient.dict(), event_id=event_id)
    db.add(db_recipient)
    db.commit()
    db.refresh(db_recipient)
    return db_recipient

@app.get("/events/{event_id}/recipients", response_model=List[schemas.EventRecipientDetail])
def read_event_recipients(event_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    event = db.query(models.Event).filter(models.Event.id == event_id, models.Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    recipients = db.query(models.EventRecipient).filter(models.EventRecipient.event_id == event_id).all()
    return recipients

@app.put("/events/{event_id}/recipients/{recipient_id}", response_model=schemas.EventRecipient)
def update_event_recipient(event_id: int, recipient_id: int, recipient: schemas.EventRecipientUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    event = db.query(models.Event).filter(models.Event.id == event_id, models.Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db_recipient = db.query(models.EventRecipient).filter(
        models.EventRecipient.id == recipient_id,
        models.EventRecipient.event_id == event_id
    ).first()
    if not db_recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    for key, value in recipient.dict(exclude_unset=True).items():
        setattr(db_recipient, key, value)
    db.commit()
    db.refresh(db_recipient)
    return db_recipient

@app.delete("/events/{event_id}/recipients/{recipient_id}")
def remove_recipient_from_event(event_id: int, recipient_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    event = db.query(models.Event).filter(models.Event.id == event_id, models.Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db_recipient = db.query(models.EventRecipient).filter(
        models.EventRecipient.id == recipient_id,
        models.EventRecipient.event_id == event_id
    ).first()
    if not db_recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    db.delete(db_recipient)
    db.commit()
    return {"ok": True}

# Gift endpoints
@app.post("/recipients/{recipient_id}/gifts", response_model=schemas.Gift)
def create_gift(recipient_id: int, gift: schemas.GiftCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    recipient = db.query(models.EventRecipient).join(models.Event).filter(
        models.EventRecipient.id == recipient_id,
        models.Event.user_id == current_user.id
    ).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    db_gift = models.Gift(**gift.dict(), event_recipient_id=recipient_id)
    db.add(db_gift)
    db.commit()
    db.refresh(db_gift)
    return db_gift

@app.get("/recipients/{recipient_id}/gifts", response_model=List[schemas.Gift])
def read_gifts(recipient_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    recipient = db.query(models.EventRecipient).join(models.Event).filter(
        models.EventRecipient.id == recipient_id,
        models.Event.user_id == current_user.id
    ).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    gifts = db.query(models.Gift).filter(models.Gift.event_recipient_id == recipient_id).all()
    return gifts

@app.put("/gifts/{gift_id}", response_model=schemas.Gift)
def update_gift(gift_id: int, gift: schemas.GiftUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_gift = db.query(models.Gift).join(models.EventRecipient).join(models.Event).filter(
        models.Gift.id == gift_id,
        models.Event.user_id == current_user.id
    ).first()
    if not db_gift:
        raise HTTPException(status_code=404, detail="Gift not found")
    
    for key, value in gift.dict(exclude_unset=True).items():
        setattr(db_gift, key, value)
    db.commit()
    db.refresh(db_gift)
    return db_gift

@app.delete("/gifts/{gift_id}")
def delete_gift(gift_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_gift = db.query(models.Gift).join(models.EventRecipient).join(models.Event).filter(
        models.Gift.id == gift_id,
        models.Event.user_id == current_user.id
    ).first()
    if not db_gift:
        raise HTTPException(status_code=404, detail="Gift not found")
    
    db.delete(db_gift)
    db.commit()
    return {"ok": True}

# Friend endpoints
@app.post("/friends/request", response_model=schemas.FriendRequest)
def send_friend_request(request: schemas.FriendRequestCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Find the user to send request to
    to_user = db.query(models.User).filter(models.User.username == request.to_username).first()
    if not to_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if to_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")
    
    # Check if already friends or pending request exists
    existing = db.query(models.FriendRequest).filter(
        ((models.FriendRequest.from_user_id == current_user.id) & (models.FriendRequest.to_user_id == to_user.id)) |
        ((models.FriendRequest.from_user_id == to_user.id) & (models.FriendRequest.to_user_id == current_user.id))
    ).first()
    
    if existing:
        if existing.status == "accepted":
            raise HTTPException(status_code=400, detail="Already friends")
        else:
            raise HTTPException(status_code=400, detail="Friend request already exists")
    
    db_request = models.FriendRequest(from_user_id=current_user.id, to_user_id=to_user.id)
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

@app.get("/friends/requests", response_model=List[schemas.FriendRequest])
def get_friend_requests(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    requests = db.query(models.FriendRequest).filter(
        models.FriendRequest.to_user_id == current_user.id,
        models.FriendRequest.status == "pending"
    ).all()
    return requests

@app.post("/friends/requests/{request_id}/accept")
def accept_friend_request(request_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_request = db.query(models.FriendRequest).filter(
        models.FriendRequest.id == request_id,
        models.FriendRequest.to_user_id == current_user.id
    ).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    db_request.status = "accepted"
    db.commit()
    return {"ok": True}

@app.post("/friends/requests/{request_id}/reject")
def reject_friend_request(request_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_request = db.query(models.FriendRequest).filter(
        models.FriendRequest.id == request_id,
        models.FriendRequest.to_user_id == current_user.id
    ).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    db_request.status = "rejected"
    db.commit()
    return {"ok": True}

@app.get("/friends", response_model=List[schemas.FriendInfo])
def get_friends(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Get all accepted friend requests where current user is involved
    friend_requests = db.query(models.FriendRequest).filter(
        ((models.FriendRequest.from_user_id == current_user.id) | (models.FriendRequest.to_user_id == current_user.id)),
        models.FriendRequest.status == "accepted"
    ).all()
    
    friends = []
    for req in friend_requests:
        friend_id = req.to_user_id if req.from_user_id == current_user.id else req.from_user_id
        friend = db.query(models.User).filter(models.User.id == friend_id).first()
        if friend:
            friends.append(friend)
    
    return friends

# Contact sharing endpoints
@app.post("/contacts/{contact_id}/share")
def share_contact(contact_id: int, share: schemas.ContactShareCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    contact = db.query(models.Contact).filter(
        models.Contact.id == contact_id,
        models.Contact.user_id == current_user.id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found or not yours")
    
    # Check if they're friends
    is_friend = db.query(models.FriendRequest).filter(
        ((models.FriendRequest.from_user_id == current_user.id) & (models.FriendRequest.to_user_id == share.shared_with_user_id)) |
        ((models.FriendRequest.from_user_id == share.shared_with_user_id) & (models.FriendRequest.to_user_id == current_user.id)),
        models.FriendRequest.status == "accepted"
    ).first()
    
    if not is_friend:
        raise HTTPException(status_code=400, detail="Can only share with friends")
    
    # Check if already shared
    existing = db.query(models.ContactShare).filter(
        models.ContactShare.contact_id == contact_id,
        models.ContactShare.shared_with_user_id == share.shared_with_user_id
    ).first()
    
    if existing:
        # Update permission
        existing.permission = share.permission
        db.commit()
        return {"ok": True, "message": "Permission updated"}
    
    db_share = models.ContactShare(
        contact_id=contact_id,
        shared_with_user_id=share.shared_with_user_id,
        permission=share.permission
    )
    db.add(db_share)
    db.commit()
    return {"ok": True}

@app.delete("/contacts/{contact_id}/share/{user_id}")
def unshare_contact(contact_id: int, user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    contact = db.query(models.Contact).filter(
        models.Contact.id == contact_id,
        models.Contact.user_id == current_user.id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found or not yours")
    
    share = db.query(models.ContactShare).filter(
        models.ContactShare.contact_id == contact_id,
        models.ContactShare.shared_with_user_id == user_id
    ).first()
    
    if share:
        db.delete(share)
        db.commit()
    
    return {"ok": True}

# Event sharing endpoints
@app.post("/events/{event_id}/share")
def share_event(event_id: int, share: schemas.EventShareCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    event = db.query(models.Event).filter(
        models.Event.id == event_id,
        models.Event.user_id == current_user.id
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found or not yours")
    
    # Check if they're friends
    is_friend = db.query(models.FriendRequest).filter(
        ((models.FriendRequest.from_user_id == current_user.id) & (models.FriendRequest.to_user_id == share.shared_with_user_id)) |
        ((models.FriendRequest.from_user_id == share.shared_with_user_id) & (models.FriendRequest.to_user_id == current_user.id)),
        models.FriendRequest.status == "accepted"
    ).first()
    
    if not is_friend:
        raise HTTPException(status_code=400, detail="Can only share with friends")
    
    # Check if already shared
    existing = db.query(models.EventShare).filter(
        models.EventShare.event_id == event_id,
        models.EventShare.shared_with_user_id == share.shared_with_user_id
    ).first()
    
    if existing:
        # Update permission
        existing.permission = share.permission
        db.commit()
        return {"ok": True, "message": "Permission updated"}
    
    db_share = models.EventShare(
        event_id=event_id,
        shared_with_user_id=share.shared_with_user_id,
        permission=share.permission
    )
    db.add(db_share)
    db.commit()
    return {"ok": True}

@app.delete("/events/{event_id}/share/{user_id}")
def unshare_event(event_id: int, user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    event = db.query(models.Event).filter(
        models.Event.id == event_id,
        models.Event.user_id == current_user.id
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found or not yours")
    
    share = db.query(models.EventShare).filter(
        models.EventShare.event_id == event_id,
        models.EventShare.shared_with_user_id == user_id
    ).first()
    
    if share:
        db.delete(share)
        db.commit()
    
    return {"ok": True}
