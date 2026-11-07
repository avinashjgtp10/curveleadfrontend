import { useState } from 'react';
import { History } from 'lucide-react';
import { automationAPI } from '../../services/api';
import { timelineLine, currentLine } from '../../utils/automationInsights';

const DOT = { ok: 'bg-green-500', warn: 'bg-amber-500', bad: 'bg-red-500', muted: 'bg-gray-300' };
const when = (iso) => new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Everything automation did for this lead, oldest first. Loads when opened.
export default function AutomationTimeline({ leadId }) {
  const [state, setState] = useState({ open: false, loading: false, error: '', data: null });
  const toggle = async () => {
    if (state.open) return setState((s) => ({ ...s, open: false }));
    setState((s) => ({ ...s, open: true, loading: true, error: '' }));
    try { const { data } = await automationAPI.leadTimeline(leadId); setState({ open: true, loading: false, error: '', data }); }
    catch (e) { setState({ open: true, loading: false, error: e?.response?.data?.error || 'Could not load the history.', data: null }); }
  };
  const { open, loading, error, data } = state;
  return (
    <div className="px-5 pb-5">
      <button type="button" onClick={toggle} aria-expanded={open} className="text-xs font-semibold text-brand-700 flex items-center gap-1.5"><History size={13} /> {open ? 'Hide history' : 'Show history'}</button>
      {open && (
        <div className="mt-3">
          {loading && <p className="text-xs text-gray-500">Loading…</p>}
          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
          {data && !data.events.length && <p className="text-xs text-gray-500">Automation has not done anything for this lead yet.</p>}
          {data && (data.current || []).map((c) => { const l = currentLine(c); return <p key={c.enrollment_id} className="text-xs bg-gray-50 border rounded-lg px-2.5 py-2 mb-2"><span className="font-semibold">{c.sequence_name}: </span>{l.text}</p>; })}
          {data && data.events.length > 0 && (
            <ol className="border-l-2 border-gray-100 ml-1.5 pl-4 space-y-3">
              {data.events.map((e, i) => { const l = timelineLine(e); return (
                <li key={i} className="relative" data-tone={l.tone}>
                  <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${DOT[l.tone]}`} />
                  <p className="text-xs font-medium text-gray-800">{l.title}</p>
                  {l.detail && <p className="text-[11px] text-gray-500">{l.detail}</p>}
                  <p className="text-[10px] text-gray-400">{when(e.at)}</p>
                </li>); })}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
