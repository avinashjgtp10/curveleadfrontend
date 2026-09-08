import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Workflow, Search, ChevronDown, X, CheckCircle2, Clock, Circle, XCircle, Phone, Settings, Save,
  MessageCircle, PhoneCall, Play, Pause, Download,
} from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';

const STATUS_STYLES = {
  'In Progress': 'bg-blue-100 text-blue-700',
  'Converted': 'bg-emerald-100 text-emerald-700',
  'Lost': 'bg-red-100 text-red-700',
  'Follow-up': 'bg-amber-100 text-amber-700',
};

const STATUS_OPTIONS = ['All Status', 'In Progress', 'Converted', 'Lost', 'Follow-up'];

const STEP_OPTIONS = [
  'All Steps',
  'Send WhatsApp Message',
  'Waiting for Customer Reply',
  'Booking',
  'Wait 24 Hours',
  'Not Interested',
];

// Static demo journeys — simulate what an automation would look like once a
// lead moves past "Add Lead" in the real Leads flow. No backend involved.
const JOURNEYS = {
  waitingReply: [
    { label: 'Lead Added', state: 'done' },
    { label: 'Lead Saved in Database', state: 'done' },
    { label: 'Automation Started', state: 'done' },
    { label: 'WhatsApp Message Sent', state: 'done' },
    { label: 'Waiting for Customer Reply', state: 'current' },
    { label: 'AI Detect Intent', state: 'pending' },
    { label: 'Send Service/Offer Details', state: 'pending' },
    { label: 'Send Booking Link', state: 'pending' },
    { label: 'Booking', state: 'pending' },
    { label: 'Converted', state: 'pending' },
  ],
  noReply: [
    { label: 'Lead Added', state: 'done' },
    { label: 'WhatsApp Message Sent', state: 'done' },
    { label: 'No Customer Reply', state: 'failed' },
    { label: 'Wait 1 Hour', state: 'done' },
    { label: 'AI Follow-up Call', state: 'current' },
    { label: 'Customer Answered', state: 'pending' },
    { label: 'AI Conversation', state: 'pending' },
    { label: 'Check Customer Interest', state: 'pending' },
    { label: 'Booking', state: 'pending' },
    { label: 'Converted', state: 'pending' },
  ],
  booking: [
    { label: 'Lead Added', state: 'done' },
    { label: 'Lead Saved in Database', state: 'done' },
    { label: 'Automation Started', state: 'done' },
    { label: 'WhatsApp Message Sent', state: 'done' },
    { label: 'Waiting for Customer Reply', state: 'done' },
    { label: 'AI Detect Intent', state: 'done' },
    { label: 'Send Service/Offer Details', state: 'done' },
    { label: 'Send Booking Link', state: 'done' },
    { label: 'Booking', state: 'current' },
    { label: 'Converted', state: 'pending' },
  ],
  finalFollowUp: [
    { label: 'No Answer', state: 'done' },
    { label: 'Wait 24 Hours', state: 'done' },
    { label: 'AI Final Follow-up Call', state: 'current' },
    { label: 'Send Booking Link', state: 'pending' },
    { label: 'Converted', state: 'pending' },
  ],
  lost: [
    { label: 'Lead Added', state: 'done' },
    { label: 'WhatsApp Message Sent', state: 'done' },
    { label: 'Customer Answered', state: 'done' },
    { label: 'AI Conversation Started', state: 'done' },
    { label: 'Customer Not Interested', state: 'done' },
    { label: 'Lead Marked as Lost', state: 'failed' },
  ],
};

const LEADS = [
  { id: 1, name: 'Shivani', phone: '9999999999', step: 'Send WhatsApp Message', status: 'In Progress', journey: 'waitingReply' },
  { id: 2, name: 'Test User', phone: '7777777777', step: 'Waiting for Customer Reply', status: 'In Progress', journey: 'waitingReply' },
  { id: 3, name: 'Rahul', phone: '8888888888', step: 'Booking', status: 'Converted', journey: 'booking' },
  { id: 4, name: 'Amit', phone: '6666666666', step: 'Wait 24 Hours', status: 'Follow-up', journey: 'finalFollowUp' },
  { id: 5, name: 'Adi', phone: '5555555555', step: 'Not Interested', status: 'Lost', journey: 'lost' },
];

const SUMMARY = { total: 120, inProgress: 45, converted: 60, lost: 15 };

