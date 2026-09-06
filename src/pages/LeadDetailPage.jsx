import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { leadAPI, aiAPI, whatsappAPI, quotationsAPI, templateAPI, stageAPI, statusAPI, brochuresAPI, staffAPI, followupAPI } from '../services/api';
import LeadNotes from '../components/lead/LeadNotes';
import LeadAttachments from '../components/lead/LeadAttachments';
import LeadRecordings from '../components/lead/LeadRecordings';
import LeadAiCalls from '../components/lead/LeadAiCalls';
import LeadIntentCard from '../components/lead/LeadIntentCard';
import { ArrowLeft, Phone, MessageCircle, Mail, MapPin, Zap, Edit2, X, Send, FileText, List, ExternalLink, Calendar, ChevronDown, PhoneCall, MessageSquare, Navigation, StickyNote, GitBranch, UserCheck, Share2, Star, PlusCircle, Paperclip, Radio, CheckCircle, ChevronLeft, ChevronRight, Video, Gauge, Building2 } from 'lucide-react';

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
    demo_scheduled:      { Icon: Video,        bg: 'bg-violet-50',  color: 'text-violet-600' },
    demo_completed:      { Icon: CheckCircle,  bg: 'bg-green-50',   color: 'text-green-600' },
    demo_cancelled:      { Icon: X,            bg: 'bg-red-50',     color: 'text-red-500' },
    followup_completed:  { Icon: CheckCircle,  bg: 'bg-green-50',   color: 'text-green-600' },
    followup_cancelled:  { Icon: X,            bg: 'bg-gray-50',    color: 'text-gray-400' },
    file_uploaded:       { Icon: Paperclip,    bg: 'bg-orange-50',  color: 'text-orange-600' },
    share_material:      { Icon: Share2,       bg: 'bg-teal-50',    color: 'text-teal-600' },
    enrolled:            { Icon: UserCheck,    bg: 'bg-green-50',   color: 'text-green-700' },
    lead_created:        { Icon: PlusCircle,   bg: 'bg-brand-50',   color: 'text-brand-600' },
    created:             { Icon: PlusCircle,   bg: 'bg-brand-50',   color: 'text-brand-600' },
    ai_scored:           { Icon: Star,         bg: 'bg-yellow-50',  color: 'text-yellow-600' },
    score_change:        { Icon: Gauge,        bg: 'bg-yellow-50',  color: 'text-yellow-600' },
  };
  return map[type] || { Icon: StickyNote, bg: 'bg-gray-50', color: 'text-gray-400' };
};

