import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Workflow, Search, ChevronDown, X, CheckCircle2, Clock, Circle, XCircle, Phone, Settings,
  MessageCircle, PhoneCall, Play, Pause, Download, Users, Sparkles, AlertTriangle,
} from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import { leadAPI, automationAPI, whatsappAPI, recordingAPI } from '../../services/api';
import AutomationBuilder from './AutomationBuilder';

const AVATAR_COLORS = [
  'from-brand-500 to-brand-700',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-700',
  'from-cyan-500 to-cyan-700',
  'from-violet-500 to-violet-700',
];
const hashString = (str) => String(str).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
const avatarColor = (id) => AVATAR_COLORS[hashString(id) % AVATAR_COLORS.length];

const STATUS_STYLES = {
  'Not Enrolled': 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200',
  'In Progress': 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
  'Completed': 'bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200',
  'Cancelled': 'bg-gray-100 text-gray-500 ring-1 ring-inset ring-gray-200',
  'Converted': 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  'Lost': 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
};

const STATUS_DOT = {
  'Not Enrolled': 'bg-gray-400',
  'In Progress': 'bg-blue-500',
  'Completed': 'bg-teal-500',
  'Cancelled': 'bg-gray-400',
  'Converted': 'bg-emerald-500',
  'Lost': 'bg-red-500',
};

const STATUS_OPTIONS = ['All Status', 'Not Enrolled', 'In Progress', 'Completed', 'Cancelled', 'Converted', 'Lost'];

// A lead's automation status is derived from its own outcome first (won/lost
// leads keep that label regardless of what their enrollment says), then from
// its most recent automation_enrollments row.
const computeStatus = (lead, enrollment) => {
  if (lead.won_at) return 'Converted';
  if (lead.lost_at) return 'Lost';
  if (!enrollment) return 'Not Enrolled';
  if (enrollment.status === 'active') return 'In Progress';
  if (enrollment.status === 'completed') return 'Completed';
  if (enrollment.status === 'cancelled') return 'Cancelled';
  return 'Not Enrolled';
};

const stepLabel = (enrollment) => {
  if (!enrollment) return 'Not Enrolled';
  const total = enrollment.steps.length;
  return enrollment.status === 'cancelled'
    ? `Cancelled — Step ${enrollment.current_step + 1} of ${total}`
    : `Step ${enrollment.current_step + 1} of ${total}`;
};

// Real per-lead journey, built from automation_enrollments + its sequence's
// steps. Verified against automationSequenceRunner.js: while active,
// current_step is the index of the step not yet sent; on the final step it
// marks the enrollment completed without incrementing further.
const buildTimeline = (enrollment) => enrollment.steps.map((s, i) => ({
  label: `${s.channel === 'email' ? 'Email' : 'WhatsApp'} — Step ${i + 1}`,
  state: enrollment.status === 'completed' && i <= enrollment.current_step ? 'done'
       : i < enrollment.current_step ? 'done'
       : i === enrollment.current_step && enrollment.status === 'active' ? 'current'
       : 'pending',
}));

const STEP_ICON = {
  done: <CheckCircle2 size={18} className="text-emerald-500" />,
  current: <Clock size={18} className="text-amber-500" />,
  pending: <Circle size={18} className="text-gray-300" />,
  failed: <XCircle size={18} className="text-red-500" />,
};

const STEP_LABEL_STYLE = {
  done: 'text-gray-700',
  current: 'text-amber-700 font-semibold',
  pending: 'text-gray-400',
  failed: 'text-red-600 font-semibold',
};

