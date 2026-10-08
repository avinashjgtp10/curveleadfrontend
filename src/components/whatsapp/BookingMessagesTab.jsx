import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, ExternalLink } from 'lucide-react';
import { whatsappAPI } from '../../services/api';
import { useToast } from '../ui/Toast';
import { Card, ErrorBox, LoadError, Loading, Toggle, useLoad, fmtDateTime } from './hubUi';

// Variables are filled by position — keep in sync with services/bookingMessages.js (backend).
const VARIABLES = {
  demo: ['lead name', 'business name', 'date & time', 'meeting link'],
  visit: ['lead name', 'business name', 'date & time', 'address', 'Google Maps link'],
};

const SUGGESTED = {
  demo_confirmation: 'Hi {{1}}, your demo with {{2}} is confirmed for {{3}}.\n\nJoin the meeting here: {{4}}\n\nReply to this message if you need to reschedule.',
  visit_confirmation: 'Hi {{1}}, your visit to {{2}} is confirmed for {{3}}.\n\n📍 {{4}}\nDirections: {{5}}\n\nReply to this message if you need to reschedule.',
  demo_reminder: 'Hi {{1}}, a quick reminder that your demo with {{2}} is {{3}}.\n\nJoin the meeting here: {{4}}\n\nReply to this message if you need to reschedule.',
  visit_reminder: 'Hi {{1}}, a quick reminder of your visit to {{2}} {{3}}.\n\n📍 {{4}}\nDirections: {{5}}\n\nReply to this message if you need to reschedule.',
};

const REMINDER_OPTIONS = [
  [0, 'Off'], [30, '30 minutes before'], [60, '1 hour before'], [120, '2 hours before'], [180, '3 hours before'],
  [360, '6 hours before'], [720, '12 hours before'], [1440, '1 day before'], [2880, '2 days before'],
];

const KIND_LABELS = { confirmation: 'Confirmation', reminder_1: 'Reminder 1', reminder_2: 'Reminder 2' };
const STATUS_STYLES = {
  sent: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700',
  skipped: 'bg-gray-100 text-gray-600', sending: 'bg-blue-100 text-blue-700',
};

const bodyOf = t => t?.components?.find(c => c.type === 'BODY')?.text || '';
const varCount = text => Math.max(0, ...[...text.matchAll(/\{\{(\d+)\}\}/g)].map(m => Number(m[1])));

const TemplateSelect = ({ label, type, value, onChange, templates, samples }) => {
  const selected = templates.find(t => t.name === value);
  const body = bodyOf(selected);
  const needed = varCount(body);
  const header = selected?.components?.find(c => c.type === 'HEADER');
  const preview = body.replace(/\{\{(\d+)\}\}/g, (m, n) => samples[Number(n) - 1] ?? m);
  const missing = value && !selected;

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
        <option value="">None (only sent inside the 24-hour window)</option>
        {missing && <option value={value}>{value} (not found)</option>}
        {templates.map(t => (
          <option key={`${t.name}:${t.language}`} value={t.name} disabled={t.status !== 'APPROVED'}>
            {t.name} · {t.language}{t.status !== 'APPROVED' ? ` (${t.status.toLowerCase()})` : ''}
          </option>
        ))}
      </select>
      {missing && <p className="text-[11px] text-red-600 mt-1">This template no longer exists in WhatsApp Manager. Pick another.</p>}
      {selected && needed > VARIABLES[type].length && (
        <p className="text-[11px] text-red-600 mt-1">This template has {needed} variables; a {type} message can fill at most {VARIABLES[type].length}. It will fail to send.</p>
      )}
      {selected && header?.format === 'TEXT' && /\{\{\d+\}\}/.test(header.text || '') && (
        <p className="text-[11px] text-red-600 mt-1">Variables in the header aren't supported. Use a template with a plain header.</p>
      )}
      {selected && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(header?.format) && !selected.media_url && (
        <p className="text-[11px] text-amber-700 mt-1">Its header media isn't on file in CurveLead, so sending may fail. Recreate it from the Templates tab.</p>
      )}
      {selected && (
        <p className="mt-2 text-xs text-gray-700 whitespace-pre-wrap bg-[#e7fbe0] border border-green-100 rounded-lg px-3 py-2">{preview}</p>
      )}
    </div>
  );
};

