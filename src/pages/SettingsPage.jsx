import { useEffect, useState } from 'react';
import { settingsAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Building, Lock, Webhook, CheckCircle, Copy } from 'lucide-react';

const SettingsPage = () => {
  const { user, tenant } = useAuth();
  const [tab, setTab] = useState('profile');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Profile form
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  // Business settings
  const [business, setBusiness] = useState({ name: '', phone: '', address: '' });

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const { data } = await settingsAPI.get();
      setSettings(data.settings || {});
      setProfile({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
      setBusiness({ name: tenant?.name || '', phone: data.settings?.phone || '', address: data.settings?.address || '' });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveBusiness = async () => {
    try {
      await settingsAPI.update({ ...settings, ...business });
      showSaved();
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) return alert('Passwords do not match');
    if (pwForm.newPassword.length < 6) return alert('Password must be at least 6 characters');
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      showSaved();
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const webhookUrl = `${window.location.origin.replace('www.', '')}/api/webhook/meta/${tenant?.id}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSaved();
  };

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'business', label: 'Business', icon: Building },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'integrations', label: 'Integrations', icon: Webhook },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto">
      {saved && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 shadow-lg">
          <CheckCircle size={16} /> Saved!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
        {/* Tabs */}
        <div className="bg-white rounded-2xl border p-2 h-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left mb-0.5 ${tab === t.id ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border p-5">
          {tab === 'profile' && (
            <>
              <h2 className="text-lg font-bold mb-4">My Profile</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                  <input type="text" value={profile.name} disabled
                    className="w-full px-3 py-2.5 border rounded-lg text-sm bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input type="email" value={profile.email} disabled
                    className="w-full px-3 py-2.5 border rounded-lg text-sm bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                  <input type="text" value={user?.role} disabled
                    className="w-full px-3 py-2.5 border rounded-lg text-sm bg-gray-50 capitalize" />
                </div>
              </div>
            </>
          )}

          {tab === 'business' && (
            <>
              <h2 className="text-lg font-bold mb-4">Business Settings</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Business Name</label>
                  <input type="text" value={business.name} onChange={e => setBusiness({ ...business, name: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                  <input type="tel" value={business.phone} onChange={e => setBusiness({ ...business, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                  <textarea value={business.address} onChange={e => setBusiness({ ...business, address: e.target.value })}
                    rows={3} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
                </div>
                <button onClick={handleSaveBusiness} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">Save Changes</button>
              </div>
            </>
          )}

          {tab === 'password' && (
            <>
              <h2 className="text-lg font-bold mb-4">Change Password</h2>
              <div className="space-y-3 max-w-sm">
                <input type="password" placeholder="Current Password" value={pwForm.currentPassword}
                  onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm" />
                <input type="password" placeholder="New Password (min 6)" value={pwForm.newPassword}
                  onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm" />
                <input type="password" placeholder="Confirm New Password" value={pwForm.confirm}
                  onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm" />
                <button onClick={handleChangePassword} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">Change Password</button>
              </div>
            </>
          )}

          {tab === 'integrations' && (
            <>
              <h2 className="text-lg font-bold mb-4">Integrations</h2>

              <div className="border rounded-xl p-4 mb-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">Meta Ads Webhook</h3>
                    <p className="text-xs text-gray-500 mt-1">Auto-capture leads from Facebook & Instagram</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">ACTIVE</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Webhook URL:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-white px-2 py-1.5 rounded border break-all">{webhookUrl}</code>
                    <button onClick={() => copyToClipboard(webhookUrl)} className="p-2 hover:bg-gray-100 rounded"><Copy size={14} /></button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Verify Token: <code className="bg-gray-100 px-1.5 py-0.5 rounded">curvelead_webhook_2026</code>
                </p>
              </div>

              <div className="border rounded-xl p-4 mb-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">WhatsApp Business API</h3>
                    <p className="text-xs text-gray-500 mt-1">Send and receive WhatsApp messages</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">SETUP REQUIRED</span>
                </div>
                <p className="text-xs text-gray-500">
                  Configure via environment variables on the server. See documentation.
                </p>
              </div>

              <div className="border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">AI (Groq)</h3>
                    <p className="text-xs text-gray-500 mt-1">Auto-score leads as hot/warm/cold</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">ACTIVE</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
