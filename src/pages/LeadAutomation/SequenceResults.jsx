import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { automationAPI } from '../../services/api';
import { sequenceStatus } from '../../utils/sequenceStatus';
import { funnelRows, coverageText, stopText, reasonText } from '../../utils/automationInsights';
import { parseFailure } from '../../utils/failureReason';

const TONE = { ok: 'bg-green-50 text-green-700', warn: 'bg-amber-50 text-amber-800', bad: 'bg-red-50 text-red-700', muted: 'bg-gray-100 text-gray-600' };
const STATUS_WORD = { active: 'In progress', awaiting_reply: 'Waiting for a reply', completed: 'Finished', cancelled: 'Stopped', blocked: 'Held back', failed: 'Failed', uncertain: 'Unsure if delivered', human_review: 'Needs review' };

// How one sequence is doing: who is in it, what happened at each step, why leads stopped or failed, and who needs attention.
export default function SequenceResults({ sequence, onClose }) {
  const [days, setDays] = useState(30);
  const [state, setState] = useState({ loading: true, error: '', data: null });
  useEffect(() => {
    let live = true;
    setState({ loading: true, error: '', data: null });
    automationAPI.sequenceAnalytics(sequence.id, days)
      .then(({ data }) => live && setState({ loading: false, error: '', data }))
      .catch((e) => live && setState({ loading: false, error: e?.response?.data?.error || 'Could not load the results.', data: null }));
    return () => { live = false; };
  }, [sequence.id, days]);
  const status = sequenceStatus(sequence);
  const { loading, error, data } = state;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div role="dialog" aria-modal="true" aria-label={`Results for ${sequence.name}`} className="bg-white rounded-2xl p-5 w-full max-w-3xl max-h-[88vh] overflow-y-auto shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2 flex-wrap">{sequence.name} <span title={status.detail} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${TONE[status.tone]}`}>{status.label}</span></h3>
            <p className="text-xs text-gray-500 mt-0.5">{status.detail}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select aria-label="Time period" value={days} onChange={(e) => setDays(Number(e.target.value))} className="border rounded-lg text-xs px-2 py-1.5 bg-white">
              <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
            </select>
            <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><X size={18} /></button>
          </div>
        </div>

        {loading && <p className="text-sm text-gray-500">Loading…</p>}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {data && (
          <>
            <section aria-label="Leads">
              <h4 className="text-sm font-semibold mb-1">Leads added in this period: {data.enrolled.total}</h4>
              {data.enrolled.total === 0 ? <p className="text-xs text-gray-500">No leads were added in this period.</p> : (
                <p className="text-xs text-gray-600">{Object.entries(data.enrolled.by_status).map(([k, v]) => `${v} ${(STATUS_WORD[k] || k).toLowerCase()}`).join(' · ')} · {data.enrolled.completion_rate}% finished every step</p>
              )}
            </section>

            {data.steps.length > 0 && (
              <section aria-label="Steps">
                <h4 className="text-sm font-semibold mb-1">What happened at each step</h4>
                <div className="overflow-x-auto"><table className="w-full text-xs">
                  <thead><tr className="text-left text-gray-400"><th className="py-1 pr-3">Step</th><th className="pr-3">Sent</th><th className="pr-3">Delivered</th><th className="pr-3">Read</th><th className="pr-3">Replied</th><th>Problems</th></tr></thead>
                  <tbody>{funnelRows(data.steps).map((r) => (
                    <tr key={r.step} className="border-t"><td className="py-1.5 pr-3">{r.step}. {r.what}</td><td className="pr-3">{r.sent}</td><td className="pr-3">{r.delivered}</td><td className="pr-3">{r.read}</td><td className="pr-3">{r.replied}</td><td className={r.failed ? 'text-red-600 font-medium' : ''}>{r.failed}</td></tr>))}</tbody>
                </table></div>
                <p className="text-[11px] text-gray-400 mt-1">Replied counts an answer within 3 days of the message. Email shows no delivery or read data.</p>
              </section>
            )}

            {data.stopped_because.length > 0 && (
              <section aria-label="Why leads stopped"><h4 className="text-sm font-semibold mb-1">Why leads stopped</h4>
                <ul className="text-xs text-gray-700 space-y-0.5">{data.stopped_because.map((s) => <li key={s.reason}>{s.count} × {stopText(s.reason)}</li>)}</ul></section>
            )}

            {data.failure_reasons.length > 0 && (
              <section aria-label="Why messages failed"><h4 className="text-sm font-semibold mb-1">Why messages failed</h4>
                <ul className="text-xs text-gray-700 space-y-0.5">{data.failure_reasons.map((f, i) => <li key={i}>{f.count} × {parseFailure(f.detail).text}</li>)}</ul></section>
            )}

            <section aria-label="Opt-in coverage"><h4 className="text-sm font-semibold mb-1">Opt-in coverage</h4><p className="text-xs text-gray-700">{coverageText(data.opt_in)}</p></section>

            <section aria-label="Needs attention"><h4 className="text-sm font-semibold mb-1">Needs attention</h4>
              {data.problems.length === 0 ? <p className="text-xs text-green-700">No leads are stuck in this sequence.</p> : (
                <ul className="divide-y border rounded-lg">{data.problems.map((p) => (
                  <li key={p.enrollment_id} className="px-3 py-2 text-xs flex items-start justify-between gap-3">
                    <span><Link to={`/leads/${p.lead_id}`} className="font-semibold text-brand-700 hover:underline">{p.lead_name || 'Lead'}</Link>
                      <span className="text-gray-500"> · step {(Number(p.current_step) || 0) + 1} · {STATUS_WORD[p.status] || p.status}</span>
                      <span className="block text-gray-600">{p.status === 'human_review' ? 'Their reply needs a team member to review.' : reasonText(p.reason)}</span></span>
                  </li>))}</ul>
              )}
              <p className="text-[11px] text-gray-400 mt-1">Open a lead to retry or review. Fix the cause first, such as an unapproved template or a missing opt-in.</p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
