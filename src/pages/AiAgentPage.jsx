import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Bot, ChevronDown, ArrowRight, RefreshCw } from 'lucide-react';
import { whatsappAPI } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { Card, Toggle, Loading, ErrorBox, useLoad } from '../components/whatsapp/hubUi';

const BUSINESS_TYPES = ['E-commerce', 'Service Business', 'Real Estate', 'Restaurant', 'Education', 'Healthcare', 'Other'];

const REVIEW_FIELDS = [
  { key: 'about', label: 'About the business', rows: 3 },
  { key: 'services_prices', label: 'Services and prices', rows: 5 },
  { key: 'faqs', label: 'FAQs', rows: 5 },
  { key: 'tone', label: 'Tone and style', rows: 2 },
  { key: 'goal', label: 'Main goal', rows: 2 },
  { key: 'never_say', label: 'Never say or promise', rows: 2 },
  { key: 'handoff_rules', label: 'Hand off to a human when', rows: 2 },
];

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

const emptySetupForm = () => ({
  website: '', businessType: 'E-commerce', groundRules: '', businessContext: '', agentName: '', greeting: '',
});

// Step 1: tell the AI about the business (website + a few setup answers).
const SetupWizard = ({ onClose, onDrafted }) => {
  const toast = useToast();
  const [form, setForm] = useState(emptySetupForm());
  const [drafting, setDrafting] = useState(false);
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.website.trim()) return toast.error('Website is required.');
    setDrafting(true);
    try {
      const { data } = await whatsappAPI.hubDraftAiAgent(form);
      onDrafted(data.knowledge, form.agentName);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to read that website. Try again.');
    } finally { setDrafting(false); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b">
          <h3 className="font-bold text-base flex items-center gap-2"><Sparkles size={16} className="text-brand-600" /> Set up your AI Agent</h3>
          <p className="text-xs text-gray-500 mt-1">Give it your website and a few answers — it drafts everything else, and you review before it goes live.</p>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Website <span className="text-red-500">*</span></label>
            <input value={form.website} onChange={set('website')} placeholder="https://yourbusiness.com"
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Business type</label>
            <InlineSelect value={form.businessType} onChange={v => setForm(f => ({ ...f, businessType: v }))} options={BUSINESS_TYPES} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Anything the website won't tell it <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea value={form.businessContext} onChange={set('businessContext')} rows={2}
              placeholder="e.g. we only serve women, walk-ins need a 10-min wait on weekends"
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ground rules <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea value={form.groundRules} onChange={set('groundRules')} rows={2}
              placeholder="e.g. never discuss competitors, always ask for the customer's name first"
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Agent name <span className="text-gray-400 font-normal">(optional)</span></label>
              <input value={form.agentName} onChange={set('agentName')} placeholder="e.g. Priya"
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Greeting <span className="text-gray-400 font-normal">(optional)</span></label>
              <input value={form.greeting} onChange={set('greeting')} placeholder="e.g. Hi! How can I help?"
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={drafting}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 flex items-center gap-1.5">
            <Sparkles size={14} /> {drafting ? 'Reading your website…' : 'Draft my AI Agent'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Step 2: review/edit what the AI drafted before it goes live.
const ReviewDraft = ({ draft, onBack, onActivated }) => {
  const toast = useToast();
  const [k, setK] = useState(draft);
  const [saving, setSaving] = useState(false);

  const activate = async () => {
    setSaving(true);
    try {
      await whatsappAPI.hubSaveAiKnowledge({ enabled: true, knowledge: k });
      toast.success('AI Agent is live on WhatsApp.');
      onActivated();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="p-5 border-b">
          <h3 className="font-bold text-base">Review before it goes live</h3>
          <p className="text-xs text-gray-500 mt-1">Drafted from your website — edit anything that's off, especially prices.</p>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto">
          {REVIEW_FIELDS.map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
              <textarea value={k[f.key] || ''} onChange={e => setK(prev => ({ ...prev, [f.key]: e.target.value }))}
                rows={f.rows} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          ))}
        </div>
        <div className="p-4 border-t flex justify-between gap-2">
          <button onClick={onBack} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Back</button>
          <button onClick={activate} disabled={saving}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
            {saving ? 'Activating…' : 'Activate AI Agent'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AiAgentPage = () => {
  const toast = useToast();
  const { data, error, loading, reload } = useLoad(() => whatsappAPI.hubGetAiKnowledge());
  const [showWizard, setShowWizard] = useState(false);
  const [draft, setDraft] = useState(null);

  const hasAgent = !!(data?.knowledge?.about || '').trim();

  const toggleEnabled = async (enabled) => {
    try {
      await whatsappAPI.hubSaveAiKnowledge({ enabled, knowledge: data.knowledge });
      reload();
      toast.success(enabled ? 'AI Agent turned on.' : 'AI Agent turned off.');
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save'); }
  };

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox>{error}</ErrorBox>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {!hasAgent ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <Bot size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 max-w-sm mx-auto mb-4">Build a WhatsApp AI agent from your website that chats with leads and answers questions automatically.</p>
          <button onClick={() => setShowWizard(true)}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 inline-flex items-center gap-2">
            <Sparkles size={16} /> Set up my AI Agent
          </button>
        </div>
      ) : (
        <Card
          title="Your AI Agent"
          action={<Toggle checked={!!data.enabled} onChange={toggleEnabled} />}
        >
          <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">{data.knowledge.about}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowWizard(true)}
              className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
              <RefreshCw size={12} /> Regenerate from website
            </button>
            <Link to="/whatsapp?tab=ai"
              className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-brand-700 hover:bg-brand-50 flex items-center gap-1.5">
              Fine-tune manually <ArrowRight size={12} />
            </Link>
          </div>
        </Card>
      )}

      {showWizard && !draft && (
        <SetupWizard onClose={() => setShowWizard(false)} onDrafted={(k) => setDraft(k)} />
      )}
      {draft && (
        <ReviewDraft draft={draft} onBack={() => setDraft(null)}
          onActivated={() => { setDraft(null); setShowWizard(false); reload(); }} />
      )}
    </div>
  );
};

export default AiAgentPage;
