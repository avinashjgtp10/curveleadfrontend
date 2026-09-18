import { useEffect, useState } from 'react';
import { MessageCircle, Store, Send } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import EmptyState from '../../components/ui/EmptyState';
import { superAdminAPI } from '../../services/api';

const SuperAdminWhatsAppPage = () => {
  const [conversations, setConversations] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [search, setSearch] = useState('');
  const [wsSearch, setWsSearch] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('all');
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    superAdminAPI.getTenants().then(({ data }) => setTenants(data.tenants || [])).catch(() => {});
    superAdminAPI.getWhatsAppConversations()
      .then(({ data }) => {
        const list = data.conversations || [];
        setConversations(list);
        if (list.length) setActiveId(list[0].id);
      })
      .catch((e) => { if (e.response?.status === 404) setUnavailable(true); else console.error(e); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeId) return;
    setMessagesLoading(true);
    superAdminAPI.getWhatsAppMessages(activeId)
      .then(({ data }) => setMessages(data.messages || []))
      .catch(console.error)
      .finally(() => setMessagesLoading(false));
  }, [activeId]);

  // Per-workspace conversation counts + most recent message time, derived from the
  // already-fetched conversation list so switching workspaces needs no extra request.
  const workspaceStats = tenants.reduce((acc, t) => {
    const own = conversations.filter(c => c.tenant_id === t.id);
    acc[t.id] = {
      count: own.length,
      lastAt: own.reduce((max, c) => (!max || new Date(c.last_message_at) > new Date(max) ? c.last_message_at : max), null),
    };
    return acc;
  }, {});

  const visibleTenants = tenants
    .filter(t => t.name?.toLowerCase().includes(wsSearch.trim().toLowerCase()))
    .sort((a, b) => (workspaceStats[b.id]?.count || 0) - (workspaceStats[a.id]?.count || 0));

  const selectWorkspace = (tenantId) => {
    setSelectedTenantId(tenantId);
    const pool = tenantId === 'all' ? conversations : conversations.filter(c => c.tenant_id === tenantId);
    setActiveId(pool.length ? pool[0].id : null);
  };

  const filtered = conversations.filter(c => {
    if (selectedTenantId !== 'all' && c.tenant_id !== selectedTenantId) return false;
    const q = search.trim().toLowerCase();
    return !q || c.lead_name?.toLowerCase().includes(q) || c.tenant_name?.toLowerCase().includes(q) || c.lead_phone?.includes(q);
  });

  const active = conversations.find(c => c.id === activeId);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    const optimistic = { id: `tmp-${Date.now()}`, direction: 'outbound', text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    setDraft('');
    try {
      await superAdminAPI.sendWhatsAppMessage(activeId, text);
    } catch (e) {
      console.error(e);
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      alert('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (unavailable) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <PageHeader title="WhatsApp" subtitle="Conversations across every workspace." />
        <div className="bg-white rounded-2xl border p-10">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <MessageCircle size={26} />
          </div>
          <EmptyState message="WhatsApp conversations aren't exposed to Super Admin yet, so there's nothing real to show here." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader title="WhatsApp" subtitle="Conversations across every workspace (read-only)." />

      <div className="bg-white rounded-2xl border grid grid-cols-1 md:grid-cols-[220px_300px_1fr] h-[calc(100vh-220px)] min-h-[420px] overflow-hidden">
        <div className="border-r flex flex-col min-h-0">
          <div className="p-3 border-b">
            <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center justify-between">
              Workspaces <span className="text-indigo-600 bg-indigo-50 rounded-full px-1.5 py-0.5">{tenants.length}</span>
            </p>
            <SearchInput value={wsSearch} onChange={setWsSearch} placeholder="Search workspace..." />
          </div>
          <div className="flex-1 overflow-y-auto p-1.5">
            <button onClick={() => selectWorkspace('all')}
              className={`w-full text-left px-2.5 py-2 rounded-lg text-xs mb-1 flex items-center justify-between ${selectedTenantId === 'all' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
              <span>All Workspaces</span>
              <span className="text-[10px] text-gray-400">{conversations.length}</span>
            </button>
            {visibleTenants.map(t => (
              <button key={t.id} onClick={() => selectWorkspace(t.id)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs mb-1 ${selectedTenantId === t.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'}`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-medium truncate">{t.name}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">{workspaceStats[t.id]?.count || 0}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {workspaceStats[t.id]?.lastAt ? `Last ${new Date(workspaceStats[t.id].lastAt).toLocaleDateString('en-IN')}` : 'No messages'}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="border-r flex flex-col min-h-0">
          <div className="p-3 border-b">
            <SearchInput value={search} onChange={setSearch} placeholder="Search lead, phone, or workspace..." />
          </div>
          <div className="flex-1 overflow-y-auto divide-y">
            {loading ? (
              <div className="p-6 text-center text-gray-400 text-sm">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-6"><EmptyState message="No conversations found." /></div>
            ) : filtered.map(c => (
              <button key={c.id} onClick={() => setActiveId(c.id)}
                className={`w-full text-left p-3.5 hover:bg-gray-50 ${activeId === c.id ? 'bg-indigo-50' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm text-gray-800 truncate">{c.lead_name}</span>
                  <span className="text-[11px] text-gray-400 shrink-0">{c.last_message_at ? new Date(c.last_message_at).toLocaleDateString('en-IN') : ''}</span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{c.last_message}</p>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-indigo-600">
                  <Store size={11} /> {c.tenant_name}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col min-h-0">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-gray-300">
              <MessageCircle size={40} />
            </div>
          ) : (
            <>
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-gray-800">{active.lead_name}</p>
                  <p className="text-xs text-gray-400">{active.lead_phone} · {active.tenant_name}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messagesLoading ? (
                  <div className="text-center text-gray-400 text-sm">Loading…</div>
                ) : messages.length === 0 ? (
                  <EmptyState message="No messages in this conversation." />
                ) : messages.map(m => (
                  <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm ${m.direction === 'outbound' ? 'bg-emerald-100 text-gray-800' : 'bg-white border text-gray-700'}`}>
                      <p>{m.text}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 p-3 border-t">
                <input value={draft} onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..." disabled={sending}
                  className="flex-1 px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50" />
                <button onClick={handleSend} disabled={sending || !draft.trim()}
                  className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 shrink-0">
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminWhatsAppPage;