// Static demo WhatsApp transcripts, keyed by lead id — frontend-only mock data.
const WHATSAPP_CHATS = {
  1: [
    { from: 'business', text: 'Hi Shivani, thanks for your interest! We’d love to help you find the right service.', time: '10:02 AM' },
    { from: 'business', text: 'Reply anytime and our team will get back to you shortly.', time: '10:02 AM' },
  ],
  2: [
    { from: 'business', text: 'Hi Test User, thanks for reaching out! How can we help you today?', time: '11:14 AM' },
    { from: 'business', text: 'Just checking in — are you still looking for our services?', time: '2:30 PM' },
  ],
  3: [
    { from: 'business', text: 'Hi Rahul, thanks for your interest!', time: '9:05 AM' },
    { from: 'customer', text: 'Yes, I’d like to know more about pricing.', time: '9:20 AM' },
    { from: 'business', text: 'Sure! Here are our service and offer details 👇', time: '9:22 AM' },
    { from: 'customer', text: 'Sounds good, can I book a slot?', time: '9:40 AM' },
    { from: 'business', text: 'Absolutely, here’s your booking link: curvelead.app/book/rahul', time: '9:41 AM' },
  ],
  4: [
    { from: 'business', text: 'Hi Amit, thanks for your interest!', time: 'Yesterday, 4:10 PM' },
  ],
  5: [
    { from: 'business', text: 'Hi Adi, thanks for your interest!', time: '2 days ago' },
    { from: 'customer', text: 'Not interested right now, thanks.', time: '2 days ago' },
  ],
};

// Static demo call recordings, keyed by lead id — frontend-only mock data (no real audio).
const CALL_RECORDINGS = {
  1: [],
  2: [],
  3: [
    { label: 'Booking Confirmation Call', date: 'Today, 9:45 AM', duration: '2:14' },
  ],
  4: [
    { label: 'AI Follow-up Call', date: 'Yesterday, 4:15 PM', duration: '0:48' },
  ],
  5: [
    { label: 'AI Follow-up Call', date: '2 days ago', duration: '1:32' },
    { label: 'AI Final Follow-up Call', date: '2 days ago', duration: '0:21' },
  ],
};

const WAIT_OPTIONS = ['15 Minutes', '30 Minutes', '1 Hour', '2 Hours', '6 Hours', '24 Hours', '48 Hours'];

const DEFAULT_SETTINGS = {
  whatsappTemplate: 'Hi {{lead_name}}, thanks for your interest! We’d love to help you find the right service. Reply anytime and our team (or assistant) will get back to you shortly.',
  noReplyWait: '1 Hour',
  followUpCallScript: 'Hello {{lead_name}}, this is a follow-up call from our team regarding your recent enquiry. Are you still interested in learning more about our services?',
  finalFollowUpWait: '24 Hours',
  finalCallScript: 'Hi {{lead_name}}, just checking in one last time — we have a great offer for you. Would you like us to send you the booking link?',
  notInterestedMessage: 'Thanks for your time, {{lead_name}}. Feel free to reach out whenever you’re ready — we’re here to help!',
};

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
  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
    {status}
  </span>
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
    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col max-h-[80vh]">
      <div className="flex items-center justify-between px-5 h-14 border-b shrink-0">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          {Icon && <Icon size={17} className="text-brand-600" />} {title}
        </h2>
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  </div>
);

const WhatsAppChatModal = ({ lead, onClose }) => {
  if (!lead) return null;
  const messages = WHATSAPP_CHATS[lead.id] || [];
  return (
    <ModalShell title={`WhatsApp Chat — ${lead.name}`} icon={MessageCircle} onClose={onClose}>
      <div className="bg-[#e5ddd5] rounded-xl p-4 space-y-2 min-h-[200px]">
        {messages.length === 0 && <EmptyState message="No messages yet" />}
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.from === 'business' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ${m.from === 'business' ? 'bg-[#dcf8c6] text-gray-800' : 'bg-white text-gray-800'}`}>
              <p>{m.text}</p>
              <p className="text-[10px] text-gray-400 text-right mt-1">{m.time}</p>
            </div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
};

const CallRecordingModal = ({ lead, onClose }) => {
  const [playingIdx, setPlayingIdx] = useState(null);
  if (!lead) return null;
  const recordings = CALL_RECORDINGS[lead.id] || [];
  return (
    <ModalShell title={`Call Recordings — ${lead.name}`} icon={PhoneCall} onClose={onClose}>
      {recordings.length === 0 && <EmptyState message="No call recordings yet" />}
      <div className="space-y-3">
        {recordings.map((rec, idx) => (
          <div key={idx} className="border rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-800">{rec.label}</p>
              <span className="text-[11px] text-gray-400">{rec.date}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPlayingIdx(playingIdx === idx ? null : idx)}
                className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 hover:bg-brand-700"
              >
                {playingIdx === idx ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
              </button>
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full bg-brand-500 rounded-full ${playingIdx === idx ? 'w-1/3' : 'w-0'} transition-all`} />
              </div>
              <span className="text-xs text-gray-500 shrink-0">{rec.duration}</span>
              <button className="text-gray-400 hover:text-gray-600 shrink-0" title="Download">
                <Download size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
};

const LeadDrawer = ({ lead, onClose, onViewChat, onViewCalls }) => {
  if (!lead) return null;
  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col animate-[fieldFadeIn_.2s_ease]">
        <div className="flex items-center justify-between px-5 h-14 border-b shrink-0">
          <h2 className="font-semibold text-gray-800">Lead Automation Details</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div className="bg-gray-50 rounded-2xl p-4 border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-brand-700 font-semibold text-sm">{lead.name.charAt(0).toUpperCase()}</span>
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

          <div>
            <p className="text-[11px] font-bold uppercase text-gray-400 tracking-wide mb-3">Automation Journey</p>
            <Timeline steps={JOURNEYS[lead.journey]} />
          </div>
        </div>
      </div>
    </div>
  );
};

