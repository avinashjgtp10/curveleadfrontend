import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Pause, Play, Hash, AlertTriangle, WifiOff, X, RotateCcw, CheckCircle2 } from 'lucide-react';
import { voiceAPI } from '../../services/api';
import { allowedOutcomes, defaultOutcome, fillScript, formatDuration, formatMinor, nextSteps, outcomeLabel } from '../../utils/voiceCall';
import PitchPanel from './PitchPanel';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
const TIMEOUT_MS = 60 * 1000;

const STATUS = {
  connecting: { label: 'Initiating…', cls: 'bg-blue-50 text-blue-700' },
  ringing: { label: 'Ringing…', cls: 'bg-blue-50 text-blue-700' },
  active: { label: 'Connected', cls: 'bg-green-50 text-green-700' },
  held: { label: 'On hold', cls: 'bg-amber-50 text-amber-700' },
  ended: { label: 'Ended', cls: 'bg-gray-100 text-gray-700' },
  error: { label: 'Failed', cls: 'bg-red-50 text-red-700' },
};

// Right-hand panel for an in-app call: status + timer, controls, the call script, notes, outcome, and what to do next.
// `v` is the useVoiceCall() state. Nothing here changes a lead's stage or status without a click.
export default function CallDrawer({ lead, v, pitch, agentName, onClose, onRetry, onRequestFollowup, onNextStep }) {
  const toast = useToast();
  const [keypad, setKeypad] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const everActive = useRef(false);
  const [outcome, setOutcome] = useState('no_answer');
  const [touched, setTouched] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null); // { outcome, connected }
  const [cost, setCost] = useState(null);

  const phase = v.phase;
  if (phase === 'active' || phase === 'held') everActive.current = true;
  const live = ['connecting', 'ringing', 'active', 'held'].includes(phase);
  const over = phase === 'ended';
  const connected = everActive.current;
  const options = allowedOutcomes(connected);

  // "Initiating" for more than a minute means the call never got off the ground.
  useEffect(() => {
    setTimedOut(false);
    if (phase !== 'connecting') return undefined;
    const t = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // Offer a sensible default once the call is over, unless the agent already picked something.
  useEffect(() => { if (over && !touched) setOutcome(defaultOutcome(connected)); }, [over, connected, touched]);
  // If an earlier pick no longer fits what happened, fall back (e.g. "Connected" on a call that never connected).
  const valid = options.some((o) => o.value === outcome);
  const effective = valid ? outcome : defaultOutcome(connected);

  // The server settles the charge from the provider's call-ended event a few seconds later; only a connected call is billed.
  useEffect(() => {
    if (!over || !connected || !v.callId) return undefined;
    let tries = 0; let stop = false;
    const tick = async () => {
      try { const { data } = await voiceAPI.getCall(v.callId); if (!stop && data.customer_cost != null) { setCost(formatMinor(data.customer_cost, data.currency)); return; } } catch { /* retry */ }
      if (!stop && ++tries < 8) setTimeout(tick, 2000);
    };
    tick();
    return () => { stop = true; };
  }, [over, connected, v.callId]);

  const save = async (thenFollowUp) => {
    setSaving(true);
    try {
      await voiceAPI.outcome(v.callId, { outcome: effective, notes });
      setSaved({ outcome: effective, connected });
      if (thenFollowUp) { onRequestFollowup?.({ notes, outcome: effective }); onClose(true); }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not save the call.');
    } finally { setSaving(false); }
  };

  // Don't lose typed notes by accident.
  const requestClose = () => {
    if (over && !saved && notes.trim() && !window.confirm('Discard the notes for this call?')) return;
    onClose(!!saved);
  };

  const script = fillScript(pitch?.script, { name: lead.name, agent: agentName });
  const st = timedOut ? { label: 'Timed out', cls: 'bg-amber-50 text-amber-800' } : (STATUS[phase] || STATUS.connecting);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" onClick={() => { if (!live) requestClose(); }} />
      <aside role="dialog" aria-modal="true" aria-label={`Call with ${lead.name}`} className="relative w-full sm:w-[420px] h-full bg-white shadow-2xl flex flex-col">
        <header className="p-4 border-b flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-bold truncate">{lead.name}</h2>
            <p className="text-sm text-gray-500">{v.auth?.destination?.number}</p>
          </div>
          {!live && <button onClick={requestClose} aria-label="Close call panel" className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>}
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span role="status" aria-live="polite" className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
            <span className="text-2xl font-mono tabular-nums" aria-label="Call duration">{formatDuration(v.seconds)}</span>
          </div>

          {!v.online && <p className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 rounded-lg p-2"><WifiOff size={12} /> You are offline. Audio may drop; reconnecting when your network returns.</p>}
          {v.micState === 'denied' && <p className="flex items-center gap-1 text-xs text-red-700 bg-red-50 rounded-lg p-2"><AlertTriangle size={12} /> Microphone blocked</p>}
          {phase === 'error' && <p className="flex items-start gap-2 text-sm text-red-700 bg-red-50 rounded-lg p-3"><AlertTriangle size={16} className="shrink-0 mt-0.5" />{v.error || 'The call failed.'}</p>}
          {timedOut && (
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">The call hasn't started after a minute. You can try again or cancel.</p>
          )}

          {live && (
            <div className="space-y-3">
              {keypad && <div className="grid grid-cols-3 gap-2">{KEYS.map(k => <button key={k} onClick={() => v.sendDigit(k)} className="h-10 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold">{k}</button>)}</div>}
              <div className="flex items-center justify-center gap-3">
                <button onClick={v.toggleMute} disabled={phase === 'connecting'} aria-pressed={v.muted} aria-label={v.muted ? 'Unmute' : 'Mute'}
                  className={`p-3 rounded-full ${v.muted ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'} disabled:opacity-40`}>{v.muted ? <MicOff size={18} /> : <Mic size={18} />}</button>
                <button onClick={v.toggleHold} disabled={!['active', 'held'].includes(phase)} aria-label={phase === 'held' ? 'Resume call' : 'Hold call'}
                  className="p-3 rounded-full bg-gray-100 text-gray-700 disabled:opacity-40">{phase === 'held' ? <Play size={18} /> : <Pause size={18} />}</button>
                <button onClick={() => setKeypad(k => !k)} disabled={phase !== 'active'} aria-pressed={keypad} aria-label="Keypad"
                  className="p-3 rounded-full bg-gray-100 text-gray-700 disabled:opacity-40"><Hash size={18} /></button>
                {(phase === 'active' || phase === 'held') && <button onClick={v.hangup} aria-label="Hang up" className="p-3 rounded-full bg-red-600 text-white"><PhoneOff size={18} /></button>}
              </div>
              {(phase === 'connecting' || phase === 'ringing') && (
                <div className="flex gap-2 justify-center">
                  {timedOut && <Button size="sm" onClick={onRetry}><RotateCcw size={14} /> Retry</Button>}
                  <Button size="sm" variant="secondary" onClick={() => v.hangup()}>Cancel</Button>
                </div>
              )}
            </div>
          )}

          <PitchPanel pitch={pitch} scriptText={script} defaultOpen />

          {(live || over) && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-600">Notes
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} maxLength={2000} disabled={!!saved}
                  placeholder="What was discussed?" className="mt-1 w-full px-3 py-2 border rounded-lg text-sm font-normal focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </label>
              <label className="block text-xs font-semibold text-gray-600">Outcome
                <select value={effective} onChange={e => { setOutcome(e.target.value); setTouched(true); }} disabled={!!saved}
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm font-normal bg-white">
                  {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              {live && <p className="text-xs text-gray-500">You can save once the call has ended.</p>}
              {over && cost && <p className="text-xs text-gray-600">Charged {cost}</p>}
            </div>
          )}

          {saved && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 space-y-2">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-green-800"><CheckCircle2 size={16} /> Saved — {outcomeLabel(saved.outcome)}</p>
              {onNextStep && nextSteps(saved.outcome, saved.connected).length > 0 && (
                <div className="flex flex-wrap gap-2" aria-label="Suggested next steps">
                  {nextSteps(saved.outcome, saved.connected).map((s) => (
                    <button key={s.key} onClick={() => { onNextStep(s.key); onClose(true); }} className="px-3 py-1.5 rounded-full text-xs font-semibold border border-green-300 bg-white text-green-800 hover:bg-green-100">{s.label}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="p-4 border-t flex gap-2">
          {over && !saved && (
            <>
              <Button variant="secondary" className="flex-1" onClick={() => save(false)} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
              <Button className="flex-1" onClick={() => save(true)} disabled={saving}><Phone size={14} /> Save &amp; schedule follow-up</Button>
            </>
          )}
          {phase === 'error' && <><Button variant="secondary" className="flex-1" onClick={() => onClose(false)}>Close</Button><Button className="flex-1" onClick={onRetry}><RotateCcw size={14} /> Retry</Button></>}
          {saved && <Button className="flex-1" onClick={() => onClose(true)}>Done</Button>}
          {over && !saved && <button className="sr-only" onClick={() => onClose(false)}>Close without saving</button>}
        </footer>
      </aside>
    </div>
  );
}
