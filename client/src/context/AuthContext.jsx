import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await API.get('/auth/me');
        setUser(data.data);
      } catch (err) {
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    if (localStorage.getItem('token')) fetchUser();
    else setLoading(false);
  }, []);

  const register = async (name, email, mobile, password) => {
    const { data } = await API.post('/auth/register', { name, email, mobile, password });
    localStorage.setItem('token', data.data.token);
    setUser(data.data);
  };

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    localStorage.setItem('token', data.data.token);
    setUser(data.data);
  };
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
