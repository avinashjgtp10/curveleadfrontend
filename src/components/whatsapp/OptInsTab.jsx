import { useState } from 'react';
import { Link } from 'react-router-dom';
import { whatsappAPI } from '../../services/api';
import { useToast } from '../ui/Toast';
import { Card, Empty, ErrorBox, LoadError, Loading, Stat, fmtDate, useLoad } from './hubUi';

const OptInsTab = () => {
  const toast = useToast();
  const { data, error, loading, reload } = useLoad(() => whatsappAPI.hubOptIns());
  const [list, setList] = useState('opted_in');
  const [pasted, setPasted] = useState('');
  const [source, setSource] = useState('import');
  const [busy, setBusy] = useState(false);

  if (loading && !data) return <Loading />;
  if (error) return <LoadError error={error} onRetry={reload} />;

  const run = async (payload, okMsg) => {
    setBusy(true);
    try {
      const { data: r } = await whatsappAPI.hubUpdateOptIns(payload);
      toast.success(`${okMsg} (${r.updated} lead${r.updated === 1 ? '' : 's'})`);
      setPasted('');
      reload();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setBusy(false); }
  };

  const importPhones = () => {
    const phones = pasted.split(/[\s,;]+/).filter(p => p.replace(/\D/g, '').length >= 10);
    if (!phones.length) return toast.error('Paste at least one phone number.');
    run({ phones, action: 'opt_in', source }, 'Marked as opted in');
  };

  const rows = list === 'opted_in' ? data.opted_in : data.opted_out;

  return (
    <div className="space-y-4">
      {data.needs_migration && (
        <ErrorBox>
          Opt-in tracking is temporarily unavailable while we finish an update. Opt-outs (STOP) still work.
        </ErrorBox>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Opted in" value={data.summary.opted_in} tone="text-emerald-600" />
        <Stat label="Opted out" value={data.summary.opted_out} tone={data.summary.opted_out ? 'text-red-500' : 'text-gray-900'} />
        <Stat label="Total leads" value={data.summary.total} />
      </div>

      <Card title="Consent rule">
        <ul className="text-sm text-gray-700 space-y-1.5 list-disc pl-5">
          <li><strong>Marketing templates</strong> (offers, promotions) only go to leads with a recorded opt-in.</li>
          <li><strong>Utility templates</strong> (confirmations, reminders, updates) also reach leads who asked to be contacted — they filled a lead form, messaged you, or booked a visit/demo.</li>
          <li>Opted-out leads never get templates. Messaging you first does not count as a marketing opt-in.</li>
        </ul>
        <p className="text-[11px] text-gray-400 mt-2">Opt-ins are recorded automatically from Meta lead forms with a consent checkbox, from a "WhatsApp opt-in" column in CSV imports, and when someone replies START. Use the box below for consent you collected elsewhere.</p>
      </Card>

      <Card title="Record opt-ins">
        <p className="text-xs text-gray-500 mb-2">
          Paste phone numbers of people who agreed to receive WhatsApp messages (comma, space or new line separated). They're matched to existing leads.
          For individual leads, use the lead's own page.
        </p>
        <textarea value={pasted} onChange={e => setPasted(e.target.value)} rows={3} placeholder="9876543210, 9123456780"
          className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
        <div className="flex items-center gap-2 mt-2">
          <select value={source} onChange={e => setSource(e.target.value)} className="px-2 py-1.5 border rounded-lg text-sm bg-white">
            <option value="import">Source: Import</option>
            <option value="website_form">Source: Website form</option>
            <option value="in_store">Source: In store</option>
            <option value="whatsapp_chat">Source: WhatsApp chat</option>
          </select>
          <button onClick={importPhones} disabled={busy || data.needs_migration}
            className="px-4 py-1.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
            Mark as opted in
          </button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-1 mb-3">
          {[['opted_in', 'Opted in'], ['opted_out', 'Opted out']].map(([id, label]) => (
            <button key={id} onClick={() => setList(id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${list === id ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
              {label}
            </button>
          ))}
        </div>
        {rows.length === 0 ? <Empty>{list === 'opted_in' ? 'No opt-ins recorded yet.' : 'Nobody has opted out.'}</Empty> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500 border-b">
              <th className="py-2 pr-3">Lead</th><th className="pr-3">Phone</th>
              <th className="pr-3">{list === 'opted_in' ? 'Source' : 'Date'}</th>
              <th className="pr-3">{list === 'opted_in' ? 'Date' : ''}</th><th />
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 pr-3"><Link to={`/leads/${r.id}`} className="font-medium text-gray-800 hover:underline">{r.name}</Link></td>
                  <td className="pr-3 text-gray-500">{r.phone}</td>
                  {list === 'opted_in' ? (
                    <><td className="pr-3 text-gray-500">{(r.whatsapp_opt_in_source || '').replace(/_/g, ' ')}</td><td className="pr-3 text-gray-500">{fmtDate(r.whatsapp_opt_in_at)}</td></>
                  ) : (
                    <><td className="pr-3 text-gray-500">{fmtDate(r.opted_out_at)}</td><td /></>
                  )}
                  <td className="text-right">
                    {list === 'opted_in'
                      ? <button disabled={busy} onClick={() => run({ lead_ids: [r.id], action: 'opt_out' }, 'Marked as opted out')} className="text-xs text-red-500 hover:underline">Opt out</button>
                      : <button disabled={busy || data.needs_migration} onClick={() => run({ lead_ids: [r.id], action: 'opt_in', source: 'manual' }, 'Marked as opted in')} className="text-xs text-brand-600 hover:underline">Opt in again</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default OptInsTab;
