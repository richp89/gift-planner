import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import EventDetail from './components/EventDetail';
import Contacts from './components/Contacts';
import { getCurrentUser } from './api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await getCurrentUser();
          setIsAuthenticated(true);
        } catch (error) {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" /> : <Auth onLogin={() => setIsAuthenticated(true)} />} 
        />
        <Route
          path="/"
          element={isAuthenticated ? <Dashboard onLogout={() => setIsAuthenticated(false)} /> : <Navigate to="/login" />}
        />
        <Route
          path="/events/:id"
          element={isAuthenticated ? <EventDetail onLogout={() => setIsAuthenticated(false)} /> : <Navigate to="/login" />}
        />
        <Route
          path="/contacts"
          element={isAuthenticated ? <Contacts onLogout={() => setIsAuthenticated(false)} /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
