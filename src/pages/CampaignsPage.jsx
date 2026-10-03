import { sourceLabel } from '../utils/leadData.js';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignAPI, integrationsAPI } from '../services/api';
import {
  Plus, Megaphone, Users, X, Edit2, Trash2, RotateCcw, Eye, MousePointerClick, Target,
  Trophy, Percent, TrendingUp, AlertTriangle, ChevronLeft, ChevronRight, Star, CalendarDays,
} from 'lucide-react';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';
import DatePicker from '../components/ui/DatePicker';
import ErrorState, { errorMessage } from '../components/ui/ErrorState';

const PAGE_SIZE = 20;

const statusColors = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-gray-100 text-gray-600',
  draft: 'bg-blue-100 text-blue-700',
};
const statusDots = { active: 'bg-green-500', paused: 'bg-amber-500', completed: 'bg-gray-400', draft: 'bg-blue-500' };

const verdictColors = {
  high_quality: 'bg-emerald-100 text-emerald-700',
  high_volume_low_quality: 'bg-amber-100 text-amber-700',
  underperforming: 'bg-gray-100 text-gray-500',
  average: 'bg-gray-100 text-gray-600',
  too_early: 'bg-blue-50 text-blue-600',
  no_leads: 'bg-gray-50 text-gray-400',
};

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'this_year', label: 'This year' },
  { value: 'lifetime', label: 'Lifetime' },
];

const emptyForm = () => ({ name: '', source: 'meta_ads', budget: '', start_date: '', end_date: '', status: 'active', is_priority: false });

const rupees = v => `₹${Math.round(parseFloat(v) || 0).toLocaleString('en-IN')}`;
const num = v => Number(v || 0).toLocaleString('en-IN');
// Campaign start/end are plain dates; format them without a timezone shift.
const shortDate = v => {
  const [y, m, d] = String(v || '').split('T')[0].split('-').map(Number);
  return y ? new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : null;
};

