import { useEffect, useMemo, useState } from 'react';
import { whatsappAPI, leadAPI } from '../services/api';
import { AVATAR_COLORS } from '../utils/constants';
import LeadDetailPage from './LeadDetailPage';
import {
  MessageCircle, Search, SlidersHorizontal, Star, MoreVertical,
  Paperclip, Send, Smile, Check, CheckCheck, UserCircle2, X,
} from 'lucide-react';

const avatarColor = (name) => AVATAR_COLORS[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
const initials = (name) => (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';

const fmtClock = (dt) => {
  const d = new Date(dt);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};
const fmtDate = (dt) => {
  const d = new Date(dt);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'starred', label: 'Starred' },
];

const WhatsAppInboxPage = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [starredIds, setStarredIds] = useState(new Set());
  const [activeId, setActiveId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const [labelsByLead, setLabelsByLead] = useState({});
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [viewLeadId, setViewLeadId] = useState(null);
  const [showChatMenu, setShowChatMenu] = useState(false);

  useEffect(() => { loadInbox(); }, []);

  useEffect(() => {
    if (!showChatMenu) return;
    const handler = (e) => { if (!e.target.closest('[data-chat-menu]')) setShowChatMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showChatMenu]);

  const loadInbox = async () => {
    setLoading(true);
    try {
      const [{ data: inboxData }, { data: leadData }] = await Promise.all([
        whatsappAPI.getInbox(),
        leadAPI.getAll({ limit: 50 }).catch(() => ({ data: { leads: [] } })),
      ]);
      const convList = inboxData.conversations || [];
      const convIds = new Set(convList.map(c => c.lead_id));
      const extraContacts = (leadData.leads || [])
        .filter(l => !convIds.has(l.id))
        .map(l => ({
          lead_id: l.id,
          lead_name: l.name,
          lead_phone: l.phone,
          last_message: null,
          last_message_at: null,
          unread_count: 0,
        }));
      const list = [...convList, ...extraContacts];
      setConversations(list);
      if (list.length && !activeId) setActiveId(list[0].lead_id);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!activeId) return;
    loadConversation(activeId);
  }, [activeId]);

  const loadConversation = async (leadId) => {
    setMsgLoading(true);
    try {
      const { data } = await whatsappAPI.getConversation(leadId);
      setMessages(data.messages || []);
    } catch (e) { console.error(e); setMessages([]); }
    finally { setMsgLoading(false); }
  };

  const activeLabels = labelsByLead[activeId] || ['Interested'];

  const addLabel = (label) => {
    const text = label.trim();
    if (!text || !activeId) return;
    setLabelsByLead(prev => {
      const existing = prev[activeId] || ['Interested'];
      if (existing.includes(text)) return prev;
      return { ...prev, [activeId]: [...existing, text] };
    });
    setCustomLabel('');
    setShowLabelPicker(false);
  };

  const removeLabel = (label) => {
    setLabelsByLead(prev => ({ ...prev, [activeId]: (prev[activeId] || ['Interested']).filter(l => l !== label) }));
  };

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

  const handleDeleteConversation = () => {
    setConversations(prev => prev.filter(c => c.lead_id !== activeId));
    setActiveId(null);
    setMessages([]);
    setShowChatMenu(false);
  };

  const filtered = useMemo(() => conversations
    .filter(c => {
      if (tab === 'unread') return c.unread_count > 0;
      if (tab === 'starred') return starredIds.has(c.lead_id);
      return true;
    })
    .filter(c =>
      (c.lead_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.lead_phone || '').includes(search)
    ), [conversations, tab, search, starredIds]);

  const unreadCount = conversations.filter(c => c.unread_count > 0).length;
  const starredCount = starredIds.size;

  const active = conversations.find(c => c.lead_id === activeId);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !activeId) return;
    setSending(true);
    const optimistic = { id: `tmp-${Date.now()}`, direction: 'outbound', text, created_at: new Date().toISOString(), status: 'sent' };
    setMessages(prev => [...prev, optimistic]);
    setDraft('');
    try {
      await whatsappAPI.send(activeId, text);
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  return (
    <div className="h-full">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
          <MessageCircle size={20} className="text-green-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">WhatsApp Inbox</h1>
          <p className="text-sm text-gray-500">Manage and respond to your customer conversations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_300px] gap-4 h-[calc(100vh-180px)]">
        {/* Conversations */}
        <div className="bg-white border rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 pb-3 border-b">
            <h2 className="font-bold text-gray-900 mb-3">Conversations</h2>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..."
                  className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <button className="p-2 border rounded-lg text-gray-500 hover:bg-gray-50 shrink-0">
                <SlidersHorizontal size={15} />
              </button>
            </div>
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
              <button key={c.lead_id} onClick={() => setActiveId(c.lead_id)}
                className={`w-full p-4 text-left flex items-start gap-3 border-b transition-colors ${activeId === c.lead_id ? 'bg-brand-50' : 'hover:bg-gray-50'}`}>
                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(c.lead_name)}`}>
                  {initials(c.lead_name)}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${c.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-gray-900 truncate">{c.lead_name || 'Unknown'}</p>
                    <span className="text-xs text-gray-400 shrink-0">{relTime(c.last_message_at)}</span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${c.last_message ? 'text-gray-500' : 'italic text-gray-400'}`}>
                    {c.last_message || 'No messages yet — tap to start chatting'}
                  </p>
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
        <div className="bg-white border rounded-2xl flex flex-col overflow-hidden">
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageCircle size={40} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium">Select a conversation to start</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(active.lead_name)}`}>
                    {initials(active.lead_name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-gray-900">{active.lead_name || 'Unknown'}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${active.is_online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {active.is_online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{active.lead_phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
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

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#f8f7f4]">
                {msgLoading ? (
                  <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400">No messages yet</div>
                ) : (
                  <>
                    <div className="flex justify-center">
                      <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full border">Today</span>
                    </div>
                    {messages.map((m, i) => {
                      const outbound = m.direction === 'outbound';
                      return (
                        <div key={m.id || i} className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${outbound ? 'bg-green-100 text-gray-800 rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'}`}>
                            <p>{m.text}</p>
                            <div className={`flex items-center gap-1 mt-1 ${outbound ? 'justify-end' : ''}`}>
                              <span className="text-[10px] text-gray-400">
                                {fmtClock(m.created_at)}
                              </span>
                              {outbound && (m.status === 'read'
                                ? <CheckCheck size={13} className="text-blue-500" />
                                : <Check size={13} className="text-gray-400" />)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 px-4 py-3 border-t">
                <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"><Smile size={18} /></button>
                <input value={draft} onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"><Paperclip size={18} /></button>
                <button onClick={handleSend} disabled={sending || !draft.trim()}
                  className="w-10 h-10 bg-brand-600 text-white rounded-full flex items-center justify-center hover:bg-brand-700 disabled:opacity-50 shrink-0">
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Contact details */}
        <div className="bg-white border rounded-2xl overflow-y-auto p-4 hidden lg:block">
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
                  <span className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white rounded-full ${active.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
                <p className="font-semibold text-gray-900">{active.lead_name || 'Unknown'}</p>
                <p className="text-xs text-gray-400">{active.lead_phone}</p>
              </div>
              <button onClick={() => setViewLeadId(active.lead_id)}
                className="w-full py-2 border rounded-lg text-sm font-medium text-brand-600 hover:bg-brand-50 flex items-center justify-center gap-1.5 mb-5">
                <UserCircle2 size={15} /> View Contact
              </button>

              <div className="mb-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">About</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">First Message</span><span className="text-gray-700 font-medium">{active.first_message_at ? fmtDate(active.first_message_at) : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Last Message</span><span className="text-gray-700 font-medium">{active.last_message_at ? fmtClock(active.last_message_at) || '—' : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Total Messages</span><span className="text-gray-700 font-medium">{messages.length}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-400">Status</span><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">Active</span></div>
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
    </div>
  );
};

export default WhatsAppInboxPage;
