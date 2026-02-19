import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app mount
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      try {
        const decoded = jwtDecode(accessToken);
        setUsername(decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 'User');
        setIsLoggedIn(true);
      } catch (err) {
        console.error('Invalid token:', err);
        localStorage.removeItem('accessToken');
      }
    }
    setLoading(false);
  }, []);

  const login = (token) => {
    try {
      const decoded = jwtDecode(token);
      setUsername(decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 'User');
      setIsLoggedIn(true);
      localStorage.setItem('accessToken', token);
    } catch (err) {
      console.error('Invalid token:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await fetch('https://localhost:7261/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('accessToken');
      setIsLoggedIn(false);
      setUsername('');
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
