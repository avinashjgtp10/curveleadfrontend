import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AcceptInvitePage = () => {
  const navigate = useNavigate();
  const { acceptInvite } = useAuth();
  const [params] = useSearchParams();
  const token = params.get('token');

  const [invite, setInvite] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    authAPI.getInviteInfo(token)
      .then(({ data }) => { setInvite(data); setName(data.name || ''); })
      .catch(err => setLoadError(err.response?.data?.error || 'Invalid invitation link.'));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required.');
    if (password !== confirm) return setError('Passwords do not match.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    setError('');
    try {
      await acceptInvite({ token, name: name.trim(), password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept invitation.');
    } finally { setLoading(false); }
  };

  if (!token || loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border max-w-md">
          <p className="text-red-600">{loadError || 'Invalid invitation link.'}</p>
          <button onClick={() => navigate('/login')} className="mt-4 text-brand-600">Back to login</button>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Join {invite.tenant_name}</h2>
          <p className="text-sm text-gray-500 mt-1">You've been invited as {invite.role} — set up your account for <strong>{invite.email}</strong>.</p>
          {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50">
              {loading ? 'Joining...' : 'Join Team'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitePage;
