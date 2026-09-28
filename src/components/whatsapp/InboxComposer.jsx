import { useEffect, useMemo, useRef, useState } from 'react';
import { whatsappAPI, attachmentsAPI, templateAPI } from '../../services/api';
import { useToast } from '../ui/Toast';
import { Paperclip, Send, Smile, Zap, Layers, X, Search, Clock, Image as ImageIcon, FileText, Lock } from 'lucide-react';

const EMOJIS = ['😀','😁','😂','🤣','😊','😍','😘','😎','🤔','😅','😉','🙂','😢','😭','😡','👍','👎','🙏','👏','💪','🔥','🎉','❤️','💯'];
const WINDOW_MS = 24 * 60 * 60 * 1000;

// WhatsApp only allows free-text/media within 24h of the customer's last message.
export const lastInboundAt = (messages) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].direction === 'inbound') return new Date(messages[i].sent_at).getTime();
  }
  return null;
};

export const fmtRemaining = (ms) => {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  return h > 0 ? `${h}h ${totalMin % 60}m` : `${totalMin}m`;
};

// Pick an approved template (with its variables) to start or restart a conversation.
const TemplatePickerModal = ({ leadId, leadName, onClose, onSent }) => {
  const toast = useToast();
  const [templates, setTemplates] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [vars, setVars] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    whatsappAPI.getSendableTemplates()
      .then(({ data }) => setTemplates(data.templates || []))
      .catch(e => setError(e.response?.data?.error || 'Failed to load templates.'));
  }, []);

  const pick = (t) => {
    setSelected(t);
    setVars(Array.from({ length: t.variable_count }, (_, i) => (i === 0 ? (leadName || '').trim().split(/\s+/)[0] : '')));
  };

  const preview = selected ? selected.body_text.replace(/\{\{(\d+)\}\}/g, (m, n) => (vars[n - 1]?.trim() ? vars[n - 1] : m)) : '';
  const canSend = !!selected && vars.every(v => v.trim());

  const filtered = (templates || []).filter(t => `${t.name} ${t.body_text}`.toLowerCase().includes(search.toLowerCase()));

  const send = async () => {
    setSending(true);
    try {
      const { data } = await whatsappAPI.sendTemplate(leadId, {
        template_name: selected.name, language_code: selected.language, template_params: vars, body_text: selected.body_text,
      });
      onSent(data.message);
      if (data.delivery?.success === false) toast.error(`Not delivered: ${data.delivery.error || 'WhatsApp rejected it.'}`);
      else toast.success('Template sent.');
      onClose();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to send template'); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2"><Layers size={18} className="text-brand-600" /> Send a template</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3">
          {error ? (
            <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">{error}</p>
          ) : templates === null ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading templates…</p>
          ) : !selected ? (
            <>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…"
                  className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm" />
              </div>
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No approved templates{search ? ' match your search' : ' yet'}.</p>
              ) : filtered.map(t => (
                <button key={`${t.name}::${t.language}`} disabled={!!t.unsupported} onClick={() => pick(t)}
                  className={`w-full text-left p-3 rounded-xl border ${t.unsupported ? 'bg-gray-50 opacity-70 cursor-not-allowed' : 'hover:border-brand-300 hover:bg-brand-50/30'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase shrink-0">{t.category}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 whitespace-pre-wrap">{t.body_text}</p>
                  {t.unsupported && <p className="text-[11px] text-amber-600 mt-1">{t.unsupported}</p>}
                </button>
              ))}
            </>
          ) : (
            <>
              <button onClick={() => setSelected(null)} className="text-xs font-semibold text-brand-600 hover:underline">← Choose another</button>
              <p className="text-sm font-semibold text-gray-900">{selected.name}</p>
              {selected.variable_count > 0 && (
                <div className="space-y-2">
                  {vars.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-gray-100 px-1.5 py-1 rounded shrink-0">{`{{${i + 1}}}`}</span>
                      <input value={v} onChange={e => setVars(prev => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
                        placeholder={i === 0 ? 'e.g. customer name' : 'Value'} className="flex-1 px-2.5 py-1.5 border rounded-lg text-sm" />
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-xl p-3" style={{ background: '#e5ddd5' }}>
                <div className="bg-white rounded-lg rounded-tl-none px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap shadow-sm">{preview}</div>
              </div>
            </>
          )}
        </div>

        {selected && (
          <div className="flex justify-end gap-2 p-4 border-t">
            <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={send} disabled={!canSend || sending}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
              {sending ? 'Sending…' : 'Send template'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const InboxComposer = ({ leadId, leadName, messages, messagesLoading, setMessages, onSent, onOpenBrochure }) => {
  const toast = useToast();
  const [draft, setDraft] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(null); // null = not loaded yet
  const [savedQuery, setSavedQuery] = useState('');
  const [now, setNow] = useState(Date.now());
  const rootRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const draftsRef = useRef({});
  const draftValueRef = useRef('');
  draftValueRef.current = draft;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // Each chat keeps its own unsent draft, like WhatsApp itself does.
  useEffect(() => {
    setDraft(draftsRef.current[leadId] || '');
    setShowEmoji(false); setShowAttach(false); setShowSaved(false); setSavedQuery('');
    return () => { draftsRef.current[leadId] = draftValueRef.current; };
  }, [leadId]);

  useEffect(() => {
    const handler = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) { setShowEmoji(false); setShowAttach(false); setShowSaved(false); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [draft]);

  const lastIn = useMemo(() => lastInboundAt(messages), [messages]);
  const windowLeft = lastIn ? lastIn + WINDOW_MS - now : -1;
  const windowOpen = windowLeft > 0;
  const windowKnown = !messagesLoading;

  // Typing "/" at the start of a message searches saved replies.
  const slashMode = /^\/\S*$/.test(draft);
  const popoverOpen = windowOpen && (showSaved || slashMode);
  const query = slashMode ? draft.slice(1) : savedQuery;

  useEffect(() => {
    if (!popoverOpen || saved !== null) return;
    templateAPI.getAll({ channel: 'whatsapp' })
      .then(({ data }) => setSaved(data.templates || []))
      .catch(() => setSaved([]));
  }, [popoverOpen, saved]);

  const filteredSaved = (saved || []).filter(t => `${t.name} ${t.message}`.toLowerCase().includes(query.toLowerCase()));

  const insertSaved = async (t) => {
    let text = t.message;
    try { const { data } = await templateAPI.generate(t.id, { lead_id: leadId }); text = data.message || text; } catch { /* fall back to raw text */ }
    setDraft(prev => (slashMode || !prev.trim() ? text : `${prev.trimEnd()}\n${text}`));
    setShowSaved(false); setSavedQuery('');
    textareaRef.current?.focus();
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !windowOpen) return;
    const tmpId = `tmp-${Date.now()}`;
    setMessages(prev => [...prev, { id: tmpId, direction: 'outbound', message: text, sent_at: new Date().toISOString(), status: 'sending' }]);
    setDraft('');
    try {
      const { data } = await whatsappAPI.send(leadId, text);
      setMessages(prev => prev.map(m => (m.id === tmpId ? data.message : m)));
      onSent?.();
      if (data.delivery?.success === false) toast.error(`Message not delivered: ${data.delivery.error || 'WhatsApp rejected it.'}`);
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tmpId));
      if (e.response?.data?.window_closed) setDraft(text);
      toast.error(e.response?.data?.error || 'Failed to send message');
    }
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data: uploadData } = await attachmentsAPI.upload(leadId, formData);
      const { data } = await whatsappAPI.sendAttachment(leadId, uploadData.attachment.id);
      setMessages(prev => [...prev, data.message]);
      onSent?.();
      toast.success('File sent on WhatsApp');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to send file'); }
    finally { setUploading(false); }
  };

  const templateSent = (message) => { setMessages(prev => [...prev, message]); onSent?.(); };

  return (
    <div ref={rootRef} className="border-t">
      {windowKnown && !windowOpen && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border-b border-amber-100">
          <div className="flex items-start gap-2 text-sm text-amber-800 min-w-0">
            <Lock size={15} className="mt-0.5 shrink-0" />
            <span>
              {lastIn
                ? '24-hour reply window closed — WhatsApp only allows an approved template now.'
                : "This lead hasn't messaged you yet — start the conversation with an approved template."}
            </span>
          </div>
          <button onClick={() => setShowTemplates(true)}
            className="shrink-0 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 flex items-center gap-1.5">
            <Layers size={13} /> Send template
          </button>
        </div>
      )}
      {windowKnown && windowOpen && (
        <div className="px-4 pt-2 text-[11px] text-gray-400 flex items-center gap-1">
          <Clock size={11} /> Reply window open · {fmtRemaining(windowLeft)} left
        </div>
      )}

      <div className="relative px-4 py-3">
        {popoverOpen && (
          <div className="absolute left-4 bottom-full mb-1 w-80 max-h-64 overflow-y-auto bg-white border rounded-xl shadow-lg z-30">
            {!slashMode && (
              <div className="p-2 border-b sticky top-0 bg-white">
                <input autoFocus value={savedQuery} onChange={e => setSavedQuery(e.target.value)} placeholder="Search saved replies…"
                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs" />
              </div>
            )}
            {saved === null ? (
              <p className="text-xs text-gray-400 text-center py-4">Loading…</p>
            ) : filteredSaved.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4 px-3">
                {saved.length === 0 ? 'No saved replies yet — an admin can add them under WhatsApp → Saved replies.' : 'No saved replies match.'}
              </p>
            ) : filteredSaved.map(t => (
              <button key={t.id} onClick={() => insertSaved(t)} className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-0">
                <p className="text-xs font-semibold text-gray-800">{t.name}</p>
                <p className="text-xs text-gray-500 truncate">{t.message}</p>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-0.5 bg-white border border-gray-200 rounded-2xl shadow-sm px-2 py-1.5 focus-within:ring-2 focus-within:ring-brand-300 focus-within:border-brand-300 transition-shadow">
          <div className="relative">
            <button onClick={() => { setShowEmoji(v => !v); setShowAttach(false); setShowSaved(false); }} disabled={!windowOpen}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-full disabled:opacity-40"><Smile size={18} /></button>
            {showEmoji && (
              <div className="absolute left-0 bottom-full mb-1 w-64 bg-white border rounded-lg shadow-lg z-30 p-2 grid grid-cols-8 gap-1">
                {EMOJIS.map(emoji => (
                  <button key={emoji} onClick={() => { setDraft(d => d + emoji); setShowEmoji(false); textareaRef.current?.focus(); }}
                    className="text-lg hover:bg-gray-100 rounded p-1">{emoji}</button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => { setShowSaved(v => !v); setShowEmoji(false); setShowAttach(false); }} disabled={!windowOpen}
            title="Saved replies (or type /)" className="p-2 text-gray-400 hover:bg-gray-100 rounded-full disabled:opacity-40"><Zap size={18} /></button>
          <button onClick={() => setShowTemplates(true)} title="Send a template"
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><Layers size={18} /></button>

          <textarea ref={textareaRef} value={draft} rows={1} onChange={e => setDraft(e.target.value)} onKeyDown={handleKeyDown}
            disabled={windowKnown && !windowOpen}
            placeholder={windowKnown && !windowOpen ? 'Window closed — send a template to reply' : 'Type a message… (Shift+Enter for a new line, / for saved replies)'}
            className="flex-1 min-w-0 px-1.5 py-2 bg-transparent text-sm resize-none focus:outline-none disabled:text-gray-400" />

          <input ref={fileInputRef} type="file" hidden onChange={handleFileSelected} accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" />
          <div className="relative">
            <button onClick={() => { setShowAttach(v => !v); setShowEmoji(false); setShowSaved(false); }} disabled={uploading || !windowOpen}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-full disabled:opacity-40"><Paperclip size={18} /></button>
            {showAttach && (
              <div className="absolute right-0 bottom-full mb-1 w-48 bg-white border rounded-lg shadow-lg z-30 py-1">
                <button onClick={() => { setShowAttach(false); fileInputRef.current?.click(); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-2"><ImageIcon size={14} /> Attach File</button>
                <button onClick={() => { setShowAttach(false); onOpenBrochure(); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-2"><FileText size={14} /> Send Brochure</button>
              </div>
            )}
          </div>
          <button onClick={handleSend} disabled={!draft.trim() || !windowOpen}
            className="w-9 h-9 bg-brand-600 text-white rounded-full flex items-center justify-center hover:bg-brand-700 disabled:opacity-50 shrink-0 ml-0.5">
            <Send size={15} />
          </button>
        </div>
      </div>

      {showTemplates && (
        <TemplatePickerModal leadId={leadId} leadName={leadName} onClose={() => setShowTemplates(false)} onSent={templateSent} />
      )}
    </div>
  );
};

export default InboxComposer;
