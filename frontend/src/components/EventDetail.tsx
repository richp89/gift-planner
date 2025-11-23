import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getEvent,
  getContacts,
  addRecipientToEvent,
  updateEventRecipient,
  removeRecipientFromEvent,
  createGift,
  updateGift,
  deleteGift,
  logout,
  EventDetail as EventDetailType,
  Contact,
  EventRecipient,
  Gift,
  getFriends,
  shareEvent,
  Friend,
  getCurrentUser,
  User,
} from '../api';
import { Plus, ArrowLeft, LogOut, Trash2, Edit, ChevronDown, ChevronRight, Share2 } from 'lucide-react';

interface EventDetailProps {
  onLogout: () => void;
}

export default function EventDetail({ onLogout }: EventDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetailType | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [budgetLimit, setBudgetLimit] = useState<number>(0);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [editingBudget, setEditingBudget] = useState<number | null>(null);
  const [editingAmount, setEditingAmount] = useState<number | null>(null);
  const [currentRecipient, setCurrentRecipient] = useState<EventRecipient | null>(null);
  const [currentGift, setCurrentGift] = useState<Gift | null>(null);
  const [newGift, setNewGift] = useState({
    name: '',
    description: '',
    amount: 0,
    purchased: false,
    url: '',
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedFriendId, setSelectedFriendId] = useState<number>(0);
  const [sharePermission, setSharePermission] = useState<string>('read');

  useEffect(() => {
    loadData();
    loadFriends();
    loadCurrentUser();
  }, [id]);

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

  const loadData = async () => {
    try {
      const [eventData, contactsData] = await Promise.all([
        getEvent(Number(id)),
        getContacts(),
      ]);
      setEvent(eventData);
      setContacts(contactsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecipients = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      for (const contactId of selectedContactIds) {
        await addRecipientToEvent(Number(id), contactId, budgetLimit);
      }
      setSelectedContactIds([]);
      setBudgetLimit(0);
      setShowAddModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to add recipients:', error);
    }
  };

  const handleRemoveRecipient = async (recipientId: number) => {
    if (window.confirm('Remove this person from the event?')) {
      try {
        await removeRecipientFromEvent(Number(id), recipientId);
        loadData();
      } catch (error) {
        console.error('Failed to remove recipient:', error);
      }
    }
  };

  const handleUpdateBudget = async (recipientId: number, value: number) => {
    try {
      await updateEventRecipient(Number(id), recipientId, { budget_limit: value });
      setEditingBudget(null);
      loadData();
    } catch (error) {
      console.error('Failed to update budget:', error);
    }
  };

  const handleCreateGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRecipient) return;
    try {
      await createGift(currentRecipient.id, newGift);
      setNewGift({ name: '', description: '', amount: 0, purchased: false, url: '' });
      setShowGiftModal(false);
      setCurrentRecipient(null);
      loadData();
    } catch (error) {
      console.error('Failed to create gift:', error);
    }
  };

  const handleUpdateGift = async (giftId: number, updates: Partial<Gift>) => {
    try {
      await updateGift(giftId, updates);
      setEditingAmount(null);
      setCurrentGift(null);
      loadData();
    } catch (error) {
      console.error('Failed to update gift:', error);
    }
  };

  const handleDeleteGift = async (giftId: number) => {
    if (window.confirm('Delete this gift?')) {
      try {
        await deleteGift(giftId);
        loadData();
      } catch (error) {
        console.error('Failed to delete gift:', error);
      }
    }
  };

  const toggleRow = (recipientId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(recipientId)) {
      newExpanded.delete(recipientId);
    } else {
      newExpanded.add(recipientId);
    }
    setExpandedRows(newExpanded);
  };

  const calculateSpent = (recipient: EventRecipient) => {
    return recipient.gifts.reduce((sum, gift) => sum + gift.amount, 0);
  };

  const calculateRemaining = (recipient: EventRecipient) => {
    return recipient.budget_limit - calculateSpent(recipient);
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const openGiftForm = (recipient: EventRecipient, gift?: Gift) => {
    setCurrentRecipient(recipient);
    if (gift) {
      setCurrentGift(gift);
      setNewGift({
        name: gift.name,
        description: gift.description || '',
        amount: gift.amount,
        purchased: gift.purchased,
        url: gift.url || '',
      });
    } else {
      setCurrentGift(null);
      setNewGift({ name: '', description: '', amount: 0, purchased: false, url: '' });
    }
    setShowGiftModal(true);
  };

  const handleSaveGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentGift) {
      await handleUpdateGift(currentGift.id, newGift);
    } else {
      await handleCreateGift(e);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriendId || !event) return;
    
    try {
      await shareEvent(event.id, selectedFriendId, sharePermission);
      setShowShareModal(false);
      setSelectedFriendId(0);
      alert('Event shared successfully!');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to share event');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!event) {
    return <div>Event not found</div>;
  }

  const availableContacts = contacts.filter(
    (contact) => !event.recipients.some((r) => r.contact_id === contact.id)
  );

  return (
    <div className="app-container">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary btn-icon" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <h1>🎁 {event.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {currentUser && event.user_id === currentUser.id && (
            <button className="btn btn-secondary" onClick={() => setShowShareModal(true)}>
              <Share2 size={16} /> Share
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2>Recipients & Gifts</h2>
            {event.date && <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Event Date: {event.date}</p>}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            disabled={availableContacts.length === 0}
          >
            <Plus size={16} /> Add Recipients
          </button>
        </div>

        {event.recipients.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            No recipients yet. Add people to start tracking gifts!
          </p>
        ) : (
          <>
            <div style={{ 
              display: 'flex', 
              gap: '2rem', 
              padding: '1rem', 
              backgroundColor: '#f9fafb', 
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              justifyContent: 'center'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                  Total Budget
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
                  ${event.recipients.reduce((sum, r) => sum + r.budget_limit, 0).toFixed(2)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                  Total Spent
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
                  ${event.recipients.reduce((sum, r) => sum + calculateSpent(r), 0).toFixed(2)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                  Remaining
                </div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 700,
                  color: event.recipients.reduce((sum, r) => sum + calculateRemaining(r), 0) < 0 ? '#ef4444' : '#059669'
                }}>
                  ${event.recipients.reduce((sum, r) => sum + calculateRemaining(r), 0).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Name</th>
                  <th>Budget Limit</th>
                  <th>Total Spent</th>
                  <th>Remaining</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {event.recipients.map((recipient) => {
                  const spent = calculateSpent(recipient);
                  const remaining = calculateRemaining(recipient);
                  const isExpanded = expandedRows.has(recipient.id);

                  return (
                    <>
                      <tr key={recipient.id} className={isExpanded ? 'expanded' : ''}>
                        <td>
                          <button
                            className="btn btn-icon btn-small"
                            onClick={() => toggleRow(recipient.id)}
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </td>
                        <td style={{ fontWeight: 600 }}>{recipient.contact.name}</td>
                        <td>
                          {editingBudget === recipient.id ? (
                            <input
                              type="number"
                              className="form-input inline-edit"
                              defaultValue={recipient.budget_limit}
                              onBlur={(e) => handleUpdateBudget(recipient.id, Number(e.target.value))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateBudget(recipient.id, Number(e.currentTarget.value));
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <span
                              onClick={() => setEditingBudget(recipient.id)}
                              style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              ${recipient.budget_limit.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td>${spent.toFixed(2)}</td>
                        <td style={{ color: remaining < 0 ? '#ef4444' : '#059669', fontWeight: 600 }}>
                          ${remaining.toFixed(2)}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-small btn-primary"
                              onClick={() => openGiftForm(recipient)}
                            >
                              <Plus size={14} /> Gift
                            </button>
                            <button
                              className="btn btn-small btn-danger"
                              onClick={() => handleRemoveRecipient(recipient.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded &&
                        recipient.gifts.map((gift) => (
                          <tr key={`gift-${gift.id}`} className="sub-row">
                            <td></td>
                            <td colSpan={2}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                  type="checkbox"
                                  checked={gift.purchased}
                                  onChange={() => handleUpdateGift(gift.id, { purchased: !gift.purchased })}
                                />
                                <span style={{ textDecoration: gift.purchased ? 'line-through' : 'none' }}>
                                  {gift.name}
                                </span>
                              </div>
                              {gift.description && (
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                  {gift.description}
                                </div>
                              )}
                            </td>
                            <td>
                              {editingAmount === gift.id ? (
                                <input
                                  type="number"
                                  className="form-input inline-edit"
                                  defaultValue={gift.amount}
                                  onBlur={(e) => handleUpdateGift(gift.id, { amount: Number(e.target.value) })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleUpdateGift(gift.id, { amount: Number(e.currentTarget.value) });
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <span
                                  onClick={() => setEditingAmount(gift.id)}
                                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                  ${gift.amount.toFixed(2)}
                                </span>
                              )}
                            </td>
                            <td></td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn btn-small btn-secondary"
                                  onClick={() => openGiftForm(recipient, gift)}
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  className="btn btn-small btn-danger"
                                  onClick={() => handleDeleteGift(gift.id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Recipients</h2>
              <button onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddRecipients}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label>Select Contacts</label>
                  <button
                    type="button"
                    className="btn btn-small btn-secondary"
                    onClick={() => {
                      if (selectedContactIds.length === availableContacts.length) {
                        setSelectedContactIds([]);
                      } else {
                        setSelectedContactIds(availableContacts.map((c) => c.id));
                      }
                    }}
                  >
                    {selectedContactIds.length === availableContacts.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}>
                  {availableContacts.map((contact) => (
                    <div key={contact.id} style={{ padding: '0.25rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'normal' }}>
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(contact.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedContactIds([...selectedContactIds, contact.id]);
                            } else {
                              setSelectedContactIds(selectedContactIds.filter((id) => id !== contact.id));
                            }
                          }}
                        />
                        {contact.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Budget Limit per Person</label>
                <input
                  type="number"
                  className="form-input"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(Number(e.target.value))}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={selectedContactIds.length === 0}>
                  Add Selected
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGiftModal && (
        <div className="modal-overlay" onClick={() => setShowGiftModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{currentGift ? 'Edit Gift' : 'Add Gift'}</h2>
              <button onClick={() => setShowGiftModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveGift}>
              <div className="form-group">
                <label>Gift Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newGift.name}
                  onChange={(e) => setNewGift({ ...newGift, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-input"
                  value={newGift.description}
                  onChange={(e) => setNewGift({ ...newGift, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  className="form-input"
                  value={newGift.amount}
                  onChange={(e) => setNewGift({ ...newGift, amount: Number(e.target.value) })}
                  onFocus={(e) => {
                    if (e.target.value === '0') {
                      e.target.select();
                    }
                  }}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={newGift.url}
                  onChange={(e) => setNewGift({ ...newGift, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={newGift.purchased}
                    onChange={(e) => setNewGift({ ...newGift, purchased: e.target.checked })}
                  />
                  Purchased
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowGiftModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {currentGift ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Share Event</h2>
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
