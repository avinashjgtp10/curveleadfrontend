import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { whatsappAPI, automationAPI } from '../../services/api';
import { welcomeStatus, WELCOME_EDIT_PATH, SEQUENCE_PATH } from '../../utils/welcomeStatus';

const TONE = {
  ok: { box: 'bg-green-50 border-green-200 text-green-900', Icon: CheckCircle2, icon: 'text-green-600' },
  warn: { box: 'bg-amber-50 border-amber-200 text-amber-900', Icon: AlertTriangle, icon: 'text-amber-600' },
  muted: { box: 'bg-gray-50 border-gray-200 text-gray-800', Icon: Info, icon: 'text-gray-500' },
};

// One status for "what does a new lead get on WhatsApp?", the same on every screen that touches it. Admin screens only
// (the data comes from the admin-only hub and automation endpoints). `where` hides the link to the screen you are already on.
//   where: 'auto' (WhatsApp > Auto messages) | 'hub' (Automations hub) | 'integrations' | 'rule' (sequence rule editor)
export default function WelcomeStatusCard({ where, refreshKey = 0, compact = false }) {
  const [state, setState] = useState({ loading: true, error: false, status: null });
  useEffect(() => {
    let live = true;
    Promise.all([whatsappAPI.hubGetAutoMessages(), automationAPI.getRules()]).then(([a, r]) => {
      if (!live) return;
      const d = a.data || {};
      const rules = Array.isArray(r.data) ? r.data : (r.data?.rules || []);
      setState({ loading: false, error: false, status: welcomeStatus({ responder: { enabled: d.welcome_enabled, template: d.welcome_template_name, message: d.welcome_message }, rules }) });
    }).catch(() => { if (live) setState({ loading: false, error: true, status: null }); });
    return () => { live = false; };
  }, [refreshKey]);

  if (state.loading) return <div className="h-14 rounded-xl bg-gray-100 animate-pulse" aria-busy="true" aria-label="Checking the welcome message" />;
  if (state.error) return <p className="text-xs text-gray-500">Couldn’t check the welcome message status right now.</p>;
  const s = state.status; const t = TONE[s.tone] || TONE.muted;
  return (
    <div role="status" className={`rounded-xl border px-4 py-3 flex gap-3 ${t.box}`}>
      <t.Icon size={18} className={`shrink-0 mt-0.5 ${t.icon}`} />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{s.headline}</p>
        {!compact && <p className="text-xs mt-0.5">{s.detail}</p>}
        <p className="text-xs mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
          {where !== 'auto' && <Link to={WELCOME_EDIT_PATH} className="underline">Edit the welcome message</Link>}
          {where !== 'rule' && <Link to={SEQUENCE_PATH} className="underline">Edit sequences</Link>}
        </p>
      </div>
    </div>
  );
}