const TextField = ({ label, hint, value, onChange, rows }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">{label}</label>
    {rows ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      />
    )}
    {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
  </div>
);

const AutomationSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  const update = (key) => (value) => { setSettings(s => ({ ...s, [key]: value })); setSaved(false); };

  const handleSave = () => {
    // Frontend-only: simulated save to local state, no backend call.
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl border p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-800">Automation Settings</h2>
          <p className="text-xs text-gray-500 mt-0.5">Configure the WhatsApp messages, call scripts and reminder timing used by the automation.</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg shrink-0"
        >
          <Save size={15} /> Save Changes
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm px-3 py-2 rounded-lg">
          <CheckCircle2 size={16} /> Settings saved
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">WhatsApp Response</p>
        <TextField
          label="Initial WhatsApp Message"
          hint="Sent automatically once a lead is added."
          rows={3}
          value={settings.whatsappTemplate}
          onChange={update('whatsappTemplate')}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <FilterDropdown label="Wait Before No-Reply Follow-up" value={settings.noReplyWait} options={WAIT_OPTIONS} onChange={update('noReplyWait')} />
        <FilterDropdown label="Wait Before Final Follow-up" value={settings.finalFollowUpWait} options={WAIT_OPTIONS} onChange={update('finalFollowUpWait')} />
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Call Reminder / Response Scripts</p>
        <div className="space-y-4">
          <TextField
            label="AI Follow-up Call Script"
            hint="Used when the customer hasn't replied on WhatsApp."
            rows={3}
            value={settings.followUpCallScript}
            onChange={update('followUpCallScript')}
          />
          <TextField
            label="AI Final Follow-up Call Script"
            hint="Used if the first follow-up call goes unanswered."
            rows={3}
            value={settings.finalCallScript}
            onChange={update('finalCallScript')}
          />
          <TextField
            label="Not Interested Response"
            hint="Sent when a lead is marked as Lost."
            rows={2}
            value={settings.notInterestedMessage}
            onChange={update('notInterestedMessage')}
          />
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

  const filteredLeads = useMemo(() => {
    return LEADS.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) || lead.phone.includes(search);
      const matchesStatus = statusFilter === 'All Status' || lead.status === statusFilter;
      const matchesStep = stepFilter === 'All Steps' || lead.step === stepFilter;
      return matchesSearch && matchesStatus && matchesStep;
    });
  }, [search, statusFilter, stepFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Workflow size={22} className="text-brand-600" /> Lead Automation
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Automate and track your lead follow-up journey.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border rounded-full px-3.5 py-2 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-gray-600">Automation Status:</span>
          <span className="text-sm font-semibold text-emerald-600">Active</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={SUMMARY.total} icon={Workflow} color="bg-brand-100 text-brand-600" />
        <StatCard label="In Progress" value={SUMMARY.inProgress} icon={Clock} color="bg-amber-100 text-amber-600" />
        <StatCard label="Converted" value={SUMMARY.converted} icon={CheckCircle2} color="bg-emerald-100 text-emerald-600" />
        <StatCard label="Lost" value={SUMMARY.lost} icon={XCircle} color="bg-red-100 text-red-600" />
      </div>

      <div className="flex items-center gap-1 bg-white border rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('leads')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'leads' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Automation Leads
        </button>
        <button
          onClick={() => setTab('settings')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'settings' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Settings size={14} /> Automation Settings
        </button>
      </div>

      {tab === 'settings' ? (
        <AutomationSettings />
      ) : (
      <div className="bg-white rounded-2xl border p-4 sm:p-6">
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
            <FilterDropdown value={stepFilter} options={STEP_OPTIONS} onChange={setStepFilter} />
          </div>
        </div>

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
                <tr key={lead.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-800">{lead.name}</td>
                  <td className="py-3 pr-4 text-gray-600">{lead.phone}</td>
                  <td className="py-3 pr-4 text-gray-600">{lead.step}</td>
                  <td className="py-3 pr-4"><StatusBadge status={lead.status} /></td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="text-brand-600 font-medium hover:text-brand-700 hover:underline"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => setChatLead(lead)}
                        title="View WhatsApp Chat"
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                      >
                        <MessageCircle size={16} />
                      </button>
                      <button
                        onClick={() => setCallLead(lead)}
                        title="Call Recordings"
                        className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
                      >
                        <PhoneCall size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLeads.length === 0 && <EmptyState message="No leads match your filters" />}
        </div>
      </div>
      )}

      <LeadDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onViewChat={(l) => { setSelectedLead(null); setChatLead(l); }}
        onViewCalls={(l) => { setSelectedLead(null); setCallLead(l); }}
      />
      <WhatsAppChatModal lead={chatLead} onClose={() => setChatLead(null)} />
      <CallRecordingModal lead={callLead} onClose={() => setCallLead(null)} />
    </div>
  );
};

export default LeadAutomationPage;
