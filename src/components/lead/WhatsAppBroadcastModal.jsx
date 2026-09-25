import { useEffect, useState } from 'react';
import { whatsappAPI } from '../../services/api';
import { X, MessageCircle, AlertCircle, CheckCircle, Send, Plus, ArrowLeft, Image as ImageIcon, Film, FileText, Upload, Search, Megaphone, Wrench, ShieldCheck, ChevronRight } from 'lucide-react';
import { useToast } from '../ui/Toast';
import TemplateCreateForm from '../whatsapp/TemplateCreateForm';

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
const STATUS_DOT = {
  APPROVED: 'bg-green-500',
  PENDING: 'bg-amber-500',
  REJECTED: 'bg-red-500',
};

const CATEGORY_STYLE = {
  MARKETING: { icon: Megaphone, iconWrap: 'bg-purple-50 text-purple-600', tag: 'text-purple-500' },
  UTILITY: { icon: Wrench, iconWrap: 'bg-blue-50 text-blue-600', tag: 'text-blue-500' },
  AUTHENTICATION: { icon: ShieldCheck, iconWrap: 'bg-amber-50 text-amber-600', tag: 'text-amber-500' },
};

const getComponent = (tmpl, type) => tmpl.components?.find(c => c.type === type);

const countVars = (text) => {
  if (!text) return 0;
  const nums = [...text.matchAll(/\{\{(\d+)\}\}/g)].map(m => parseInt(m[1], 10));
  return nums.length ? Math.max(...nums) : 0;
};

const MEDIA_ICON = { IMAGE: ImageIcon, VIDEO: Film, DOCUMENT: FileText };

// A template with a plain/no header is always supported. One with a text
// header carrying its own variable isn't (no way to source it). One with a
// media header is only supported if CurveLead has the matching file on
// record (attached when the template was created through this modal).
const isSupported = (tmpl) => {
  const header = getComponent(tmpl, 'HEADER');
  if (!header) return true;
  if (header.format === 'TEXT') return countVars(header.text) === 0;
  return !!tmpl.media_url;
};

