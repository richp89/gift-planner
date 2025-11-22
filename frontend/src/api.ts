import axios from 'axios';

// Use environment variable for production, fallback to proxy for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
}

export interface Contact {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  user_id: number;
}

export interface Event {
  id: number;
  name: string;
  date?: string;
  description?: string;
  user_id: number;
}

export interface Gift {
  id: number;
  event_recipient_id: number;
  name: string;
  description?: string;
  amount: number;
  purchased: boolean;
  url?: string;
}

export interface EventRecipient {
  id: number;
  event_id: number;
  contact_id: number;
  budget_limit: number;
  notes?: string;
  contact: Contact;
  gifts: Gift[];
}

export interface EventDetail extends Event {
  recipients: EventRecipient[];
}

// Auth
export const register = async (username: string, email: string, password: string, full_name?: string) => {
  const response = await api.post<User>('/register', { username, email, password, full_name });
  return response.data;
};

export const login = async (username: string, password: string) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  const response = await api.post<{ access_token: string; token_type: string }>('/token', formData);
  localStorage.setItem('token', response.data.access_token);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const getCurrentUser = async () => {
  const response = await api.get<User>('/users/me');
  return response.data;
};

// Contacts
export const getContacts = async () => {
  const response = await api.get<Contact[]>('/contacts');
  return response.data;
};

export const createContact = async (contact: Omit<Contact, 'id' | 'user_id'>) => {
  const response = await api.post<Contact>('/contacts', contact);
  return response.data;
};

export const updateContact = async (id: number, contact: Omit<Contact, 'id' | 'user_id'>) => {
  const response = await api.put<Contact>(`/contacts/${id}`, contact);
  return response.data;
};

export const deleteContact = async (id: number) => {
  await api.delete(`/contacts/${id}`);
};

// Events
export const getEvents = async () => {
  const response = await api.get<Event[]>('/events');
  return response.data;
};

export const getEvent = async (id: number) => {
  const response = await api.get<EventDetail>(`/events/${id}`);
  return response.data;
};

export const createEvent = async (event: Omit<Event, 'id' | 'user_id'>) => {
  const response = await api.post<Event>('/events', event);
  return response.data;
};

export const updateEvent = async (id: number, event: Omit<Event, 'id' | 'user_id'>) => {
  const response = await api.put<Event>(`/events/${id}`, event);
  return response.data;
};

export const deleteEvent = async (id: number) => {
  await api.delete(`/events/${id}`);
};

// Event Recipients
export const getEventRecipients = async (eventId: number) => {
  const response = await api.get<EventRecipient[]>(`/events/${eventId}/recipients`);
  return response.data;
};

export const addRecipientToEvent = async (eventId: number, contactId: number, budgetLimit: number) => {
  const response = await api.post<EventRecipient>(`/events/${eventId}/recipients`, {
    contact_id: contactId,
    budget_limit: budgetLimit,
  });
  return response.data;
};

export const updateEventRecipient = async (eventId: number, recipientId: number, data: { budget_limit?: number; notes?: string }) => {
  const response = await api.put<EventRecipient>(`/events/${eventId}/recipients/${recipientId}`, data);
  return response.data;
};

export const removeRecipientFromEvent = async (eventId: number, recipientId: number) => {
  await api.delete(`/events/${eventId}/recipients/${recipientId}`);
};

// Gifts
export const getGifts = async (recipientId: number) => {
  const response = await api.get<Gift[]>(`/recipients/${recipientId}/gifts`);
  return response.data;
};

export const createGift = async (recipientId: number, gift: Omit<Gift, 'id' | 'event_recipient_id'>) => {
  const response = await api.post<Gift>(`/recipients/${recipientId}/gifts`, gift);
  return response.data;
};

export const updateGift = async (giftId: number, gift: Partial<Omit<Gift, 'id' | 'event_recipient_id'>>) => {
  const response = await api.put<Gift>(`/gifts/${giftId}`, gift);
  return response.data;
};

export const deleteGift = async (giftId: number) => {
  await api.delete(`/gifts/${giftId}`);
};

export default api;
