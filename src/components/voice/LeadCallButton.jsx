import { useEffect, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Pause, Play, Hash, Loader2, AlertTriangle, WifiOff, X } from 'lucide-react';
import { leadAPI, voiceAPI } from '../../services/api';
import { dateTimeInputToUTC, toDateTimeInput } from '../../utils/dateTime.js';
import { formatDuration, formatMinor, isFirstCall, OUTCOMES } from '../../utils/voiceCall';
import useVoiceCall from '../../hooks/useVoiceCall';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';

const Overlay = ({ children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="fixed inset-0 bg-black/50" onClick={onClose} />
    <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl">{children}</div>
  </div>
);

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

// Call button for a lead + the pre-call, in-call and after-call UIs.
// `variant="icon"` renders the compact header button; "text" the inline one next to the phone number.
// Renders nothing unless calling is enabled for this workspace and user (falls back to the caller's tel: link).
export default function LeadCallButton({ lead, variant = 'icon', onLogged }) {
  const toast = useToast();
  const v = useVoiceCall();
  const [enabled, setEnabled] = useState(false);
  const [keypad, setKeypad] = useState(false);
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [first, setFirst] = useState(null); // null = still checking, true/false once known
  const [ack, setAck] = useState(false);

  // On the confirm dialog, find out whether this is the first call to this lead. If the history can't be read, assume it is.
  useEffect(() => {
    if (v.phase !== 'confirm' || !v.auth) { setFirst(null); setAck(false); return undefined; }
    let live = true;
    voiceAPI.listCalls({ leadId: lead.id, limit: 20 })
      .then(({ data }) => { if (live) setFirst(isFirstCall(data, v.auth.authorizationId)); })
      .catch(() => { if (live) setFirst(true); });
    return () => { live = false; };
  }, [v.phase, v.auth, lead.id]);

  useEffect(() => {
    let live = true;
    voiceAPI.status().then(({ data }) => { if (live) setEnabled(!!data.enabled); }).catch(() => {});
    return () => { live = false; };
  }, []);

  useEffect(() => { if (v.phase === 'ended') setOutcomeOpen(true); }, [v.phase]);

  if (!enabled) return null;

  const closeAll = () => { setOutcomeOpen(false); setKeypad(false); v.reset(); };
  const live = ['connecting', 'ringing', 'active', 'held'].includes(v.phase);

  const trigger = variant === 'icon'
    ? <button onClick={() => v.begin(lead.id)} title="Call from CurveLead" className="shrink-0 p-2 bg-emerald-50 text-emerald-700 rounded-lg"><Phone size={14} /></button>
    : <button onClick={() => v.begin(lead.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"><Phone size={12} /> Call</button>;

  return (
    <>
      {trigger}
      <audio ref={v.audioRef} autoPlay />

      {v.phase === 'authorizing' && (
        <Overlay><div className="p-8 flex items-center justify-center gap-2 text-sm text-gray-600"><Loader2 size={16} className="animate-spin" /> Checking call permissions…</div></Overlay>
      )}

      {v.phase === 'confirm' && v.auth && (
        <Overlay onClose={v.hangup}>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Call {v.auth.lead.name}</h2>
              <button onClick={v.hangup} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Cancel"><X size={18} /></button></div>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between"><dt className="text-gray-500">Calling</dt><dd className="font-medium">{v.auth.destination.number}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Destination</dt><dd className="font-medium">{v.auth.destination.country}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Your caller ID</dt><dd className="font-medium">{v.auth.callerId}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Rate</dt><dd className="font-medium">{v.auth.rate}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Max duration</dt><dd className="font-medium">{formatDuration(v.auth.maxDurationSeconds)}</dd></div>
            </dl>
            <p className="text-xs text-gray-500">Estimate only. Final charge is based on billed talk time, rounded up to {v.auth.billingIncrementSeconds}s.</p>
            {first === true && (
              <div role="alert" className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-2">
                <p className="text-sm font-semibold text-amber-900">First call to {v.auth.lead.name}</p>
                <p className="text-xs text-amber-900">Introduce yourself and your business, and check they are happy to talk. If they ask not to be contacted, end the call politely and record it in the outcome.</p>
                <label className="flex items-center gap-2 text-xs font-medium text-amber-900"><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} /> I understand</label>
              </div>
            )}
            <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={v.hangup}>Cancel</Button>
              <Button className="flex-1" onClick={v.dial} disabled={first === null || (first === true && !ack)}><Phone size={14} /> Start call</Button></div>
          </div>
        </Overlay>
      )}

      {live && (
        <Overlay>
          <div className="p-5 space-y-4 text-center">
            <div><p className="text-base font-bold">{lead.name}</p><p className="text-sm text-gray-500">{v.auth?.destination.number}</p></div>
            <p className="text-sm font-semibold capitalize text-emerald-700">
              {v.phase === 'connecting' && 'Connecting…'}{v.phase === 'ringing' && 'Ringing…'}{v.phase === 'active' && 'On call'}{v.phase === 'held' && 'On hold'}
            </p>
            <p className="text-3xl font-mono tabular-nums">{formatDuration(v.seconds)}</p>
            {!v.online && <p className="flex items-center justify-center gap-1 text-xs text-amber-700 bg-amber-50 rounded-lg p-2"><WifiOff size={12} /> You are offline. Audio may drop; reconnecting when your network returns.</p>}
            {v.micState === 'denied' && <p className="flex items-center justify-center gap-1 text-xs text-red-700 bg-red-50 rounded-lg p-2"><AlertTriangle size={12} /> Microphone blocked</p>}
            {keypad && <div className="grid grid-cols-3 gap-2">{KEYS.map(k => <button key={k} onClick={() => v.sendDigit(k)} className="h-10 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold">{k}</button>)}</div>}
            <div className="flex items-center justify-center gap-3">
              <button onClick={v.toggleMute} disabled={v.phase === 'connecting'} aria-pressed={v.muted} title={v.muted ? 'Unmute' : 'Mute'}
                className={`p-3 rounded-full ${v.muted ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'} disabled:opacity-40`}>{v.muted ? <MicOff size={18} /> : <Mic size={18} />}</button>
              <button onClick={v.toggleHold} disabled={!['active', 'held'].includes(v.phase)} title={v.phase === 'held' ? 'Resume' : 'Hold'}
                className="p-3 rounded-full bg-gray-100 text-gray-700 disabled:opacity-40">{v.phase === 'held' ? <Play size={18} /> : <Pause size={18} />}</button>
              <button onClick={() => setKeypad(k => !k)} disabled={v.phase !== 'active'} title="Keypad" aria-pressed={keypad}
                className="p-3 rounded-full bg-gray-100 text-gray-700 disabled:opacity-40"><Hash size={18} /></button>
              <button onClick={v.hangup} title="Hang up" className="p-3 rounded-full bg-red-600 text-white"><PhoneOff size={18} /></button>
            </div>
          </div>
        </Overlay>
      )}

      {v.phase === 'error' && (
        <Overlay onClose={closeAll}>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-2"><AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" /><p className="text-sm text-gray-700">{v.error}</p></div>
            <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={closeAll}>Close</Button>
              {v.micState === 'denied' && v.auth && <Button className="flex-1" onClick={v.dial}>Retry</Button>}</div>
          </div>
        </Overlay>
      )}

      {outcomeOpen && (
        <OutcomeModal lead={lead} callId={v.callId} seconds={v.seconds}
          onDone={(logged) => { if (logged) { toast.success('Call saved to the lead timeline.'); onLogged?.(); } closeAll(); }} />
      )}
    </>
  );
}

function OutcomeModal({ lead, callId, seconds, onDone }) {
  const toast = useToast();
  const [outcome, setOutcome] = useState('connected');
  const [notes, setNotes] = useState('');
  const [followUp, setFollowUp] = useState(false);
  const [when, setWhen] = useState(toDateTimeInput(new Date(Date.now() + 24 * 3600 * 1000)));
  const [saving, setSaving] = useState(false);
  const [cost, setCost] = useState(null);

  // Settlement arrives from the provider webhook a few seconds after hangup; poll briefly for the final charge.
  useEffect(() => {
    let tries = 0; let stop = false;
    const tick = async () => {
      try { const { data } = await voiceAPI.getCall(callId); if (!stop && data.customer_cost != null) { setCost(formatMinor(data.customer_cost, data.currency)); return; } } catch { /* retry */ }
      if (!stop && ++tries < 8) setTimeout(tick, 2000);
    };
    if (callId) tick();
    return () => { stop = true; };
  }, [callId]);

  const save = async () => {
    setSaving(true);
    try {
      await voiceAPI.outcome(callId, { outcome, notes });
      if (followUp || outcome === 'follow_up_required') {
        await leadAPI.addFollowup(lead.id, { followup_type: 'call', notes: notes || 'Follow-up after call', next_followup_at: dateTimeInputToUTC(when) });
      }
      onDone(true);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not save the call outcome.');
      setSaving(false);
    }
  };

  const needsFollowUp = followUp || outcome === 'follow_up_required';
  return (
    <Overlay>
      <div className="p-5 space-y-4">
        <div><h2 className="text-lg font-bold">How did the call go?</h2>
          <p className="text-xs text-gray-500">{lead.name} · {formatDuration(seconds)}{cost ? ` · Charged ${cost}` : ''}</p></div>
        <div className="flex flex-wrap gap-2">
          {OUTCOMES.map(o => (
            <button key={o.value} onClick={() => setOutcome(o.value)} aria-pressed={outcome === o.value}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${outcome === o.value ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-700 border-gray-300'}`}>{o.label}</button>
          ))}
        </div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} maxLength={2000} placeholder="Notes (optional)"
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={needsFollowUp} disabled={outcome === 'follow_up_required'} onChange={e => setFollowUp(e.target.checked)} /> Create a follow-up task</label>
        {needsFollowUp && <input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />}
        <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => onDone(false)}>Skip</Button>
          <Button className="flex-1" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></div>
      </div>
    </Overlay>
  );
}
