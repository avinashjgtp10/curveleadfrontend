import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leadAPI, templateAPI } from '../services/api';
import {
  ArrowLeft, Phone, MessageCircle, MapPin, BookOpen, Clock,
  PhoneCall, PhoneOff, PhoneMissed, Send, FileText, Eye,
  ChevronDown, ChevronUp, X, Calendar, User, ArrowRightCircle,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

const activityIcons = {
  call: PhoneCall,
  whatsapp_sent: Send,
  whatsapp_received: MessageCircle,
  visit: MapPin,
  note: FileText,
  stage_change: ArrowRightCircle,
  followup_scheduled: Clock,
};

const activityColors = {
  call: 'bg-green-100 text-green-600 border-green-200',
  whatsapp_sent: 'bg-emerald-100 text-emerald-600 border-emerald-200',
  whatsapp_received: 'bg-teal-100 text-teal-600 border-teal-200',
  visit: 'bg-purple-100 text-purple-600 border-purple-200',
  note: 'bg-gray-100 text-gray-600 border-gray-200',
  stage_change: 'bg-blue-100 text-blue-600 border-blue-200',
  followup_scheduled: 'bg-amber-100 text-amber-600 border-amber-200',
};

const stageColors = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  interested: 'bg-purple-100 text-purple-700',
  enrolled: 'bg-green-100 text-green-700',
  dropped: 'bg-red-100 text-red-700',
};

const LeadJourneyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // 'call', 'whatsapp', 'visit', 'note'

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const { data } = await leadAPI.getActivities(id);
      setLead(data.lead);
      setActivities(data.activities);
    } catch (error) {
      console.error('Load journey error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Lead not found.</p>
        <button onClick={() => navigate('/leads')} className="mt-3 text-brand-600 font-medium">
          ← Back to Leads
        </button>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back button */}
      <button
        onClick={() => navigate('/leads')}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> Back to Leads
      </button>

      {/* Lead Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-brand-700 font-bold text-xl">
              {lead.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{lead.name}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Phone size={14} /> {lead.phone}</span>
                  {lead.location && <span className="flex items-center gap-1"><MapPin size={14} /> {lead.location}</span>}
                  {lead.course_name && <span className="flex items-center gap-1"><BookOpen size={14} /> {lead.course_name}</span>}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize shrink-0 ${stageColors[lead.stage]}`}>
                {lead.stage}
              </span>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
              <span>Source: {lead.source?.replace(/_/g, ' ')}</span>
              <span>Created: {new Date(lead.created_at).toLocaleDateString('en-IN')}</span>
              {lead.assigned_to_name && <span>Assigned: {lead.assigned_to_name}</span>}
            </div>
          </div>
        </div>

        {/* Quick Contact */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <a href={`tel:${lead.phone}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition">
            <Phone size={16} /> Call
          </a>
          <button onClick={() => setActiveModal('template')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition">
            <MessageCircle size={16} /> Send Template
          </button>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <button onClick={() => setActiveModal('call')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-green-300 hover:bg-green-50 transition">
          <PhoneCall size={18} className="text-green-600" /> Log Call
        </button>
        <button onClick={() => setActiveModal('whatsapp')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 transition">
          <Send size={18} className="text-emerald-600" /> Log WhatsApp
        </button>
        <button onClick={() => setActiveModal('visit')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-purple-300 hover:bg-purple-50 transition">
          <MapPin size={18} className="text-purple-600" /> Log Visit
        </button>
        <button onClick={() => setActiveModal('note')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition">
          <FileText size={18} className="text-gray-600" /> Add Note
        </button>
        <button onClick={() => setActiveModal('template')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-green-300 hover:bg-green-50 transition">
          <MessageCircle size={18} className="text-green-600" /> Template
        </button>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Journey Timeline
          <span className="text-sm font-normal text-gray-400 ml-2">({activities.length} activities)</span>
        </h2>

        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Clock size={36} className="mx-auto mb-2 opacity-50" />
            <p className="font-medium">No activities yet</p>
            <p className="text-sm mt-1">Start by logging a call or sending a WhatsApp message</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-4">
              {activities.map((activity, index) => {
                const Icon = activityIcons[activity.activity_type] || FileText;
                const color = activityColors[activity.activity_type] || activityColors.note;

                return (
                  <div key={activity.id} className="relative flex gap-4 pl-0">
                    {/* Icon */}
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 ${color}`}>
                      <Icon size={16} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{activity.title}</p>
                          {activity.created_by_name && (
                            <p className="text-xs text-gray-400 mt-0.5">by {activity.created_by_name}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-400">{formatDate(activity.created_at)}</p>
                          <p className="text-xs text-gray-300">{formatTime(activity.created_at)}</p>
                        </div>
                      </div>

                      {/* Details */}
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1.5 bg-gray-50 p-2.5 rounded-lg">
                          {activity.description}
                        </p>
                      )}

                      {/* Call details */}
                      {activity.call_duration && (
                        <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
                          <span>Duration: {activity.call_duration}</span>
                          {activity.call_outcome && <span>Outcome: {activity.call_outcome.replace(/_/g, ' ')}</span>}
                        </div>
                      )}

                      {/* WhatsApp message */}
                      {activity.whatsapp_message && (
                        <div className="mt-1.5 p-2.5 bg-green-50 rounded-lg text-sm text-gray-700 border-l-3 border-green-400">
                          {activity.whatsapp_message}
                        </div>
                      )}

                      {/* Stage change */}
                      {activity.activity_type === 'stage_change' && activity.old_value && (
                        <div className="flex items-center gap-2 mt-1.5 text-sm">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageColors[activity.old_value] || ''}`}>
                            {activity.old_value}
                          </span>
                          <ArrowRightCircle size={14} className="text-gray-400" />
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageColors[activity.new_value] || ''}`}>
                            {activity.new_value}
                          </span>
                        </div>
                      )}

                      {/* Next action */}
                      {activity.next_action && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-amber-50 rounded-lg text-xs text-amber-700">
                          <Clock size={13} />
                          <span className="font-medium">Next: {activity.next_action}</span>
                          {activity.next_action_date && (
                            <span className="text-amber-500">
                              — {new Date(activity.next_action_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {activeModal === 'call' && (
        <LogCallModal leadId={id} onClose={() => setActiveModal(null)} onSaved={() => { setActiveModal(null); loadData(); }} />
      )}
      {activeModal === 'whatsapp' && (
        <LogWhatsAppModal leadId={id} onClose={() => setActiveModal(null)} onSaved={() => { setActiveModal(null); loadData(); }} />
      )}
      {activeModal === 'visit' && (
        <LogVisitModal leadId={id} onClose={() => setActiveModal(null)} onSaved={() => { setActiveModal(null); loadData(); }} />
      )}
      {activeModal === 'note' && (
        <LogNoteModal leadId={id} onClose={() => setActiveModal(null)} onSaved={() => { setActiveModal(null); loadData(); }} />
      )}
      {activeModal === 'template' && (
        <SendTemplateModal lead={lead} leadId={id} onClose={() => setActiveModal(null)} onSent={() => { setActiveModal(null); loadData(); }} />
      )}
    </div>
  );
};

// =========== MODALS ===========

const Modal = ({ children, title, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div className="fixed inset-0 bg-black/50" onClick={onClose} />
    <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl">
      <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);

// Log Call Modal
const LogCallModal = ({ leadId, onClose, onSaved }) => {
  const [form, setForm] = useState({ outcome: 'connected', duration: '', notes: '', next_action: '', next_action_date: '' });
  const [loading, setLoading] = useState(false);

  const outcomes = [
    { value: 'connected', label: 'Connected', icon: PhoneCall, color: 'text-green-600 bg-green-50 border-green-200' },
    { value: 'not_picked', label: 'Not Picked', icon: PhoneMissed, color: 'text-red-600 bg-red-50 border-red-200' },
    { value: 'busy', label: 'Busy', icon: PhoneOff, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { value: 'switched_off', label: 'Switched Off', icon: XCircle, color: 'text-gray-600 bg-gray-50 border-gray-200' },
    { value: 'wrong_number', label: 'Wrong Number', icon: AlertCircle, color: 'text-red-600 bg-red-50 border-red-200' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await leadAPI.logCall(leadId, form);
      onSaved();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Log Phone Call" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Outcome selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Call Outcome</label>
          <div className="grid grid-cols-2 gap-2">
            {outcomes.map(o => (
              <button key={o.value} type="button"
                onClick={() => setForm({ ...form, outcome: o.value })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition ${
                  form.outcome === o.value ? o.color + ' border-current ring-2 ring-current/20' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                <o.icon size={16} /> {o.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
          <input type="text" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
            placeholder="e.g. 2 min" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={3} placeholder="What was discussed..." className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Next Action</label>
          <input type="text" value={form.next_action} onChange={e => setForm({ ...form, next_action: e.target.value })}
            placeholder="e.g. Call again tomorrow, Send brochure" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Next Action Date</label>
          <input type="datetime-local" value={form.next_action_date} onChange={e => setForm({ ...form, next_action_date: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
          {loading ? 'Saving...' : 'Log Call'}
        </button>
      </form>
    </Modal>
  );
};

// Log WhatsApp Modal
const LogWhatsAppModal = ({ leadId, onClose, onSaved }) => {
  const [form, setForm] = useState({ direction: 'sent', message: '', notes: '', next_action: '', next_action_date: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await leadAPI.logWhatsApp(leadId, form);
      onSaved();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Log WhatsApp" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
          <div className="grid grid-cols-2 gap-2">
            {[{ value: 'sent', label: 'Message Sent' }, { value: 'received', label: 'Message Received' }].map(d => (
              <button key={d.value} type="button"
                onClick={() => setForm({ ...form, direction: d.value })}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition ${
                  form.direction === d.value ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-100' : 'bg-white border-gray-200'
                }`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
            rows={3} placeholder="Paste or type the WhatsApp message..." className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={2} placeholder="Any additional context..." className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Next Action</label>
          <input type="text" value={form.next_action} onChange={e => setForm({ ...form, next_action: e.target.value })}
            placeholder="e.g. Wait for reply, Follow up call" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Next Action Date</label>
          <input type="datetime-local" value={form.next_action_date} onChange={e => setForm({ ...form, next_action_date: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
          {loading ? 'Saving...' : 'Log WhatsApp'}
        </button>
      </form>
    </Modal>
  );
};

// Log Visit Modal
const LogVisitModal = ({ leadId, onClose, onSaved }) => {
  const [form, setForm] = useState({ outcome: 'visited', notes: '', next_action: '', next_action_date: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await leadAPI.logVisit(leadId, form);
      onSaved();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Log Visit" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Visit Outcome</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'visited', label: 'Visited Academy' },
              { value: 'enrolled', label: 'Visited & Enrolled' },
              { value: 'not_interested', label: 'Not Interested' },
              { value: 'will_return', label: 'Will Come Back' },
            ].map(o => (
              <button key={o.value} type="button"
                onClick={() => setForm({ ...form, outcome: o.value })}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition ${
                  form.outcome === o.value ? 'bg-purple-50 text-purple-700 border-purple-300 ring-2 ring-purple-100' : 'bg-white border-gray-200'
                }`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={3} placeholder="What happened during the visit..." className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Next Action</label>
          <input type="text" value={form.next_action} onChange={e => setForm({ ...form, next_action: e.target.value })}
            placeholder="e.g. Send fee details, Schedule demo" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Next Action Date</label>
          <input type="datetime-local" value={form.next_action_date} onChange={e => setForm({ ...form, next_action_date: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50">
          {loading ? 'Saving...' : 'Log Visit'}
        </button>
      </form>
    </Modal>
  );
};

// Log Note Modal
const LogNoteModal = ({ leadId, onClose, onSaved }) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await leadAPI.logNote(leadId, { notes });
      onSaved();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Add Note" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            rows={4} placeholder="Write your note about this lead..." className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none" required />
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
          {loading ? 'Saving...' : 'Save Note'}
        </button>
      </form>
    </Modal>
  );
};

// Send Template Modal
const SendTemplateModal = ({ lead, leadId, onClose, onSent }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => { loadTemplates(); }, [filter]);

  const loadTemplates = async () => {
    try {
      const { data } = await templateAPI.getAll(filter || undefined);
      setTemplates(data.templates);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const selectTemplate = async (template) => {
    setSelectedTemplate(template);
    try {
      const { data } = await templateAPI.generate(template.id, { lead_id: leadId });
      setGeneratedMessage(data.message);
      setWhatsappUrl(data.whatsappUrl);
    } catch (e) {
      console.error(e);
      setGeneratedMessage(template.message);
    }
  };

  const sendAndLog = async () => {
    if (!whatsappUrl) return;
    setSending(true);
    try {
      // Log as WhatsApp activity
      await leadAPI.logWhatsApp(leadId, {
        direction: 'sent',
        message: generatedMessage,
        notes: `Sent template: ${selectedTemplate.name}`,
      });
      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
      onSent();
    } catch (e) { alert('Failed to log'); }
    finally { setSending(false); }
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(generatedMessage);
    alert('Message copied!');
  };

  const categoryColors = {
    welcome: 'bg-green-100 text-green-700', followup: 'bg-blue-100 text-blue-700',
    fee_reminder: 'bg-red-100 text-red-700', course_info: 'bg-purple-100 text-purple-700',
    custom: 'bg-gray-100 text-gray-700',
  };

  return (
    <Modal onClose={onClose} title="Send Template Message">
      <div className="space-y-4">
        {/* Lead info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center">
            <span className="text-brand-700 font-bold text-sm">{lead.name?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{lead.name}</p>
            <p className="text-xs text-gray-500">{lead.phone} {lead.course_name ? `• ${lead.course_name}` : ''}</p>
          </div>
        </div>

        {!selectedTemplate ? (
          /* Template List */
          <>
            <div className="flex gap-2">
              <select value={filter} onChange={e => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white flex-1">
                <option value="">All Templates</option>
                <option value="welcome">Welcome</option>
                <option value="followup">Follow-up</option>
                <option value="fee_reminder">Fee Reminder</option>
                <option value="course_info">Course Info</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-20"><div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
            ) : templates.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">No templates found. Create templates from the Templates page.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {templates.map(t => (
                  <button key={t.id} onClick={() => selectTemplate(t)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-900">{t.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${categoryColors[t.category] || categoryColors.custom}`}>
                        {t.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{t.message}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Preview & Send */
          <>
            <button onClick={() => setSelectedTemplate(null)}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium">← Choose different template</button>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">{selectedTemplate.name}</p>
              {/* WhatsApp style bubble */}
              <div className="bg-[#DCF8C6] rounded-lg rounded-tl-none p-3 text-sm text-gray-800 shadow-sm whitespace-pre-wrap">
                {generatedMessage}
                <p className="text-right text-xs text-gray-500 mt-2">
                  {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ✓✓
                </p>
              </div>
            </div>

            {/* Edit message */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Edit message (optional)</label>
              <textarea value={generatedMessage} onChange={e => {
                setGeneratedMessage(e.target.value);
                const phone = lead.phone?.replace(/\D/g, '').slice(-10);
                setWhatsappUrl(phone ? `https://wa.me/91${phone}?text=${encodeURIComponent(e.target.value)}` : '');
              }}
                rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
            </div>

            <div className="flex gap-2">
              <button onClick={copyMessage}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                <FileText size={16} /> Copy
              </button>
              <button onClick={sendAndLog} disabled={sending}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                <Send size={16} /> {sending ? 'Sending...' : 'Send WhatsApp'}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">Opens WhatsApp with pre-filled message + logs activity automatically</p>
          </>
        )}
      </div>
    </Modal>
  );
};

export default LeadJourneyPage;
