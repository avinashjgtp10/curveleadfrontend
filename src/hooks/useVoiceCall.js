import { useCallback, useEffect, useRef, useState } from 'react';
import { voiceAPI } from '../services/api';
import { mapSdkState, denialMessage, hangupReason, CAPACITY_MESSAGE } from '../utils/voiceCall';

// Drives one outbound browser call. Phases:
//   idle -> authorizing -> confirm -> connecting -> ringing -> active|held -> ended   (error from anywhere)
// The server authorizes + reserves funds first; the browser then dials via Telnyx WebRTC with the server-issued
// clientState. Billing/settlement is done server-side from signed provider webhooks, never from this hook.
export default function useVoiceCall() {
  const [phase, setPhase] = useState('idle');
  const [auth, setAuth] = useState(null);       // authorize() response (caller ID, destination, rate…)
  const [callId, setCallId] = useState(null);
  const [error, setError] = useState(null);
  const [muted, setMuted] = useState(false);
  const [micState, setMicState] = useState('unknown'); // unknown|granted|denied
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [seconds, setSeconds] = useState(0);

  const clientRef = useRef(null);
  const callRef = useRef(null);
  const audioRef = useRef(null);          // <audio> element the caller component renders
  const activeSince = useRef(null);
  const phaseRef = useRef('idle');
  const setPhaseBoth = (p) => { phaseRef.current = p; setPhase(p); };

  const teardown = useCallback(() => {
    try { callRef.current?.hangup?.(); } catch { /* already gone */ }
    try { clientRef.current?.disconnect?.(); } catch { /* ignore */ }
    callRef.current = null; clientRef.current = null; activeSince.current = null;
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Duration ticks from the moment media became active.
  useEffect(() => {
    if (phase !== 'active' && phase !== 'held') return undefined;
    if (!activeSince.current) activeSince.current = Date.now();
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - activeSince.current) / 1000)), 500);
    return () => clearInterval(t);
  }, [phase]);

  const fail = useCallback((message) => { setError(message); setPhaseBoth('error'); }, []);

  const begin = useCallback(async (leadId) => {
    setError(null); setAuth(null); setCallId(null); setSeconds(0); setMuted(false); activeSince.current = null;
    setPhaseBoth('authorizing');
    try {
      const { data } = await voiceAPI.authorize(leadId);
      setAuth(data); setCallId(data.authorizationId); setPhaseBoth('confirm');
    } catch (e) { fail(denialMessage(e)); }
  }, [fail]);

  // User confirmed the pre-call dialog.
  const dial = useCallback(async () => {
    if (!auth) return;
    setPhaseBoth('connecting');
    try {
      // Ask for the mic first: a denied mic must not burn the authorization/wallet reservation.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setMicState('granted');
      } catch { setMicState('denied'); throw Object.assign(new Error('mic'), { mic: true }); }

      const { data: claim } = await voiceAPI.createCall(auth.authorizationId);
      const { data: tok } = await voiceAPI.token();
      const { TelnyxRTC } = await import('@telnyx/webrtc');
      const client = new TelnyxRTC({ login_token: tok.token });
      clientRef.current = client;
      client.remoteElement = audioRef.current;

      client.on('telnyx.error', () => { if (phaseRef.current !== 'ended') fail('The calling connection failed. Check your network and try again.'); });
      client.on('telnyx.ready', () => {
        const call = client.newCall({
          destinationNumber: claim.dial.to, callerNumber: claim.dial.from,
          clientState: claim.dial.clientState, audio: true, video: false, remoteElement: audioRef.current,
        });
        callRef.current = call;
      });
      client.on('telnyx.notification', (n) => {
        if (n.type === 'userMediaError') { setMicState('denied'); return fail('Microphone is blocked. Allow microphone access and retry.'); }
        if (n.type !== 'callUpdate' || !n.call) return;
        const next = mapSdkState(n.call.state);
        if (next === 'ended') {
          // Provider rejected the call because every line is in use: say so instead of showing an outcome sheet for a call that never happened.
          if (!activeSince.current && hangupReason(n.call) === 'capacity') { teardown(); fail(CAPACITY_MESSAGE); return; }
          setPhaseBoth('ended'); return;
        }
        if (next === 'active' && !activeSince.current) activeSince.current = Date.now();
        setPhaseBoth(next);
      });
      client.connect();
    } catch (e) {
      teardown();
      fail(e.mic ? 'Microphone permission is required to call. Allow it in your browser and retry.' : denialMessage(e));
    }
  }, [auth, fail, teardown]);

  const toggleMute = useCallback(() => {
    const c = callRef.current; if (!c) return;
    if (muted) c.unmuteAudio(); else c.muteAudio();
    setMuted(!muted);
  }, [muted]);

  const toggleHold = useCallback(async () => {
    const c = callRef.current; if (!c) return;
    try { if (phaseRef.current === 'held') await c.unhold(); else await c.hold(); } catch { /* state arrives via notification */ }
  }, []);

  const sendDigit = useCallback((d) => { try { callRef.current?.dtmf(d); } catch { /* ignore */ } }, []);

  const hangup = useCallback(async () => {
    const wasLive = !!callRef.current;
    try { callRef.current?.hangup(); } catch { /* ignore */ }
    if (callId && phaseRef.current !== 'ended') voiceAPI.hangup(callId).catch(() => {}); // backstop via provider/cancel authorization
    if (wasLive) setPhaseBoth('ended'); else { teardown(); setPhaseBoth('idle'); }
  }, [callId, teardown]);

  const reset = useCallback(() => { teardown(); setPhaseBoth('idle'); setAuth(null); setCallId(null); setError(null); setSeconds(0); }, [teardown]);

  return { phase, auth, callId, error, muted, micState, online, seconds, audioRef, begin, dial, hangup, toggleMute, toggleHold, sendDigit, reset };
}
