import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  // Handle Google OAuth callback token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token && window.location.pathname === '/auth/google/callback') {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchMe().then(() => {
        window.history.replaceState({}, '', '/dashboard');
      });
    }
  }, []);

  const fetchMe = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    return user;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  };

  const loginWithGoogle = () => {
    // In production: use relative URL (same Railway domain)
    // In development: use full localhost URL
    const base = import.meta.env.VITE_API_URL || '';
    window.location.href = `${base}/api/auth/google`;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithGoogle, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