const formatDuration = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / (86400 * 30))}mo`;
};

const scoreColors = {
  hot: 'bg-red-100 text-red-700',
  warm: 'bg-amber-100 text-amber-700',
  cold: 'bg-gray-100 text-gray-600',
};

const LeadDetailPage = ({ leadId, onClose, onPrev, onNext, hasPrev, hasNext } = {}) => {
  const { id: routeId } = useParams();
  const id = leadId || routeId;
  const navigate = useNavigate();
  const location = useLocation();
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [messages, setMessages] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState(null);
  const [fieldDraft, setFieldDraft] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [templates, setTemplates] = useState([]);
  const [showTmplPicker, setShowTmplPicker] = useState(false);
  const [showQuickResponse, setShowQuickResponse] = useState(false);
  const [tmplsLoaded, setTmplsLoaded] = useState(false);
  const [brochures, setBrochures] = useState([]);
  const [brochuresLoaded, setBrochuresLoaded] = useState(false);
  const [shareTab, setShareTab] = useState('templates');
  const [activeTab, setActiveTab] = useState('overview');

  // Stages, Statuses & Staff
  const [stages, setStages] = useState([]);
  const [stageSaving, setStageSaving] = useState(false);
  const [lostReasonModal, setLostReasonModal] = useState({ open: false, newStage: null, reason: '', customReason: '' });
  const closeLostModal = () => setLostReasonModal({ open: false, newStage: null, reason: '', customReason: '' });
  const [stageStatuses, setStageStatuses] = useState({});
  const [allStatuses, setAllStatuses] = useState([]);
  const [staff, setStaff] = useState([]);

  // Follow-up
  const [followups, setFollowups] = useState([]);
  const getLocalNow = () => { const d = new Date(); d.setSeconds(0, 0); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
  const getDateShortcut = (daysOffset, hour = 10) => { const d = new Date(); d.setDate(d.getDate() + daysOffset); d.setHours(hour, 0, 0, 0); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
  const [followupForm, setFollowupForm] = useState({
    next_followup_at: getLocalNow(),
    followup_type: 'call',
    notes: '',
    meeting_url: '',
  });
  const [savingFollowup, setSavingFollowup] = useState(false);

  // Follow-up history with pagination
  const [followupHistory, setFollowupHistory] = useState([]);
  const [followupPage, setFollowupPage] = useState(1);
  const [followupPagination, setFollowupPagination] = useState({ total: 0, pages: 1 });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [editingFollowupId, setEditingFollowupId] = useState(null);
  const [editFollowupForm, setEditFollowupForm] = useState({ next_followup_at: '', followup_type: 'call', notes: '', meeting_url: '' });
  const [savingFollowupEdit, setSavingFollowupEdit] = useState(false);
  const FOLLOWUP_LIMIT = 5;

  useEffect(() => { loadData(); loadStages(); loadTemplatesAndBrochures(); }, [id]);
  useEffect(() => { if (id) loadFollowupHistory(); }, [id, followupPage]);

  // Reset ephemeral UI state when switching leads via Prev/Next — the component
  // stays mounted across the id change, so nothing here resets on its own.
  useEffect(() => {
    setActiveTab('overview');
    setEditingField(null);
    setShowTmplPicker(false);
    setShowQuickResponse(false);
    setShareTab('templates');
    setFollowupPage(1);
    setHistoryExpanded(false);
    setEditingFollowupId(null);
    setNewMessage('');
    setStageSaving(false);
    setLostReasonModal({ open: false, newStage: null, reason: '', customReason: '' });
    setFollowupForm({ next_followup_at: getLocalNow(), followup_type: 'call', notes: '', meeting_url: '' });
  }, [id]);

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
    setLoading(true);
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
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadStages = async () => {
    try {
      const { data } = await statusAPI.byStage().catch(() => stageAPI.getAll().then(r => ({ data: { stages: (r.data.stages || []).map(s => ({ ...s, statuses: [] })) } })));
      const stgs = data.stages || [];
      setStages(stgs);
      const byStage = {};
      const all = [];
      stgs.forEach(s => {
        if (s.statuses?.length) {
          byStage[s.name?.toLowerCase()] = s.statuses;
          all.push(...s.statuses);
        }
      });
      setStageStatuses(byStage);
      setAllStatuses(all);
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

  const startFieldEdit = (field, currentValue) => {
    if (field === 'assigned_to') loadStaff();
    setFieldDraft(currentValue ?? '');
    setEditingField(field);
  };

  const cancelFieldEdit = () => { setEditingField(null); setFieldDraft(''); };

  const saveField = async (field, valueOverride) => {
    const raw = valueOverride !== undefined ? valueOverride : fieldDraft;
    const value = raw === '' ? null : raw;
    setEditingField(null);
    try {
      await leadAPI.update(id, { [field]: value });
      if (field === 'assigned_to') {
        const staffMember = staff.find(s => s.id === value);
        setLead(prev => ({ ...prev, assigned_to: value, assigned_to_name: staffMember?.name || null }));
      } else {
        setLead(prev => ({ ...prev, [field]: value }));
      }
    } catch (e) { alert('Failed to save'); loadData(); }
  };

  const handleStageChange = async (newStage) => {
    const stageObj = stages.find(s => s.name.toLowerCase() === newStage.toLowerCase());
    if (stageObj?.is_lost) {
      setLostReasonModal({ open: true, newStage, reason: '', customReason: '' });
      return;
    }
    setStageSaving(true);
    try {
      await leadAPI.update(id, { stage: newStage, lead_status: '' });
      setLead(prev => ({ ...prev, stage: newStage, lead_status: '' }));
    } catch (e) { alert('Failed to update stage'); }
    finally { setStageSaving(false); }
  };

  const confirmLostStage = async () => {
    const finalReason = lostReasonModal.reason === 'Other'
      ? (lostReasonModal.customReason || 'Other')
      : lostReasonModal.reason;
    if (!finalReason) return;
    setStageSaving(true);
    try {
      await leadAPI.update(id, { stage: lostReasonModal.newStage, lead_status: '', lost_reason: finalReason });
      setLead(prev => ({ ...prev, stage: lostReasonModal.newStage, lead_status: '' }));
      closeLostModal();
      loadData();
    } catch (e) { alert(e.response?.data?.error || 'Failed to update stage'); }
    finally { setStageSaving(false); }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await leadAPI.update(id, { lead_status: newStatus });
      setLead(prev => ({ ...prev, lead_status: newStatus }));
    } catch (e) { alert('Failed to update status'); }
  };

  const handleScheduleFollowup = async () => {
    if (!followupForm.next_followup_at) return alert('Please pick a date and time');
    setSavingFollowup(true);
    try {
      // Convert local datetime string to UTC ISO so the server (UTC) stores it correctly
      const utcAt = new Date(followupForm.next_followup_at).toISOString();
      await leadAPI.addFollowup(id, {
        ...followupForm,
        next_followup_at: utcAt,
        notes: (followupForm.notes || '').trim() || null,
      });
      setFollowupForm({ next_followup_at: '', followup_type: 'call', notes: '', meeting_url: '' });
      setFollowupPage(1);
      loadData();
      loadFollowupHistory();
    } catch (e) { alert(e.response?.data?.error || 'Failed to schedule follow-up'); }
    finally { setSavingFollowup(false); }
  };

  const toLocalInputValue = (isoString) => {
    const d = new Date(isoString);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const startEditFollowup = (f) => {
    setEditingFollowupId(f.id);
    setEditFollowupForm({
      next_followup_at: toLocalInputValue(f.next_followup_at),
      followup_type: f.followup_type || 'call',
      notes: f.notes || '',
      meeting_url: f.meeting_url || '',
    });
  };

  const cancelEditFollowup = () => setEditingFollowupId(null);

  const saveFollowupEdit = async () => {
    if (!editFollowupForm.next_followup_at) return alert('Please pick a date and time');
    setSavingFollowupEdit(true);
    try {
      const utcAt = new Date(editFollowupForm.next_followup_at).toISOString();
      await followupAPI.update(editingFollowupId, {
        ...editFollowupForm,
        next_followup_at: utcAt,
        notes: (editFollowupForm.notes || '').trim() || null,
      });
      setEditingFollowupId(null);
      loadFollowupHistory();
      loadData();
    } catch (e) { alert(e.response?.data?.error || 'Failed to update follow-up'); }
    finally { setSavingFollowupEdit(false); }
  };

  const handleAIScore = async () => {
    try {
      await aiAPI.scoreLead(id);
      loadData();
    } catch (e) { alert('AI scoring failed'); }
  };

  const handleMarkContacted = async () => {
    try {
      await leadAPI.markContacted(id);
      loadData();
    } catch (e) { alert(e.response?.data?.error || 'Failed to mark as contacted'); }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await whatsappAPI.send(id, newMessage);
      setNewMessage('');
      loadData();
    } catch (e) { alert(e.response?.data?.error || 'Failed to send'); }
  };

  const handleOpenQuickResponse = async () => {
    if (!tmplsLoaded) {
      try {
        const { data } = await templateAPI.getAll();
        setTemplates(data.templates || []);
        setTmplsLoaded(true);
      } catch (e) { console.error(e); }
    }
    setShowQuickResponse(v => !v);
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
    e?.stopPropagation();
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

  if (loading && !lead) {
    return (
      <div className="max-w-5xl mx-auto animate-pulse">
        <div className="border-b space-y-3 pb-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-8 w-28 bg-gray-200 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-40 bg-gray-200 rounded" />
            <div className="h-4 w-14 bg-gray-200 rounded-full" />
          </div>
          <div className="flex gap-1.5">
            <div className="h-7 w-20 bg-gray-200 rounded-lg" />
            <div className="h-7 w-16 bg-gray-200 rounded-lg" />
            <div className="h-7 w-24 bg-gray-200 rounded-lg" />
            <div className="h-7 w-20 bg-gray-200 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
          <div className="space-y-4">
            <div className="h-48 bg-gray-100 rounded-2xl border" />
            <div className="h-32 bg-gray-100 rounded-2xl border" />
          </div>
          <div className="space-y-4">
            <div className="h-40 bg-gray-100 rounded-2xl border" />
            <div className="h-32 bg-gray-100 rounded-2xl border" />
          </div>
        </div>
      </div>
    );
  }
  if (!lead) return <p>Lead not found</p>;

  const isWon = stages.find(s => s.name.toLowerCase() === (lead.stage || '').toLowerCase())?.is_won;
  const balanceDue = Math.max(0, Number(lead.deal_value || 0) - Number(lead.advance_received || 0));
  const lastStageChange = activities.find(a => a.activity_type === 'stage_change');
  const stageSince = lastStageChange?.created_at || lead.created_at;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'chat', label: 'Chat' },
    { id: 'notes', label: 'Notes & Files' },
    { id: 'activity', label: 'Activity' },
  ];

  return (
    <div className="max-w-5xl mx-auto relative">
      {loading && (
        <div className="absolute inset-0 z-30 bg-white/70 backdrop-blur-[1px] flex items-start justify-center pt-20 transition-opacity duration-150">
          <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      )}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b space-y-2 pb-3 pt-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1">
            {!onClose && (
              <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft size={16} /> Back
              </button>
            )}
            {(onPrev || onNext) && (
              <div className={`flex items-center gap-1 ${onClose ? '' : 'ml-2 pl-2 border-l'}`}>
                <button onClick={onPrev} disabled={!hasPrev || loading} title="Previous lead"
                  className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft size={15} />
                </button>
                <button onClick={onNext} disabled={!hasNext || loading} title="Next lead"
                  className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>
          <button onClick={() => navigate(`/quotations/new?lead_id=${id}`)}
            className="px-3 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium flex items-center gap-1.5">
            <FileText size={14} /> New Quotation
          </button>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {lead.lead_number && (
              <span className="shrink-0 text-xs font-mono text-gray-400">{lead.lead_number}</span>
            )}
            <h2 className="text-base font-bold truncate">{lead.name}</h2>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${scoreColors[lead.lead_score]}`}>
              {lead.lead_score?.toUpperCase()}
            </span>
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 capitalize">
              {lead.stage}
            </span>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <a href={`tel:${lead.phone}`} onClick={() => leadAPI.logCall(lead.id).catch(() => {})} title="Call" className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Phone size={14} /></a>
            <a href={`https://wa.me/${lead.phone}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="p-2 bg-green-50 text-green-600 rounded-lg"><MessageCircle size={14} /></a>
            <div className="relative">
              <button onClick={handleOpenQuickResponse} title="Quick Response"
                className={`p-2 rounded-lg ${showQuickResponse ? 'bg-brand-100 text-brand-700' : 'bg-brand-50 text-brand-600'}`}>
                <Zap size={14} />
              </button>
              {showQuickResponse && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowQuickResponse(false)} />
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border shadow-lg z-40 overflow-hidden">
                    <div className="px-3 py-2 border-b bg-gray-50">
                      <p className="text-xs font-semibold text-gray-600">Quick Response · Send via WhatsApp</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y">
                      {!tmplsLoaded ? (
                        <p className="text-xs text-gray-400 text-center py-4">Loading...</p>
                      ) : templates.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">No templates yet. Create them in Settings → Templates.</p>
                      ) : templates.map(t => (
                        <button key={t.id}
                          onClick={() => { handleSendTemplateWhatsApp(t); setShowQuickResponse(false); }}
                          className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{t.name}</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 capitalize">{t.category?.replace(/_/g, ' ')}</span>
                          </div>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{t.message}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === t.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
       <div className="space-y-4">
        {/* Lead Intent */}
        <LeadIntentCard lead={lead} activities={activities} />

        {/* Lead Info */}
        <div className="bg-white rounded-2xl border p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0 pr-2">
                {lead.lead_number && (
                  <span className="block text-xs font-mono text-gray-400 mb-0.5">{lead.lead_number}</span>
                )}
                {editingField === 'name' ? (
                  <input autoFocus value={fieldDraft} onChange={e => setFieldDraft(e.target.value)}
                    onBlur={() => saveField('name')}
                    onKeyDown={e => { if (e.key === 'Enter') saveField('name'); if (e.key === 'Escape') cancelFieldEdit(); }}
                    placeholder="Full name"
                    className="text-xl font-bold w-full border-b focus:outline-none focus:border-brand-500" />
                ) : (
                  <h2 onClick={() => startFieldEdit('name', lead.name)} title="Click to edit"
                    className="text-xl font-bold truncate cursor-text hover:bg-gray-50 rounded px-0.5 -mx-0.5">
                    {lead.name}
                  </h2>
                )}
                <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${scoreColors[lead.lead_score]}`}>
                  {lead.lead_score?.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-gray-400 shrink-0" />
                    {editingField === 'business_name' ? (
                      <input autoFocus value={fieldDraft} onChange={e => setFieldDraft(e.target.value)}
                        onBlur={() => saveField('business_name')}
                        onKeyDown={e => { if (e.key === 'Enter') saveField('business_name'); if (e.key === 'Escape') cancelFieldEdit(); }}
                        placeholder="Business name"
                        className="flex-1 px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                    ) : lead.business_name ? (
                      <span onClick={() => startFieldEdit('business_name', lead.business_name)} title="Click to edit"
                        className="truncate cursor-text hover:bg-gray-50 rounded px-0.5 -mx-0.5">{lead.business_name}</span>
                    ) : (
                      <button onClick={() => startFieldEdit('business_name', '')} className="text-xs text-cyan-600 hover:underline">Add business name →</button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400 shrink-0" />
                    {editingField === 'phone' ? (
                      <input autoFocus type="tel" value={fieldDraft} onChange={e => setFieldDraft(e.target.value)}
                        onBlur={() => saveField('phone')}
                        onKeyDown={e => { if (e.key === 'Enter') saveField('phone'); if (e.key === 'Escape') cancelFieldEdit(); }}
                        className="flex-1 px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                    ) : (
                      <>
                        <a href={`tel:${lead.phone}`} onClick={() => leadAPI.logCall(lead.id).catch(() => {})} className="hover:text-brand-600">{lead.phone}</a>
                        <button onClick={() => startFieldEdit('phone', lead.phone)} title="Edit phone" className="text-gray-300 hover:text-brand-600"><Edit2 size={11} /></button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400 shrink-0" />
                    {editingField === 'email' ? (
                      <input autoFocus type="email" value={fieldDraft} onChange={e => setFieldDraft(e.target.value)}
                        onBlur={() => saveField('email')}
                        onKeyDown={e => { if (e.key === 'Enter') saveField('email'); if (e.key === 'Escape') cancelFieldEdit(); }}
                        placeholder="Email"
                        className="flex-1 px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                    ) : lead.email ? (
                      <>
                        <a href={`mailto:${lead.email}`} className="hover:text-brand-600 truncate">{lead.email}</a>
                        <button onClick={() => startFieldEdit('email', lead.email)} title="Edit email" className="text-gray-300 hover:text-brand-600"><Edit2 size={11} /></button>
                      </>
                    ) : (
                      <button onClick={() => startFieldEdit('email', '')} className="text-xs text-cyan-600 hover:underline">Add email →</button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400 shrink-0" />
                    {editingField === 'location' ? (
                      <input autoFocus value={fieldDraft} onChange={e => setFieldDraft(e.target.value)}
                        onBlur={() => saveField('location')}
                        onKeyDown={e => { if (e.key === 'Enter') saveField('location'); if (e.key === 'Escape') cancelFieldEdit(); }}
                        placeholder="City"
                        className="flex-1 px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                    ) : lead.location ? (
                      <span onClick={() => startFieldEdit('location', lead.location)} title="Click to edit"
                        className="cursor-text hover:bg-gray-50 rounded px-0.5 -mx-0.5">{lead.location}</span>
                    ) : (
                      <button onClick={() => startFieldEdit('location', '')} className="text-xs text-cyan-600 hover:underline">Add city →</button>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <Navigation size={14} className="text-gray-400 shrink-0 mt-0.5" />
                    {editingField === 'address' ? (
                      <textarea autoFocus value={fieldDraft} onChange={e => setFieldDraft(e.target.value)}
                        onBlur={() => saveField('address')}
                        onKeyDown={e => { if (e.key === 'Escape') cancelFieldEdit(); }}
                        rows={2} placeholder="Address"
                        className="flex-1 px-2 py-1 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-300" />
                    ) : lead.address ? (
                      <span onClick={() => startFieldEdit('address', lead.address)} title="Click to edit"
                        className="whitespace-pre-wrap cursor-text hover:bg-gray-50 rounded px-0.5 -mx-0.5">{lead.address}</span>
                    ) : (
                      <button onClick={() => startFieldEdit('address', '')} className="text-xs text-cyan-600 hover:underline">Add address →</button>
                    )}
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">Source</p>
                    {editingField === 'source' ? (
                      <select autoFocus value={fieldDraft} onChange={e => saveField('source', e.target.value)}
                        onBlur={cancelFieldEdit}
                        className="w-full mt-0.5 px-2 py-1.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300">
                        <option value="manual">Manual</option>
                        <option value="meta_ads">Meta Ads</option>
                        <option value="google_ads">Google Ads</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="referral">Referral</option>
                        <option value="website">Website</option>
                        <option value="walkin">Walk-in</option>
                      </select>
                    ) : (
                      <p onClick={() => startFieldEdit('source', lead.source || 'manual')} title="Click to edit"
                        className="capitalize font-medium cursor-text hover:bg-gray-50 rounded px-0.5 -mx-0.5 inline-block">{lead.source?.replace(/_/g, ' ')}</p>
                    )}
                  </div>
                  {(lead.campaign_name || lead.source_detail) && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500">Campaign</p>
                      {lead.campaign_name ? (
                        <button onClick={() => navigate(`/campaigns/${lead.campaign_id}`)} className="font-medium text-cyan-600 hover:underline text-left">
                          {lead.campaign_name}
                        </button>
                      ) : (
                        <p className="font-medium">—</p>
                      )}
                      {lead.source_detail && <p className="text-xs text-gray-500 mt-0.5">Ad: {lead.source_detail}</p>}
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">Lead Date</p>
                    <p className="font-medium flex items-center gap-1.5">
                      <Calendar size={13} className="text-gray-400" />
                      {new Date(lead.lead_date || lead.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">Assigned To</p>
                    {editingField === 'assigned_to' ? (
                      <select autoFocus value={fieldDraft || ''} onChange={e => saveField('assigned_to', e.target.value || null)}
                        onBlur={cancelFieldEdit}
                        className="w-full mt-0.5 px-2 py-1.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300">
                        <option value="">Unassigned</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    ) : lead.assigned_to_name ? (
                      <p onClick={() => startFieldEdit('assigned_to', lead.assigned_to)} title="Click to edit"
                        className="font-medium cursor-text hover:bg-gray-50 rounded px-0.5 -mx-0.5 inline-block">{lead.assigned_to_name}</p>
                    ) : (
                      <button onClick={() => startFieldEdit('assigned_to', '')} className="text-xs text-cyan-600 hover:underline">Assign a staff member →</button>
                    )}
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">Notes</p>
                    {editingField === 'notes' ? (
                      <textarea autoFocus value={fieldDraft} onChange={e => setFieldDraft(e.target.value)}
                        onBlur={() => saveField('notes')}
                        onKeyDown={e => { if (e.key === 'Escape') cancelFieldEdit(); }}
                        rows={2} placeholder="Notes"
                        className="w-full mt-0.5 px-2 py-1.5 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-300" />
                    ) : lead.notes ? (
                      <p onClick={() => startFieldEdit('notes', lead.notes)} title="Click to edit"
                        className="text-sm whitespace-pre-wrap cursor-text hover:bg-gray-50 rounded px-0.5 -mx-0.5">{lead.notes}</p>
                    ) : (
                      <button onClick={() => startFieldEdit('notes', '')} className="text-xs text-cyan-600 hover:underline">Add notes →</button>
                    )}
                  </div>
                  <div className="pt-2 border-t flex flex-wrap gap-2">
                    <div className="flex-1 min-w-[100px] bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-gray-500">Quoted Price</p>
                      {editingField === 'deal_value' ? (
                        <input autoFocus type="number" min="0" value={fieldDraft} onChange={e => setFieldDraft(e.target.value)}
                          onBlur={() => saveField('deal_value')}
                          onKeyDown={e => { if (e.key === 'Enter') saveField('deal_value'); if (e.key === 'Escape') cancelFieldEdit(); }}
                          placeholder="0"
                          className="w-full px-1.5 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                      ) : Number(lead.deal_value) ? (
                        <p onClick={() => startFieldEdit('deal_value', lead.deal_value)} title="Click to edit"
                          className="text-sm font-bold cursor-text hover:bg-gray-100 rounded px-0.5 -mx-0.5">₹{Number(lead.deal_value).toLocaleString('en-IN')}</p>
                      ) : (
                        <button onClick={() => startFieldEdit('deal_value', '')} className="text-xs text-cyan-600 hover:underline">Add price →</button>
                      )}
                    </div>
                    {isWon && (
                      <>
                        <div className="flex-1 min-w-[100px] bg-green-50 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-gray-500">Advance Received</p>
                          {editingField === 'advance_received' ? (
                            <input autoFocus type="number" min="0" value={fieldDraft} onChange={e => setFieldDraft(e.target.value)}
                              onBlur={() => saveField('advance_received')}
                              onKeyDown={e => { if (e.key === 'Enter') saveField('advance_received'); if (e.key === 'Escape') cancelFieldEdit(); }}
                              placeholder="0"
                              className="w-full px-1.5 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
                          ) : (
                            <p onClick={() => startFieldEdit('advance_received', lead.advance_received)} title="Click to edit"
                              className="text-sm font-bold text-green-700 cursor-text hover:bg-green-100 rounded px-0.5 -mx-0.5">₹{Number(lead.advance_received || 0).toLocaleString('en-IN')}</p>
                          )}
                        </div>
                        <div className="flex-1 min-w-[100px] bg-amber-50 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-gray-500">Balance Due</p>
                          <p className="text-sm font-bold text-amber-700">₹{balanceDue.toLocaleString('en-IN')}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

              {/* Stage Dropdown — always visible */}
              <div className="pt-2 border-t">
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
                {stageSince && (
                  <p className="text-[10px] text-gray-400 mt-1" title={new Date(stageSince).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}>
                    In this stage for {formatDuration(stageSince)}
                  </p>
                )}
              </div>

              {/* Status Dropdown */}
              {(stageStatuses[lead.stage?.toLowerCase()]?.length > 0 || allStatuses.length > 0) && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <div className="relative">
                    <select
                      value={lead.lead_status || ''}
                      onChange={e => handleStatusChange(e.target.value)}
                      className="w-full appearance-none px-3 py-2 border rounded-lg text-sm bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                      <option value="">— No status —</option>
                      {(stageStatuses[lead.stage?.toLowerCase()] || allStatuses).map(st => (
                        <option key={st.id} value={st.name}>{st.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {lead.score_reason && (
                <div>
                  <p className="text-xs text-gray-500">AI Reason</p>
                  <p className="text-xs">{lead.score_reason}</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <a href={`tel:${lead.phone}`} onClick={() => leadAPI.logCall(lead.id).catch(() => {})} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium text-center flex items-center justify-center gap-1"><Phone size={14} /> Call</a>
              <a href={`https://wa.me/${lead.phone}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium text-center flex items-center justify-center gap-1"><MessageCircle size={14} /> WhatsApp</a>
            </div>

            {!lead.first_response_at && (
              <button onClick={handleMarkContacted} className="mt-2 w-full py-2 bg-cyan-50 text-cyan-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1">
                <CheckCircle size={14} /> Mark as Contacted
              </button>
            )}

            <button onClick={handleAIScore} className="mt-2 w-full py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium flex items-center justify-center gap-1">
              <Zap size={14} /> Recalculate Intent
            </button>
          </div>
       </div>

       <div className="space-y-4">
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-500">Date & Time *</label>
                  <div className="flex gap-1">
                    {[['Today', 0], ['Tomorrow', 1], ['In 2 days', 2]].map(([label, days]) => (
                      <button key={label} type="button"
                        onClick={() => setFollowupForm({ ...followupForm, next_followup_at: getDateShortcut(days) })}
                        className="px-2 py-0.5 text-[11px] font-medium rounded-md border bg-gray-50 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-300 text-gray-500 transition-colors">
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
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

              {followupForm.followup_type === 'demo' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Video size={11} /> Meeting Link (optional)
                  </label>
                  <input
                    type="url"
                    value={followupForm.meeting_url}
                    onChange={e => setFollowupForm({ ...followupForm, meeting_url: e.target.value })}
                    placeholder="https://meet.google.com/..."
                    className="w-full px-3 py-2 border rounded-lg text-sm border-violet-200 focus:ring-2 focus:ring-violet-300 focus:outline-none" />
                  {lead?.email && followupForm.meeting_url && (
                    <p className="text-[11px] text-violet-600 mt-1 flex items-center gap-1">
                      ✉️ Invite will be sent to {lead.email}
                    </p>
                  )}
                  {!lead?.email && followupForm.meeting_url && (
                    <p className="text-[11px] text-gray-400 mt-1">No email on file — invite won't be sent</p>
                  )}
                </div>
              )}

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
                className={`w-full py-2 text-white rounded-lg text-sm font-semibold disabled:opacity-60 ${followupForm.followup_type === 'demo' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-brand-600 hover:bg-brand-700'}`}>
                {savingFollowup ? 'Saving...' : followupForm.followup_type === 'demo' ? '🎥 Schedule Demo' : 'Schedule Follow-up'}
              </button>
            </div>
          </div>

          {/* Discussion Notes */}
          <LeadNotes leadId={id} onActivityAdded={loadData} />

          {/* Follow-up History */}
          {(followupHistory.length > 0 || historyLoading) && (
            <div className="bg-white rounded-2xl border p-5">
              <button onClick={() => setHistoryExpanded(v => !v)} className="w-full flex items-center gap-2 text-sm font-semibold">
                <Calendar size={16} /> Follow-up History
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">{followupPagination.total}</span>
                <ChevronDown size={14} className={`ml-auto text-gray-400 transition-transform ${historyExpanded ? 'rotate-180' : ''}`} />
              </button>

              {historyExpanded && (
              <div className="mt-3">
              {historyLoading ? (
                <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
              ) : (
                <div className="space-y-2">
                  {followupHistory.map(f => (
                    editingFollowupId === f.id ? (
                      <div key={f.id} className="p-2.5 rounded-xl border border-brand-300 bg-brand-50/30 space-y-2">
                        <input type="datetime-local" value={editFollowupForm.next_followup_at}
                          onChange={e => setEditFollowupForm({ ...editFollowupForm, next_followup_at: e.target.value })}
                          className="w-full px-2 py-1.5 border rounded-lg text-xs" />
                        <div className="flex gap-1">
                          {['call', 'whatsapp', 'visit', 'demo'].map(t => (
                            <button key={t} type="button" onClick={() => setEditFollowupForm({ ...editFollowupForm, followup_type: t })}
                              className={`flex-1 py-1 rounded-md text-[11px] font-medium capitalize border transition-colors ${editFollowupForm.followup_type === t ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                              {t}
                            </button>
                          ))}
                        </div>
                        {editFollowupForm.followup_type === 'demo' && (
                          <input type="url" value={editFollowupForm.meeting_url}
                            onChange={e => setEditFollowupForm({ ...editFollowupForm, meeting_url: e.target.value })}
                            placeholder="Meeting link (optional)"
                            className="w-full px-2 py-1.5 border rounded-lg text-xs" />
                        )}
                        <input type="text" value={editFollowupForm.notes}
                          onChange={e => setEditFollowupForm({ ...editFollowupForm, notes: e.target.value })}
                          placeholder="Notes"
                          className="w-full px-2 py-1.5 border rounded-lg text-xs" />
                        <div className="flex gap-2">
                          <button onClick={cancelEditFollowup} className="flex-1 py-1.5 border rounded-lg text-xs font-medium hover:bg-gray-50">Cancel</button>
                          <button onClick={saveFollowupEdit} disabled={savingFollowupEdit}
                            className="flex-1 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold disabled:opacity-60">
                            {savingFollowupEdit ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div key={f.id} onClick={() => startEditFollowup(f)}
                        className={`p-2.5 rounded-xl border cursor-pointer hover:border-brand-300 transition-colors ${f.is_completed ? 'bg-gray-50' : 'bg-white'}`}>
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
                              onClick={async (e) => { e.stopPropagation(); await followupAPI.complete(f.id, { outcome: 'Done' }); setFollowupPage(1); loadFollowupHistory(); loadData(); }}
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
                    )
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
            </div>
          )}

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
      </div>
      )}

      {activeTab === 'chat' && (
      <div className="space-y-4 pt-4">
          {/* WhatsApp Conversation */}
          <div className="bg-white rounded-2xl border p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-semibold flex items-center gap-2"><MessageCircle size={18} /> WhatsApp Conversation</h3>
              {lead.ai_paused && (
                <button
                  onClick={async () => { await leadAPI.update(id, { ai_paused: false }); setLead(prev => ({ ...prev, ai_paused: false })); }}
                  className="flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium hover:bg-amber-100">
                  AI replies paused for this lead · Resume AI
                </button>
              )}
            </div>
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
      </div>
      )}

      {activeTab === 'notes' && (
      <div className="space-y-4 pt-4">
          {/* Notes */}
          <LeadNotes leadId={id} onActivityAdded={loadData} />

          {/* Attachments */}
          <LeadAttachments leadId={id} onActivityAdded={loadData} />

          {/* Recordings */}
          <LeadRecordings leadId={id} />

          {/* AI Voice Calls */}
          <LeadAiCalls leadId={id} />
      </div>
      )}

      {activeTab === 'activity' && (
      <div className="space-y-4 pt-4">
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
      )}

      {/* ── Lost Reason Modal ── */}
      {/* Portal to document.body: this page can be nested inside the Leads-list modal, whose
          card has a scale transition (a CSS transform) — that makes it the containing block
          for any `fixed` descendant, breaking full-viewport overlay positioning unless we escape it. */}
      {lostReasonModal.open && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={closeLostModal} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-gray-900">Why is this lead lost?</h2>
              <button onClick={closeLostModal} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-gray-500">A reason is required to track why deals aren't converting.</p>
              <select value={lostReasonModal.reason}
                onChange={e => setLostReasonModal(m => ({ ...m, reason: e.target.value }))}
                className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300">
                <option value="">— Select a reason —</option>
                <option value="Not interested">Not interested</option>
                <option value="Budget constraint">Budget constraint</option>
                <option value="Chose competitor">Chose competitor</option>
                <option value="Bad timing">Bad timing</option>
                <option value="No response">No response</option>
                <option value="Requirement mismatch">Requirement mismatch</option>
                <option value="Other">Other</option>
              </select>
              {lostReasonModal.reason === 'Other' && (
                <textarea placeholder="Describe the reason…"
                  value={lostReasonModal.customReason}
                  onChange={e => setLostReasonModal(m => ({ ...m, customReason: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={closeLostModal}
                  className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={confirmLostStage}
                  disabled={stageSaving || !lostReasonModal.reason || (lostReasonModal.reason === 'Other' && !lostReasonModal.customReason)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                  {stageSaving ? 'Saving…' : 'Mark as Lost'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LeadDetailPage;
