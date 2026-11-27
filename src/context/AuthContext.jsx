import { setWorkspaceTimezone } from '../utils/dateTime';
import { setWorkspaceLocale, setLegacyCurrency, loadRates } from '../utils/locale';
import { createContext, useContext, useState, useEffect, Fragment } from 'react';
import { authAPI, clearApiCache } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratesVersion, setRatesVersion] = useState(0);

  // Daily exchange rates, so amounts recorded in another currency show in the workspace currency.
  useEffect(() => { loadRates().then((fresh) => { if (fresh) setRatesVersion((v) => v + 1); }); }, []);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('token');
    const current = () => active && localStorage.getItem('token') === token;
    if (token) {
      authAPI.me()
        .then(({ data }) => { if (current()) { setUser(data.user); setTenant(data.tenant); } })
        .catch(() => { if (current()) { clearApiCache(); localStorage.removeItem('token'); } })
        .finally(() => { if (active) setLoading(false); });
    } else {
      setLoading(false);
    }
    return () => { active = false; };
  }, []);

  const refreshProfile = async () => {
    const { data } = await authAPI.me({ force: true });
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  };

  // Apply a just-saved country/currency at once, so every screen formats with it even if /me lags behind.
  const applyWorkspaceLocale = (patch) => {
    setTenant((t) => (t ? { ...t, ...patch, settings: { ...(t.settings || {}), ...patch } } : t));
  };

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    clearApiCache();
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  };

  const verifyOtp = async (payload) => {
    const { data } = await authAPI.verifyOtp(payload);
    clearApiCache();
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  };

  const googleLogin = async (credential) => {
    const { data } = await authAPI.googleLogin(credential);
    clearApiCache();
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  };

  const signup = async (formData) => {
    const { data } = await authAPI.signup(formData);
    clearApiCache();
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  };

  const acceptInvite = async (payload) => {
    const { data } = await authAPI.acceptInvite(payload);
    clearApiCache();
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  };

  const logout = () => {
    clearApiCache();
    localStorage.removeItem('token');
    setUser(null);
    setTenant(null);
  };

  setWorkspaceTimezone(tenant?.settings?.timezone || tenant?.timezone || 'Asia/Kolkata');
  setWorkspaceLocale({ country: tenant?.country, currency: tenant?.currency });
  setLegacyCurrency(tenant?.settings?.currency_history?.[0]?.from);

  return (
    <AuthContext.Provider value={{ user, tenant, applyWorkspaceLocale, loading, login, verifyOtp, googleLogin, signup, acceptInvite, logout, refreshProfile }}>
      <Fragment key={ratesVersion}>{children}</Fragment>
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
