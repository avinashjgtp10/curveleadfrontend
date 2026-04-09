import { useState, useEffect } from 'react';
import { settingsAPI, staffAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Save, Building2, Clock, Zap, Users, CheckCircle } from 'lucide-react';

const SettingsPage = () => {
  const { tenant, loadProfile } = useAuth();
  const [settings, setSettings] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState('academy');

  useEffect(() => { loadSettings(); loadStaff(); }, []);

  const loadSettings = async () => {
    try { const { data } = await settingsAPI.get(); setSettings(data.settings); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadStaff = async () => {
    try { const { data } = await staffAPI.getAll(); setStaff(data.staff); }
    catch (e) { console.error(e); }
  };

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      await settingsAPI.update(settings);
      setSaved(true);
      loadProfile();
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { alert(e.response?.data?.error || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const updateField = (field, value) => setSettings(prev => ({ ...prev, [field]: value }));

  if (loading || !settings) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[{ key: 'academy', label: 'Academy Profile' }, { key: 'leads', label: 'Lead Settings' }, { key: 'staff', label: 'Staff & Time' }, { key: 'meta', label: 'Meta Ads' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Subscription Info */}
      <div className="bg-brand-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-brand-700 font-medium">Plan: {settings.plan_name || 'Basic'} — ₹{parseFloat(settings.plan_price || 0).toLocaleString('en-IN')}/mo</p>
          <p className="text-xs text-brand-500 capitalize">Status: {settings.subscription_status}
            {settings.subscription_status === 'trial' && settings.trial_ends_at && ` (ends ${new Date(settings.trial_ends_at).toLocaleDateString('en-IN')})`}
          </p>
        </div>
      </div>

      {tab === 'academy' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Building2 size={18} /> Academy Profile</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Academy Name</label>
              <input type="text" value={settings.name || ''} onChange={e => updateField('name', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Academy Type</label>
              <select value={settings.academy_type || 'Other'} onChange={e => updateField('academy_type', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
                <option>Beauty</option><option>IT & Computer</option><option>Coaching</option><option>Vocational</option><option>Dance & Music</option><option>Fitness</option><option>Other</option>
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={settings.email || ''} onChange={e => updateField('email', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" value={settings.phone || ''} onChange={e => updateField('phone', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input type="text" value={settings.address || ''} onChange={e => updateField('address', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" value={settings.city || ''} onChange={e => updateField('city', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input type="text" value={settings.state || ''} onChange={e => updateField('state', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" /></div>
          </div>
        </div>
      )}

      {tab === 'leads' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Users size={18} /> Lead Settings</h3>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={settings.lead_auto_assign || false} onChange={e => updateField('lead_auto_assign', e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded" />
              <span className="text-sm font-medium text-gray-700">Auto-assign new leads to staff</span>
            </label>
          </div>
          {settings.lead_auto_assign && (
            <>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Assignment Type</label>
                <select value={settings.lead_auto_assign_type || 'round_robin'} onChange={e => updateField('lead_auto_assign_type', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="round_robin">Round Robin (distribute equally)</option>
                  <option value="default">Always assign to one person</option>
                </select></div>
              {settings.lead_auto_assign_type === 'default' && (
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Default Assignee</label>
                  <select value={settings.default_assignee_id || ''} onChange={e => updateField('default_assignee_id', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">Select staff</option>
                    {staff.filter(s => s.status === 'active').map(s => <option key={s.id} value={s.user_id || s.id}>{s.name} ({s.role})</option>)}
                  </select></div>
              )}
            </>
          )}
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Auto Follow-up Delay (for Meta leads)</label>
            <select value={settings.auto_followup_minutes || 60} onChange={e => updateField('auto_followup_minutes', parseInt(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
              <option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={60}>1 hour</option>
              <option value={120}>2 hours</option><option value={1440}>Next day</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">When a lead comes from Meta Ads, auto-schedule a follow-up after this delay.</p>
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Clock size={18} /> Staff & Time Management</h3>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Grace Period (minutes)</label>
            <p className="text-xs text-gray-400 mb-2">Staff arriving after this grace period will be auto-marked as Half Day.</p>
            <select value={settings.grace_period_minutes || 15} onChange={e => updateField('grace_period_minutes', parseInt(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
              <option value={5}>5 minutes</option><option value={10}>10 minutes</option><option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option><option value={30}>30 minutes</option><option value={45}>45 minutes</option>
            </select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Financial Year Start</label>
            <select value={settings.financial_year_start || 4} onChange={e => updateField('financial_year_start', parseInt(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
              <option value={1}>January</option><option value={4}>April (Indian FY)</option>
            </select></div>
        </div>
      )}

      {tab === 'meta' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Zap size={18} /> Meta Ads Integration</h3>
          <p className="text-sm text-gray-500">Connect your Meta (Facebook/Instagram) Ads account to auto-capture leads from Lead Form Ads and Click-to-WhatsApp Ads.</p>

          <div className="p-4 bg-blue-50 rounded-lg space-y-2">
            <h4 className="text-sm font-semibold text-blue-800">Setup Steps:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Create a Facebook App at developers.facebook.com</li>
              <li>Subscribe to Leadgen webhook for your Page</li>
              <li>Set webhook URL to: <code className="bg-blue-100 px-1 rounded text-xs">{window.location.origin}/api/webhook/meta</code></li>
              <li>Enter your App ID and Page Access Token below</li>
            </ol>
          </div>

          <div><label className="block text-sm font-medium text-gray-700 mb-1">Meta App ID</label>
            <input type="text" value={settings.meta_app_id || ''} onChange={e => updateField('meta_app_id', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="Your Facebook App ID" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Page Access Token</label>
            <input type="password" value={settings.meta_page_access_token || ''} onChange={e => updateField('meta_page_access_token', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="Your Page Access Token" /></div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Webhook URL for Meta:</p>
            <code className="text-sm text-brand-600 block mt-1 break-all">{window.location.origin}/api/webhook/meta</code>
          </div>
        </div>
      )}

      {/* Save Button */}
      <button onClick={handleSave} disabled={saving}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
          saved ? 'bg-green-600 text-white' : 'bg-brand-600 text-white hover:bg-brand-700'
        } disabled:opacity-50`}>
        {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
         saved ? <><CheckCircle size={18} /> Saved!</> : <><Save size={18} /> Save Settings</>}
      </button>
    </div>
  );
};

export default SettingsPage;
