# Gift Planner

A full-stack Progressive Web App (PWA) for planning and tracking gifts for events. Perfect for couples or families who want to coordinate gift-giving across multiple devices.

## Features

- 🎁 **Event Management**: Create and manage multiple gift-giving events
- 👥 **Contact Management**: Maintain a contact list for gift recipients
- 💰 **Budget Tracking**: Set budget limits per person and track spending
- 📝 **Gift Lists**: Add multiple gifts per recipient with inline editing
- ✅ **Purchase Tracking**: Mark gifts as purchased with a checkbox
- 📱 **PWA Support**: Install on mobile devices for offline access
- 🔐 **User Authentication**: Secure login system for multi-device access
- 👫 **Shared Access**: Multiple users can access the same data

## Tech Stack

### Backend
- Python 3.8+
- FastAPI
- SQLAlchemy
- SQLite
- JWT Authentication

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- Axios
- Lucide Icons

## Installation

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the backend server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

1. **Register**: Create an account with username, email, and password
2. **Add Contacts**: Go to the Contacts page and add people you buy gifts for
3. **Create Event**: Create an event (e.g., "Christmas 2025", "Birthday Party")
4. **Add Recipients**: Select contacts to add to the event and set budget limits
5. **Track Gifts**: 
   - Click the expand arrow to see gifts for each person
   - Click "+ Gift" to add new gifts
   - Click on budget or amount to edit inline
   - Check the box when a gift is purchased
6. **Monitor Spending**: The "Remaining" column shows budget left (red if over budget)

## Features in Detail

### Inline Editing
- Click on any budget limit to edit it directly in the table
- Click on any gift amount to edit it directly
- Changes save automatically

### Expandable Rows
- Click the arrow icon to expand/collapse gift lists for each recipient
- Sub-rows show individual gifts with checkboxes for purchase status

### Action Buttons
- **Delete Recipient**: Removes person from event (not from contacts)
- **+ Gift**: Add a new gift for that person
- **Edit Gift**: Open full form to edit gift details
- **Delete Gift**: Remove a gift from the list

## API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /token` - Login
- `GET /users/me` - Get current user

### Contacts
- `GET /contacts` - List all contacts
- `POST /contacts` - Create contact
- `PUT /contacts/{id}` - Update contact
- `DELETE /contacts/{id}` - Delete contact

### Events
- `GET /events` - List all events
- `GET /events/{id}` - Get event details
- `POST /events` - Create event
- `PUT /events/{id}` - Update event
- `DELETE /events/{id}` - Delete event

### Event Recipients
- `GET /events/{id}/recipients` - List recipients for event
- `POST /events/{id}/recipients` - Add recipient to event
- `PUT /events/{id}/recipients/{rid}` - Update recipient
- `DELETE /events/{id}/recipients/{rid}` - Remove recipient

### Gifts
- `GET /recipients/{id}/gifts` - List gifts for recipient
- `POST /recipients/{id}/gifts` - Create gift
- `PUT /gifts/{id}` - Update gift
- `DELETE /gifts/{id}` - Delete gift

## Database Schema

- **Users**: User accounts with authentication
- **Contacts**: People you buy gifts for
- **Events**: Gift-giving occasions
- **EventRecipients**: Links contacts to events with budgets
- **Gifts**: Individual gifts for each recipient

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- All API endpoints require authentication
- Users can only access their own data

## Future Enhancements

- Gift idea suggestions
- Price tracking from URLs
- Sharing events between users
- Gift reminders and notifications
- Export/import functionality
- Multiple currencies support

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first.