const WhatsAppBroadcastModal = ({ leads, onClose, onSent }) => {
  const toast = useToast();
  const [step, setStep] = useState('pick');
  const [templateSearch, setTemplateSearch] = useState('');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [mapping, setMapping] = useState([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [sendMode, setSendMode] = useState('now'); // now | later
  const [scheduleAt, setScheduleAt] = useState('');



  const loadTemplates = () => {
    setLoading(true);
    setLoadError('');
    whatsappAPI.getBroadcastTemplates()
      .then(({ data }) => setTemplates(data.templates || []))
      .catch(e => setLoadError(e.response?.data?.error || 'Failed to load templates'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTemplates(); }, []);

  const filteredTemplates = templates.filter(t => {
    const q = templateSearch.trim().toLowerCase();
    if (!q) return true;
    return t.name.toLowerCase().includes(q) || (getComponent(t, 'BODY')?.text || '').toLowerCase().includes(q);
  });

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
    if (sendMode === 'later' && !scheduleAt) return toast.error('Pick a date and time to send.');
    setSending(true);
    try {
      const { data } = await whatsappAPI.sendBroadcast({
        ...(sendMode === 'later' ? { scheduled_at: new Date(scheduleAt).toISOString() } : {}),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl w-full max-h-[85vh] flex flex-col shadow-2xl ${step === 'create' ? 'max-w-3xl' : 'max-w-lg'}`}>
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
              <button onClick={() => setStep('create')}
                className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                <Plus size={14} /> Create New Template
              </button>

              {!loading && !loadError && templates.length > 0 && (
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={templateSearch} onChange={e => setTemplateSearch(e.target.value)}
                    placeholder="Search templates..."
                    className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                </div>
              )}

              {loading ? (
                <div className="text-center py-6 text-gray-400">Loading templates...</div>
              ) : loadError ? (
                <div className="text-sm text-amber-700 bg-amber-50 px-3 py-3 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> {loadError}
                </div>
              ) : templates.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No templates yet — create one above to submit it for Meta's approval.</p>
              ) : filteredTemplates.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No templates match "{templateSearch}"</p>
              ) : (
                <div className="space-y-2.5">
                  {filteredTemplates.map(t => {
                    const supported = isSupported(t) && t.status === 'APPROVED';
                    const cat = CATEGORY_STYLE[t.category] || CATEGORY_STYLE.UTILITY;
                    const CatIcon = cat.icon;
                    return (
                      <button key={`${t.name}-${t.language}`} disabled={!supported} onClick={() => handleSelectTemplate(t)}
                        className={`group w-full text-left p-3.5 rounded-2xl border transition-all ${supported ? 'bg-white border-gray-200 hover:border-brand-300 hover:shadow-md hover:shadow-brand-100/60' : 'bg-gray-50/60 border-gray-100 opacity-70 cursor-not-allowed'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cat.iconWrap}`}>
                            <CatIcon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-sm text-gray-900 truncate min-w-0" title={t.name}>{t.name}</p>
                              {supported && <ChevronRight size={16} className="text-gray-300 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />}
                            </div>
                            <div className="flex items-center gap-2 mt-1 mb-1.5">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_STYLE[t.status] || 'bg-gray-100 text-gray-500'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[t.status] || 'bg-gray-400'}`} />
                                {t.status}
                              </span>
                              <span className={`text-[10px] font-semibold uppercase tracking-wide ${cat.tag}`}>{t.category}</span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 flex items-center gap-1">
                              {t.media_type && MEDIA_ICON[t.media_type] && (() => { const Icon = MEDIA_ICON[t.media_type]; return <Icon size={11} className="text-gray-400 shrink-0" />; })()}
                              {getComponent(t, 'BODY')?.text}
                            </p>
                            {t.status === 'APPROVED' && !isSupported(t) && (
                              <p className="text-[11px] text-amber-600 mt-1.5">
                                {getComponent(t, 'HEADER')?.format === 'TEXT'
                                  ? 'Not supported — this template has a variable in its header.'
                                  : 'Media not on file — recreate this template through CurveLead to attach an image/video/document.'}
                              </p>
                            )}
                            {t.status === 'REJECTED' && <p className="text-[11px] text-red-600 mt-1.5">Rejected by Meta — edit and resubmit under a new name.</p>}
                            {t.status === 'PENDING' && <p className="text-[11px] text-amber-600 mt-1.5">Awaiting Meta's review.</p>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 'create' && (
            <TemplateCreateForm
              onCancel={() => setStep('pick')}
              onCreated={() => { loadTemplates(); setStep('pick'); }}
            />
          )}

          {step === 'map' && selectedTemplate && (
            <div className="space-y-4">
              {selectedTemplate.media_url && (
                selectedTemplate.media_type === 'IMAGE' ? (
                  <img src={selectedTemplate.media_url} alt="Header" className="w-full max-h-40 object-cover rounded-xl border" />
                ) : (
                  <div className="flex items-center gap-2 bg-gray-50 border rounded-xl p-3 text-sm text-gray-600">
                    {(() => { const Icon = MEDIA_ICON[selectedTemplate.media_type] || FileText; return <Icon size={16} />; })()}
                    {selectedTemplate.media_type === 'VIDEO' ? 'Video attached' : 'Document attached'}
                  </div>
                )
              )}
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

          {step === 'map' && selectedTemplate && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-gray-600">When to send</p>
              <div className="flex gap-2">
                {[['now', 'Send now'], ['later', 'Schedule for later']].map(([id, label]) => (
                  <button key={id} onClick={() => setSendMode(id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${sendMode === id ? 'bg-brand-600 text-white border-brand-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {label}
                  </button>
                ))}
              </div>
              {sendMode === 'later' && (
                <div>
                  <input type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)}
                    min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000 + 120000).toISOString().slice(0, 16)}
                    className="px-3 py-2 border rounded-lg text-sm" />
                  <p className="text-[11px] text-gray-400 mt-1">Your local time. You can cancel it any time before it starts, from WhatsApp → Messages → Broadcasts.</p>
                </div>
              )}
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-3 rounded-lg text-sm">
                <CheckCircle size={16} />
                {result.scheduled
                  ? `Scheduled for ${new Date(result.scheduled_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${result.count} lead${result.count > 1 ? 's' : ''}`
                  : `${result.sent} sent${result.failed > 0 ? `, ${result.failed} failed` : ''}`}
              </div>
              {!result.scheduled && result.failed > 0 && (
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

        <div className="p-4 border-t flex items-center justify-between gap-2">
          {step === 'map' && (
            <>
              <button onClick={() => setStep('pick')} className="px-4 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50">Back</button>
              <button onClick={handleSend} disabled={sending || !mappingComplete}
                className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {sending ? (sendMode === 'later' ? 'Scheduling…' : 'Sending…') : <><Send size={14} /> {sendMode === 'later' ? 'Schedule for' : 'Send to'} {leads.length} lead{leads.length > 1 ? 's' : ''}</>}
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
