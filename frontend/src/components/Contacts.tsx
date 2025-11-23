import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getContacts, 
  createContact, 
  updateContact, 
  deleteContact, 
  logout, 
  Contact,
  getFriends,
  shareContact,
  unshareContact,
  Friend,
  getCurrentUser,
  User,
} from '../api';
import { Plus, ArrowLeft, LogOut, Trash2, Edit, Share2 } from 'lucide-react';

interface ContactsProps {
  onLogout: () => void;
}

export default function Contacts({ onLogout }: ContactsProps) {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingContact, setSharingContact] = useState<Contact | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedFriendId, setSelectedFriendId] = useState<number>(0);
  const [sharePermission, setSharePermission] = useState<string>('read');

  useEffect(() => {
    loadContacts();
    loadFriends();
    loadCurrentUser();
  }, []);

  const loadFriends = async () => {
    try {
      const data = await getFriends();
      setFriends(data);
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const data = await getContacts();
      setContacts(data);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await updateContact(editingContact.id, formData);
      } else {
        await createContact(formData);
      }
      setFormData({ name: '', email: '', phone: '', notes: '' });
      setEditingContact(null);
      setShowModal(false);
      loadContacts();
    } catch (error) {
      console.error('Failed to save contact:', error);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      notes: contact.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteContact(id);
        loadContacts();
      } catch (error) {
        console.error('Failed to delete contact:', error);
      }
    }
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const handleOpenShare = (contact: Contact) => {
    setSharingContact(contact);
    setShowShareModal(true);
    setSelectedFriendId(0);
    setSharePermission('read');
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharingContact || !selectedFriendId) return;
    
    try {
      await shareContact(sharingContact.id, selectedFriendId, sharePermission);
      setShowShareModal(false);
      setSharingContact(null);
      alert('Contact shared successfully!');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to share contact');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary btn-icon" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <h1>👥 Contacts</h1>
        </div>
        <button className="btn btn-secondary" onClick={handleLogout}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>All Contacts</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Contact
          </button>
        </div>

        {contacts.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            No contacts yet. Add your first contact to get started!
          </p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td style={{ fontWeight: 600 }}>{contact.name}</td>
                    <td>{contact.email || '-'}</td>
                    <td>{contact.phone || '-'}</td>
                    <td>{contact.notes || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        {currentUser && contact.user_id === currentUser.id && (
                          <button className="btn btn-small btn-secondary" onClick={() => handleOpenShare(contact)}>
                            <Share2 size={14} />
                          </button>
                        )}
                        <button className="btn btn-small btn-secondary" onClick={() => handleEdit(contact)}>
                          <Edit size={14} />
                        </button>
                        {currentUser && contact.user_id === currentUser.id && (
                          <button className="btn btn-small btn-danger" onClick={() => handleDelete(contact.id)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingContact(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingContact ? 'Edit Contact' : 'Add Contact'}</h2>
              <button onClick={() => { setShowModal(false); setEditingContact(null); }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  className="form-input"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowModal(false); setEditingContact(null); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingContact ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showShareModal && sharingContact && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Share Contact: {sharingContact.name}</h2>
              <button onClick={() => setShowShareModal(false)}>✕</button>
            </div>
            <form onSubmit={handleShare}>
              <div className="form-group">
                <label>Share with Friend</label>
                <select
                  className="form-input"
                  value={selectedFriendId}
                  onChange={(e) => setSelectedFriendId(Number(e.target.value))}
                  required
                >
                  <option value={0}>Select a friend...</option>
                  {friends.map((friend) => (
                    <option key={friend.id} value={friend.id}>
                      {friend.username} ({friend.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Permission Level</label>
                <select
                  className="form-input"
                  value={sharePermission}
                  onChange={(e) => setSharePermission(e.target.value)}
                >
                  <option value="read">Read Only</option>
                  <option value="write">Can Edit</option>
                  <option value="admin">Admin (Can Delete & Manage Sharing)</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowShareModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!selectedFriendId}>
                  Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
