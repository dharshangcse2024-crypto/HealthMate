import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/profile');
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await api.post('/auth/login', formData);
    localStorage.setItem('token', response.data.access_token);
    
    // Fetch profile after login
    const profileRes = await api.get('/profile');
    setUser(profileRes.data);
  };

  const googleLogin = async (credentialResponse) => {
    const response = await api.post('/auth/google', {
      token: credentialResponse.credential
    });
    localStorage.setItem('token', response.data.access_token);
    
    // Fetch profile after login
    const profileRes = await api.get('/profile');
    setUser(profileRes.data);
  };

  const register = async (name, email, password) => {
    await api.post('/auth/register', { name, email, password });
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const profileRes = await api.get('/profile');
      setUser(profileRes.data);
    } catch (err) {
      console.error('Failed to refresh profile', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, googleLogin, register, logout, loading, refreshProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