// Numbers on the card are for the selected range (services/metrics.js) except the budget
// bar, which tracks the campaign's lifetime spend against its budget.
const CampaignCard = ({ c, onOpen, onEdit, onDelete, onOpenMeta }) => {
  const spend = parseFloat(c.lifetime_spend ?? c.actual_spend) || 0;
  const isDaily = Number(c.daily_budget) > 0 && !(Number(c.lifetime_budget) > 0);
  const budget = parseFloat(c.budget) || 0;
  const usedPct = budget > 0 && !isDaily ? Math.min(100, Math.round((spend / budget) * 100)) : null;
  const cpl = c.cpl != null ? Number(c.cpl) : null;
  const periodSpend = c.spend != null ? Number(c.spend) : null;
  const ctr = Number(c.impressions) > 0 ? ((Number(c.clicks || 0) / Number(c.impressions)) * 100).toFixed(2) : null;
  const start = shortDate(c.start_date), end = shortDate(c.end_date);
  const hasMeta = c.meta_campaign_id && (c.impressions != null || c.clicks != null);

  return (
    <div onClick={onOpen}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col hover:shadow-md hover:border-gray-200 transition cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 line-clamp-2 break-words" title={c.name}>{c.name}</h3>
          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
            <span className="text-xs text-gray-500">{sourceLabel(c.source)}</span>
            {c.meta_campaign_id && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600">Meta synced</span>}
            {c.is_priority && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-50 text-violet-600 flex items-center gap-0.5"><Star size={9} /> Priority</span>}
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusColors[c.status] || 'bg-gray-100 text-gray-600'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusDots[c.status] || 'bg-gray-400'}`} />{c.status}
        </span>
      </div>

      {c.verdict_label && (
        <div className={`mt-3 px-2.5 py-1.5 rounded-lg text-[11px] font-medium ${verdictColors[c.verdict] || 'bg-gray-100 text-gray-600'}`} title={c.verdict_reason}>
          {c.verdict_label}
        </div>
      )}

      <div className="mt-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-gray-500">Lifetime spent</span>
          <span>
            <span className="font-semibold text-gray-900">{rupees(spend)}</span>
            {budget > 0 && <span className="text-gray-400 text-xs"> {isDaily ? `· ${rupees(budget)}/day` : `of ${rupees(budget)}`}</span>}
          </span>
        </div>
        {usedPct !== null && (
          <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden" title={`${usedPct}% of budget used`}>
            <div className={`h-full rounded-full ${usedPct >= 90 ? 'bg-red-500' : usedPct >= 70 ? 'bg-amber-500' : 'bg-brand-500'}`} style={{ width: `${usedPct}%` }} />
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-gray-100 rounded-xl bg-gray-50 py-2.5 text-center">
        <div title="Leads in CurveLead created in this period">
          <p className="text-[11px] text-gray-500">Leads</p>
          <p className="font-bold text-gray-900">{num(c.crm_leads ?? c.total_leads)}</p>
        </div>
        <div title="Of these leads, how many became customers (reached a won stage)">
          <p className="text-[11px] text-gray-500">Converted</p>
          <p className="font-bold text-gray-900">{num(c.converted)}</p>
        </div>
        <div title={c.spend_basis === 'not_measured' ? 'No daily spend for this campaign (manual spend is lifetime only)' : 'Spend in this period ÷ leads in this period'}>
          <p className="text-[11px] text-gray-500">CPL</p>
          <p className="font-bold text-brand-600">{cpl != null ? rupees(cpl) : '—'}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
        {periodSpend != null && <span>Spent in period <strong className="text-gray-700">{rupees(periodSpend)}</strong></span>}
        {c.cost_per_customer != null && <span>Per customer <strong className="text-gray-700">{rupees(c.cost_per_customer)}</strong></span>}
        {c.platform_leads != null && <span title="Leads Meta reports for this period — can differ from leads in CurveLead">Reported by Meta <strong className="text-gray-700">{num(c.platform_leads)}</strong></span>}
        {c.won > 0 && <span title="Leads that reached a won stage in this period, whenever they came in">Won this period <strong className="text-gray-700">{num(c.won)}</strong></span>}
      </div>

      {hasMeta && (
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Eye size={12} /> {num(c.impressions)}</span>
          <span className="flex items-center gap-1"><MousePointerClick size={12} /> {num(c.clicks)}</span>
          {ctr && <span className="flex items-center gap-1"><Percent size={12} /> {ctr}% CTR</span>}
        </div>
      )}

      <div className="mt-auto pt-4 flex items-center justify-between gap-2">
        <span className="text-xs text-gray-400 flex items-center gap-1 min-w-0 truncate">
          {(start || end) && <><CalendarDays size={12} className="shrink-0" /> {start || '…'} – {end || 'ongoing'}</>}
        </span>
        <div className="flex gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition">
          {c.meta_campaign_id && (
            <button onClick={e => { e.stopPropagation(); onOpenMeta(); }} aria-label="Open in Meta Ads" title="Ad sets, ads and daily spend in Meta Ads"
              className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600"><TrendingUp size={14} /></button>
          )}
          <button onClick={e => { e.stopPropagation(); onEdit(); }} aria-label="Edit campaign" title="Edit"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"><Edit2 size={14} /></button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} aria-label="Delete campaign" title="Delete"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  );
};

const CampaignsPage = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const toast = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [period, setPeriod] = useState('this_month');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editingMeta, setEditingMeta] = useState(false); // Meta-synced: status/budget/dates come from Meta
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [syncingInsights, setSyncingInsights] = useState(false);
  const [tab, setTab] = useState('active');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState('');

  useEffect(() => { loadData(); }, [period, page]);

  const handleSyncInsights = async () => {
    setSyncingInsights(true);
    try {
      const { data } = await integrationsAPI.syncAdInsights();
      toast.success(data.message || 'Ad insights synced.');
      loadData();
    } catch (e) { toast.error(e.response?.data?.error || 'Sync failed. Connect an ad account in Integrations first.'); }
    finally { setSyncingInsights(false); }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await campaignAPI.getAll({ period, page, limit: PAGE_SIZE });
      setCampaigns(data.campaigns || []);
      setMetrics(data.metrics || null);
      setTotal(data.total || 0);
      setLoadError('');
    } catch (e) { setLoadError(errorMessage(e, 'Could not load campaigns.')); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setEditing(null); setEditingMeta(false); setForm(emptyForm()); setErrors({}); setShowModal(true); };

  const handleSave = async () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Campaign name is required';
    if (form.start_date && form.end_date && form.end_date < form.start_date) newErrors.end_date = 'End date must be after start date';
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;
    try {
      if (editing) {
        await campaignAPI.update(editing, editingMeta ? { name: form.name, source: form.source, is_priority: form.is_priority } : form);
      } else {
        await campaignAPI.create(form);
      }
      setShowModal(false);
      setEditing(null);
      setForm(emptyForm());
      setErrors({});
      loadData();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const handleEdit = (c) => {
    setEditing(c.id);
    setEditingMeta(!!c.meta_campaign_id);
    setForm({
      name: c.name,
      source: c.source,
      budget: c.budget || '',
      start_date: c.start_date?.split('T')[0] || '',
      end_date: c.end_date?.split('T')[0] || '',
      status: c.status,
      is_priority: !!c.is_priority,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!await confirm({ title: 'Delete this campaign?' })) return;
    try { await campaignAPI.delete(id); loadData(); } catch (e) { toast.error('Failed'); }
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeCount = campaigns.filter(c => c.status === 'active').length;
  const inactiveCount = campaigns.length - activeCount;
  const visible = campaigns.filter(c => tab === 'active' ? c.status === 'active' : c.status !== 'active');
  const focus = campaigns.filter(c => c.verdict === 'high_quality');
  const watch = campaigns.filter(c => c.verdict === 'high_volume_low_quality');
  const firstLoad = loading && !campaigns.length && !metrics;

  // Campaign-attributed leads only (no WhatsApp/manual leads without a campaign).
  const kpis = [
    { label: 'Leads from campaigns', value: num(metrics?.crm_leads ?? metrics?.total_leads), icon: Users, cls: 'bg-blue-100 text-blue-600' },
    { label: 'Won this period', value: num(metrics?.won), icon: Trophy, cls: 'bg-emerald-100 text-emerald-600' },
    { label: 'Conversion of these leads', value: `${metrics?.conversion_rate ?? 0}%`, icon: Target, cls: 'bg-violet-100 text-violet-600' },
    { label: 'Active campaigns', value: num(metrics?.active_campaigns), icon: Megaphone, cls: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-500">Track ad spend, leads and cost per lead for every campaign.</p>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Metrics period" value={period} onChange={e => { setPeriod(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm bg-white font-medium">
            {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <button onClick={handleSyncInsights} disabled={syncingInsights}
            className="px-3 py-2 border rounded-lg text-sm font-semibold bg-white hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50">
            <RotateCcw size={14} className={syncingInsights ? 'animate-spin' : ''} /> {syncingInsights ? 'Syncing…' : 'Sync ad insights'}
          </button>
          <button onClick={openCreate}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 flex items-center gap-2">
            <Plus size={16} /> New campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${k.cls}`}><k.icon size={18} /></div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{k.label}</p>
              {firstLoad
                ? <div className="h-6 w-14 mt-1 rounded bg-gray-100 animate-pulse" />
                : <p className="text-xl font-bold text-gray-900">{k.value}</p>}
            </div>
          </div>
        ))}
      </div>

      {!loading && (focus.length > 0 || watch.length > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-3"><Target size={16} className="text-brand-600" /> Where to focus</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {focus.map(c => (
              <button key={c.id} onClick={() => navigate(`/campaigns/${c.id}?period=${period}`)}
                className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-left transition">
                <TrendingUp size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-emerald-900 truncate">{c.name}</p>
                  <p className="text-xs text-emerald-700">{c.verdict_reason}</p>
                </div>
              </button>
            ))}
            {watch.map(c => (
              <button key={c.id} onClick={() => navigate(`/campaigns/${c.id}?period=${period}`)}
                className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-left transition">
                <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-amber-900 truncate">{c.name}</p>
                  <p className="text-xs text-amber-700">{c.verdict_reason}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {campaigns.length > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {[['active', 'Active', activeCount], ['inactive', 'Paused & other', inactiveCount]].map(([id, label, count]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition flex items-center gap-1.5 ${tab === id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {label}
                <span className={`px-1.5 rounded-full text-[11px] ${tab === id ? 'bg-gray-100 text-gray-700' : 'bg-gray-200 text-gray-500'}`}>{count}</span>
              </button>
            ))}
          </div>
          {pageCount > 1 && <p className="text-xs text-gray-400">Counts are for this page · {total} campaigns in total</p>}
        </div>
      )}

      {loadError && campaigns.length > 0 && <ErrorState message={loadError} onRetry={loadData} retrying={loading} />}
      {firstLoad ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => <div key={i} className="h-72 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : loadError && campaigns.length === 0 ? (
        <ErrorState message={loadError} onRetry={loadData} retrying={loading} />
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-4"><Megaphone size={26} /></div>
          <p className="font-semibold text-gray-900">No campaigns yet</p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Create a campaign, or sync ad insights from a connected ad account, to see spend, leads and cost per lead.</p>
          <button onClick={openCreate} className="mt-5 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 inline-flex items-center gap-2">
            <Plus size={16} /> New campaign
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-500">
          {tab === 'active' ? 'No active campaigns on this page.' : 'No paused, draft or completed campaigns on this page.'}
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {visible.map(c => (
            <CampaignCard key={c.id} c={c}
              onOpen={() => navigate(`/campaigns/${c.id}?period=${period}`)}
              onEdit={() => handleEdit(c)}
              onOpenMeta={() => navigate('/ads?tab=meta')}
              onDelete={() => handleDelete(c.id)} />
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 flex items-center gap-1"><ChevronLeft size={14} /> Previous</button>
          <span className="text-gray-500">Page {page} of {pageCount}</span>
          <button disabled={page >= pageCount} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 flex items-center gap-1">Next <ChevronRight size={14} /></button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">{editing ? 'Edit Campaign' : 'New Campaign'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Campaign Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.name}
                  onChange={e => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors(er => ({ ...er, name: undefined })); }}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm ${errors.name ? 'border-red-500' : ''}`} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div className={`grid gap-2 ${editingMeta ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Source</label>
                  <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                    <option value="meta_ads">Meta Ads</option>
                    <option value="google_ads">Google Ads</option>
                    <option value="instagram">Instagram</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="organic">Organic</option>
                    <option value="referral">Referral</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {!editingMeta && <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>}
              </div>
              {editingMeta ? (
                <div className="rounded-xl bg-blue-50 text-blue-800 text-xs px-3 py-2.5">
                  Status, budget and dates come from Meta and are synced automatically.{' '}
                  <button type="button" onClick={() => navigate('/ads?tab=meta')} className="font-semibold underline">Manage them in Meta Ads</button>
                </div>
              ) : (<>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Budget (₹)</label>
                <input type="number" min="0" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                  <DatePicker value={form.start_date} onChange={v => setForm({ ...form, start_date: v })}
                    className="w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                  <DatePicker value={form.end_date}
                    onChange={v => { setForm({ ...form, end_date: v }); if (errors.end_date) setErrors(er => ({ ...er, end_date: undefined })); }}
                    className="w-full" />
                  {errors.end_date && <p className="text-xs text-red-500 mt-1">{errors.end_date}</p>}
                </div>
              </div>
              </>)}
              <div className="rounded-xl border p-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_priority} onChange={e => setForm({ ...form, is_priority: e.target.checked })}
                    className="w-4 h-4 rounded" />
                  <span className="font-medium">Priority campaign</span>
                </label>
                <p className="text-xs text-gray-400 mt-1 ml-6">Leads from this campaign skip automated messaging entirely and go straight to the assigned salesperson.</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsPage;
