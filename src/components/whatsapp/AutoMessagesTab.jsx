import { useEffect, useState } from 'react';
import { whatsappAPI } from '../../services/api';
import { useToast } from '../ui/Toast';
import { Card, ErrorBox, Loading, Toggle, useLoad } from './hubUi';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AutoMessagesTab = () => {
  const toast = useToast();
  const { data, error, loading } = useLoad(() => whatsappAPI.hubGetAutoMessages());
  const [f, setF] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (data) setF(data); }, [data]);
  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (loading || !f) return <Loading />;

  const setHours = (patch) => setF(prev => ({ ...prev, business_hours: { ...prev.business_hours, ...patch } }));
  const toggleDay = (d) => setHours({
    days: f.business_hours.days.includes(d) ? f.business_hours.days.filter(x => x !== d) : [...f.business_hours.days, d].sort(),
  });

  const save = async () => {
    setSaving(true);
    try { await whatsappAPI.hubSaveAutoMessages(f); toast.success('Auto messages saved.'); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <Card title="Welcome message">
        <Toggle checked={f.welcome_enabled} onChange={v => setF({ ...f, welcome_enabled: v })}
          label="Send a welcome message to every new lead" hint="Sent right after a lead is created, from your shared WhatsApp number." />
        <textarea value={f.welcome_message} onChange={e => setF({ ...f, welcome_message: e.target.value })} rows={3} maxLength={1000}
          placeholder="Hi {{name}}, thanks for your interest! We'll be in touch shortly."
          className="w-full mt-3 px-3 py-2 border rounded-lg text-sm" />
        <p className="text-[11px] text-gray-400 mt-1">Only delivered inside WhatsApp's 24-hour window; outside it, use an approved template instead.</p>
      </Card>

      <Card title="Away message">
        <Toggle checked={f.away_enabled} onChange={v => setF({ ...f, away_enabled: v })}
          label="Reply automatically outside business hours" hint="Sent when a lead messages you while you're closed, at most once every 12 hours per lead." />
        <textarea value={f.away_message} onChange={e => setF({ ...f, away_message: e.target.value })} rows={3} maxLength={1000}
          placeholder="Hi {{name}}, we're closed right now. We'll reply first thing when we open at 10am."
          className="w-full mt-3 px-3 py-2 border rounded-lg text-sm" />

        <p className="text-xs font-medium text-gray-600 mt-4 mb-2">Business hours</p>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="time" value={f.business_hours.start} onChange={e => setHours({ start: e.target.value })} className="px-2 py-1.5 border rounded-lg text-sm" />
          <span className="text-xs text-gray-400">to</span>
          <input type="time" value={f.business_hours.end} onChange={e => setHours({ end: e.target.value })} className="px-2 py-1.5 border rounded-lg text-sm" />
          <span className="text-xs text-gray-400 ml-2">{f.business_hours.timezone}</span>
        </div>
        <div className="flex gap-1.5 mt-3">
          {DAYS.map((d, i) => (
            <button key={d} onClick={() => toggleDay(i)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${f.business_hours.days.includes(i) ? 'bg-brand-600 text-white border-brand-600' : 'text-gray-500 hover:bg-gray-50'}`}>
              {d}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-2">If AI auto-reply is on, the away message goes out instead of the AI reply for that message.</p>
      </Card>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving}
          className="px-5 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default AutoMessagesTab;
