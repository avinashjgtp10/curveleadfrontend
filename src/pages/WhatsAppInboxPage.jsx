import ChatAttributes from '../components/ChatAttributes';
import { initials, sourceLabel } from '../utils/leadData.js';
import { formatDateTime, toDateTimeInput } from '../utils/dateTime.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { whatsappAPI, leadAPI, staffAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import InboxComposer, { lastInboundAt, fmtRemaining } from '../components/whatsapp/InboxComposer';
import { AVATAR_COLORS } from '../utils/constants';
import LeadDetailPage from './LeadDetailPage';
import ShareBrochureModal from '../components/lead/ShareBrochureModal';
import { useToast } from '../components/ui/Toast';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  MessageCircle, Search, SlidersHorizontal, Star, MoreVertical,
  Check, CheckCheck, AlertCircle, UserCircle2, X,
  FileText, Layers, Download, Clock, Bot,
  ListChecks, Trash2, CheckSquare, Square, MailOpen, MessageSquarePlus,
  Phone, Mail, Building2, MapPin, Megaphone, Hash, Copy,
} from 'lucide-react';

const avatarColor = (name) => AVATAR_COLORS[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

// One contact row in the details panel: icon, label, value (optionally a link), copy button.
const ContactRow = ({ icon: Icon, label, value, href, onCopy }) => (
  <div className="flex items-start gap-2 text-sm min-w-0">
    <Icon size={14} className="text-gray-400 mt-0.5 shrink-0" />
    <div className="min-w-0 flex-1">
      <p className="text-[11px] text-gray-400 leading-tight">{label}</p>
      {href
        ? <a href={href} className="text-brand-700 font-medium break-words hover:underline">{value}</a>
        : <p className="text-gray-700 font-medium break-words">{value}</p>}
    </div>
    {onCopy && (
      <button onClick={() => onCopy(value, label)} title={`Copy ${label.toLowerCase()}`} className="p-1 text-gray-300 hover:text-gray-600 shrink-0">
        <Copy size={12} />
      </button>
    )}
  </div>
);

const fmtClock = (dt) => {
  const d = new Date(dt);
  return isNaN(d.getTime()) ? '' : formatDateTime(dt, undefined, { dateStyle: undefined, timeStyle: 'short' });
};
const fmtDate = (dt) => {
  const d = new Date(dt);
  return isNaN(d.getTime()) ? '—' : formatDateTime(dt, undefined, { timeStyle: undefined });
};

// Renders a message bubble's content by type — an inline image/video/audio
// player or a document link for media, a styled badge for a template send,
// otherwise just the plain text. Falls back to plain text if media_url is
// missing (e.g. an older message sent before media rendering existed).
const MessageBody = ({ m, templateBody }) => {
  if (m.message_type === 'template') {
    const legacy = typeof m.message === 'string' && m.message.match(/^\[Template: (.+)\]$/);
    const name = m.template_name || legacy?.[1];
    // Older/automation-sent rows only ever stored the "[Template: name]" placeholder,
    // never the actual rendered text — fall back to the template's current approved
    // body (looked up by name) so the chat shows real content instead of just the badge.
    // It won't reflect variables exactly as sent (e.g. the lead's name at the time),
    // only the template's current shape, so it's marked as a reconstruction.
    const body = legacy ? (templateBody || null) : m.message;
    const isReconstructed = legacy && !!templateBody;
    const headerIsImage = m.media_url && /\.(png|jpe?g)(\?|$)/i.test(m.media_url);
    return (
      <div>
        {headerIsImage && <img src={m.media_url} alt="" className="rounded-lg max-w-full max-h-48 mb-1.5" />}
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-lg">
          <Layers size={11} /> Template{name ? `: ${name.replace(/_+/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}` : ''}
        </span>
        {body && <p className="mt-1.5 whitespace-pre-wrap break-words">{body}</p>}
        {isReconstructed && <p className="text-[10px] text-gray-400 mt-1">Reconstructed from the current template — may not match exactly what was sent.</p>}
      </div>
    );
  }
  if (m.media_url && m.message_type === 'image') {
    return (
      <a href={m.media_url} target="_blank" rel="noreferrer" className="block">
        <img src={m.media_url} alt={m.message || 'Image'} className="rounded-lg max-w-full max-h-64 mb-1" />
        {m.message && !/^\[.*\]$/.test(m.message) && <p>{m.message}</p>}
      </a>
    );
  }
  if (m.media_url && m.message_type === 'video') {
    return (
      <div>
        <video controls src={m.media_url} className="rounded-lg max-w-full max-h-64 mb-1" />
        {m.message && !/^\[.*\]$/.test(m.message) && <p>{m.message}</p>}
      </div>
    );
  }
  if (m.media_url && m.message_type === 'audio') {
    return <audio controls src={m.media_url} className="max-w-full" />;
  }
  if (m.media_url && m.message_type === 'document') {
    return (
      <a href={m.media_url} target="_blank" rel="noreferrer"
        className="flex items-center gap-2 bg-white/60 rounded-lg px-2.5 py-2 hover:bg-white">
        <FileText size={16} className="text-gray-500 shrink-0" />
        <span className="text-xs font-medium truncate">{m.message || 'Document'}</span>
        <Download size={13} className="text-gray-400 shrink-0" />
      </a>
    );
  }
  return <p className="whitespace-pre-wrap break-words">{m.message}</p>;
};

const dayKey = dt => toDateTimeInput(dt).slice(0, 10);
const dayLabel = (dt) => {
  const d = new Date(dt);
  if (isNaN(d.getTime())) return '';
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (dayKey(d) === dayKey(today)) return 'Today';
  if (dayKey(d) === dayKey(yesterday)) return 'Yesterday';
  return formatDateTime(dt, undefined, { timeStyle: undefined });
};

const NewChatModal = ({ onClose, onStart }) => {
  const toast = useToast();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [starting, setStarting] = useState(false);

  const submit = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return toast.error('Enter a valid phone number.');
    setStarting(true);
    try { await onStart(digits, name); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed to start chat'); }
    finally { setStarting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5">
        <h3 className="font-bold text-base mb-1">New chat</h3>
        <p className="text-xs text-gray-500 mb-4">Message a number that isn't in your leads yet — a lead is created automatically so replies aren't lost.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phone number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="e.g. 9876543210" autoFocus className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name <span className="text-gray-400 font-normal">(optional)</span></label>
            <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="e.g. Priya" className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={starting}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
            {starting ? 'Starting…' : 'Start chat'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PRESET_LABELS = ['Interested', 'Hot Lead', 'Follow-up', 'Not Interested', 'VIP'];

const relTime = (dt) => {
  if (!dt) return '';
  const diffMs = Date.now() - new Date(dt).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day === 1) return 'Yesterday';
  return formatDateTime(dt, undefined, { dateStyle: undefined, timeStyle: undefined,  day: '2-digit', month: 'short' });
};

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'starred', label: 'Starred' },
];

const WhatsAppInboxPage = () => {
  const toast = useToast();
  const confirm = useConfirmDialog();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [starredIds, setStarredIds] = useState(new Set());
  const [detailsOpen,setDetailsOpen]=useState(false);
  useEffect(()=>{if(!detailsOpen)return;const close=e=>{if(e.key==='Escape')setDetailsOpen(false);};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[detailsOpen]);
  const [activeId, setActiveId] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [staff, setStaff] = useState([]);
  const [templateBodyByName, setTemplateBodyByName] = useState(new Map());

  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [labelFilter, setLabelFilter] = useState(null);
  const [customLabel, setCustomLabel] = useState('');
  const [viewLeadId, setViewLeadId] = useState(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showBrochureModal, setShowBrochureModal] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const startedChatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const stickToBottomRef = useRef(true);
  const prevActiveIdRef = useRef(null);
  const activeIdRef = useRef(null);

  useEffect(() => { loadInbox(); }, []);
  // Open to any team member (same endpoint the template picker uses) — used to
  // reconstruct old/automation-sent template messages that only ever stored the
  // "[Template: name]" placeholder instead of the real body text.
  useEffect(() => {
    whatsappAPI.getSendableTemplates()
      .then(({ data }) => setTemplateBodyByName(new Map((data.templates || []).map(t => [t.name, t.body_text]))))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!isAdmin) return;
    staffAPI.getAll().then(({ data }) => setStaff(data.staff || [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Auto-scroll to the newest message on conversation switch or while the
  // user is already near the bottom — but don't yank them back down if
  // they've scrolled up to read older messages during a background poll.
  useEffect(() => {
    const switchedConversation = prevActiveIdRef.current !== activeId;
    prevActiveIdRef.current = activeId;
    if (switchedConversation) stickToBottomRef.current = true;
    if (stickToBottomRef.current) messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, activeId]);

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  useEffect(() => {
    if (!showChatMenu) return;
    const handler = (e) => { if (!e.target.closest('[data-chat-menu]')) setShowChatMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showChatMenu]);

  useEffect(() => {
    if (!showFilterMenu) return;
    const handler = (e) => { if (!e.target.closest('[data-filter-menu]')) setShowFilterMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFilterMenu]);

  const loadInbox = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [{ data: inboxData }, { data: leadData }] = await Promise.all([
        whatsappAPI.getInbox(),
        leadAPI.getAll({ limit: 50 }).catch(() => ({ data: { leads: [] } })),
      ]);
      setAiEnabled(!!inboxData.ai_enabled);
      const convList = inboxData.conversations || [];
      const convIds = new Set(convList.map(c => c.lead_id));
      const extraContacts = (leadData.leads || [])
        .filter(l => !convIds.has(l.id))
        .map(l => ({
          lead_id: l.id,
          lead_name: l.name,
          lead_phone: l.phone,
          lead_email: l.email,
          business_name: l.business_name,
          lead_city: l.city || l.location,
          address: l.address,
          source: l.source,
          lead_number: l.lead_number,
          stage: l.stage,
          campaign_name: l.campaign_name,
          lead_since: l.lead_date || l.created_at,
          message: null,
          sent_at: null,
          unread_count: 0,
        }));
      const list = [...convList, ...extraContacts];
      // A chat started via "New chat" has no messages yet and may be an older
      // lead outside the recent 50 — keep it listed so it stays open.
      const started = startedChatRef.current;
      if (started && !list.some(c => c.lead_id === started.lead_id)) list.unshift(started);
      setConversations(list);

    } catch (e) { console.error(e); }
    finally { if (!silent) setLoading(false); }
  };

  // Chat should feel live — poll the open conversation and the list in the
  // background rather than requiring a manual refresh to see new replies.
  // Hidden browser tabs skip polls (saves the rate limit); coming back refreshes at once.
  useEffect(() => {
    const visible = () => document.visibilityState === 'visible';
    const tick = () => { if (visible()) loadInbox(true); };
    const interval = setInterval(tick, 20000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', tick); };
  }, [activeId]);

  useEffect(() => {
    activeIdRef.current = activeId;
    if (!activeId) return;
    loadConversation(activeId);
    const visible = () => document.visibilityState === 'visible';
    const tick = () => { if (visible()) loadConversation(activeId, true); };
    const interval = setInterval(tick, 8000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', tick); };
  }, [activeId]);

  const loadConversation = async (leadId, silent = false) => {
    if (!silent) setMsgLoading(true);
    try {
      const { data } = await whatsappAPI.getConversation(leadId);
      // Opening a chat marks its inbound messages read — refresh the sidebar badge.
      if ((data.messages || []).some(m => m.direction === 'inbound' && !m.read_at)) window.dispatchEvent(new Event('whatsapp-unread-changed'));
      // A slow poll for a chat the user already left must not replace the open chat.
      if (activeIdRef.current !== leadId) return;
      setMessages(data.messages || []);
      // The server just marked this chat read — clear its unread badge in the list too.
      setConversations(prev => prev.map(c => (c.lead_id === leadId && Number(c.unread_count) > 0 ? { ...c, unread_count: 0 } : c)));
    } catch (e) { console.error(e); if (!silent) setMessages([]); }
    finally { if (!silent) setMsgLoading(false); }
  };

  // Labels are the lead's tags on the server, so they persist and the whole team sees them.
  const activeLabels = conversations.find(c => c.lead_id === activeId)?.tags || [];

  const changeLabels = async (add, remove) => {
    if (!activeId) return;
    const leadId = activeId;
    try {
      const { data } = await whatsappAPI.updateLabels(leadId, add, remove);
      setConversations(prev => prev.map(c => (c.lead_id === leadId ? { ...c, tags: data.tags } : c)));
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to update labels'); }
  };

  const addLabel = (label) => {
    const text = label.trim();
    if (!text || activeLabels.includes(text)) return;
    changeLabels([text], []);
    setCustomLabel('');
    setShowLabelPicker(false);
  };

  const removeLabel = (label) => changeLabels([], [label]);

  const toggleStar = (leadId, e) => {
    e.stopPropagation();
    setStarredIds(prev => {
      const next = new Set(prev);
      next.has(leadId) ? next.delete(leadId) : next.add(leadId);
      return next;
    });
  };

  const handleClearChat = () => {
    setMessages([]);
    setShowChatMenu(false);
  };

  const handleDeleteConversation = async () => {
    const leadId = activeId;
    setShowChatMenu(false);
    const ok = await confirm({
      title: 'Delete this conversation?',
      message: 'All messages in this chat are permanently deleted. The lead itself is not affected.',
      confirmText: 'Delete',
    });
    if (!ok) return;
    try {
      await whatsappAPI.deleteConversations([leadId]);
      setConversations(prev => prev.filter(c => c.lead_id !== leadId));
      setActiveId(null);
      setMessages([]);
      toast.success('Conversation deleted.');
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to delete conversation'); }
  };

  const filtered = useMemo(() => conversations
    .filter(c => {
      // The open chat stays in Unread after it's read, so it doesn't vanish mid-conversation.
      if (tab === 'unread') return Number(c.unread_count) > 0 || c.lead_id === activeId;
      if (tab === 'starred') return starredIds.has(c.lead_id);
      return true;
    })
    .filter(c =>
      (c.lead_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.lead_phone || '').includes(search)
    )
    .filter(c => !labelFilter || (c.tags || []).includes(labelFilter)),
    [conversations, tab, search, starredIds, labelFilter, activeId]);

  const unreadCount = conversations.filter(c => Number(c.unread_count) > 0).length;
  const starredCount = starredIds.size;

  const active = conversations.find(c => c.lead_id === activeId);

  const copyValue = (value, label) => {
    navigator.clipboard?.writeText(String(value))
      .then(() => toast.success(`${label} copied.`))
      .catch(() => toast.error('Could not copy.'));
  };

  const patchConversation = (leadId, patch) =>
    setConversations(prev => prev.map(c => (c.lead_id === leadId ? { ...c, ...patch } : c)));

  const handleToggleAi = async (paused) => {
    if (!activeId) return;
    const leadId = activeId;
    try {
      await whatsappAPI.setConversationAi(leadId, paused);
      patchConversation(leadId, { ai_paused: paused });
      toast.success(paused ? 'You took over — AI and automated sequences are paused.' : 'AI and automated sequences can reply to this lead again.');
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to update AI setting'); }
  };

  const handleAssign = async (staffId) => {
    if (!activeId) return;
    const leadId = activeId;
    try {
      await leadAPI.update(leadId, { assigned_to: staffId || null });
      patchConversation(leadId, { assigned_to: staffId || null, assigned_to_name: staff.find(s => s.id === staffId)?.name || null });
      toast.success('Conversation reassigned.');
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to reassign'); }
  };

  const handleStartChat = async (phone, name) => {
    const { data } = await whatsappAPI.startChat(phone, name);
    startedChatRef.current = {
      lead_id: data.lead_id, lead_name: data.lead_name || name || 'Unknown', lead_phone: data.lead_phone || phone,
      assigned_to: data.assigned_to || null, message: null, sent_at: null, unread_count: 0,
    };
    // Reload regardless of whether a new lead was created — an existing lead with
    // no messages yet may not be in the currently-loaded list (it's capped at 50).
    await loadInbox(true);
    // loadInbox leaves the list untouched if it fails, so add the contact here too.
    setConversations(prev => prev.some(c => c.lead_id === data.lead_id) ? prev : [startedChatRef.current, ...prev]);
    setActiveId(data.lead_id);
    setShowNewChat(false);
  };

  // Resend a failed text message; the failed bubble is replaced by the new attempt.
  const [retryingId, setRetryingId] = useState(null);
  const retryMessage = async (m) => {
    setRetryingId(m.id);
    try {
      const { data } = await whatsappAPI.send(activeId, m.message);
      setMessages(prev => prev.map(x => (x.id === m.id ? data.message : x)));
      if (data.delivery?.success === false) toast.error(`Still not delivered: ${data.delivery.error || 'WhatsApp rejected it.'}`);
    } catch (e) { toast.error(e.response?.data?.error || 'Retry failed'); }
    finally { setRetryingId(null); }
  };

  const handleBrochureShared = (brochure) => {
    setMessages(prev => [...prev, {
      id: `tmp-brochure-${Date.now()}`, direction: 'outbound', message: `📄 ${brochure.name}`,
      sent_at: new Date().toISOString(), status: 'sent',
    }]);
    loadConversation(activeId, true);
  };

  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()); };

  const toggleSelected = (leadId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(leadId) ? next.delete(leadId) : next.add(leadId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => (prev.size === filtered.length ? new Set() : new Set(filtered.map(c => c.lead_id))));
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    const ok = await confirm({
      title: `Delete ${ids.length} conversation${ids.length > 1 ? 's' : ''}?`,
      message: 'All messages in the selected chats are permanently deleted. The leads themselves are not affected.',
      confirmText: 'Delete',
    });
    if (!ok) return;
    setBulkBusy(true);
    try {
      await whatsappAPI.deleteConversations(ids);
      setConversations(prev => prev.filter(c => !selectedIds.has(c.lead_id)));
      if (selectedIds.has(activeId)) { setActiveId(null); setMessages([]); }
      toast.success(`Deleted ${ids.length} conversation${ids.length > 1 ? 's' : ''}.`);
      exitSelectMode();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to delete conversations'); }
    finally { setBulkBusy(false); }
  };

  const handleBulkMarkRead = async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      await whatsappAPI.markConversationsRead(ids);
      window.dispatchEvent(new Event('whatsapp-unread-changed'));
      setConversations(prev => prev.map(c => (selectedIds.has(c.lead_id) ? { ...c, unread_count: 0 } : c)));
      toast.success('Marked as read.');
      exitSelectMode();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to mark as read'); }
    finally { setBulkBusy(false); }
  };

  return (
    <div className="h-full">
      {/* The hub's tabs already title this page; the chat gets the height instead. */}
      <h1 className="sr-only">WhatsApp Inbox</h1>
      <div className="grid grid-cols-1 min-[900px]:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_280px] gap-4 h-[calc(100dvh-190px)] min-h-[480px]">
        {/* Conversations */}
        <div className={`min-w-0 bg-white border rounded-2xl flex-col overflow-hidden ${activeId ? 'hidden min-[900px]:flex' : 'flex'}`}>
          <div className="p-4 pb-3 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900">Conversations</h2>
              <button onClick={() => setShowNewChat(true)} title="Message a number that isn't a lead yet"
                className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                <MessageSquarePlus size={14} /> New chat
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..."
                  className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div className="relative shrink-0" data-filter-menu>
                <button onClick={() => setShowFilterMenu(v => !v)}
                  className={`p-2 border rounded-lg shrink-0 ${labelFilter ? 'bg-brand-50 text-brand-600 border-brand-300' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <SlidersHorizontal size={15} />
                </button>
                {showFilterMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border rounded-lg shadow-lg z-20 py-1">
                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">Filter by label</p>
                    <button onClick={() => { setLabelFilter(null); setShowFilterMenu(false); }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-medium ${!labelFilter ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                      All labels
                    </button>
                    {[...new Set([...PRESET_LABELS, ...conversations.flatMap(c => c.tags || [])])].map(l => (
                      <button key={l} onClick={() => { setLabelFilter(l); setShowFilterMenu(false); }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-medium ${labelFilter === l ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
                title={selectMode ? 'Cancel selection' : 'Select conversations'}
                className={`p-2 border rounded-lg shrink-0 ${selectMode ? 'bg-brand-50 text-brand-600 border-brand-300' : 'text-gray-500 hover:bg-gray-50'}`}>
                <ListChecks size={15} />
              </button>
            </div>
            {selectMode ? (
              <div className="flex items-center justify-between gap-2 mt-3">
                <button onClick={toggleSelectAll} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900">
                  {selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare size={15} className="text-brand-600" /> : <Square size={15} />}
                  {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={handleBulkMarkRead} disabled={!selectedIds.size || bulkBusy}
                    title="Mark as read" className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-30">
                    <MailOpen size={15} />
                  </button>
                  <button onClick={handleBulkDelete} disabled={!selectedIds.size || bulkBusy}
                    title="Delete" className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30">
                    <Trash2 size={15} />
                  </button>
                  <button onClick={exitSelectMode} title="Cancel" className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                    <X size={15} />
                  </button>
                </div>
              </div>
            ) : (
            <div className="flex gap-4 mt-3">
              {TABS.map(t => {
                const count = t.id === 'unread' ? unreadCount : t.id === 'starred' ? starredCount : conversations.length;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`pb-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                    {t.label} ({count})
                  </button>
                );
              })}
            </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 px-4">
                <MessageCircle size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm font-medium">No conversations found</p>
              </div>
            ) : filtered.map(c => (
              <button key={c.lead_id} onClick={() => (selectMode ? toggleSelected(c.lead_id) : setActiveId(c.lead_id))}
                className={`w-full p-4 text-left flex items-start gap-3 border-b transition-colors ${activeId === c.lead_id && !selectMode ? 'bg-brand-50' : selectedIds.has(c.lead_id) ? 'bg-brand-50/60' : 'hover:bg-gray-50'}`}>
                {selectMode && (
                  selectedIds.has(c.lead_id)
                    ? <CheckSquare size={18} className="text-brand-600 shrink-0 mt-1" />
                    : <Square size={18} className="text-gray-300 shrink-0 mt-1" />
                )}
                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(c.lead_name)}`}>
                  {initials(c.lead_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-gray-900 truncate">{c.lead_name || 'Unknown'}</p>
                    <span className="text-xs text-gray-400 shrink-0">{relTime(c.sent_at)}</span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${c.direction === 'outbound' && c.status === 'failed' ? 'text-red-600' : c.message ? 'text-gray-500' : 'italic text-gray-400'}`}>
                    {c.direction === 'outbound' && c.status === 'failed' ? `Failed to send: ${c.message || ''}` : c.message || 'No messages yet — tap to start chatting'}
                  </p>
                  {(c.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {c.tags.slice(0, 3).map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">{t}</span>
                      ))}
                      {c.tags.length > 3 && <span className="text-[10px] text-gray-400">+{c.tags.length - 3}</span>}
                    </div>
                  )}
                </div>
                {c.unread_count > 0 && (
                  <span className="bg-green-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0 mt-1">
                    {c.unread_count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat panel */}
        <div className={`min-w-0 bg-white border rounded-2xl flex-col overflow-hidden ${activeId ? 'flex' : 'hidden min-[900px]:flex'}`}>
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageCircle size={40} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium">Select a conversation to start</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b">
                <button className="min-[900px]:hidden text-sm text-brand-600" onClick={()=>setActiveId(null)}>← Conversations</button>
                <button className="xl:hidden text-sm text-brand-600" aria-expanded={detailsOpen} onClick={()=>setDetailsOpen(true)}>Contact details</button>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(active.lead_name)}`}>
                    {initials(active.lead_name)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{active.lead_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{active.lead_phone}{active.sent_at ? ` · Last message ${relTime(active.sent_at)}` : ''}{active.assigned_to_name ? ` · ${active.assigned_to_name}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {true && (
                    active.ai_paused ? (
                      <button onClick={() => handleToggleAi(false)} title="AI and automation are paused — click to resume"
                        className="mr-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 hover:bg-violet-50 hover:text-violet-700 flex items-center gap-1">
                        <Bot size={12} /> Human took over · Resume
                      </button>
                    ) : (
                      <button onClick={() => handleToggleAi(true)} title="Pause AI and automation for this lead"
                        className="mr-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-700 hover:bg-violet-200 flex items-center gap-1">
                        <Bot size={12} /> Take over
                      </button>
                    )
                  )}
                  <button onClick={(e) => toggleStar(active.lead_id, e)} className="p-2 hover:bg-gray-50 rounded-lg">
                    <Star size={16} className={starredIds.has(active.lead_id) ? 'text-amber-400 fill-amber-400' : 'text-gray-400'} />
                  </button>
                  <div className="relative" data-chat-menu>
                    <button onClick={() => setShowChatMenu(v => !v)} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400">
                      <MoreVertical size={16} />
                    </button>
                    {showChatMenu && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white border rounded-lg shadow-lg z-30 py-1">
                        <button onClick={() => { setViewLeadId(active.lead_id); setShowChatMenu(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700">
                          View Contact
                        </button>
                        <button onClick={handleClearChat} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700">
                          Clear Chat
                        </button>
                        <button onClick={handleDeleteConversation} className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-500">
                          Delete Conversation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div ref={messagesContainerRef} onScroll={handleMessagesScroll} className="flex-1 overflow-y-auto px-4 py-4 bg-[#f8f7f4]">
                {msgLoading ? (
                  <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400">No messages yet</div>
                ) : (
                  <>
                    {messages.map((m, i) => {
                      const outbound = m.direction === 'outbound';
                      const prev = messages[i - 1];
                      const next = messages[i + 1];
                      const newDay = i === 0 || dayKey(m.sent_at) !== dayKey(prev.sent_at);
                      // Consecutive messages from the same side, close together in time, are
                      // visually grouped (tight spacing, rounded tail only on the last one) —
                      // rather than every message getting identical full-bubble spacing.
                      const sameGroup = (a, b) => a && b && a.direction === b.direction
                        && dayKey(a.sent_at) === dayKey(b.sent_at)
                        && Math.abs(new Date(b.sent_at) - new Date(a.sent_at)) < 5 * 60 * 1000;
                      const groupStart = newDay || !sameGroup(prev, m);
                      const groupEnd = !sameGroup(m, next);
                      return (
                        <div key={m.id || i} className={groupStart ? 'pt-3 first:pt-0' : 'pt-0.5'}>
                          {newDay && (
                            <div className="flex justify-center mb-4">
                              <span className="text-[11px] font-medium text-gray-500 bg-white px-3 py-1 rounded-full border shadow-sm">{dayLabel(m.sent_at)}</span>
                            </div>
                          )}
                        <div className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm border ${
                            outbound ? 'bg-emerald-50 border-emerald-100 text-gray-800' : 'bg-white border-gray-100 shadow-sm text-gray-800'
                          } ${groupEnd ? (outbound ? 'rounded-br-md' : 'rounded-bl-md') : ''}`}>
                            <MessageBody m={m} templateBody={m.template_name ? templateBodyByName.get(m.template_name) : undefined} />
                            <div className={`flex items-center gap-1 mt-1 ${outbound ? 'justify-end' : ''}`}>
                              <span className="text-[10px] text-gray-400">
                                {fmtClock(m.sent_at)}
                              </span>
                              {outbound && (
                                m.status === 'sending' ? <Clock size={12} className="text-gray-300" title="Sending…" />
                                : m.status === 'failed' ? <AlertCircle size={13} className="text-red-500" title={m.error_detail || 'Failed to send'} />
                                : m.status === 'read' ? <CheckCheck size={13} className="text-blue-500" title="Read" />
                                : m.status === 'delivered' ? <CheckCheck size={13} className="text-gray-400" title="Delivered" />
                                : <Check size={13} className="text-gray-400" title="Sent" />
                              )}
                            </div>
                            {outbound && m.status === 'failed' && (
                              <div className="mt-1.5 pt-1.5 border-t border-red-100 text-[11px] text-red-600">
                                <span className="font-semibold">Not delivered</span>{m.error_detail ? ` · ${m.error_detail}` : ''}
                                {m.message_type === 'text' && m.message && (
                                  <button onClick={() => retryMessage(m)} disabled={retryingId === m.id}
                                    className="ml-2 font-semibold underline hover:text-red-700 disabled:opacity-50">
                                    {retryingId === m.id ? 'Retrying…' : 'Retry'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        </div>
                      );
                    })}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              <InboxComposer
                leadId={activeId} leadName={active.lead_name} messages={messages} messagesLoading={msgLoading}
                setMessages={setMessages} onSent={() => { patchConversation(activeId, { ai_paused: true }); loadInbox(true); }}
                onOpenBrochure={() => setShowBrochureModal(true)} />
            </>
          )}
        </div>

        {/* Contact details */}
        {detailsOpen&&<button aria-label="Close contact details" className="fixed inset-0 z-40 bg-black/40 xl:hidden" onClick={()=>setDetailsOpen(false)}/>}
        <div role={detailsOpen?'dialog':undefined} aria-label="Contact details" className={`bg-white border rounded-2xl overflow-y-auto p-4 xl:static xl:block xl:w-auto xl:z-auto ${detailsOpen?'fixed inset-y-0 right-0 z-50 w-80 max-w-[90vw]':'hidden'}`}>
          <button className="xl:hidden mb-3 text-sm text-brand-600" onClick={()=>setDetailsOpen(false)}>Close details</button>
          {!active ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <UserCircle2 size={40} />
            </div>
          ) : (
            <>
              <h2 className="font-bold text-gray-900 mb-4">Contact Details</h2>
              <div className="flex flex-col items-center text-center mb-4">
                <div className={`relative w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold mb-2 ${avatarColor(active.lead_name)}`}>
                  {initials(active.lead_name)}
                </div>
                <p className="font-semibold text-gray-900">{active.lead_name || 'Unknown'}</p>
                <p className="text-xs text-gray-400">{active.lead_phone}</p>
              </div>
              <button onClick={() => setViewLeadId(active.lead_id)}
                className="w-full py-2 border rounded-lg text-sm font-medium text-brand-600 hover:bg-brand-50 flex items-center justify-center gap-1.5 mb-5">
                <UserCircle2 size={15} /> View Contact
              </button>

              <div className="mb-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Contact</p>
                <div className="space-y-2.5">
                  {active.lead_phone && <ContactRow icon={Phone} label="Phone" value={active.lead_phone} href={`tel:${String(active.lead_phone).replace(/[^\d+]/g, '')}`} onCopy={copyValue} />}
                  {active.lead_email && <ContactRow icon={Mail} label="Email" value={active.lead_email} href={`mailto:${active.lead_email}`} onCopy={copyValue} />}
                  {active.business_name && <ContactRow icon={Building2} label="Business" value={active.business_name} />}
                  {(active.lead_city || active.address) && <ContactRow icon={MapPin} label="Location" value={[active.address, active.lead_city].filter(Boolean).join(', ')} />}
                  {(active.source || active.campaign_name) && <ContactRow icon={Megaphone} label="Came from" value={[active.source && sourceLabel(active.source), active.campaign_name].filter(Boolean).join(' · ')} />}
                  {active.lead_number && <ContactRow icon={Hash} label="Lead ID" value={active.lead_number} onCopy={copyValue} />}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                  {active.stage && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 capitalize">{active.stage}</span>}
                  {active.lead_score && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 capitalize">Score: {active.lead_score}</span>}
                  {active.lead_since && <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">Lead since {fmtDate(active.lead_since)}</span>}
                </div>
              </div>

              <ChatAttributes key={activeId} lead={active} onSave={data=>patchConversation(activeId,data)}/>
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">About</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">First Message</span><span className="text-gray-700 font-medium">{messages[0]?.sent_at ? fmtDate(messages[0].sent_at) : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Last Message</span><span className="text-gray-700 font-medium">{active.sent_at ? fmtClock(active.sent_at) || '—' : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Total Messages</span><span className="text-gray-700 font-medium">{messages.length}</span></div>
                  {(() => {
                    const lastIn = lastInboundAt(messages);
                    const left = lastIn ? lastIn + 24 * 60 * 60 * 1000 - Date.now() : -1;
                    return (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Reply window</span>
                        {left > 0
                          ? <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">Open · {fmtRemaining(left)} left</span>
                          : <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">Closed · template only</span>}
                      </div>
                    );
                  })()}
                  {true && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Automation</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${active.ai_paused ? 'bg-gray-100 text-gray-600' : 'bg-violet-100 text-violet-700'}`}>
                        {active.ai_paused ? 'Paused' : 'Active'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-400 shrink-0">Assigned to</span>
                    {isAdmin ? (
                      <select value={active.assigned_to || ''} onChange={e => handleAssign(e.target.value)}
                        className="min-w-0 max-w-[140px] px-1.5 py-1 border rounded-lg text-xs bg-white text-gray-700">
                        <option value="">Unassigned</option>
                        {staff.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                      </select>
                    ) : (
                      <span className="text-gray-700 font-medium truncate">{active.assigned_to_name || 'Unassigned'}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-5 relative">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Labels</p>
                  <button onClick={() => setShowLabelPicker(v => !v)} className="text-xs font-semibold text-brand-600 hover:underline">+ Add Label</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeLabels.map(label => (
                    <span key={label} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {label}
                      <button onClick={() => removeLabel(label)} className="hover:text-green-900"><X size={11} /></button>
                    </span>
                  ))}
                </div>

                {showLabelPicker && (
                  <div className="absolute right-0 top-6 z-20 w-56 bg-white border rounded-lg shadow-lg p-3">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {PRESET_LABELS.filter(l => !activeLabels.includes(l)).map(l => (
                        <button key={l} onClick={() => addLabel(l)}
                          className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-brand-50 hover:text-brand-600">
                          {l}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input value={customLabel} onChange={e => setCustomLabel(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addLabel(customLabel)}
                        placeholder="Custom label..."
                        className="flex-1 px-2 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-300" />
                      <button onClick={() => addLabel(customLabel)} className="px-2 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold">Add</button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Previous Conversations</p>
                  <button onClick={() => setViewLeadId(active.lead_id)} className="text-xs font-semibold text-brand-600 hover:underline">View all</button>
                </div>
                <div className="text-sm text-gray-400 text-center py-4 border rounded-lg">No previous conversations</div>
              </div>
            </>
          )}
        </div>
      </div>

      {viewLeadId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
          <div className="fixed inset-0 bg-black/50" onClick={() => setViewLeadId(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-[60] h-0">
              <button onClick={() => setViewLeadId(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-white hover:bg-gray-100 rounded-full shadow border">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <LeadDetailPage leadId={viewLeadId} onClose={() => setViewLeadId(null)} />
            </div>
          </div>
        </div>
      )}

      {showBrochureModal && activeId && (
        <ShareBrochureModal
          leadId={activeId}
          onClose={() => setShowBrochureModal(false)}
          onShared={handleBrochureShared}
        />
      )}

      {showNewChat && (
        <NewChatModal onClose={() => setShowNewChat(false)} onStart={handleStartChat} />
      )}
    </div>
  );
};

export default WhatsAppInboxPage;
