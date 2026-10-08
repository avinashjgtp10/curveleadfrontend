import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Plus, Rocket, Sparkles, Trash2, X } from 'lucide-react';
import { adsAPI } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { formatDateTime } from '../utils/dateTime.js';
import { formatMoney, currencySymbol } from '../utils/locale';

// Ads Manager → Google Ads → Create with AI. Brief → AI-written responsive search ad
// (headlines, descriptions, keywords) → review/edit → created in Google Ads with the
// campaign PAUSED (one all-or-nothing request) → activated only after typing the name.
// The server re-validates every step.

const LIMIT = { headline: 30, description: 90, path: 15, headlines: 15, descriptions: 4 };
const MATCH = [['PHRASE', 'Phrase'], ['EXACT', 'Exact'], ['BROAD', 'Broad']];
const STATUS = { draft: 'bg-gray-100 text-gray-600', creating: 'bg-blue-100 text-blue-700', created: 'bg-amber-100 text-amber-700', activated: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700' };
const input = 'w-full px-3 py-2 border rounded-lg text-sm';

const Field = ({ label, error, children, hint }) => (
  <label className="block">
    <span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-gray-400 mt-0.5">{hint}</span>}
    {error && <span className="block text-[11px] text-red-600 mt-0.5">{error}</span>}
  </label>
);
const Count = ({ n, max }) => <span className={`text-[10px] tabular-nums ${n > max ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>{n}/{max}</span>;

const BriefStep = ({ onDrafted, onOpen, currency }) => {
  const toast = useToast();
  const [brief, setBrief] = useState({ offer: '', goal: '', location: '', final_url: '', budget_per_day_inr: 500, duration_days: 14, language: 'en' });
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState([]);
  useEffect(() => { adsAPI.googleAiListDrafts().then(({ data }) => setDrafts(data.drafts || [])).catch(() => {}); }, []);
  const set = (k) => (e) => setBrief(b => ({ ...b, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    try {
      const { data } = await adsAPI.googleAiCreateDraft({ ...brief, budget_per_day_inr: Number(brief.budget_per_day_inr), duration_days: Number(brief.duration_days) });
      onDrafted(data);
    } catch (e) { toast.error(e.response?.data?.error || 'Could not draft the campaign.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <Field label="What are you advertising?" hint="The offer, price and who it's for — e.g. “Diwali hair spa at 999 for women in Pune, this month only”.">
        <textarea rows={3} value={brief.offer} onChange={set('offer')} className={input} />
      </Field>
      <Field label="Landing page" hint="Where people go when they click. Leave empty to use the website in your business settings.">
        <input value={brief.final_url} onChange={set('final_url')} placeholder="https://yourbusiness.in/offer" className={input} />
      </Field>
      <Field label="Goal (optional)"><input value={brief.goal} onChange={set('goal')} placeholder="e.g. 50 bookings before Diwali" className={input} /></Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="City"><input value={brief.location} onChange={set('location')} placeholder="Pune" className={input} /></Field>
        <Field label="Ad language">
          <select value={brief.language} onChange={set('language')} className={`${input} bg-white`}>
            <option value="en">English</option><option value="hi">Hindi</option><option value="mr">Marathi</option>
          </select>
        </Field>
        <Field label={`Budget per day (${currencySymbol(currency)})`}><input type="number" min="100" value={brief.budget_per_day_inr} onChange={set('budget_per_day_inr')} className={input} /></Field>
        <Field label="Run for (days)"><input type="number" min="1" max="90" value={brief.duration_days} onChange={set('duration_days')} className={input} /></Field>
      </div>
      <button onClick={submit} disabled={busy} className="w-full py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 inline-flex items-center justify-center gap-2">
        <Sparkles size={15} /> {busy ? 'Writing your search ad… (up to a minute)' : 'Draft the search campaign'}
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

// How Google may show it: three headlines, two descriptions.
const Preview = ({ d }) => {
  let host = '';
  try { host = new URL(d.final_url).hostname.replace(/^www\./, ''); } catch { /* shown empty */ }
  return (
    <div className="rounded-xl border bg-gray-50 p-3">
      <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Preview — Google mixes headlines and descriptions</p>
      <p className="text-[11px] text-gray-600"><span className="font-semibold">Sponsored</span> · {host}{d.path1 ? ` › ${d.path1}` : ''}{d.path2 ? ` › ${d.path2}` : ''}</p>
      <p className="text-[15px] text-blue-800 leading-snug">{d.headlines.slice(0, 3).filter(Boolean).join(' | ')}</p>
      <p className="text-xs text-gray-700 mt-0.5">{d.descriptions.slice(0, 2).filter(Boolean).join(' ')}</p>
    </div>
  );
};

// Editable list of short texts with a character counter.
const TextList = ({ label, items, max, maxItems, errs, field, onChange, multiline }) => (
  <div>
    <p className="text-xs font-medium text-gray-600 mb-1">{label} <span className="font-normal text-gray-400">({items.length}/{maxItems}, max {max} characters each)</span></p>
    {errs[field] && <p className="text-[11px] text-red-600 mb-1">{errs[field]}</p>}
    <div className="space-y-1.5">
      {items.map((t, i) => (
        <div key={i}>
          <div className="flex items-center gap-1.5">
            {multiline
              ? <textarea rows={2} value={t} onChange={e => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} className={`${input} ${errs[`${field}.${i}`] ? 'border-red-400' : ''}`} />
              : <input value={t} onChange={e => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} className={`${input} ${errs[`${field}.${i}`] ? 'border-red-400' : ''}`} />}
            <Count n={t.length} max={max} />
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="p-1 text-gray-400 hover:text-red-600" title="Remove"><Trash2 size={13} /></button>
          </div>
          {errs[`${field}.${i}`] && <p className="text-[11px] text-red-600">{errs[`${field}.${i}`]}</p>}
        </div>
      ))}
    </div>
    {items.length < maxItems && <button type="button" onClick={() => onChange([...items, ''])} className="mt-1.5 text-xs text-brand-600 font-semibold inline-flex items-center gap-1"><Plus size={12} /> Add</button>}
  </div>
);

const ReviewStep = ({ initial, onChanged, currency }) => {
  const toast = useToast();
  const [rec, setRec] = useState(initial);
  const [d, setD] = useState(initial.draft);
  const [negatives, setNegatives] = useState((initial.draft.negative_keywords || []).join(', '));
  const [busy, setBusy] = useState('');
  const [confirm, setConfirm] = useState('');
  const locked = !['draft', 'failed'].includes(rec.status);
  const errs = Object.fromEntries((rec.errors || []).map(e => [e.field, e.message]));
  const set = (k, v) => setD(x => ({ ...x, [k]: v }));
  const setKeyword = (i, patch) => set('keywords', d.keywords.map((k, j) => (j === i ? { ...k, ...patch } : k)));

  const save = async () => {
    const { data } = await adsAPI.googleAiUpdateDraft(rec.id, {
      ...d, daily_budget_inr: Number(d.daily_budget_inr), duration_days: Number(d.duration_days),
      headlines: d.headlines.filter(t => t.trim()), descriptions: d.descriptions.filter(t => t.trim()), keywords: d.keywords.filter(k => k.text.trim()),
      negative_keywords: negatives.split(/[,\n]/).map(t => t.trim()).filter(Boolean),
    });
    setRec(r => ({ ...r, ...data })); setD(data.draft); setNegatives(data.draft.negative_keywords.join(', ')); onChanged?.();
    return data;
  };
  const run = (key, fn) => async () => { setBusy(key); try { await fn(); } catch (e) { toast.error(e.response?.data?.error || 'Something went wrong.'); } finally { setBusy(''); } };

  const create = run('create', async () => {
    const saved = await save();
    if (saved.errors.length) return toast.error(`Fix ${saved.errors.length} problem${saved.errors.length > 1 ? 's' : ''} first.`);
    try {
      const { data } = await adsAPI.googleAiCreate(rec.id);
      setRec(r => ({ ...r, ...data })); onChanged?.();
      toast.success('Created in Google Ads — paused. Google reviews the ad meanwhile; activate when ready.');
    } catch (e) {
      const { data } = await adsAPI.googleAiGetDraft(rec.id).catch(() => ({ data: null }));
      if (data) setRec(r => ({ ...r, ...data }));
      throw e;
    }
  });
  const activate = run('activate', async () => {
    await adsAPI.googleAiActivate(rec.id, confirm);
    setRec(r => ({ ...r, status: 'activated' })); onChanged?.();
    toast.success('Campaign is live on Google.');
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

      <Preview d={d} />

      <fieldset disabled={locked} className="space-y-4 disabled:opacity-70">
        <Field label="Campaign name" error={errs.campaign_name}><input value={d.campaign_name} onChange={e => set('campaign_name', e.target.value)} className={input} /></Field>
        <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3">
          <Field label="Landing page" error={errs.final_url}><input value={d.final_url} onChange={e => set('final_url', e.target.value)} className={input} /></Field>
          <Field label="Display path 1" error={errs.path1}><input value={d.path1} onChange={e => set('path1', e.target.value)} className={`${input} sm:w-32`} /></Field>
          <Field label="Display path 2" error={errs.path2}><input value={d.path2} onChange={e => set('path2', e.target.value)} className={`${input} sm:w-32`} /></Field>
        </div>

        <TextList label="Headlines" items={d.headlines} max={LIMIT.headline} maxItems={LIMIT.headlines} errs={errs} field="headlines" onChange={v => set('headlines', v)} />
        <TextList label="Descriptions" items={d.descriptions} max={LIMIT.description} maxItems={LIMIT.descriptions} errs={errs} field="descriptions" onChange={v => set('descriptions', v)} multiline />

        <div>
          <p className="text-xs font-medium text-gray-600 mb-1">Keywords <span className="font-normal text-gray-400">— what people search for. Phrase = searches containing it; Exact = that search or very close.</span></p>
          {errs.keywords && <p className="text-[11px] text-red-600 mb-1">{errs.keywords}</p>}
          <div className="space-y-1.5">
            {d.keywords.map((k, i) => (
              <div key={i}>
                <div className="flex items-center gap-1.5">
                  <input value={k.text} onChange={e => setKeyword(i, { text: e.target.value })} className={`${input} ${errs[`keywords.${i}`] ? 'border-red-400' : ''}`} />
                  <select value={k.match_type} onChange={e => setKeyword(i, { match_type: e.target.value })} className="px-2 py-2 border rounded-lg text-xs bg-white">
                    {MATCH.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <button type="button" onClick={() => set('keywords', d.keywords.filter((_, j) => j !== i))} className="p-1 text-gray-400 hover:text-red-600" title="Remove"><Trash2 size={13} /></button>
                </div>
                {errs[`keywords.${i}`] && <p className="text-[11px] text-red-600">{errs[`keywords.${i}`]}</p>}
              </div>
            ))}
          </div>
          {d.keywords.length < 30 && <button type="button" onClick={() => set('keywords', [...d.keywords, { text: '', match_type: 'PHRASE' }])} className="mt-1.5 text-xs text-brand-600 font-semibold inline-flex items-center gap-1"><Plus size={12} /> Add keyword</button>}
        </div>
        <Field label="Negative keywords (comma-separated)" hint="Searches containing these words won't show your ad — e.g. jobs, free, course." error={Object.entries(errs).find(([f]) => f.startsWith('negative_keywords'))?.[1]}>
          <textarea rows={2} value={negatives} onChange={e => setNegatives(e.target.value)} className={input} />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="City" error={errs.location}><input value={d.location} onChange={e => set('location', e.target.value)} className={input} /></Field>
          <Field label={`Budget / day (${currencySymbol(currency)})`} error={errs.daily_budget_inr}><input type="number" value={d.daily_budget_inr} onChange={e => set('daily_budget_inr', e.target.value)} className={input} /></Field>
          <Field label="Days" error={errs.duration_days}><input type="number" value={d.duration_days} onChange={e => set('duration_days', e.target.value)} className={input} /></Field>
        </div>
        <p className="text-[11px] text-gray-400">Shown on Google Search to people in or regularly in {d.location || 'the city'}, using Google's “Maximize clicks” bidding within your daily budget.</p>
      </fieldset>

      {!locked && (
        <div className="flex gap-2">
          <button onClick={run('save', async () => { const s = await save(); toast.success(s.errors.length ? `Saved — ${s.errors.length} problem(s) to fix.` : 'Saved.'); })} disabled={!!busy} className="flex-1 py-2.5 border rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-50">{busy === 'save' ? 'Saving…' : 'Save draft'}</button>
          <button onClick={create} disabled={!!busy} className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">{busy === 'create' ? 'Creating in Google Ads…' : 'Create in Google Ads (paused)'}</button>
        </div>
      )}

      {rec.api_log?.length > 0 && (
        <details className="text-xs"><summary className="cursor-pointer text-gray-500">Google steps ({rec.api_log.length})</summary>
          <ul className="mt-1 space-y-0.5">{rec.api_log.map((s, i) => <li key={i} className={s.ok ? 'text-gray-600' : 'text-red-600'}>{s.ok ? '✓' : '✗'} {s.step}{s.error ? ` — ${s.error}` : ''}</li>)}</ul>
        </details>
      )}

      {rec.status === 'created' && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-900 flex items-center gap-2"><CheckCircle size={15} /> In Google Ads and paused — nothing is spending yet.</p>
          <p className="text-xs text-amber-800">Google reviews the ad while it's paused; you can check it in Google Ads. It will run {d.duration_days} days from when you start it. To start spending {formatMoney(Number(d.daily_budget_inr), currency)} a day, type the campaign name:</p>
          <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={d.campaign_name} className={input} />
          <button onClick={activate} disabled={busy === 'activate' || confirm.trim() !== d.campaign_name.trim()} className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 inline-flex items-center justify-center gap-2">
            <Rocket size={15} /> {busy === 'activate' ? 'Starting…' : 'Activate campaign'}
          </button>
        </div>
      )}
      {rec.status === 'activated' && <p className="text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2.5 flex items-center gap-2"><CheckCircle size={15} /> Live on Google. It appears in the campaign list after the next sync.</p>}
    </div>
  );
};

// currency: the Google Ads account's — budgets are in it.
const GoogleSearchWizard = ({ onClose, onChanged, currency }) => {
  const toast = useToast();
  const [rec, setRec] = useState(null);
  const open = async (id) => {
    try { const { data } = await adsAPI.googleAiGetDraft(id); setRec(data); }
    catch (e) { toast.error(e.response?.data?.error || 'Could not open the draft.'); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-8">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold flex items-center gap-2"><Sparkles size={17} className="text-violet-600" /> {rec ? 'Review search campaign' : 'Create a Google search campaign with AI'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5 max-h-[75vh] overflow-y-auto">
          {rec ? <ReviewStep key={rec.id} initial={rec} onChanged={onChanged} currency={currency} /> : <BriefStep onDrafted={setRec} onOpen={open} currency={currency} />}
        </div>
      </div>
    </div>
  );
};

export default GoogleSearchWizard;
