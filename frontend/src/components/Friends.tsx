import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  logout,
  Friend,
  FriendRequest as FriendRequestType,
} from '../api';
import { ArrowLeft, LogOut, Plus, Check, X, UserPlus } from 'lucide-react';

interface FriendsProps {
  onLogout: () => void;
}

export default function Friends({ onLogout }: FriendsProps) {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFriendUsername, setNewFriendUsername] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [friendsData, requestsData] = await Promise.all([
        getFriends(),
        getFriendRequests(),
      ]);
      setFriends(friendsData);
      setRequests(requestsData);
    } catch (error) {
      console.error('Failed to load friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await sendFriendRequest(newFriendUsername);
      setNewFriendUsername('');
      setShowAddModal(false);
      loadData();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to send friend request');
    }
  };

  const handleAccept = async (requestId: number) => {
    try {
      await acceptFriendRequest(requestId);
      loadData();
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await rejectFriendRequest(requestId);
      loadData();
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const handleLogout = () => {
    logout();
    onLogout();
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
          <h1>👥 Friends</h1>
        </div>
        <button className="btn btn-secondary" onClick={handleLogout}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      {requests.length > 0 && (
        <div className="card">
          <h2>Friend Requests</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {requests.map((request) => (
              <div
                key={request.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{request.from_user.username}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {request.from_user.email}
                  </div>
                </div>
                <div className="action-buttons">
                  <button
                    className="btn btn-small btn-primary"
                    onClick={() => handleAccept(request.id)}
                  >
                    <Check size={14} /> Accept
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => handleReject(request.id)}
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>My Friends ({friends.length})</h2>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <UserPlus size={16} /> Add Friend
          </button>
        </div>

        {friends.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            No friends yet. Add friends to share contacts and events!
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {friends.map((friend) => (
              <div
                key={friend.id}
                style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
              >
                <div style={{ fontWeight: 600 }}>{friend.username}</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {friend.email}
                </div>
                {friend.full_name && (
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {friend.full_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Friend</h2>
              <button onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSendRequest}>
              <div className="form-group">
                <label>Friend's Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={newFriendUsername}
                  onChange={(e) => setNewFriendUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>
              {error && (
                <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  {error}
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
