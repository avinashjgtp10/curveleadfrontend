import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('curvelead_token');
    if (token) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await authAPI.getProfile();
      setUser(data.user);
      setTenant(data.tenant);
    } catch (error) {
      console.error('Failed to load profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('curvelead_token', data.token);
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  };

  const signup = async (formData) => {
    const { data } = await authAPI.signup(formData);
    localStorage.setItem('curvelead_token', data.token);
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('curvelead_token');
    setUser(null);
    setTenant(null);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ user, tenant, loading, login, signup, logout, isAdmin, loadProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
