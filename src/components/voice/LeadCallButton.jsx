import { useEffect, useRef, useState } from 'react';
import { Phone, ChevronDown, Loader2, AlertTriangle, X } from 'lucide-react';
import { leadAPI, voiceAPI, settingsAPI, playbookAPI } from '../../services/api';
import { fillScript, formatDuration, isFirstCall, playbookTips } from '../../utils/voiceCall';
import useVoiceCall from '../../hooks/useVoiceCall';
import useVoiceStatus from '../../hooks/useVoiceStatus';
import { useAuth } from '../../context/AuthContext';
import PitchPanel from './PitchPanel';
import CallDrawer from './CallDrawer';
import Button from '../ui/Button';

const Overlay = ({ children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="fixed inset-0 bg-black/50" onClick={onClose} />
    <div className="relative bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl">{children}</div>
  </div>
);

const DRAWER_PHASES = ['connecting', 'ringing', 'active', 'held', 'ended', 'error'];

// One labelled "Call" split button for a lead: the main part calls from CurveLead when that is available, the arrow offers
// "Call from CurveLead" and "Call from my phone" (tel:). Also owns the pre-call dialog and the call drawer.
export default function LeadCallButton({ lead, onLogged, onRequestFollowup, onNextStep, startSignal }) {
  const { user } = useAuth();
  const v = useVoiceCall();
  const enabled = useVoiceStatus();          // null while loading
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [walletLow, setWalletLow] = useState(false);
  const [dialStarted, setDialStarted] = useState(false); // the agent pressed Start call (so a failure belongs to the drawer)
  const [first, setFirst] = useState(null); // null = still checking, true/false once known
  const [ack, setAck] = useState(false);
  const [pitch, setPitch] = useState(null); // { script, tips }

  // Wallet check: an empty wallet cannot place in-app calls. Unknown (no wallet, request failed) is not treated as empty.
  const refreshWallet = () => {
    if (enabled !== true) return;
    voiceAPI.wallet().then(({ data }) => setWalletLow(!!data && Number(data.available_balance) <= 0)).catch(() => {});
  };
  useEffect(refreshWallet, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close the menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  // Script and playbook tips, loaded when the confirm dialog opens. Either may be missing; failures just hide the panel.
  useEffect(() => {
    if (v.phase !== 'confirm') return undefined;
    let live = true;
    Promise.allSettled([settingsAPI.get(), playbookAPI.get()]).then(([st, pb]) => {
      if (!live) return;
      const script = st.status === 'fulfilled' ? (st.value.data?.settings?.call_script || '').trim() : '';
      const tips = pb.status === 'fulfilled' ? playbookTips(pb.value.data?.playbook) : null;
      setPitch({ script, tips });
    });
    return () => { live = false; };
  }, [v.phase]);

  // On the confirm dialog, find out whether this is the first call to this lead. If the history can't be read, assume it is.
  useEffect(() => {
    if (v.phase !== 'confirm' || !v.auth) { setFirst(null); setAck(false); return undefined; }
    let live = true;
    voiceAPI.listCalls({ leadId: lead.id, limit: 20 })
      .then(({ data }) => { if (live) setFirst(isFirstCall(data, v.auth.authorizationId)); })
      .catch(() => { if (live) setFirst(true); });
    return () => { live = false; };
  }, [v.phase, v.auth, lead.id]);

  const noPhone = !lead.phone;
  const inAppReason = enabled === false ? 'Calling from CurveLead isn’t set up for your workspace yet.'
    : walletLow ? 'Wallet balance is too low — recharge in Calling → Wallet.' : null;
  const canInApp = enabled === true && !inAppReason;
  const mainDisabled = noPhone || (enabled === true && walletLow);

  const logPhoneCall = () => leadAPI.logCall(lead.id).catch(() => {});
  const callFromPhone = () => { logPhoneCall(); window.location.href = `tel:${lead.phone}`; };
  const startInApp = () => { setMenuOpen(false); setDialStarted(false); v.begin(lead.id); };
  const onMain = () => (canInApp ? startInApp() : callFromPhone());

  // "Call now" elsewhere on the page (or a retry link) bumps startSignal: start the call once the workspace status is known.
  const onMainRef = useRef(onMain); onMainRef.current = onMain;
  const handledSignal = useRef(0);
  useEffect(() => {
    if (!startSignal || startSignal === handledSignal.current || enabled === null || noPhone || mainDisabled) return;
    handledSignal.current = startSignal;
    onMainRef.current();
  }, [startSignal, enabled, noPhone, mainDisabled]);

  const closeAll = (done) => {
    setDialStarted(false); v.reset();
    if (done) { onLogged?.(); refreshWallet(); }
  };
  const retry = async () => { await v.hangup(); v.reset(); setDialStarted(false); v.begin(lead.id); };
  const startCall = () => { setDialStarted(true); v.dial(); };

  const mainTitle = noPhone ? 'This lead has no phone number'
    : mainDisabled ? inAppReason
    : canInApp ? `Call ${lead.phone} from CurveLead` : `Call ${lead.phone} from your phone`;

  const showDrawer = dialStarted && DRAWER_PHASES.includes(v.phase);
  const showDenial = !dialStarted && v.phase === 'error';

  return (
    <>
      <div ref={menuRef} className="relative inline-flex shrink-0">
        <button type="button" onClick={onMain} disabled={mainDisabled} title={mainTitle} aria-label={mainTitle}
          className="px-3 py-2 bg-emerald-600 text-white rounded-l-lg text-sm font-semibold flex items-center gap-1.5 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1">
          <Phone size={14} /> Call
        </button>
        <button type="button" onClick={() => setMenuOpen(o => !o)} disabled={noPhone} aria-haspopup="menu" aria-expanded={menuOpen} aria-label="More ways to call"
          className="px-2 bg-emerald-600 text-white rounded-r-lg border-l border-emerald-500 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1">
          <ChevronDown size={14} className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>
        {menuOpen && (
          <div role="menu" className="absolute right-0 top-full mt-1 w-64 bg-white border rounded-lg shadow-lg z-30 py-1">
            <button role="menuitem" type="button" onClick={startInApp} disabled={!canInApp} title={inAppReason || undefined}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <span className="block font-medium">Call from CurveLead</span>
              <span className="block text-xs text-gray-500">{inAppReason || 'Uses your wallet; the call is logged on the lead'}</span>
            </button>
            <a role="menuitem" href={`tel:${lead.phone}`} onClick={() => { logPhoneCall(); setMenuOpen(false); }} className="block px-3 py-2 text-sm hover:bg-gray-50">
              <span className="block font-medium">Call from my phone</span>
              <span className="block text-xs text-gray-500">{lead.phone}</span>
            </a>
          </div>
        )}
      </div>
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
            <PitchPanel pitch={pitch} scriptText={fillScript(pitch?.script, { name: lead.name, agent: user?.name })} defaultOpen />
            <p className="text-xs text-gray-500">Estimate only. Final charge is based on billed talk time, rounded up to {v.auth.billingIncrementSeconds}s.</p>
            {first === true && (
              <div role="alert" className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-2">
                <p className="text-sm font-semibold text-amber-900">First call to {v.auth.lead.name}</p>
                <p className="text-xs text-amber-900">Introduce yourself and your business, and check they are happy to talk. If they ask not to be contacted, end the call politely and record it in the outcome.</p>
                <label className="flex items-center gap-2 text-xs font-medium text-amber-900"><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} /> I understand</label>
              </div>
            )}
            <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={v.hangup}>Cancel</Button>
              <Button className="flex-1" onClick={startCall} disabled={first === null || (first === true && !ack)}><Phone size={14} /> Start call</Button></div>
          </div>
        </Overlay>
      )}

      {showDrawer && (
        <CallDrawer lead={lead} v={v} pitch={pitch} agentName={user?.name} onClose={closeAll} onRetry={retry}
          onRequestFollowup={onRequestFollowup} onNextStep={onNextStep} />
      )}

      {showDenial && (
        <Overlay onClose={() => closeAll(false)}>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-2"><AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" /><p className="text-sm text-gray-700">{v.error}</p></div>
            <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => closeAll(false)}>Close</Button>
              {v.micState === 'denied' && v.auth && <Button className="flex-1" onClick={startCall}>Retry</Button>}</div>
          </div>
        </Overlay>
      )}
    </>
  );
}
