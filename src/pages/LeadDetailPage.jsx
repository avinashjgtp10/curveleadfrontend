import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leadAPI } from '../services/api';
import {
  ArrowLeft, Phone, MessageCircle, Clock, MapPin, BookOpen,
  Plus, X, PhoneCall, MessageSquare, Eye, Calendar,
  AlertCircle, ArrowRight, Send
} from 'lucide-react';

const activityIcons = {
  created: { icon: Plus, color: 'bg-green-500' },
  call: { icon: PhoneCall, color: 'bg-blue-500' },
  whatsapp: { icon: MessageCircle, color: 'bg-emerald-500' },
  visit: { icon: Eye, color: 'bg-purple-500' },
  note: { icon: MessageSquare, color: 'bg-gray-500' },
  stage_change: { icon: ArrowRight, color: 'bg-amber-500' },
  followup_set: { icon: Calendar, color: 'bg-indigo-500' },
};

const stageColors = {
  new: 'bg-blue-100 text-blue-700 border-blue-200',
  contacted: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  interested: 'bg-purple-100 text-purple-700 border-purple-200',
  enrolled: 'bg-green-100 text-green-700 border-green-200',
  dropped: 'bg-red-100 text-red-700 border-red-200',
};

const stages = ['new', 'contacted', 'interested', 'enrolled', 'dropped'];

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const LeadDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [showQuickNote, setShowQuickNote] = useState(false);

  useEffect(() => { loadJourney(); }, [id]);

  const loadJourney = async () => {
    setLoading(true);
    try {
      const { data } = await leadAPI.getJourney(id);
      setLead(data.lead);
      setActivities(data.activities || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleStageChange = async (newStage) => {
    try {
      await leadAPI.update(id, { stage: newStage });
      loadJourney();
    } catch (err) { console.error(err); }
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
        <AlertCircle className="mx-auto mb-3 text-gray-300" size={40} />
        <p className="text-gray-500">Lead not found</p>
        <button onClick={() => navigate(-1)} className="mt-3 text-brand-600 font-medium">Back to Leads</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{lead.name}</h1>
          <p className="text-sm text-gray-500">Lead Journey</p>
        </div>
      </div>

      {/* Lead Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Phone size={16} />
              <a href={`tel:${lead.phone}`} className="hover:text-brand-600 font-medium">{lead.phone}</a>
            </div>
            {lead.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Send size={16} /><span>{lead.email}</span>
              </div>
            )}
            {lead.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={16} /><span>{lead.location}</span>
              </div>
            )}
            {lead.course_name && (
              <div className="flex items-center gap-2 text-gray-600">
                <BookOpen size={16} /><span>{lead.course_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Clock size={14} />
              <span>Source: {lead.source.replace(/_/g, ' ')} &bull; Created {timeAgo(lead.created_at)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <a href={`tel:${lead.phone}`}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100">
                <Phone size={16} /> Call
              </a>
              <a href={`https://wa.me/91${lead.phone.replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100">
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
            <button onClick={() => setShowFollowupForm(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
              <Plus size={16} /> Add Follow-up
            </button>
          </div>
        </div>

        {/* Stage Pipeline */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wide">Pipeline Stage</p>
          <div className="flex gap-1.5 flex-wrap">
            {stages.map((s, i) => {
              const isActive = s === lead.stage;
              const isPast = stages.indexOf(lead.stage) > i;
              return (
                <button key={s} onClick={() => handleStageChange(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition capitalize
                    ${isActive ? stageColors[s] : isPast ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}
                  `}>
                  {isActive && <span className="mr-1">&#9679;</span>}{s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex gap-2">
        <button onClick={() => setShowQuickNote(true)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <MessageSquare size={16} /> Quick Note
        </button>
        <button onClick={() => { setShowFollowupForm(true); }}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <PhoneCall size={16} /> Log Call
        </button>
      </div>

      {/* Quick Note Form */}
      {showQuickNote && (
        <QuickNoteForm leadId={id}
          onClose={() => setShowQuickNote(false)}
          onSaved={() => { setShowQuickNote(false); loadJourney(); }}
        />
      )}

      {/* Follow-up Form */}
      {showFollowupForm && (
        <FollowupForm leadId={id}
          onClose={() => setShowFollowupForm(false)}
          onSaved={() => { setShowFollowupForm(false); loadJourney(); }}
        />
      )}

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-5">Journey Timeline ({activities.length})</h3>

        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Clock size={32} className="mx-auto mb-2" />
            <p>No activities yet. Add a follow-up to start the journey.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-200" />
            <div className="space-y-0">
              {activities.map((activity) => {
                const config = activityIcons[activity.activity_type] || activityIcons.note;
                const Icon = config.icon;
                return (
                  <div key={activity.id} className="relative flex gap-4 pb-6 last:pb-0">
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white ${config.color} shrink-0`}>
                      <Icon size={16} className="text-white" />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{activity.title}</p>
                          {activity.description && (
                            <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>
                          )}
                          {activity.whatsapp_log && (
                            <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-800">
                              <span className="font-medium text-xs text-emerald-600 block mb-1">WhatsApp Log:</span>
                              {activity.whatsapp_log}
                            </div>
                          )}
                          {activity.old_value && activity.new_value && (
                            <div className="mt-1.5 flex items-center gap-2 text-xs">
                              <span className={`px-2 py-0.5 rounded-full ${stageColors[activity.old_value] || 'bg-gray-100 text-gray-600'}`}>
                                {activity.old_value}
                              </span>
                              <ArrowRight size={12} className="text-gray-400" />
                              <span className={`px-2 py-0.5 rounded-full ${stageColors[activity.new_value] || 'bg-gray-100 text-gray-600'}`}>
                                {activity.new_value}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-400">{timeAgo(activity.created_at)}</p>
                          {activity.created_by_name && (
                            <p className="text-xs text-gray-400 mt-0.5">by {activity.created_by_name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const QuickNoteForm = ({ leadId, onClose, onSaved }) => {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setLoading(true);
    try {
      await leadAPI.addActivity(leadId, { activity_type: 'note', title: 'Note added', description: note });
      onSaved();
    } catch (err) { alert('Failed to save note.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="Type a quick note..." autoFocus
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
        <button type="submit" disabled={loading}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">Save</button>
        <button type="button" onClick={onClose}
          className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"><X size={16} /></button>
      </form>
    </div>
  );
};

const FollowupForm = ({ leadId, onClose, onSaved }) => {
  const [form, setForm] = useState({
    notes: '', followup_type: 'call', outcome: '', next_followup_at: '', whatsapp_log: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.notes.trim()) return;
    setLoading(true);
    try {
      await leadAPI.addFollowup(leadId, form);
      onSaved();
    } catch (err) { alert(err.response?.data?.error || 'Failed to add follow-up.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Add Follow-up</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.followup_type} onChange={e => setForm({ ...form, followup_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="call">Phone Call</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="visit">Visit</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
            <select value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="">Select...</option>
              <option value="not_picked">Not Picked</option>
              <option value="interested">Interested</option>
              <option value="callback">Call Back Later</option>
              <option value="visited">Visited</option>
              <option value="not_interested">Not Interested</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes *</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
            placeholder="What happened..." required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Log</label>
          <textarea value={form.whatsapp_log} onChange={e => setForm({ ...form, whatsapp_log: e.target.value })}
            rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
            placeholder="Paste WhatsApp conversation summary..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up Date</label>
          <input type="datetime-local" value={form.next_followup_at}
            onChange={e => setForm({ ...form, next_followup_at: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading}
            className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Follow-up'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeadDetailPage;
