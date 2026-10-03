import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, ImagePlus, Rocket, Sparkles, X } from 'lucide-react';
import { adsAPI } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { formatDateTime } from '../utils/dateTime.js';

// Ads Manager → Meta Ads → Create with AI. Brief → AI draft → review/edit → created on
// Meta PAUSED → activated only after typing the campaign name. Server re-validates every step.

const CTA_OPTIONS = {
  LEAD_FORM: ['BOOK_NOW', 'SIGN_UP', 'GET_QUOTE', 'LEARN_MORE', 'APPLY_NOW', 'CONTACT_US', 'GET_OFFER', 'SUBSCRIBE', 'DOWNLOAD'],
  WHATSAPP: ['WHATSAPP_MESSAGE'],
};
const label = (s) => s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
const STATUS = { draft: 'bg-gray-100 text-gray-600', creating: 'bg-blue-100 text-blue-700', created: 'bg-amber-100 text-amber-700', activated: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700' };
const input = 'w-full px-3 py-2 border rounded-lg text-sm';

const Field = ({ label: l, error, children, hint }) => (
  <label className="block">
    <span className="block text-xs font-medium text-gray-600 mb-1">{l}</span>
    {children}
    {hint && <span className="block text-[11px] text-gray-400 mt-0.5">{hint}</span>}
    {error && <span className="block text-[11px] text-red-600 mt-0.5">{error}</span>}
  </label>
);

const BriefStep = ({ onDrafted, onOpen }) => {
  const toast = useToast();
  const [brief, setBrief] = useState({ offer: '', goal: '', location: '', budget_per_day_inr: 500, duration_days: 14, language: 'en', destination: 'LEAD_FORM' });
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState([]);
  useEffect(() => { adsAPI.aiListDrafts().then(({ data }) => setDrafts(data.drafts || [])).catch(() => {}); }, []);
  const set = (k) => (e) => setBrief(b => ({ ...b, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    try {
      const { data } = await adsAPI.aiCreateDraft({ ...brief, budget_per_day_inr: Number(brief.budget_per_day_inr), duration_days: Number(brief.duration_days) });
      onDrafted(data);
    } catch (e) { toast.error(e.response?.data?.error || 'Could not draft the campaign.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <Field label="What are you advertising?" hint="The offer, price and who it's for — e.g. “Diwali hair spa at ₹999 for women in Baramati, this month only”.">
        <textarea rows={3} value={brief.offer} onChange={set('offer')} className={input} />
      </Field>
      <Field label="Goal (optional)"><input value={brief.goal} onChange={set('goal')} placeholder="e.g. 50 bookings before Diwali" className={input} /></Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="City"><input value={brief.location} onChange={set('location')} placeholder="Baramati" className={input} /></Field>
        <Field label="Ad language">
          <select value={brief.language} onChange={set('language')} className={`${input} bg-white`}>
            <option value="en">English</option><option value="hi">Hindi</option><option value="mr">Marathi</option>
          </select>
        </Field>
        <Field label="Budget per day (₹)"><input type="number" min="100" value={brief.budget_per_day_inr} onChange={set('budget_per_day_inr')} className={input} /></Field>
        <Field label="Run for (days)"><input type="number" min="1" max="90" value={brief.duration_days} onChange={set('duration_days')} className={input} /></Field>
      </div>
      <Field label="When someone taps the ad">
        <div className="grid grid-cols-2 gap-2">
          {[['LEAD_FORM', 'Instant lead form', 'Leads land in CurveLead automatically'], ['WHATSAPP', 'WhatsApp chat', 'Opens a chat with your business']].map(([v, t, d]) => (
            <button key={v} type="button" onClick={() => setBrief(b => ({ ...b, destination: v }))}
              className={`text-left rounded-xl border p-3 ${brief.destination === v ? 'border-brand-500 bg-brand-50' : 'hover:bg-gray-50'}`}>
              <span className="block text-sm font-semibold">{t}</span><span className="block text-[11px] text-gray-500">{d}</span>
            </button>
          ))}
        </div>
      </Field>
      <button onClick={submit} disabled={busy} className="w-full py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 inline-flex items-center justify-center gap-2">
        <Sparkles size={15} /> {busy ? 'Writing your ads… (up to a minute)' : 'Draft the campaign'}
      </button>
      {drafts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1.5">Earlier drafts</p>
          <ul className="divide-y border rounded-xl text-sm">
            {drafts.slice(0, 8).map(d => (
              <li key={d.id}><button onClick={() => onOpen(d.id)} className="w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-gray-50">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS[d.status]}`}>{d.status}</span>
                <span className="font-medium truncate">{d.campaign_name || d.brief?.offer}</span>
                <span className="ml-auto text-[11px] text-gray-400 shrink-0">{formatDateTime(d.created_at)}</span>
              </button></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const ReviewStep = ({ initial, onChanged }) => {
  const toast = useToast();
  const [rec, setRec] = useState(initial);
  const [d, setD] = useState(initial.draft);
  const [forms, setForms] = useState(null);
  const [busy, setBusy] = useState('');
  const [confirm, setConfirm] = useState('');
  const locked = !['draft', 'failed'].includes(rec.status);
  useEffect(() => { adsAPI.getLeadForms().then(({ data }) => setForms(data.forms || [])).catch(() => setForms([])); }, []);

  const errs = Object.fromEntries((rec.errors || []).map(e => [e.field, e.message]));
  const set = (k, v) => setD(x => ({ ...x, [k]: v }));
  const setList = (k, i, v) => setD(x => ({ ...x, [k]: x[k].map((t, j) => (j === i ? v : t)) }));
  const setForm = (patch) => setD(x => ({ ...x, lead_form: { ...x.lead_form, ...patch } }));

  const save = async () => {
    const { data } = await adsAPI.aiUpdateDraft(rec.id, { ...d, radius_km: Number(d.radius_km), age_min: Number(d.age_min), age_max: Number(d.age_max), daily_budget_inr: Number(d.daily_budget_inr), duration_days: Number(d.duration_days) });
    setRec(r => ({ ...r, ...data })); setD(data.draft); onChanged?.();
    return data;
  };
  const run = (key, fn) => async () => { setBusy(key); try { await fn(); } catch (e) { toast.error(e.response?.data?.error || 'Something went wrong.'); } finally { setBusy(''); } };

  const onImage = (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (file) run('image', async () => { const { data } = await adsAPI.aiUploadImage(rec.id, file); setRec(r => ({ ...r, image: data.image })); toast.success('Image added.'); })();
  };
  const create = run('create', async () => {
    const saved = await save();
    if (saved.errors.length) return toast.error(`Fix ${saved.errors.length} problem${saved.errors.length > 1 ? 's' : ''} first.`);
    try {
      const { data } = await adsAPI.aiCreateOnMeta(rec.id);
      setRec(r => ({ ...r, ...data })); onChanged?.();
      toast.success('Created on Meta — paused. Review it, then activate when ready.');
    } catch (e) {
      const { data } = await adsAPI.aiGetDraft(rec.id).catch(() => ({ data: null }));
      if (data) setRec(r => ({ ...r, ...data }));
      throw e;
    }
  });
  const activate = run('activate', async () => {
    await adsAPI.aiActivate(rec.id, confirm);
    setRec(r => ({ ...r, status: 'activated' })); onChanged?.();
    toast.success('Campaign is live on Meta.');
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS[rec.status]}`}>{rec.status}</span>
        {rec.ai_reasoning && <span className="text-xs text-gray-500">{rec.ai_reasoning}</span>}
      </div>

      {(rec.warnings || []).map((w, i) => <p key={i} className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2"><AlertTriangle size={13} className="mt-0.5 shrink-0" />{w.message}</p>)}
      {errs.copy && <p className="text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2">{rec.errors.filter(e => e.field === 'copy').map(e => e.message).join(' ')}</p>}
      {rec.error && <p className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2"><AlertCircle size={13} className="mt-0.5 shrink-0" />{rec.error}</p>}

      <fieldset disabled={locked} className="space-y-4 disabled:opacity-70">
        <Field label="Campaign name" error={errs.campaign_name}><input value={d.campaign_name} onChange={e => set('campaign_name', e.target.value)} className={input} /></Field>

        <div>
          <p className="text-xs font-medium text-gray-600 mb-1">Primary text — pick one, edit freely</p>
          <div className="space-y-2">
            {d.primary_texts.map((t, i) => (
              <div key={i} className={`flex gap-2 rounded-xl border p-2 ${d.primary_text_index === i ? 'border-brand-500 bg-brand-50/40' : ''}`}>
                <input type="radio" checked={d.primary_text_index === i} onChange={() => set('primary_text_index', i)} className="mt-2" />
                <div className="flex-1">
                  <textarea rows={2} value={t} onChange={e => setList('primary_texts', i, e.target.value)} className={`${input} ${errs[`primary_texts.${i}`] ? 'border-red-400' : ''}`} />
                  <p className={`text-[11px] ${t.length > 125 ? 'text-amber-600' : 'text-gray-400'}`}>{t.length} characters{t.length > 125 ? ' — will be cut off with "See more"' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Headline (max 40)</p>
            {d.headlines.map((t, i) => (
              <label key={i} className="flex items-center gap-2 mb-1.5">
                <input type="radio" checked={d.headline_index === i} onChange={() => set('headline_index', i)} />
                <input value={t} onChange={e => setList('headlines', i, e.target.value)} className={`${input} ${errs[`headlines.${i}`] ? 'border-red-400' : ''}`} />
              </label>
            ))}
          </div>
          <Field label="Button" error={errs.cta}>
            <select value={d.cta} onChange={e => set('cta', e.target.value)} className={`${input} bg-white`}>
              {CTA_OPTIONS[d.destination].map(c => <option key={c} value={c}>{label(c)}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="City" error={errs.location}><input value={d.location} onChange={e => set('location', e.target.value)} className={input} /></Field>
          <Field label="Radius (km)" error={errs.radius_km}><input type="number" value={d.radius_km} onChange={e => set('radius_km', e.target.value)} className={input} /></Field>
          <Field label="Age from" error={errs.age_min}><input type="number" value={d.age_min} onChange={e => set('age_min', e.target.value)} className={input} disabled={d.special_ad_categories?.length > 0} /></Field>
          <Field label="Age to"><input type="number" value={d.age_max} onChange={e => set('age_max', e.target.value)} className={input} disabled={d.special_ad_categories?.length > 0} /></Field>
          <Field label="Budget / day (₹)" error={errs.daily_budget_inr}><input type="number" value={d.daily_budget_inr} onChange={e => set('daily_budget_inr', e.target.value)} className={input} /></Field>
          <Field label="Days" error={errs.duration_days}><input type="number" value={d.duration_days} onChange={e => set('duration_days', e.target.value)} className={input} /></Field>
        </div>
        {d.special_ad_categories?.length > 0 && <p className="text-[11px] text-gray-500">Meta special ad category: {d.special_ad_categories.map(label).join(', ')} — age and narrow targeting are limited by Meta.</p>}

        {d.destination === 'LEAD_FORM' && (
          <div className="rounded-xl border p-3 space-y-2">
            <p className="text-xs font-medium text-gray-600">Lead form</p>
            <select value={d.lead_form.existing_form_id || ''} onChange={e => setForm({ existing_form_id: e.target.value || null })} className={`${input} bg-white`}>
              <option value="">Create a new form (name + phone{(d.lead_form.questions || []).length ? ' + more' : ''})</option>
              {(forms || []).filter(f => (f.status || '').toUpperCase() === 'ACTIVE').map(f => <option key={f.id} value={f.external_id}>Use “{f.name}”</option>)}
            </select>
            {!d.lead_form.existing_form_id && (
              <Field label="Your privacy-policy link" error={errs['lead_form.privacy_policy_url']} hint="Meta requires it on every new lead form.">
                <input value={d.lead_form.privacy_policy_url} onChange={e => setForm({ privacy_policy_url: e.target.value })} placeholder="https://yourbusiness.in/privacy" className={input} />
              </Field>
            )}
          </div>
        )}

        <div className="rounded-xl border p-3 flex items-center gap-3">
          {rec.image?.url ? <img src={rec.image.url} alt="" className="w-16 h-16 rounded-lg object-cover" /> : <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400"><ImagePlus size={20} /></div>}
          <div className="flex-1 text-xs text-gray-500">{rec.image ? `Image: ${rec.image.name}` : 'Add the ad image (JPG or PNG, square 1080×1080 works everywhere).'}</div>
          <label className="px-3 py-1.5 border rounded-lg text-xs font-semibold cursor-pointer hover:bg-gray-50">
            <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={onImage} />{busy === 'image' ? 'Uploading…' : rec.image ? 'Replace' : 'Upload'}
          </label>
        </div>
      </fieldset>

      {!locked && (
        <div className="flex gap-2">
          <button onClick={run('save', async () => { const s = await save(); toast.success(s.errors.length ? `Saved — ${s.errors.length} problem(s) to fix.` : 'Saved.'); })} disabled={!!busy} className="flex-1 py-2.5 border rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-50">{busy === 'save' ? 'Saving…' : 'Save draft'}</button>
          <button onClick={create} disabled={!!busy || !rec.image} title={!rec.image ? 'Upload the ad image first' : ''} className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">{busy === 'create' ? 'Creating on Meta…' : 'Create on Meta (paused)'}</button>
        </div>
      )}

      {rec.api_log?.length > 0 && (
        <details className="text-xs"><summary className="cursor-pointer text-gray-500">Meta steps ({rec.api_log.length})</summary>
          <ul className="mt-1 space-y-0.5">{rec.api_log.map((s, i) => <li key={i} className={s.ok ? 'text-gray-600' : 'text-red-600'}>{s.ok ? '✓' : '✗'} {s.step}{s.id ? ` · ${s.id}` : ''}{s.error ? ` — ${s.error}` : ''}</li>)}</ul>
        </details>
      )}

      {rec.status === 'created' && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-900 flex items-center gap-2"><CheckCircle size={15} /> On Meta and paused — nothing is spending yet.</p>
          <p className="text-xs text-amber-800">Check it in Meta Ads Manager if you like. To start spending ₹{Number(d.daily_budget_inr).toLocaleString('en-IN')} a day, type the campaign name:</p>
          <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={d.campaign_name} className={input} />
          <button onClick={activate} disabled={busy === 'activate' || confirm.trim() !== d.campaign_name.trim()} className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 inline-flex items-center justify-center gap-2">
            <Rocket size={15} /> {busy === 'activate' ? 'Starting…' : 'Activate campaign'}
          </button>
        </div>
      )}
      {rec.status === 'activated' && <p className="text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2.5 flex items-center gap-2"><CheckCircle size={15} /> Live on Meta. It appears in the campaign list after the next sync.</p>}
    </div>
  );
};

const AiCampaignWizard = ({ onClose, onChanged }) => {
  const toast = useToast();
  const [rec, setRec] = useState(null);
  const open = async (id) => {
    try { const { data } = await adsAPI.aiGetDraft(id); setRec(data); }
    catch (e) { toast.error(e.response?.data?.error || 'Could not open the draft.'); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-8">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold flex items-center gap-2"><Sparkles size={17} className="text-violet-600" /> {rec ? 'Review campaign' : 'Create a campaign with AI'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5 max-h-[75vh] overflow-y-auto">
          {rec ? <ReviewStep key={rec.id} initial={rec} onChanged={onChanged} /> : <BriefStep onDrafted={setRec} onOpen={open} />}
        </div>
      </div>
    </div>
  );
};

export default AiCampaignWizard;
