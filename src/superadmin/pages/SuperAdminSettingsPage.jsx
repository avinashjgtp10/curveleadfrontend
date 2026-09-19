import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { superAdminAPI } from '../../services/api';

const SuperAdminSettingsPage = () => {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    superAdminAPI.getSettings()
      .then(({ data }) => setForm(data.settings))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const { data } = await superAdminAPI.updateSettings(form);
      setForm(data.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <PageHeader title="Settings" subtitle="Platform-wide configuration for Super Admins." />
        <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">Loading…</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <PageHeader title="Settings" subtitle="Platform-wide configuration for Super Admins." />
        <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">Couldn't load settings.</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <PageHeader title="Settings" subtitle="Platform-wide configuration for Super Admins." />

      <div className="bg-white rounded-2xl border p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Platform Name</label>
          <input value={form.platform_name || ''} onChange={e => setForm({ ...form, platform_name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Support Email</label>
          <input type="email" value={form.support_email || ''} onChange={e => setForm({ ...form, support_email: e.target.value })}
            placeholder="support@curvelead.com"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Default Trial Length (days)</label>
          <input type="number" min="0" value={form.default_trial_days ?? 0}
            onChange={e => setForm({ ...form, default_trial_days: Number(e.target.value) || 0 })}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <p className="text-xs text-gray-400 mt-1">Used for new workspace signups.</p>
        </div>

        <div className="flex items-center justify-between py-2 border-t pt-4">
          <div>
            <p className="text-sm font-medium text-gray-800">Allow New Signups</p>
            <p className="text-xs text-gray-400">When off, the public signup page stops accepting new workspaces.</p>
          </div>
          <button type="button" onClick={() => setForm({ ...form, signup_enabled: !form.signup_enabled })}
            className={`w-11 h-6 shrink-0 rounded-full relative transition-colors duration-200 ${form.signup_enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}>
            <span className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${form.signup_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between py-2 border-t pt-4">
          <div>
            <p className="text-sm font-medium text-gray-800">Maintenance Mode</p>
            <p className="text-xs text-gray-400">Shows a maintenance message to every tenant and blocks login.</p>
          </div>
          <button type="button" onClick={() => setForm({ ...form, maintenance_mode: !form.maintenance_mode })}
            className={`w-11 h-6 shrink-0 rounded-full relative transition-colors duration-200 ${form.maintenance_mode ? 'bg-red-600' : 'bg-gray-300'}`}>
            <span className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${form.maintenance_mode ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {form.maintenance_mode && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Maintenance Message</label>
            <textarea value={form.maintenance_message || ''} onChange={e => setForm({ ...form, maintenance_message: e.target.value })}
              rows={3} placeholder="We're performing scheduled maintenance — back shortly."
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
        )}

        <div className="flex items-center gap-3 pt-2 border-t">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
            <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {saved && <span className="text-sm text-emerald-600 font-medium">Saved.</span>}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSettingsPage;
