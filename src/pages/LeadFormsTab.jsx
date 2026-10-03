import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Download, RefreshCw } from 'lucide-react';
import { adsAPI } from '../services/api';
import { useToast } from '../components/ui/Toast';
import ErrorState, { errorMessage } from '../components/ui/ErrorState';
import { formatDateTime } from '../utils/dateTime.js';
import { formatNumber } from '../utils/locale';

const num = n => formatNumber(n);
const CAPI_STATUS = {
  success: 'bg-green-100 text-green-700', pending: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700', skipped: 'bg-gray-100 text-gray-500',
};

// Conversions API feedback: which Meta leads were reported back as qualified / converted.
const ConversionsCard = () => {
  const [capi, setCapi] = useState(null);
  useEffect(() => { adsAPI.getCapiEvents().then(({ data }) => setCapi(data)).catch(() => {}); }, []);
  if (!capi) return null;
  const state = !capi.enabled ? ['Off', 'text-gray-500'] : !capi.configured ? ['On, but not set up', 'text-red-600'] : ['On', 'text-green-700'];
  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl">
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b">
        <div>
          <p className="text-sm font-semibold text-gray-900">Lead quality feedback to Meta <span className={`ml-1 text-xs font-semibold ${state[1]}`}>· {state[0]}</span></p>
          <p className="text-xs text-gray-500">When a Meta lead reaches a qualified or won stage, CurveLead tells Meta ({capi.qualified_event} / {capi.converted_event}) so your ads find more leads like it.</p>
        </div>
        {(!capi.enabled || !capi.configured) && <Link to="/integrations" className="text-xs font-semibold text-brand-600 hover:underline">{capi.enabled ? 'Add dataset ID & token' : 'Set up in Integrations'}</Link>}
      </div>
      {capi.events.length === 0 ? <p className="px-4 py-4 text-sm text-gray-400">No events yet.</p> : (
        <ul className="divide-y text-sm max-h-72 overflow-y-auto">
          {capi.events.map(e => (
            <li key={e.id} className="px-4 py-2 flex flex-wrap items-baseline gap-x-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${CAPI_STATUS[e.status] || CAPI_STATUS.skipped}`}>{e.status}</span>
              <span className="font-medium">{e.event_name}</span>
              <span className="text-gray-600">{e.lead_name || 'Deleted lead'}</span>
              {e.last_error && <span className="text-xs text-red-600 w-full sm:w-auto">{e.last_error}</span>}
              <span className="ml-auto text-[11px] text-gray-400">{formatDateTime(e.sent_at || e.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Ads Manager → Lead Forms: the Facebook Page's lead forms, how many of their leads are
// in CurveLead, and a backfill for older leads (new ones arrive in real time).
const LeadFormsTab = () => {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [queued, setQueued] = useState({});

  const load = () => {
    setLoading(true); setError('');
    adsAPI.getLeadForms()
      .then(({ data }) => setData(data))
      .catch(e => setError(errorMessage(e, 'Could not load lead forms.')))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const backfill = async (form) => {
    try {
      await adsAPI.backfillLeadForm(form.id);
      setQueued(q => ({ ...q, [form.id]: true }));
      toast.success(`Importing leads from "${form.name}". Refresh in a minute to see the count.`);
    } catch (e) { toast.error(e.response?.data?.error || 'Could not start the import.'); }
  };

  const toggleScoring = async () => {
    const next = !data.score_on_ingest;
    try {
      await adsAPI.updateLeadSettings({ score_on_ingest: next });
      setData(d => ({ ...d, score_on_ingest: next }));
    } catch (e) { toast.error(e.response?.data?.error || 'Could not save.'); }
  };

  if (loading && !data) return <div className="text-center py-12 text-gray-400 text-sm">Loading lead forms…</div>;
  if (error) {
    return (
      <div className="space-y-2">
        <ErrorState message={error} onRetry={load} retrying={loading} />
        {error.includes('Integrations') && <Link to="/integrations" className="inline-block text-sm font-medium text-brand-600 underline">Open Integrations</Link>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-500">New leads from these forms arrive in CurveLead within seconds. Use <strong>Import all leads</strong> to bring in older ones — they're assigned but not messaged.</p>
        <button onClick={load} disabled={loading} className="shrink-0 px-3 py-2 border rounded-lg text-sm bg-white hover:bg-gray-50 inline-flex items-center gap-1.5 disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <label className="flex items-start justify-between gap-4 bg-white border border-gray-100 shadow-sm rounded-2xl p-4 cursor-pointer">
        <span>
          <span className="block text-sm font-medium text-gray-800">Score new Meta leads instantly</span>
          <span className="block text-xs text-gray-500 mt-0.5">Gives every new lead a hot/warm/cold intent score as soon as it arrives, so the team knows who to call first.</span>
        </span>
        <button type="button" role="switch" aria-checked={data.score_on_ingest} onClick={toggleScoring}
          className={`relative shrink-0 w-10 h-6 rounded-full transition-colors ${data.score_on_ingest ? 'bg-green-500' : 'bg-gray-300'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${data.score_on_ingest ? 'translate-x-4' : ''}`} />
        </button>
      </label>

      <ConversionsCard />

      {data.forms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <ClipboardList size={26} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No lead forms on your Facebook Page yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Form</th>
                <th className="text-right px-4 py-2.5 font-medium">Leads on Meta</th>
                <th className="text-right px-4 py-2.5 font-medium">In CurveLead</th>
                <th className="text-left px-4 py-2.5 font-medium">Last import</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {data.forms.map(f => {
                const missing = f.leads_count != null && f.crm_leads < f.leads_count;
                return (
                  <tr key={f.id} className="border-t align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{f.name || f.external_id}</p>
                      <p className="text-[11px] text-gray-400">{f.status ? f.status.toLowerCase() : ''}{f.created_time ? ` · created ${formatDateTime(f.created_time, undefined, { dateStyle: 'medium', timeStyle: undefined })}` : ''}</p>
                    </td>
                    <td className="px-4 py-3 text-right">{f.leads_count == null ? '—' : num(f.leads_count)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${missing ? 'text-amber-600' : 'text-gray-900'}`} title={missing ? 'Some of this form\'s leads are not in CurveLead yet' : ''}>{num(f.crm_leads)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {f.last_backfill_error
                        ? <span className="text-red-600">Failed: {f.last_backfill_error}</span>
                        : f.last_backfilled_at ? `${formatDateTime(f.last_backfilled_at)} · ${num(f.last_backfill_count)} new` : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => backfill(f)} disabled={queued[f.id]}
                        className="px-3 py-1.5 border rounded-lg text-xs font-semibold hover:bg-gray-50 inline-flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap">
                        <Download size={12} /> {queued[f.id] ? 'Importing…' : 'Import all leads'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeadFormsTab;
