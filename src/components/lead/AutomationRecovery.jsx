import { useState } from 'react';
import { automationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AutomationRecovery({ enrollment, onRecovered }) {
  const { user } = useAuth();
  const [answer, setAnswer] = useState('');
  const [note, setNote] = useState('');
  const [providerId, setProviderId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!enrollment || !['blocked', 'failed', 'uncertain', 'human_review'].includes(enrollment.status)) return null;
  const canManage = ['admin','super_admin'].includes(user?.role);
  const recover = async action => {
    setBusy(true); setError('');
    try {
      await automationAPI.recoverEnrollment(enrollment.enrollment_id || enrollment.id, { action, note, answer, provider_id: providerId });
      await onRecovered?.();
    } catch (e) { setError(e.response?.data?.error || 'Could not recover this step.'); }
    finally { setBusy(false); }
  };
  return <div className="border border-amber-200 bg-amber-50 rounded-xl p-3 space-y-2 text-sm">
    <p className="font-semibold capitalize">{enrollment.status === 'human_review' ? 'Reply needs human review' : `Delivery ${enrollment.status}`}</p>
    <p>{enrollment.last_error || 'Review this step before continuing.'}</p>
    {enrollment.status === 'human_review' ? <>
      <p>Review the reply in WhatsApp. Resume automation in the inbox only when ready to route the reviewed answer.</p>
      {canManage && <><label className="block text-xs">Reviewed classification<select className="w-full border rounded p-2 bg-white" value={answer} onChange={e => setAnswer(e.target.value)}><option value="">Choose classification</option>{(enrollment.awaiting_routes || []).map(route => <option key={route.answer} value={route.answer}>{route.classification}</option>)}</select></label><button disabled={busy || !answer} className="border rounded p-2 bg-white disabled:opacity-50" onClick={() => recover('route')}>Apply reviewed route</button></>}
    </> : canManage && enrollment.status === 'uncertain' ? <>
      <p>Check the provider’s message history first. Confirm delivery only with its message ID. Request another send only after confirming the earlier request was not delivered.</p>
      <label className="block text-xs">Reconciliation note<textarea className="w-full border rounded p-2 bg-white" value={note} onChange={e => setNote(e.target.value)} /></label>
      <label className="block text-xs">Confirmed message ID<input className="w-full border rounded p-2 bg-white" value={providerId} onChange={e => setProviderId(e.target.value)} /></label>
      <div className="flex flex-wrap gap-2"><button disabled={busy || !note.trim() || !providerId.trim()} className="border rounded p-2 bg-white disabled:opacity-50" onClick={() => recover('confirmed_sent')}>Confirm sent</button><button disabled={busy || !note.trim()} className="border rounded p-2 bg-white disabled:opacity-50" onClick={() => recover('confirmed_not_sent')}>Confirmed not sent — retry</button></div>
    </> : canManage && <button disabled={busy} className="border rounded p-2 bg-white disabled:opacity-50" onClick={() => recover('retry')}>Retry after fixing the cause</button>}
    <p className="text-xs text-gray-600">Recovery preserves any manual pause.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </div>;
}
