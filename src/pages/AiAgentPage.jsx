import { useState } from 'react';
import { Sparkles, Globe, MessageSquare, X, Bot, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';

const BUSINESS_TYPES = ['E-commerce', 'Service Business', 'Real Estate', 'Restaurant', 'Education', 'Healthcare', 'Other'];

// Renders its options inline (pushing content down) instead of a native <select> popup,
// which can render in the wrong place inside a scrollable modal.
const InlineSelect = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2 border rounded-lg text-sm bg-white flex items-center justify-between focus:ring-2 focus:ring-brand-500 focus:outline-none">
        <span>{value}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-1 border rounded-lg overflow-hidden divide-y">
          {options.map(opt => (
            <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm ${opt === value ? 'bg-brand-50 text-brand-700 font-medium' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const emptyAiAgentForm = () => ({
  website: '',
  businessType: 'E-commerce',
  groundRules: '',
  businessContext: '',
  agentName: '',
  greeting: '',
});

const AiAgentSetupModal = ({ initial, onClose, onSave }) => {
  const toast = useToast();
  const [form, setForm] = useState(initial || emptyAiAgentForm());
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.website.trim()) return toast.error('Website is required.');
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <MessageSquare size={16} className="text-white" />
            </div>
            <h2 className="font-semibold text-gray-900">Set up your AI Agent</h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="text-center pb-1">
            <div className="w-11 h-11 mx-auto rounded-xl bg-brand-50 flex items-center justify-center mb-3">
              <Globe size={20} className="text-brand-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Let's build your agent from your website</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Tell us about your business — we'll read your pages in the background and have your agent ready to test.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">
              Website <span className="text-red-500">*</span>
            </label>
            <input value={form.website} onChange={set('website')} placeholder="https://yourstore.com"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
            <p className="text-xs text-gray-400 mt-1">We'll crawl this to build your agent's knowledge.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">Business type</label>
            <InlineSelect value={form.businessType} onChange={v => setForm(f => ({ ...f, businessType: v }))} options={BUSINESS_TYPES} />
            <p className="text-xs text-gray-400 mt-1">Your agent can recommend products and take payment with a checkout link.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">Anything special it should know?</label>
            <textarea value={form.groundRules} onChange={set('groundRules')} rows={3}
              placeholder="Optional ground rules — e.g. Never promise same-day delivery. Always mention the festive 15% off above ₹1,000."
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-brand-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">Business context</label>
            <textarea value={form.businessContext} onChange={set('businessContext')} rows={2}
              placeholder="Describe what the business does. Leave blank to draft it from your website."
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-brand-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">Agent / business name</label>
            <input value={form.agentName} onChange={set('agentName')} placeholder="How the agent introduces itself"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">Greeting message</label>
            <input value={form.greeting} onChange={set('greeting')} placeholder="Sent word-for-word as the first message (optional)"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-4 border-t shrink-0">
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
            <Sparkles size={14} />
            {saving ? 'Creating…' : 'Create agent'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AiAgentPage = () => {
  const toast = useToast();
  const confirm = useConfirmDialog();
  const [agents, setAgents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const openNew = () => { setEditing(null); setShowModal(true); };
  const openEdit = (a) => { setEditing(a); setShowModal(true); };

  const handleSave = async (form) => {
    // Wire up to a real endpoint when the backend is ready — for now the agent lives in local state.
    if (editing) {
      setAgents(list => list.map(a => a.id === editing.id ? { ...a, ...form } : a));
      toast.error('Agent updated.');
    } else {
      setAgents(list => [...list, { id: Date.now(), ...form }]);
      toast.error('AI agent created — it will finish learning your website shortly.');
    }
  };

  const handleDelete = async (id) => {
    if (!await confirm({ title: 'Delete this AI agent?' })) return;
    setAgents(list => list.filter(a => a.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Build a WhatsApp AI agent from your website that chats with leads and answers questions automatically.</p>
        <button onClick={openNew}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 flex items-center gap-2">
          <Sparkles size={16} /> Create agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <Bot size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No AI agents yet. Create one from your website to start chatting with leads.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Bot size={20} className="text-brand-600" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(a)} className="p-1.5 text-gray-400 hover:text-brand-600 rounded"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 size={14} /></button>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{a.agentName || 'Untitled agent'}</h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{a.website}</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 w-fit">{a.businessType}</span>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AiAgentSetupModal
          initial={editing || undefined}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default AiAgentPage;
