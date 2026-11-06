import { useEffect, useState } from 'react';
import { PhoneCall } from 'lucide-react';
import { voiceAPI } from '../../services/api';
import { formatDateTime } from '../../utils/dateTime.js';
import { callResult, durationText, outcomeLabel } from '../../utils/voiceCall';
import useVoiceStatus from '../../hooks/useVoiceStatus';
import useStaffNames from '../../hooks/useStaffNames';

const TONE_CLS = { ok: 'bg-green-50 text-green-700', bad: 'bg-red-50 text-red-700', warn: 'bg-amber-50 text-amber-800', live: 'bg-blue-50 text-blue-700', muted: 'bg-gray-100 text-gray-600' };

// Last 5 calls to this lead: when, how long, what happened, who called, and their notes (when the API returns them).
// Hidden when calling isn't enabled for the workspace.
export default function LeadCallsCard({ leadId, refreshKey }) {
  const enabled = useVoiceStatus();
  const names = useStaffNames();
  const [state, setState] = useState({ loading: true, error: false, calls: [] });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!enabled || !leadId) return undefined;
    let live = true;
    setState((s) => ({ ...s, loading: true, error: false }));
    voiceAPI.listCalls({ leadId, limit: 5 })
      .then(({ data }) => { if (live) setState({ loading: false, error: false, calls: (Array.isArray(data) ? data : []).filter((c) => c.status !== 'authorized') }); })
      .catch(() => { if (live) setState({ loading: false, error: true, calls: [] }); });
    return () => { live = false; };
  }, [enabled, leadId, refreshKey, retry]);

  if (!enabled) return null;
  return (
    <div className="bg-white rounded-2xl border p-4">
      <h3 className="text-sm font-bold flex items-center gap-1.5 text-gray-800 mb-3"><PhoneCall size={14} className="text-brand-500" /> Calls</h3>
      {state.loading && (
        <div className="space-y-2" aria-busy="true" aria-label="Loading calls">{[0, 1].map(i => <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />)}</div>
      )}
      {!state.loading && state.error && (
        <p className="text-sm text-red-600">Couldn’t load calls. <button onClick={() => setRetry(n => n + 1)} className="underline">Retry</button></p>
      )}
      {!state.loading && !state.error && state.calls.length === 0 && <p className="text-sm text-gray-500">No calls yet.</p>}
      {!state.loading && !state.error && state.calls.length > 0 && (
        <ul className="divide-y">
          {state.calls.map((c) => {
            const r = callResult(c);
            return (
              <li key={c.id} className="py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500">{c.started_at ? formatDateTime(c.started_at, undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</span>
                  <span className="text-xs text-gray-500 tabular-nums">{durationText(c)}</span>
                </div>
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${TONE_CLS[r.tone]}`}>{r.label}</span>
                  {r.reason && <span className="text-xs text-gray-500">{r.reason}</span>}
                  {r.outcome && <span className="text-xs font-medium text-gray-700">{outcomeLabel(r.outcome)}</span>}
                  <span className="text-xs text-gray-400">· {names[c.agent_id] || (c.agent_id ? 'Agent' : '—')}</span>
                </div>
                {c.outcome_notes && <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{c.outcome_notes}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
