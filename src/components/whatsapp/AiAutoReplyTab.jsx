import { useEffect, useState } from 'react';
import { whatsappAPI } from '../../services/api';
import { useToast } from '../ui/Toast';
import { Upload, FileText, Trash2 } from 'lucide-react';
import { Card, Empty, ErrorBox, Loading, Toggle, fmtDateTime, useLoad } from './hubUi';

const SHARE_FILE_ACTIONS = [
  { key: 'send_demo', label: 'Demo video / images', hint: 'Sent when the AI judges a lead is interested and would benefit from seeing the product/service.' },
  { key: 'send_pricing', label: 'Pricing brochure', hint: 'Sent when the AI judges a lead is ready for pricing details.' },
];

const FIELDS = [
  { key: 'about', label: 'About the business', rows: 3, placeholder: 'What you do, where you are, who your customers are.' },
  { key: 'services_prices', label: 'Services and prices', rows: 5, placeholder: 'Hair spa — ₹1,500\nBridal makeup — from ₹15,000\nOffers this month: …' },
  { key: 'faqs', label: 'FAQs', rows: 5, placeholder: 'Q: Do you take walk-ins?\nA: Yes, but appointments get priority.\nQ: Timings?\nA: 10am–8pm, Mon–Sat.' },
  { key: 'tone', label: 'Tone and style', rows: 2, placeholder: 'Short, warm, Hinglish-friendly. Use the customer\'s name. One question at a time.' },
  { key: 'goal', label: 'Main goal', rows: 2, placeholder: 'Get the customer to book a visit this week. Offer two time slots.' },
  { key: 'never_say', label: 'Never say or promise', rows: 2, placeholder: 'Never quote a price not listed above. Never promise results or discounts.' },
  { key: 'handoff_rules', label: 'Hand off to a human when', rows: 2, placeholder: 'They ask for a discount, complain, want to reschedule, or are ready to pay.' },
  { key: 'example_chats', label: 'Example conversations', rows: 6, placeholder: 'Customer: Hi, price for bridal makeup?\nYou: Hi Priya! Bridal starts at ₹15,000 and includes … Which date is the wedding?' },
];

const AiAutoReplyTab = () => {
  const toast = useToast();
  const { data, error, loading } = useLoad(() => whatsappAPI.hubGetAiKnowledge());
  const replies = useLoad(() => whatsappAPI.hubAiReplies());
  const [enabled, setEnabled] = useState(false);
  const [k, setK] = useState({});
  const [saving, setSaving] = useState(false);
  const [shareFiles, setShareFiles] = useState({});
  const [uploadingAction, setUploadingAction] = useState(null);

  useEffect(() => { if (data) { setEnabled(data.enabled); setK(data.knowledge || {}); setShareFiles(data.share_files || {}); } }, [data]);

  const uploadShareFile = async (action, file) => {
    setUploadingAction(action);
    try {
      const { data: res } = await whatsappAPI.hubUploadAiShareFile(action, file);
      setShareFiles(res.share_files);
      toast.success('File saved.');
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to upload file'); }
    finally { setUploadingAction(null); }
  };

  const removeShareFile = async (action) => {
    try {
      const { data: res } = await whatsappAPI.hubRemoveAiShareFile(action);
      setShareFiles(res.share_files);
    } catch (e) { toast.error('Failed to remove file'); }
  };

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox>{error}</ErrorBox>;

  const save = async () => {
    setSaving(true);
    try { await whatsappAPI.hubSaveAiKnowledge({ enabled, knowledge: k }); toast.success('AI training saved.'); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const filled = FIELDS.filter(f => (k[f.key] || '').trim()).length;

  return (
    <div className="space-y-4">
      <Card>
        <Toggle checked={enabled} onChange={setEnabled} label="AI auto-reply on WhatsApp"
          hint="When on, the AI answers incoming messages from leads, qualifies them, and hands off to your team when it isn't sure. A human reply from the inbox pauses it for that lead." />
      </Card>

      <Card title="Files the AI can share">
        <p className="text-xs text-gray-500 mb-4">
          When the AI decides a lead is ready for it, it sends the matching file below right after its text reply — no staff needed. Leave a slot empty and the AI simply won't attach anything for that moment.
        </p>
        <div className="space-y-3">
          {SHARE_FILE_ACTIONS.map(a => {
            const file = shareFiles[a.key];
            const uploading = uploadingAction === a.key;
            return (
              <div key={a.key} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{a.label}</p>
                  <p className="text-[11px] text-gray-400">{a.hint}</p>
                </div>
                {file ? (
                  <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-2.5 py-1.5 shrink-0">
                    <FileText size={13} className="text-gray-400" />
                    <span className="text-xs font-medium max-w-[140px] truncate">{file.name}</span>
                    <button onClick={() => removeShareFile(a.key)} className="text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                ) : (
                  <label className={`shrink-0 px-3 py-1.5 border border-dashed rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-50 flex items-center gap-1.5 ${uploading ? 'opacity-50 pointer-events-none' : 'text-gray-600'}`}>
                    <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.mp4,.3gp,.pdf"
                      onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) uploadShareFile(a.key, f); }} />
                    <Upload size={12} /> {uploading ? 'Uploading…' : 'Upload'}
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card title={`Train your AI (${filled}/${FIELDS.length} filled)`}
        action={<button onClick={save} disabled={saving}
          className="px-4 py-1.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>}>
        <p className="text-xs text-gray-500 mb-4">
          The AI only knows what you write here. The more real prices, FAQs and example chats you add, the better and safer its replies. It is told never to invent prices.
        </p>
        <div className="space-y-4">
          {FIELDS.map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
              <textarea value={k[f.key] || ''} rows={f.rows} maxLength={4000}
                onChange={e => setK(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Recent AI replies (review them, then improve the training above)">
        {replies.loading ? <Loading /> : !replies.data?.replies?.length ? <Empty>No AI replies yet.</Empty> : (
          <div className="space-y-3">
            {replies.data.replies.map(r => (
              <div key={r.id} className="text-sm border-b last:border-0 pb-3 last:pb-0">
                <p className="text-xs text-gray-400 mb-1">{r.lead_name} · {fmtDateTime(r.sent_at)}</p>
                {r.lead_message && <p className="text-gray-600"><span className="font-medium">Lead:</span> {r.lead_message}</p>}
                <p className="text-gray-900"><span className="font-medium text-violet-600">AI:</span> {r.reply}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AiAutoReplyTab;
