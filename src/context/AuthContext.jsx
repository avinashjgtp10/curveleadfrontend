import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.me()
        .then(({ data }) => { setUser(data.user); setTenant(data.tenant); })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const refreshProfile = async () => {
    const { data } = await authAPI.me();
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  };

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  };

  const verifyOtp = async (payload) => {
    const { data } = await authAPI.verifyOtp(payload);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  };

  const signup = async (formData) => {
    const { data } = await authAPI.signup(formData);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  };

  const acceptInvite = async (payload) => {
    const { data } = await authAPI.acceptInvite(payload);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider value={{ user, tenant, loading, login, verifyOtp, signup, acceptInvite, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
