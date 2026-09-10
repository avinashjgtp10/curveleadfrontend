import { useEffect, useState } from 'react';
import { whatsappAPI } from '../../services/api';
import { X, MessageCircle, AlertCircle, CheckCircle, Send, Plus, ArrowLeft } from 'lucide-react';
import { useToast } from '../ui/Toast';

const FIELD_OPTIONS = [
  { value: 'name', label: "Lead Name" },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'location', label: 'Location' },
  { value: 'stage', label: 'Stage' },
  { value: 'assigned_to_name', label: 'Assigned Rep Name' },
];

const CATEGORIES = ['MARKETING', 'UTILITY', 'AUTHENTICATION'];
const LANGUAGES = [
  { value: 'en_US', label: 'English (US)' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
];

const STATUS_STYLE = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const getComponent = (tmpl, type) => tmpl.components?.find(c => c.type === type);

const countVars = (text) => {
  if (!text) return 0;
  const nums = [...text.matchAll(/\{\{(\d+)\}\}/g)].map(m => parseInt(m[1], 10));
  return nums.length ? Math.max(...nums) : 0;
};

// v1 only sends BODY parameters — a template is unsupported if its header
// carries media or its own variables, since we have nowhere to source those.
const isSupported = (tmpl) => {
  const header = getComponent(tmpl, 'HEADER');
  if (header && (header.format !== 'TEXT' || countVars(header.text) > 0)) return false;
  return true;
};

const emptyCreateForm = () => ({ name: '', category: 'MARKETING', language: 'en_US', body_text: '' });

const WhatsAppBroadcastModal = ({ leads, onClose, onSent }) => {
  const toast = useToast();
  const [step, setStep] = useState('pick');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [mapping, setMapping] = useState([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const [createForm, setCreateForm] = useState(emptyCreateForm());
  const [createExamples, setCreateExamples] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadTemplates = () => {
    setLoading(true);
    setLoadError('');
    whatsappAPI.getBroadcastTemplates()
      .then(({ data }) => setTemplates(data.templates || []))
      .catch(e => setLoadError(e.response?.data?.error || 'Failed to load templates'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTemplates(); }, []);

  const bodyText = selectedTemplate ? getComponent(selectedTemplate, 'BODY')?.text || '' : '';
  const varCount = countVars(bodyText);
  const sampleLead = leads[0] || {};

  const handleSelectTemplate = (tmpl) => {
    setSelectedTemplate(tmpl);
    const body = getComponent(tmpl, 'BODY')?.text || '';
    const n = countVars(body);
    setMapping(Array.from({ length: n }, (_, i) => ({ position: i + 1, source: 'field', value: 'name' })));
    setStep('map');
  };

  const previewText = () => {
    let text = bodyText;
    mapping.forEach(m => {
      const value = m.source === 'fixed' ? (m.value || `{{${m.position}}}`) : (sampleLead[m.value] || `{{${m.position}}}`);
      text = text.replace(new RegExp(`\\{\\{${m.position}\\}\\}`, 'g'), value);
    });
    return text;
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const { data } = await whatsappAPI.sendBroadcast({
        lead_ids: leads.map(l => l.id),
        template_name: selectedTemplate.name,
        language_code: selectedTemplate.language,
        body_text: bodyText,
        variable_mapping: mapping,
      });
      setResult(data);
      setStep('result');
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to send broadcast'); }
    finally { setSending(false); }
  };

  const mappingComplete = mapping.every(m => m.source === 'field' || (m.value || '').trim());

  const createVarCount = countVars(createForm.body_text);
  useEffect(() => {
    setCreateExamples(prev => Array.from({ length: createVarCount }, (_, i) => prev[i] || ''));
  }, [createVarCount]);

  const openCreate = () => {
    setCreateForm(emptyCreateForm());
    setCreateExamples([]);
    setCreateError('');
    setStep('create');
  };

  const handleCreateTemplate = async () => {
    setCreateError('');
    if (!/^[a-z0-9_]+$/.test(createForm.name)) {
      return setCreateError('Name must be lowercase letters, numbers, and underscores only (e.g. order_update).');
    }
    if (!createForm.body_text.trim()) return setCreateError('Body text is required.');
    if (createVarCount > 0 && createExamples.some(e => !e.trim())) {
      return setCreateError('Provide an example value for every {{n}} variable — Meta requires this for review.');
    }
    setCreating(true);
    try {
      const { data } = await whatsappAPI.createBroadcastTemplate({
        name: createForm.name,
        category: createForm.category,
        language: createForm.language,
        body_text: createForm.body_text,
        examples: createExamples,
      });
      toast.success(`Template submitted — status: ${data.status}. Meta usually reviews within a few hours.`);
      loadTemplates();
      setStep('pick');
    } catch (e) { setCreateError(e.response?.data?.error || 'Failed to submit template'); }
    finally { setCreating(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MessageCircle size={18} className="text-green-600" /> WhatsApp Broadcast
            <span className="text-xs font-normal text-gray-400">· {leads.length} lead{leads.length > 1 ? 's' : ''}</span>
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'pick' && (
            <div className="space-y-3">
              <button onClick={openCreate}
                className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                <Plus size={14} /> Create New Template
              </button>

              {loading ? (
                <div className="text-center py-6 text-gray-400">Loading templates...</div>
              ) : loadError ? (
                <div className="text-sm text-amber-700 bg-amber-50 px-3 py-3 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> {loadError}
                </div>
              ) : templates.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No templates yet — create one above to submit it for Meta's approval.</p>
              ) : (
                <div className="space-y-2">
                  {templates.map(t => {
                    const supported = isSupported(t) && t.status === 'APPROVED';
                    return (
                      <button key={`${t.name}-${t.language}`} disabled={!supported} onClick={() => handleSelectTemplate(t)}
                        className={`w-full text-left p-3 rounded-xl border transition-colors ${supported ? 'hover:bg-gray-50 border-gray-200' : 'opacity-60 cursor-not-allowed border-gray-100'}`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm">{t.name}</p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_STYLE[t.status] || 'bg-gray-100 text-gray-500'}`}>{t.status}</span>
                            <span className="text-[10px] font-semibold uppercase text-gray-400">{t.category}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{getComponent(t, 'BODY')?.text}</p>
                        {t.status === 'APPROVED' && !isSupported(t) && <p className="text-[11px] text-amber-600 mt-1">Not supported — this template has a media or variable header.</p>}
                        {t.status === 'REJECTED' && <p className="text-[11px] text-red-600 mt-1">Rejected by Meta — edit and resubmit under a new name.</p>}
                        {t.status === 'PENDING' && <p className="text-[11px] text-amber-600 mt-1">Awaiting Meta's review.</p>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 'create' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Template Name</label>
                <input value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                  placeholder="e.g. order_update" className="w-full px-3 py-2 border rounded-lg text-sm" />
                <p className="text-[11px] text-gray-400 mt-1">Lowercase letters, numbers, underscores only — Meta rejects anything else.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <select value={createForm.category} onChange={e => setCreateForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Language</label>
                  <select value={createForm.language} onChange={e => setCreateForm(f => ({ ...f, language: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Body Text</label>
                <textarea value={createForm.body_text} onChange={e => setCreateForm(f => ({ ...f, body_text: e.target.value }))}
                  rows={4} placeholder={'Hi {{1}}, your order is on its way. Track it here: {{2}}'}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
                <p className="text-[11px] text-gray-400 mt-1">Use <code className="bg-gray-100 px-1 rounded">{'{{1}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{2}}'}</code>... for variables. Header, footer, and buttons aren't supported yet.</p>
              </div>

              {createVarCount > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">Example values <span className="font-normal text-gray-400">(required by Meta for review)</span></p>
                  {createExamples.map((ex, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-gray-100 px-1.5 py-1 rounded shrink-0">{`{{${i + 1}}}`}</span>
                      <input value={ex} onChange={e => setCreateExamples(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}
                        placeholder="e.g. Priya" className="flex-1 px-2 py-1.5 border rounded-lg text-sm" />
                    </div>
                  ))}
                </div>
              )}

              {createError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{createError}</p>}
            </div>
          )}

          {step === 'map' && selectedTemplate && (
            <div className="space-y-4">
              <div className="bg-gray-50 border rounded-xl p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Preview (using "{sampleLead.name || 'first selected lead'}")</p>
                <p className="text-sm whitespace-pre-wrap">{previewText()}</p>
              </div>

              {varCount === 0 ? (
                <p className="text-sm text-gray-500">This template has no variables — ready to send as-is.</p>
              ) : mapping.map((m, i) => (
                <div key={m.position} className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-gray-100 px-1.5 py-1 rounded shrink-0">{`{{${m.position}}}`}</span>
                  <select value={m.source === 'fixed' ? 'fixed' : m.value}
                    onChange={e => {
                      const v = e.target.value;
                      setMapping(prev => prev.map((row, idx) => idx === i
                        ? (v === 'fixed' ? { ...row, source: 'fixed', value: '' } : { ...row, source: 'field', value: v })
                        : row));
                    }}
                    className="flex-1 px-2 py-1.5 border rounded-lg text-sm bg-white">
                    {FIELD_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    <option value="fixed">Fixed value…</option>
                  </select>
                  {m.source === 'fixed' && (
                    <input value={m.value} onChange={e => {
                      const v = e.target.value;
                      setMapping(prev => prev.map((row, idx) => idx === i ? { ...row, value: v } : row));
                    }} placeholder="Type a value" className="flex-1 px-2 py-1.5 border rounded-lg text-sm" />
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-3 rounded-lg text-sm">
                <CheckCircle size={16} /> {result.sent} sent{result.failed > 0 ? `, ${result.failed} failed` : ''}
              </div>
              {result.failed > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {result.results.filter(r => !r.success).map(r => {
                    const lead = leads.find(l => l.id === r.lead_id);
                    return (
                      <div key={r.lead_id} className="text-xs bg-red-50 text-red-700 px-2.5 py-2 rounded-lg">
                        <span className="font-medium">{lead?.name || r.lead_id}</span> — {r.error || 'Failed'}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex gap-2">
          {step === 'create' && (
            <>
              <button onClick={() => setStep('pick')} className="px-4 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50 flex items-center gap-1.5">
                <ArrowLeft size={14} /> Back
              </button>
              <button onClick={handleCreateTemplate} disabled={creating}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
                {creating ? 'Submitting…' : 'Submit for Approval'}
              </button>
            </>
          )}
          {step === 'map' && (
            <>
              <button onClick={() => setStep('pick')} className="px-4 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50">Back</button>
              <button onClick={handleSend} disabled={sending || !mappingComplete}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {sending ? 'Sending…' : <><Send size={14} /> Send to {leads.length} lead{leads.length > 1 ? 's' : ''}</>}
              </button>
            </>
          )}
          {step === 'result' && (
            <button onClick={() => onSent?.()} className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700">Done</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppBroadcastModal;
