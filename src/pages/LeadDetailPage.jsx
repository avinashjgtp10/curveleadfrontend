import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { leadAPI, aiAPI, whatsappAPI, quotationsAPI, templateAPI, stageAPI, brochuresAPI, staffAPI, followupAPI } from '../services/api';
import LeadNotes from '../components/lead/LeadNotes';
import LeadAttachments from '../components/lead/LeadAttachments';
import { ArrowLeft, Phone, MessageCircle, Mail, MapPin, Zap, Edit2, Save, X, Send, FileText, List, ExternalLink, Calendar, ChevronDown, PhoneCall, MessageSquare, Navigation, StickyNote, GitBranch, UserCheck, Share2, Star, PlusCircle, Paperclip, Radio, CheckCircle, ChevronLeft, ChevronRight, Video } from 'lucide-react';

const activityConfig = (type) => {
  const map = {
    call:                { Icon: PhoneCall,    bg: 'bg-blue-50',    color: 'text-blue-600' },
    whatsapp:            { Icon: MessageSquare,bg: 'bg-green-50',   color: 'text-green-600' },
    whatsapp_sent:       { Icon: MessageSquare,bg: 'bg-green-50',   color: 'text-green-600' },
    whatsapp_received:   { Icon: MessageSquare,bg: 'bg-green-50',   color: 'text-green-600' },
    visit:               { Icon: Navigation,   bg: 'bg-purple-50',  color: 'text-purple-600' },
    stage_change:        { Icon: GitBranch,    bg: 'bg-amber-50',   color: 'text-amber-600' },
    source_change:       { Icon: Radio,        bg: 'bg-sky-50',     color: 'text-sky-600' },
    note:                { Icon: StickyNote,   bg: 'bg-gray-50',    color: 'text-gray-500' },
    quotation:           { Icon: FileText,     bg: 'bg-indigo-50',  color: 'text-indigo-600' },
    followup_scheduled:  { Icon: Calendar,     bg: 'bg-cyan-50',    color: 'text-cyan-600' },
    demo:                { Icon: Video,        bg: 'bg-violet-50',  color: 'text-violet-600' },
    file_uploaded:       { Icon: Paperclip,    bg: 'bg-orange-50',  color: 'text-orange-600' },
    share_material:      { Icon: Share2,       bg: 'bg-teal-50',    color: 'text-teal-600' },
    enrolled:            { Icon: UserCheck,    bg: 'bg-green-50',   color: 'text-green-700' },
    lead_created:        { Icon: PlusCircle,   bg: 'bg-brand-50',   color: 'text-brand-600' },
    created:             { Icon: PlusCircle,   bg: 'bg-brand-50',   color: 'text-brand-600' },
    ai_scored:           { Icon: Star,         bg: 'bg-yellow-50',  color: 'text-yellow-600' },
  };
  return map[type] || { Icon: StickyNote, bg: 'bg-gray-50', color: 'text-gray-400' };
};

const scoreColors = {
  hot: 'bg-red-100 text-red-700',
  warm: 'bg-amber-100 text-amber-700',
  cold: 'bg-gray-100 text-gray-600',
};

const LeadDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [messages, setMessages] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [templates, setTemplates] = useState([]);
  const [showTmplPicker, setShowTmplPicker] = useState(false);
  const [tmplsLoaded, setTmplsLoaded] = useState(false);
  const [brochures, setBrochures] = useState([]);
  const [brochuresLoaded, setBrochuresLoaded] = useState(false);
  const [shareTab, setShareTab] = useState('templates');

  // Stages & Staff
  const [stages, setStages] = useState([]);
  const [stageSaving, setStageSaving] = useState(false);
  const [staff, setStaff] = useState([]);

  // Follow-up
  const [followups, setFollowups] = useState([]);
  const getLocalNow = () => { const d = new Date(); d.setSeconds(0, 0); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
  const [followupForm, setFollowupForm] = useState({
    next_followup_at: getLocalNow(),
    followup_type: 'call',
    notes: '',
  });
  const [savingFollowup, setSavingFollowup] = useState(false);

  // Follow-up history with pagination
  const [followupHistory, setFollowupHistory] = useState([]);
  const [followupPage, setFollowupPage] = useState(1);
  const [followupPagination, setFollowupPagination] = useState({ total: 0, pages: 1 });
  const [historyLoading, setHistoryLoading] = useState(false);
  const FOLLOWUP_LIMIT = 5;

  useEffect(() => { loadData(); loadStages(); loadTemplatesAndBrochures(); }, [id]);
  useEffect(() => { if (id) loadFollowupHistory(); }, [id, followupPage]);

  const loadTemplatesAndBrochures = async () => {
    try {
      const [tmplRes, brochRes] = await Promise.all([
        templateAPI.getAll().catch(() => ({ data: { templates: [] } })),
        brochuresAPI.getAll().catch(() => ({ data: { brochures: [] } })),
      ]);
      setTemplates(tmplRes.data.templates || []);
      setTmplsLoaded(true);
      setBrochures(brochRes.data.brochures || []);
      setBrochuresLoaded(true);
    } catch (e) { console.error(e); }
  };

  const loadData = async () => {
    try {
      const [leadRes, msgRes, quoteRes] = await Promise.all([
        leadAPI.getOne(id),
        whatsappAPI.getConversation(id).catch(() => ({ data: { messages: [] } })),
        quotationsAPI.getAll({ lead_id: id }).catch(() => ({ data: { quotations: [] } })),
      ]);
      setLead(leadRes.data.lead);
      setFollowups(leadRes.data.followups || []);
      setActivities(leadRes.data.activities || []);
      setMessages(msgRes.data.messages || []);
      setQuotations(quoteRes.data.quotations || []);
      setForm(leadRes.data.lead);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadStages = async () => {
    try {
      const { data } = await stageAPI.getAll();
      setStages(data.stages || []);
    } catch (e) { console.error(e); }
  };

  const loadStaff = async () => {
    if (staff.length > 0) return;
    try {
      const { data } = await staffAPI.getAll().catch(() => ({ data: { staff: [] } }));
      setStaff(data.staff || []);
    } catch (e) { console.error(e); }
  };

  const loadFollowupHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await followupAPI.getAll({ lead_id: id, status: 'all', page: followupPage, limit: FOLLOWUP_LIMIT });
      setFollowupHistory(data.followups || []);
      setFollowupPagination(data.pagination || { total: 0, pages: 1 });
    } catch (e) { console.error(e); }
    finally { setHistoryLoading(false); }
  };

  const handleSave = async () => {
    try {
      await leadAPI.update(id, form);
      setEditing(false);
      loadData();
    } catch (e) { alert('Failed to save'); }
  };

  const handleStageChange = async (newStage) => {
    setStageSaving(true);
    try {
      await leadAPI.update(id, { stage: newStage });
      setLead(prev => ({ ...prev, stage: newStage }));
    } catch (e) { alert('Failed to update stage'); }
    finally { setStageSaving(false); }
  };

  const handleScheduleFollowup = async () => {
    if (!followupForm.next_followup_at) return alert('Please pick a date and time');
    setSavingFollowup(true);
    try {
      await leadAPI.addFollowup(id, {
        ...followupForm,
        notes: followupForm.notes.trim() || null,
      });
      setFollowupForm({ next_followup_at: '', followup_type: 'call', notes: '' });
      setFollowupPage(1);
      loadData();
      loadFollowupHistory();
    } catch (e) { alert(e.response?.data?.error || 'Failed to schedule follow-up'); }
    finally { setSavingFollowup(false); }
  };

  const handleAIScore = async () => {
    try {
      await aiAPI.scoreLead(id);
      loadData();
    } catch (e) { alert('AI scoring failed'); }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await whatsappAPI.send(id, newMessage);
      setNewMessage('');
      loadData();
    } catch (e) { alert(e.response?.data?.error || 'Failed to send'); }
  };

  const handleOpenTmplPicker = async () => {
    if (!tmplsLoaded) {
      try {
        const { data } = await templateAPI.getAll();
        setTemplates(data.templates || []);
        setTmplsLoaded(true);
      } catch (e) { console.error(e); }
    }
    setShowTmplPicker(v => !v);
  };

  const handleSelectTemplate = async (tmpl) => {
    try {
      const { data } = await templateAPI.generate(tmpl.id, { lead_id: id });
      setNewMessage(data.message);
      setShowTmplPicker(false);
    } catch (e) { alert('Failed to generate message'); }
  };

  const handleSendTemplateWhatsApp = async (tmpl, e) => {
    e.stopPropagation();
    try {
      const { data } = await templateAPI.generate(tmpl.id, { lead_id: id });
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank');
        setShowTmplPicker(false);
      } else {
        alert('No phone number found for this lead');
      }
    } catch (e) { alert('Failed to generate message'); }
  };

  const handleShareBrochureWA = async (brochureId) => {
    try {
      const { data } = await brochuresAPI.shareWithLead(brochureId, id);
      window.open(data.whatsapp_url, '_blank');
      loadData();
    } catch (e) { alert(e.response?.data?.error || 'Failed to share brochure'); }
  };

  const nextFollowup = followups.find(f => !f.is_completed && f.next_followup_at);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  if (!lead) return <p>Lead not found</p>;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} /> Back
        </button>
        <button onClick={() => navigate(`/quotations/new?lead_id=${id}`)}
          className="px-3 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium flex items-center gap-1.5">
          <FileText size={14} /> New Quotation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lead Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0 pr-2">
                {editing ? (
                  <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Full name"
                    className="text-xl font-bold w-full border-b focus:outline-none focus:border-brand-500" />
                ) : <h2 className="text-xl font-bold truncate">{lead.name}</h2>}
                <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${scoreColors[lead.lead_score]}`}>
                  {lead.lead_score?.toUpperCase()}
                </span>
              </div>
              <div className="flex gap-1 shrink-0">
                {editing && (
                  <button onClick={() => { setEditing(false); setForm(lead); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400" title="Cancel">
                    <X size={16} />
                  </button>
                )}
                <button onClick={() => editing ? handleSave() : (setEditing(true), loadStaff())} className="p-2 hover:bg-gray-100 rounded-lg" title={editing ? 'Save' : 'Edit'}>
                  {editing ? <Save size={16} className="text-brand-600" /> : <Edit2 size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              {editing ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-500">Phone *</label>
                    <input type="tel" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full mt-0.5 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Email</label>
                    <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full mt-0.5 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">City</label>
                    <input value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })}
                      className="w-full mt-0.5 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Source</label>
                    <select value={form.source || 'manual'} onChange={e => setForm({ ...form, source: e.target.value })}
                      className="w-full mt-0.5 px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300">
                      <option value="manual">Manual</option>
                      <option value="meta_ads">Meta Ads</option>
                      <option value="google_ads">Google Ads</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="referral">Referral</option>
                      <option value="website">Website</option>
                      <option value="walkin">Walk-in</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Assign To</label>
                    <select value={form.assigned_to || ''} onChange={e => setForm({ ...form, assigned_to: e.target.value || null })}
                      className="w-full mt-0.5 px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300">
                      <option value="">Unassigned</option>
                      {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Deal Value (₹)</label>
                    <input type="number" min="0" value={form.deal_value || ''} onChange={e => setForm({ ...form, deal_value: e.target.value })}
                      placeholder="0"
                      className="w-full mt-0.5 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Notes</label>
                    <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })}
                      rows={2} className="w-full mt-0.5 px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-300" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400 shrink-0" />
                    <a href={`tel:${lead.phone}`} className="hover:text-brand-600">{lead.phone}</a>
                  </div>
                  {lead.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400 shrink-0" />
                      <a href={`mailto:${lead.email}`} className="hover:text-brand-600 truncate">{lead.email}</a>
                    </div>
                  )}
                  {lead.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400 shrink-0" />
                      <span>{lead.location}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">Source</p>
                    <p className="capitalize font-medium">{lead.source?.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">Assigned To</p>
                    {lead.assigned_to_name ? (
                      <p className="font-medium">{lead.assigned_to_name}</p>
                    ) : (
                      <button onClick={() => { setEditing(true); loadStaff(); }} className="text-xs text-cyan-600 hover:underline">Assign a staff member →</button>
                    )}
                  </div>
                </>
              )}

              {/* Stage Dropdown — always visible */}
              <div className={editing ? '' : 'pt-2 border-t'}>
                <p className="text-xs text-gray-500 mb-1">Stage</p>
                <div className="relative">
                  <select
                    value={(lead.stage || '').toLowerCase()}
                    onChange={e => handleStageChange(e.target.value)}
                    disabled={stageSaving}
                    className="w-full appearance-none px-3 py-2 border rounded-lg text-sm font-medium bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-brand-300 capitalize disabled:opacity-60">
                    {stages.length > 0
                      ? stages.map(s => <option key={s.id} value={s.name.toLowerCase()}>{s.name}</option>)
                      : <option value={(lead.stage || '').toLowerCase()}>{lead.stage || 'Select stage'}</option>
                    }
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {lead.score_reason && (
                <div>
                  <p className="text-xs text-gray-500">AI Reason</p>
                  <p className="text-xs">{lead.score_reason}</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <a href={`tel:${lead.phone}`} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium text-center flex items-center justify-center gap-1"><Phone size={14} /> Call</a>
              <a href={`https://wa.me/${lead.phone}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium text-center flex items-center justify-center gap-1"><MessageCircle size={14} /> WhatsApp</a>
            </div>

            <button onClick={handleAIScore} className="mt-2 w-full py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium flex items-center justify-center gap-1">
              <Zap size={14} /> Re-score with AI
            </button>
          </div>

          {/* Schedule Follow-up */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <Calendar size={16} /> Schedule Follow-up
            </h3>

            {nextFollowup && (
              <div className={`mb-3 px-3 py-2 rounded-lg border ${nextFollowup.followup_type === 'demo' ? 'bg-violet-50 border-violet-200' : 'bg-amber-50 border-amber-200'}`}>
                <p className={`text-xs font-medium ${nextFollowup.followup_type === 'demo' ? 'text-violet-700' : 'text-amber-700'}`}>
                  {nextFollowup.followup_type === 'demo' ? '🎥 Demo scheduled:' : 'Next scheduled:'}
                </p>
                <p className={`text-xs mt-0.5 ${nextFollowup.followup_type === 'demo' ? 'text-violet-600' : 'text-amber-600'}`}>
                  {new Date(nextFollowup.next_followup_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  {' '}· <span className="capitalize">{nextFollowup.followup_type}</span>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={followupForm.next_followup_at}
                  onChange={e => setFollowupForm({ ...followupForm, next_followup_at: e.target.value })}
                  min={getLocalNow()}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <div className="flex gap-2">
                  {['call', 'whatsapp', 'visit', 'demo'].map(t => (
                    <button key={t} onClick={() => setFollowupForm({ ...followupForm, followup_type: t })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors ${followupForm.followup_type === t ? (t === 'demo' ? 'bg-violet-600 text-white border-violet-600' : 'bg-brand-600 text-white border-brand-600') : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                      {t === 'demo' ? '🎥 Demo' : t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={followupForm.notes}
                  onChange={e => setFollowupForm({ ...followupForm, notes: e.target.value })}
                  placeholder="e.g. Discuss pricing"
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>

              <button onClick={handleScheduleFollowup} disabled={savingFollowup}
                className="w-full py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-60">
                {savingFollowup ? 'Saving...' : 'Schedule Follow-up'}
              </button>
            </div>
          </div>

          {/* Follow-up History */}
          {(followupHistory.length > 0 || historyLoading) && (
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <Calendar size={16} /> Follow-up History
                <span className="ml-auto text-xs text-gray-400 font-normal">{followupPagination.total} total</span>
              </h3>

              {historyLoading ? (
                <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
              ) : (
                <div className="space-y-2">
                  {followupHistory.map(f => (
                    <div key={f.id} className={`p-2.5 rounded-xl border ${f.is_completed ? 'bg-gray-50' : 'bg-white'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {f.is_completed
                            ? <CheckCircle size={13} className="text-green-500 shrink-0" />
                            : <Calendar size={13} className="text-cyan-500 shrink-0" />
                          }
                          <span className={`text-xs font-medium capitalize ${f.is_completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                            {f.followup_type}
                          </span>
                        </div>
                        {!f.is_completed && (
                          <button
                            onClick={async () => { await followupAPI.complete(f.id, { outcome: 'Done' }); setFollowupPage(1); loadFollowupHistory(); loadData(); }}
                            className="shrink-0 text-[10px] px-2 py-0.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100">
                            Done
                          </button>
                        )}
                      </div>
                      {f.notes && <p className="text-xs text-gray-500 mt-1 truncate">{f.notes}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(f.next_followup_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {followupPagination.pages > 1 && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="text-[10px] text-gray-400">
                    {(followupPage - 1) * FOLLOWUP_LIMIT + 1}–{Math.min(followupPage * FOLLOWUP_LIMIT, followupPagination.total)} of {followupPagination.total}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setFollowupPage(p => p - 1)} disabled={followupPage === 1}
                      className="p-1 rounded border hover:bg-gray-50 disabled:opacity-40"><ChevronLeft size={13} /></button>
                    <span className="text-xs px-1">{followupPage} / {followupPagination.pages}</span>
                    <button onClick={() => setFollowupPage(p => p + 1)} disabled={followupPage === followupPagination.pages}
                      className="p-1 rounded border hover:bg-gray-50 disabled:opacity-40"><ChevronRight size={13} /></button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Share Materials */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <Share2 size={16} /> Share Materials
            </h3>
            <div className="flex gap-1 mb-3">
              {['templates', 'brochures'].map(tab => (
                <button key={tab} onClick={() => setShareTab(tab)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors ${shareTab === tab ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5">
              {shareTab === 'templates' ? (
                !tmplsLoaded ? (
                  <p className="text-xs text-gray-400 text-center py-3">Loading...</p>
                ) : templates.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">No templates. Create them in Settings → Templates.</p>
                ) : templates.map(t => (
                  <div key={t.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{t.name}</p>
                      <p className="text-[11px] text-gray-400 capitalize">{t.category?.replace(/_/g, ' ')}</p>
                    </div>
                    <button onClick={(e) => handleSendTemplateWhatsApp(t, e)}
                      className="shrink-0 px-2.5 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-medium flex items-center gap-1">
                      <MessageCircle size={11} /> Send
                    </button>
                  </div>
                ))
              ) : (
                !brochuresLoaded ? (
                  <p className="text-xs text-gray-400 text-center py-3">Loading...</p>
                ) : brochures.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">No brochures. Upload in Brochures page.</p>
                ) : brochures.map(b => (
                  <div key={b.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{b.name}</p>
                      <p className="text-[11px] text-gray-400 capitalize">{b.category}</p>
                    </div>
                    <button onClick={() => handleShareBrochureWA(b.id)}
                      className="shrink-0 px-2.5 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-medium flex items-center gap-1">
                      <MessageCircle size={11} /> Send
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quotations */}
          {quotations.length > 0 && (
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText size={16} /> Quotations ({quotations.length})
              </h3>
              <div className="space-y-2">
                {quotations.map(q => (
                  <button key={q.id} onClick={() => navigate(`/quotations/${q.id}`)}
                    className="w-full text-left p-2.5 hover:bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono">{q.quote_number}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                        q.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        q.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                        q.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>{q.status?.toUpperCase()}</span>
                    </div>
                    <p className="text-sm font-bold text-brand-600 mt-1">₹{parseFloat(q.total).toLocaleString('en-IN')}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* WhatsApp Conversation */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><MessageCircle size={18} /> WhatsApp Conversation</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto mb-3">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No messages yet</p>
              ) : messages.map(m => (
                <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${m.direction === 'outbound' ? 'bg-brand-600 text-white' : 'bg-gray-100'}`}>
                    <p>{m.message}</p>
                    <p className={`text-[10px] mt-1 ${m.direction === 'outbound' ? 'text-white/70' : 'text-gray-400'}`}>
                      {new Date(m.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {showTmplPicker && (
              <div className="mb-2 border rounded-xl overflow-hidden shadow-sm">
                {templates.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-3">No templates yet. Create them in Settings → Templates.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto divide-y">
                    {templates.map(t => (
                      <div key={t.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors">
                        <button onClick={() => handleSelectTemplate(t)} className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{t.name}</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 capitalize">{t.category.replace(/_/g, ' ')}</span>
                          </div>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{t.message}</p>
                        </button>
                        <button onClick={(e) => handleSendTemplateWhatsApp(t, e)}
                          title="Open in WhatsApp"
                          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-medium transition-colors">
                          <ExternalLink size={12} /> WA
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm" />
              <button onClick={handleOpenTmplPicker}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 border transition-colors whitespace-nowrap ${showTmplPicker ? 'bg-brand-50 text-brand-600 border-brand-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'}`}>
                <List size={14} /> Templates
              </button>
              <button onClick={handleSendMessage} className="px-4 py-2 bg-brand-600 text-white rounded-lg"><Send size={16} /></button>
            </div>
          </div>

          {/* Notes */}
          <LeadNotes leadId={id} onActivityAdded={loadData} />

          {/* Attachments */}
          <LeadAttachments leadId={id} onActivityAdded={loadData} />

          {/* Activity Timeline */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-4">Activity Timeline</h3>
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No activity yet</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />
                <div className="space-y-4">
                  {activities.map(a => {
                    const cfg = activityConfig(a.activity_type);
                    return (
                      <div key={a.id} className="flex gap-3 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${cfg.bg}`}>
                          <cfg.Icon size={14} className={cfg.color} />
                        </div>
                        <div className="flex-1 pt-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{a.title}</p>
                            {a.created_by_name && (
                              <span className="text-[10px] text-gray-400">by {a.created_by_name}</span>
                            )}
                          </div>
                          {a.description && <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>}
                          {a.old_value && a.new_value && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              <span className="line-through">{a.old_value}</span>
                              {' → '}
                              <span className="font-medium text-brand-600">{a.new_value}</span>
                            </p>
                          )}
                          {a.whatsapp_message && (
                            <p className="text-xs text-gray-500 mt-1 bg-green-50 px-2 py-1 rounded-lg italic">"{a.whatsapp_message}"</p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(a.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default LeadDetailPage;
