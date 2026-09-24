import { useEffect, useState } from 'react';
import { whatsappAPI } from '../../services/api';
import { CheckCircle, Upload, Sparkles, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '../ui/Toast';

const CATEGORIES = ['MARKETING', 'UTILITY', 'AUTHENTICATION'];
const LANGUAGES = [
  { value: 'en_US', label: 'English (US)' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
];

const countVars = (text) => {
  if (!text) return 0;
  const nums = [...text.matchAll(/\{\{(\d+)\}\}/g)].map(m => parseInt(m[1], 10));
  return nums.length ? Math.max(...nums) : 0;
};

const emptyCreateForm = () => ({ name: '', category: 'MARKETING', language: 'en_US', body_text: '', footer_text: '' });

// Create a WhatsApp message template (manually or drafted by AI) and submit it
// to Meta for approval. Shared by the Templates page and the broadcast modal.
const TemplateCreateForm = ({ onCreated, onCancel }) => {
  const toast = useToast();
  const [createForm, setCreateForm] = useState(emptyCreateForm());
  const [createExamples, setCreateExamples] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [buttons, setButtons] = useState([]); // { type: 'QUICK_REPLY' | 'URL', text, url? }
  const [aiBrief, setAiBrief] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [imageIdea, setImageIdea] = useState('');
  const [headerType, setHeaderType] = useState('NONE'); // NONE | IMAGE | VIDEO | DOCUMENT
  const [headerUploading, setHeaderUploading] = useState(false);
  const [headerMedia, setHeaderMedia] = useState(null); // { url, handle, media_type, fileName }

  const createVarCount = countVars(createForm.body_text);
  useEffect(() => {
    setCreateExamples(prev => Array.from({ length: createVarCount }, (_, i) => prev[i] || ''));
  }, [createVarCount]);

  const handleAiDraft = async () => {
    setCreateError('');
    if (aiBrief.trim().length < 10) return setCreateError('Describe what the template is for (at least a sentence).');
    setDrafting(true);
    try {
      const { data } = await whatsappAPI.aiDraftTemplate({ brief: aiBrief, category: createForm.category, language: createForm.language });
      const d = data.draft;
      setCreateForm(f => ({ ...f, name: d.name || f.name, body_text: d.body_text, footer_text: d.footer_text || '' }));
      setCreateExamples(d.examples || []);
      setButtons(d.buttons || []);
      setImageIdea(d.image_idea || '');
      toast.success('Draft ready — review and edit it before submitting.');
    } catch (e) { setCreateError(e.response?.data?.error || 'Failed to draft template'); }
    finally { setDrafting(false); }
  };

  const handleHeaderFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setHeaderMedia(null);
    setCreateError('');
    setHeaderUploading(true);
    try {
      const { data } = await whatsappAPI.uploadBroadcastMedia(file, headerType);
      setHeaderMedia({ ...data, fileName: file.name });
    } catch (e2) { setCreateError(e2.response?.data?.error || 'Failed to upload file'); }
    finally { setHeaderUploading(false); }
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
    if (headerType !== 'NONE' && !headerMedia) {
      return setCreateError('Upload a file for the header, or set Header back to None.');
    }
    setCreating(true);
    try {
      const { data } = await whatsappAPI.createBroadcastTemplate({
        name: createForm.name,
        category: createForm.category,
        language: createForm.language,
        body_text: createForm.body_text,
        examples: createExamples,
        footer_text: createForm.footer_text,
        buttons: buttons.filter(b => b.text.trim()),
        ...(headerMedia ? { header_type: headerType, header_handle: headerMedia.handle, header_media_url: headerMedia.url } : {}),
      });
      toast.success(`Template submitted — status: ${data.status}. Meta usually reviews within a few hours.`);
      onCreated?.(data);
    } catch (e) { setCreateError(e.response?.data?.error || 'Failed to submit template'); }
    finally { setCreating(false); }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3 space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-violet-700">
            <Sparkles size={13} /> Draft with AI
          </label>
          <textarea value={aiBrief} onChange={e => setAiBrief(e.target.value)} rows={2}
            placeholder="e.g. Festive discount on hair spa for existing customers, ask them to book this week"
            className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm bg-white" />
          <button onClick={handleAiDraft} disabled={drafting}
            className="w-full py-1.5 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700 disabled:opacity-50">
            {drafting ? 'Drafting…' : 'Generate template'}
          </button>
          <p className="text-[11px] text-gray-500">Uses the category and language selected below. You can edit everything before it goes to Meta.</p>
        </div>
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
          <label className="block text-xs font-medium text-gray-600 mb-1">Header <span className="text-gray-400 font-normal">(optional)</span></label>
          <div className="flex items-center gap-2">
            <select value={headerType}
              onChange={e => { setHeaderType(e.target.value); setHeaderMedia(null); setCreateError(''); }}
              className="px-2 py-1.5 border rounded-lg text-sm bg-white">
              <option value="NONE">None</option>
              <option value="IMAGE">Image</option>
              <option value="VIDEO">Video</option>
              <option value="DOCUMENT">Document</option>
            </select>
            {headerType !== 'NONE' && (
              <label className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-dashed rounded-lg text-xs font-medium cursor-pointer ${headerMedia ? 'border-green-300 text-green-700 bg-green-50' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                <input type="file" className="hidden" onChange={handleHeaderFileSelect}
                  accept={headerType === 'IMAGE' ? '.jpg,.jpeg,.png' : headerType === 'VIDEO' ? '.mp4,.3gp' : '.pdf'} />
                {headerUploading ? 'Uploading…' : headerMedia ? <><CheckCircle size={13} /> {headerMedia.fileName}</> : <><Upload size={13} /> Choose file</>}
              </label>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Body Text</label>
          <textarea value={createForm.body_text} onChange={e => setCreateForm(f => ({ ...f, body_text: e.target.value }))}
            rows={4} placeholder={'Hi {{1}}, your order is on its way. Track it here: {{2}}'}
            className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
          <p className="text-[11px] text-gray-400 mt-1">Use <code className="bg-gray-100 px-1 rounded">{'{{1}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{2}}'}</code>... for variables.</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Footer <span className="text-gray-400 font-normal">(optional, max 60)</span></label>
          <input value={createForm.footer_text} maxLength={60}
            onChange={e => setCreateForm(f => ({ ...f, footer_text: e.target.value }))}
            placeholder="e.g. Reply STOP to opt out" className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600">Buttons <span className="text-gray-400 font-normal">(optional, max 3)</span></label>
            {buttons.length < 3 && (
              <button onClick={() => setButtons(b => [...b, { type: 'QUICK_REPLY', text: '' }])}
                className="text-xs text-brand-600 font-medium hover:underline">+ Add button</button>
            )}
          </div>
          {buttons.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <select value={b.type} onChange={e => setButtons(prev => prev.map((x, idx) => idx === i ? { ...x, type: e.target.value } : x))}
                className="px-2 py-1.5 border rounded-lg text-xs bg-white">
                <option value="QUICK_REPLY">Quick reply</option>
                <option value="URL">Link</option>
              </select>
              <input value={b.text} maxLength={25} placeholder="Button text"
                onChange={e => setButtons(prev => prev.map((x, idx) => idx === i ? { ...x, text: e.target.value } : x))}
                className="flex-1 min-w-0 px-2 py-1.5 border rounded-lg text-sm" />
              {b.type === 'URL' && (
                <input value={b.url || ''} placeholder="https://…"
                  onChange={e => setButtons(prev => prev.map((x, idx) => idx === i ? { ...x, url: e.target.value } : x))}
                  className="flex-1 min-w-0 px-2 py-1.5 border rounded-lg text-sm" />
              )}
              <button onClick={() => setButtons(prev => prev.filter((_, idx) => idx !== i))} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        {imageIdea && (
          <p className="text-[11px] text-violet-700 bg-violet-50 rounded-lg px-3 py-2">
            <span className="font-semibold">Header image idea:</span> {imageIdea}
          </p>
        )}

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
      <div className="flex gap-2 justify-end pt-1">
        {onCancel && (
          <button onClick={onCancel} className="px-4 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50 flex items-center gap-1.5">
            <ArrowLeft size={14} /> Back
          </button>
        )}
        <button onClick={handleCreateTemplate} disabled={creating || headerUploading}
          className="px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
          {creating ? 'Submitting…' : 'Submit for Approval'}
        </button>
      </div>
    </div>
  );
};

export default TemplateCreateForm;