const FilterDropdown = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div className="space-y-1" ref={ref}>
      {label && <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">{label}</label>}
      <div className="relative">
        <button type="button" onClick={() => setOpen(v => !v)}
          className="h-10 w-full flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-lg px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent">
          <span className="truncate">{value}</span>
          <ChevronDown size={14} className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto py-1">
            {options.map(o => (
              <button key={o} type="button" onClick={() => { onChange(o); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-brand-50 ${o === value ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-700'}`}>
                {o}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] || 'bg-gray-400'}`} />
    {status}
  </span>
);

const StatTile = ({ label, value, icon: Icon, gradient }) => (
  <div className="relative overflow-hidden bg-white rounded-2xl p-4 border shadow-sm hover:shadow-md transition-shadow">
    <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br ${gradient} opacity-10`} />
    <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${gradient} text-white shadow-sm`}>
      <Icon size={18} />
    </div>
    <p className="relative text-xs text-gray-500 font-medium">{label}</p>
    <p className="relative text-2xl font-bold mt-0.5 text-gray-800">{value}</p>
  </div>
);

const Timeline = ({ steps }) => (
  <div>
    {steps.map((step, idx) => (
      <div key={step.label} className="flex gap-3">
        <div className="flex flex-col items-center">
          {STEP_ICON[step.state]}
          {idx < steps.length - 1 && <div className="w-px flex-1 min-h-[22px] bg-gray-200 my-0.5" />}
        </div>
        <p className={`text-sm pb-5 ${STEP_LABEL_STYLE[step.state]}`}>{step.label}</p>
      </div>
    ))}
  </div>
);

const ModalShell = ({ title, icon: Icon, onClose, children }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50" onClick={onClose} />
    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col max-h-[80vh] overflow-hidden">
      <div className="flex items-center justify-between px-5 h-14 border-b shrink-0 bg-gradient-to-r from-brand-600 to-brand-700">
        <h2 className="font-semibold text-white flex items-center gap-2">
          {Icon && <Icon size={17} />} {title}
        </h2>
        <button onClick={onClose} className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  </div>
);

const ModalSpinner = () => (
  <div className="flex items-center justify-center h-32">
    <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
  </div>
);

const WhatsAppChatModal = ({ lead, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lead) return;
    setLoading(true);
    whatsappAPI.getConversation(lead.id)
      .then(({ data }) => setMessages(data.messages || []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [lead]);

  if (!lead) return null;
  return (
    <ModalShell title={`WhatsApp Chat — ${lead.name}`} icon={MessageCircle} onClose={onClose}>
      <div className="bg-[#e5ddd5] rounded-xl p-4 space-y-2 min-h-[200px]">
        {loading ? <ModalSpinner /> : messages.length === 0 ? <EmptyState message="No messages yet" /> : messages.map(m => (
          <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ${m.direction === 'outbound' ? 'bg-[#dcf8c6] text-gray-800' : 'bg-white text-gray-800'}`}>
              <p>{m.message}</p>
              <p className="text-[10px] text-gray-400 text-right mt-1">
                {new Date(m.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
};

const CallRecordingModal = ({ lead, onClose }) => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    if (!lead) return;
    setLoading(true);
    recordingAPI.getByLead(lead.id)
      .then(({ data }) => setRecordings(data.recordings || []))
      .catch(() => setRecordings([]))
      .finally(() => setLoading(false));
  }, [lead]);

  if (!lead) return null;
  return (
    <ModalShell title={`Call Recordings — ${lead.name}`} icon={PhoneCall} onClose={onClose}>
      {loading ? <ModalSpinner /> : recordings.length === 0 ? <EmptyState message="No call recordings yet" /> : (
        <div className="space-y-3">
          {recordings.map(rec => (
            <div key={rec.id} className="border rounded-xl p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-800">{rec.title || 'Call Recording'}</p>
                <span className="text-[11px] text-gray-400">{new Date(rec.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPlayingId(prev => prev === rec.id ? null : rec.id)}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shrink-0 hover:opacity-90 shadow-sm"
                >
                  {playingId === rec.id ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                </button>
                {playingId === rec.id && rec.playback_url && (
                  <audio src={rec.playback_url} autoPlay onEnded={() => setPlayingId(null)} className="hidden" />
                )}
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full ${playingId === rec.id ? 'w-1/3' : 'w-0'} transition-all`} />
                </div>
                {(rec.playback_url || rec.file_url) && (
                  <a href={rec.playback_url || rec.file_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 shrink-0" title="Download">
                    <Download size={15} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
};

const LeadDrawer = ({ lead, onClose, onViewChat, onViewCalls, onReEnable }) => {
  if (!lead) return null;
  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col animate-[fieldFadeIn_.2s_ease]">
        <div className="flex items-center justify-between px-5 h-14 border-b shrink-0 bg-gradient-to-r from-brand-600 to-brand-700">
          <h2 className="font-semibold text-white">Lead Automation Details</h2>
          <button onClick={onClose} className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div className="bg-gray-50 rounded-2xl p-4 border">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br ${avatarColor(lead.id)} text-white shadow-sm`}>
                <span className="font-semibold text-sm">{lead.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate">{lead.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={12} /> {lead.phone}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500">Status:</span>
              <StatusBadge status={lead.status} />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onViewChat(lead)}
                className="flex-1 flex items-center justify-center gap-1.5 border border-emerald-200 text-emerald-700 text-xs font-medium py-2 rounded-lg hover:bg-emerald-50"
              >
                <MessageCircle size={14} /> View WhatsApp Chat
              </button>
              <button
                onClick={() => onViewCalls(lead)}
                className="flex-1 flex items-center justify-center gap-1.5 border border-brand-200 text-brand-700 text-xs font-medium py-2 rounded-lg hover:bg-brand-50"
              >
                <PhoneCall size={14} /> Call Recordings
              </button>
            </div>
          </div>

          {lead.opted_out && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between gap-2">
              <span className="text-xs text-red-700 font-medium">Opted out of automated messages</span>
              <button onClick={() => onReEnable(lead)} className="text-xs font-semibold text-red-700 underline shrink-0">Re-enable</button>
            </div>
          )}

          <div>
            <p className="text-[11px] font-bold uppercase text-gray-400 tracking-wide mb-3 flex items-center gap-1.5">
              <Sparkles size={13} className="text-brand-500" /> Automation Journey
            </p>
            {lead.enrollment ? (
              <>
                <p className="text-xs text-gray-500 mb-3">{lead.enrollment.sequence_name}</p>
                <Timeline steps={buildTimeline(lead.enrollment)} />
              </>
            ) : (
              <p className="text-sm text-gray-400">This lead isn't enrolled in an automation sequence yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LeadAutomationPage = () => {
  const [tab, setTab] = useState('leads');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [stepFilter, setStepFilter] = useState('All Steps');
  const [selectedLead, setSelectedLead] = useState(null);
  const [chatLead, setChatLead] = useState(null);
  const [callLead, setCallLead] = useState(null);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentError, setEnrollmentError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await leadAPI.getAll({ limit: 50 });
        const rawLeads = data.leads || [];
        if (cancelled) return;
        if (!rawLeads.length) { setLeads([]); return; }

        const leadIds = rawLeads.map(l => l.id);
        const enrollResult = await automationAPI.getEnrollments(leadIds).catch(() => null);
        if (cancelled) return;
        setEnrollmentError(!enrollResult);
        const enrollments = enrollResult?.data?.enrollments || {};

        setLeads(rawLeads.map(l => {
          const enrollment = enrollments[l.id] || null;
          return {
            id: l.id,
            name: l.name,
            phone: l.phone,
            won_at: l.won_at,
            lost_at: l.lost_at,
            opted_out: l.opted_out,
            enrollment,
            status: computeStatus(l, enrollment),
            step: stepLabel(enrollment),
          };
        }));
      } catch {
        if (!cancelled) setLeads([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const summary = useMemo(() => ({
    total: leads.length,
    inProgress: leads.filter(l => l.status === 'In Progress').length,
    converted: leads.filter(l => l.status === 'Converted').length,
    lost: leads.filter(l => l.status === 'Lost').length,
  }), [leads]);

  const stepOptions = useMemo(() => {
    const set = new Set(leads.map(l => l.step));
    return ['All Steps', ...Array.from(set).sort()];
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) || (lead.phone || '').includes(search);
      const matchesStatus = statusFilter === 'All Status' || lead.status === statusFilter;
      const matchesStep = stepFilter === 'All Steps' || lead.step === stepFilter;
      return matchesSearch && matchesStatus && matchesStep;
    });
  }, [leads, search, statusFilter, stepFilter]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-800 p-5 sm:p-6 shadow-sm">
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute right-16 bottom-[-2.5rem] w-24 h-24 rounded-full bg-white/10" />
        <div className="relative flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-sm">
            <Workflow size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Lead Automation</h1>
            <p className="text-sm text-white/80 mt-0.5">Automate and track your lead follow-up journey.</p>
          </div>
        </div>
      </div>

      {enrollmentError && !loading && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertTriangle size={16} className="shrink-0" /> Could not load automation status for these leads — showing them as Not Enrolled until this loads.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Total Leads" value={summary.total} icon={Users} gradient="from-brand-500 to-indigo-600" />
        <StatTile label="In Progress" value={summary.inProgress} icon={Clock} gradient="from-amber-400 to-amber-600" />
        <StatTile label="Converted" value={summary.converted} icon={CheckCircle2} gradient="from-emerald-400 to-emerald-600" />
        <StatTile label="Lost" value={summary.lost} icon={XCircle} gradient="from-rose-400 to-rose-600" />
      </div>

      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('leads')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'leads' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Automation Leads
        </button>
        <button
          onClick={() => setTab('settings')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'settings' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Settings size={14} /> Automation Settings
        </button>
      </div>

      {tab === 'settings' ? (
        <div className="bg-white rounded-2xl border p-4 sm:p-6 shadow-sm">
          <AutomationBuilder />
        </div>
      ) : (
      <div className="bg-white rounded-2xl border p-4 sm:p-6 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4">Automation Leads</h2>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Lead"
              className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div className="w-full sm:w-48">
            <FilterDropdown value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
          </div>
          <div className="w-full sm:w-56">
            <FilterDropdown value={stepFilter} options={stepOptions} onChange={setStepFilter} />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase text-gray-400 tracking-wide border-b">
                <th className="py-2.5 pr-4">Lead Name</th>
                <th className="py-2.5 pr-4">Phone Number</th>
                <th className="py-2.5 pr-4">Current Step</th>
                <th className="py-2.5 pr-4">Status</th>
                <th className="py-2.5 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => (
                <tr key={lead.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br ${avatarColor(lead.id)} text-white shadow-sm`}>
                        <span className="text-xs font-semibold">{lead.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="font-medium text-gray-800">{lead.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-600">{lead.phone}</td>
                  <td className="py-3 pr-4 text-gray-600">{lead.step}</td>
                  <td className="py-3 pr-4"><StatusBadge status={lead.status} /></td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="text-brand-600 font-medium hover:text-brand-700 hover:underline"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => setChatLead(lead)}
                        title="View WhatsApp Chat"
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <MessageCircle size={16} />
                      </button>
                      <button
                        onClick={() => setCallLead(lead)}
                        title="Call Recordings"
                        className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <PhoneCall size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLeads.length === 0 && (
            <EmptyState message={leads.length === 0 ? 'No leads yet' : 'No leads match your filters'} />
          )}
        </div>
        )}
      </div>
      )}

      <LeadDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onViewChat={(l) => { setSelectedLead(null); setChatLead(l); }}
        onViewCalls={(l) => { setSelectedLead(null); setCallLead(l); }}
        onReEnable={async (l) => {
          try {
            await leadAPI.update(l.id, { opted_out: false });
            setLeads(ls => ls.map(x => x.id === l.id ? { ...x, opted_out: false } : x));
            setSelectedLead(s => s && s.id === l.id ? { ...s, opted_out: false } : s);
          } catch { /* silently ignore — drawer stays as-is, user can retry */ }
        }}
      />
      <WhatsAppChatModal lead={chatLead} onClose={() => setChatLead(null)} />
      <CallRecordingModal lead={callLead} onClose={() => setCallLead(null)} />
    </div>
  );
};

export default LeadAutomationPage;