const BookingMessagesTab = () => {
  const toast = useToast();
  const { data, error, loading, reload } = useLoad(() => whatsappAPI.hubGetBookingMessages());
  const tpl = useLoad(() => whatsappAPI.getBroadcastTemplates());
  const [f, setF] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (data) setF(data); }, [data]);
  if (error) return <LoadError error={error} onRetry={reload} />;
  if (loading || !f) return <Loading />;

  const templates = tpl.data?.templates || [];
  const set = patch => setF(prev => ({ ...prev, ...patch }));
  const address = f.address || f.business_address;
  const samples = when => ({
    demo: ['Priya', f.business_name || 'Your business', when, 'https://meet.google.com/abc-defg-hij'],
    visit: ['Priya', f.business_name || 'Your business', when, address || 'Your address', f.maps_url || 'https://maps.app.goo.gl/…'],
  });
  const confirmSamples = samples('Fri, 3 Oct at 11:00 AM');
  const reminderSamples = samples('tomorrow at 11:00 AM');
  const reminderOptions = minutes => REMINDER_OPTIONS.some(([m]) => m === minutes)
    ? REMINDER_OPTIONS : [...REMINDER_OPTIONS, [minutes, `${minutes} minutes before`]];

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); toast.success('Copied. Paste it into the template body.'); }
    catch { toast.error('Could not copy. Select the text and copy it manually.'); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const { recent, business_name, business_address, timezone, ...payload } = f;
      await whatsappAPI.hubSaveBookingMessages(payload);
      toast.success('Booking messages saved.');
      reload();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        When a <strong>demo</strong> or <strong>visit</strong> is booked, the lead gets a WhatsApp confirmation with the date and time, and reminders before it.
        Inside WhatsApp's 24-hour window a normal message is sent; outside it, the approved template you pick here.
      </p>

      {tpl.error && <ErrorBox>Couldn't load your WhatsApp templates: {tpl.error}</ErrorBox>}

      <Card title="Confirmation when booked">
        <Toggle checked={f.confirmation_enabled} onChange={v => set({ confirmation_enabled: v })}
          label="Send a confirmation as soon as a demo or visit is booked"
          hint="Staff can still untick it for a single booking in the booking form." />
        {f.confirmation_enabled && (
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <TemplateSelect label="Demo confirmation template" type="demo" templates={templates} samples={confirmSamples.demo}
              value={f.demo_confirmation_template} onChange={v => set({ demo_confirmation_template: v })} />
            <TemplateSelect label="Visit confirmation template" type="visit" templates={templates} samples={confirmSamples.visit}
              value={f.visit_confirmation_template} onChange={v => set({ visit_confirmation_template: v })} />
          </div>
        )}
      </Card>

      <Card title="Reminders before the booking">
        <Toggle checked={f.reminders_enabled} onChange={v => set({ reminders_enabled: v })}
          label="Remind the lead automatically"
          hint="Each reminder is sent once. Rescheduling sends reminders for the new time; completed or cancelled bookings get none." />
        {f.reminders_enabled && (
          <>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              {['reminder_1_minutes', 'reminder_2_minutes'].map((key, i) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reminder {i + 1}</label>
                  <select value={f[key]} onChange={e => set({ [key]: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                    {reminderOptions(f[key]).map(([m, l]) => <option key={m} value={m}>{l}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <TemplateSelect label="Demo reminder template" type="demo" templates={templates} samples={reminderSamples.demo}
                value={f.demo_reminder_template} onChange={v => set({ demo_reminder_template: v })} />
              <TemplateSelect label="Visit reminder template" type="visit" templates={templates} samples={reminderSamples.visit}
                value={f.visit_reminder_template} onChange={v => set({ visit_reminder_template: v })} />
            </div>
          </>
        )}
      </Card>

      <Card title="Visit location">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Address shown to the lead</label>
            <textarea value={f.address} onChange={e => set({ address: e.target.value })} rows={2} maxLength={300}
              placeholder={f.business_address || 'e.g. 2nd floor, Shree Complex, MG Road, Baramati'}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
            {!f.address && f.business_address && <p className="text-[11px] text-gray-400 mt-1">Empty uses your business address from Settings: {f.business_address}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Google Maps link</label>
            <input value={f.maps_url} onChange={e => set({ maps_url: e.target.value })} maxLength={500}
              placeholder="https://maps.app.goo.gl/…" className="w-full px-3 py-2 border rounded-lg text-sm" />
            <p className="text-[11px] text-gray-400 mt-1">In Google Maps, open your business → Share → Copy link. Left empty, a Maps search for the address is used.</p>
          </div>
        </div>
      </Card>

      <Card title="Templates to submit to Meta"
        action={<Link to="/whatsapp?tab=templates" className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">Create template <ExternalLink size={11} /></Link>}>
        <p className="text-xs text-gray-500 mb-3">
          Use category <strong>UTILITY</strong>. Variables are filled in this order. Demo: {VARIABLES.demo.map((v, i) => `{{${i + 1}}} ${v}`).join(' · ')}.
          Visit: {VARIABLES.visit.map((v, i) => `{{${i + 1}}} ${v}`).join(' · ')}.
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {Object.entries(SUGGESTED).map(([name, body]) => (
            <div key={name} className="rounded-xl border p-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <code className="text-xs font-semibold text-gray-800">{name}</code>
                <button onClick={() => copy(body)} className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"><Copy size={12} /> Copy</button>
              </div>
              <p className="text-xs text-gray-600 whitespace-pre-wrap">{body}</p>
            </div>
          ))}
        </div>
      </Card>

      {f.recent?.length > 0 && (
        <Card title="Recent booking messages">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-gray-400 uppercase tracking-wide border-b">
                  <th className="text-left pb-2 font-semibold">Lead</th>
                  <th className="text-left pb-2 font-semibold">Message</th>
                  <th className="text-left pb-2 font-semibold">Booking</th>
                  <th className="text-left pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {f.recent.map(r => (
                  <tr key={r.id} className="border-b last:border-0 align-top">
                    <td className="py-2 pr-3 font-medium text-gray-800">{r.lead_name}</td>
                    <td className="py-2 pr-3 text-gray-600 capitalize">{KIND_LABELS[r.kind] || r.kind} · {r.followup_type}</td>
                    <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">{fmtDateTime(r.booking_at)}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_STYLES[r.status] || STATUS_STYLES.skipped}`}>{r.status}</span>
                      {r.via && <span className="ml-1.5 text-[11px] text-gray-400">{r.via}</span>}
                      {r.error && <p className="text-[11px] text-red-600 mt-0.5 max-w-xs">{r.error}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex justify-end">
        <button onClick={save} disabled={saving}
          className="px-5 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default BookingMessagesTab;
