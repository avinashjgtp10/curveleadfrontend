import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Megaphone, PlayCircle, PauseCircle, CheckCircle2, Eye, BarChart3, Store, X, Users, Target,
  PauseCircle as PauseIcon, PlayCircle as PlayIcon, Facebook, Search as SearchIcon, Globe, PenLine, UserPlus, MapPin, RotateCcw, ArrowLeft, Plus,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import SelectFilter from '../components/ui/SelectFilter';
import Pagination from '../components/ui/Pagination';
import ActionMenu from '../components/ui/ActionMenu';
import LinkStatCard from '../components/ui/LinkStatCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { superAdminAPI } from '../../services/api';

const PAGE_SIZE = 20;
const SOURCE_OPTIONS = ['meta_ads', 'google_ads', 'manual', 'referral', 'website', 'walkin'];
const STATUS_OPTIONS = ['active', 'paused', 'completed', 'draft'];
const SOURCE_ICONS = { meta_ads: Facebook, google_ads: SearchIcon, website: Globe, manual: PenLine, referral: UserPlus, walkin: MapPin };
const DATE_OPTIONS =['Last 7 Days', 'Last 30 Days', 'Last 90 Days'];
const DATE_DAYS = { 'Last 7 Days': 7, 'Last 30 Days': 30, 'Last 90 Days': 90 };
const SOURCE_CHOICES = ['meta_ads', 'google_ads', 'manual', 'referral', 'website', 'walkin', 'whatsapp', 'organic', 'other'];
const EMPTY_FORM = { tenant_id: '', name: '', source: 'manual', budget: '', start_date: '', end_date: '', description: '', status: 'active' };
const INPUT_CLASS = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400';

const ALL_ORGS = 'All Organizations';
const ALL_SOURCES = 'All Sources';
const ALL_STATUS = 'All Status';
const ALL_DATES = 'All Time';

const prettify = (s) => (s || '').replace(/_/g, ' ');
const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');
const conversionRate = (c) => (Number(c.total_leads) > 0 ? `${((Number(c.won_leads || 0) / Number(c.total_leads)) * 100).toFixed(1)}%` : '—');

const SourceCell = ({ source }) => {
  const Icon = SOURCE_ICONS[source] || Megaphone;
  return (
    <span className="inline-flex items-center gap-2 text-gray-500 capitalize">
      <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0"><Icon size={13} /></span>
      {prettify(source) || '—'}
    </span>
  );
};

const MetricTile = ({ label, value }) => (
  <div className="rounded-xl bg-indigo-50/50 border border-indigo-50 p-3">
    <p className="text-[11px] text-gray-500">{label}</p>
    <p className="text-lg font-bold text-[#141a3d] mt-0.5">{value}</p>
  </div>
);

const DetailRow =({ label, children }) => (
  <div className="flex items-center justify-between gap-4 py-2.5 border-b last:border-0 text-sm">
    <dt className="text-gray-500">{label}</dt>
    <dd className="font-medium text-gray-800 text-right">{children}</dd>
  </div>
);

const SuperAdminCampaignsPage = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [total, setTotal] = useState(0);
  const [tenants, setTenants] = useState([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, paused: 0, completed: 0, leads: 0, won: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState(ALL_ORGS);
  const [sourceFilter, setSourceFilter] = useState(ALL_SOURCES);
  const [statusFilter, setStatusFilter] = useState(ALL_STATUS);
  const [dateFilter, setDateFilter] = useState(ALL_DATES);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null); // { campaign, view: 'details' | 'analytics' }
  const [reloadKey, setReloadKey] = useState(0);
  const [statusChange, setStatusChange] = useState(null); // { campaign, next: 'paused' | 'active' }
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    superAdminAPI.getTenants().then(({ data }) => setTenants(data.tenants || [])).catch(console.error);
  }, []);

  // Exact platform-wide numbers straight from the database.
  useEffect(() => {
    superAdminAPI.getCampaignSummary().then(({ data }) => setSummary(data)).catch(console.error);
  }, [reloadKey]);

  useEffect(() => {
    setLoading(true);
    const tenant = tenants.find(t => t.id === tenantFilter);
    const params = {
      page, limit: PAGE_SIZE,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(tenant ? { tenant_id: tenant.id } : {}),
      ...(sourceFilter !== ALL_SOURCES ? { source: sourceFilter } : {}),
      ...(statusFilter !== ALL_STATUS ? { status: statusFilter } : {}),
      ...(dateFilter !== ALL_DATES ? { days: DATE_DAYS[dateFilter] } : {}),
    };
    superAdminAPI.getCampaigns(params)
      .then(({ data }) => { setCampaigns(data.campaigns || []); setTotal(data.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, tenantFilter, sourceFilter, statusFilter, dateFilter, tenants, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const organizationNames = useMemo(() => tenants.map(t => ({ value: t.id, label: t.name })), [tenants]);
  const sourceOptions = SOURCE_OPTIONS;
  const filtersActive = search || tenantFilter !== ALL_ORGS || sourceFilter !== ALL_SOURCES || statusFilter !== ALL_STATUS || dateFilter !== ALL_DATES;
  const resetFilters = () => {
    setSearch(''); setTenantFilter(ALL_ORGS); setSourceFilter(ALL_SOURCES); setStatusFilter(ALL_STATUS); setDateFilter(ALL_DATES); setPage(1);
  };
  const resetPage = (setter) => (v) => { setter(v); setPage(1); };

  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const closeCreate = () => { setCreateOpen(false); setForm(EMPTY_FORM); setFormError(''); };
  const handleCreate = async () => {
    if (!form.tenant_id) return setFormError('Choose the organization this campaign belongs to.');
    if (!form.name.trim()) return setFormError('Campaign name is required.');
    if (form.budget !== '' && !(Number(form.budget) >= 0)) return setFormError('Budget must be 0 or more.');
    if (form.start_date && form.end_date && form.end_date < form.start_date) return setFormError('End date cannot be before the start date.');
    setCreating(true);
    setFormError('');
    try {
      await superAdminAPI.createCampaign({
        tenant_id: form.tenant_id, name: form.name.trim(), source: form.source, status: form.status,
        ...(form.budget !== '' ? { budget: Number(form.budget) } : {}),
        ...(form.start_date ? { start_date: form.start_date } : {}),
        ...(form.end_date ? { end_date: form.end_date } : {}),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
      });
      closeCreate();
      setPage(1);
      setReloadKey(k => k + 1);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Could not create the campaign.');
    } finally { setCreating(false); }
  };

  const confirmStatusChange = async () => {
    setStatusBusy(true);
    setStatusError('');
    try {
      await superAdminAPI.setCampaignStatus(statusChange.campaign.id, statusChange.next);
      setSelected(sel => (sel && sel.campaign.id === statusChange.campaign.id ? { ...sel, campaign: { ...sel.campaign, status: statusChange.next } } : sel));
      setStatusChange(null);
      setReloadKey(k => k + 1); // re-fetch summary counts and the list, keeping filters and search
    } catch (err) {
      setStatusError(err.response?.data?.error || 'Could not update the campaign. Please try again.');
    } finally { setStatusBusy(false); }
  };
  const statusActions = (row) => {
    if (row.status === 'active') return [{ label: 'Pause Campaign', icon: PauseIcon, onClick: () => { setStatusError(''); setStatusChange({ campaign: row, next: 'paused' }); } }];
    if (row.status === 'paused') return [{ label: 'Resume Campaign', icon: PlayIcon, onClick: () => { setStatusError(''); setStatusChange({ campaign: row, next: 'active' }); } }];
    return [];
  };

  const c = selected?.campaign;

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader title="Campaigns" subtitle="Monitor and manage campaigns across every organization."
        action={
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
            <Plus size={16} /> Create Campaign
          </button>
        } />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <LinkStatCard label="Total Campaigns" value={summary.total} icon={Megaphone} tint="bg-indigo-50 text-indigo-500" />
        <LinkStatCard label="Active" value={summary.active} icon={PlayCircle} tint="bg-emerald-50 text-emerald-500" />
        <LinkStatCard label="Paused" value={summary.paused} icon={PauseCircle} tint="bg-amber-50 text-amber-500" />
        <LinkStatCard label="Completed" value={summary.completed} icon={CheckCircle2} tint="bg-blue-50 text-blue-500" />
        <LinkStatCard label="Total Leads" value={summary.leads} icon={Users} tint="bg-violet-50 text-violet-500" />
        <LinkStatCard label="Total Conversions" value={summary.won} icon={Target} tint="bg-pink-50 text-pink-500" />
      </div>

      <div className="bg-white rounded-2xl border">
        <div className="flex flex-wrap items-center gap-2.5 p-4 border-b">
          <SearchInput value={search} onChange={resetPage(setSearch)} placeholder="Search by campaign name..." className="flex-1 min-w-[220px]" />
          <SelectFilter value={tenantFilter} onChange={resetPage(setTenantFilter)} allLabel={ALL_ORGS} options={organizationNames} />
          <SelectFilter value={sourceFilter} onChange={resetPage(setSourceFilter)} allLabel={ALL_SOURCES} options={sourceOptions} />
          <SelectFilter value={statusFilter} onChange={resetPage(setStatusFilter)} allLabel={ALL_STATUS} options={STATUS_OPTIONS} />
          <SelectFilter value={dateFilter} onChange={resetPage(setDateFilter)} allLabel={ALL_DATES} options={DATE_OPTIONS} />
          <button onClick={resetFilters} disabled={!filtersActive}
            className="flex items-center gap-1.5 px-3 py-2 border border-indigo-200 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed">
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase border-b">
                <th className="text-left px-4 py-3 font-semibold">Campaign</th>
                <th className="text-left px-4 py-3 font-semibold">Organization</th>
                <th className="text-left px-4 py-3 font-semibold">Source</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Spent</th>
                <th className="text-right px-4 py-3 font-semibold">Leads</th>
                <th className="text-right px-4 py-3 font-semibold">Won</th>
                <th className="text-right px-4 py-3 font-semibold">CPL</th>
                <th className="text-left px-4 py-3 font-semibold">Created</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center text-gray-400 py-10">Loading…</td></tr>
              ) : campaigns.map(row => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => setSelected({ campaign: row, view: 'details' })}>
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate" title={row.name}>{row.name}</td>
                  <td className="px-4 py-3"><span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600">{row.tenant_name || '—'}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap"><SourceCell source={row.source} /></td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3 text-right text-gray-600">{fmtMoney(row.actual_spend)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{row.total_leads}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{row.won_leads}</td>
                  <td className="px-4 py-3 text-right text-gray-600">₹{row.cpl}</td>
                  <td className="px-4 py-3 text-gray-400">{fmtDate(row.created_at)}</td>
                  <td className="px-4 py-3">
                    <ActionMenu items={[
                      { label: 'View Details', icon: Eye, onClick: () => setSelected({ campaign: row, view: 'details' }) },
                      { label: 'View Analytics', icon: BarChart3, onClick: () => setSelected({ campaign: row, view: 'analytics' }) },
                      ...statusActions(row),
                      { label: 'View Organization', icon: Store, onClick: () => navigate(`/super-admin/workspaces/${row.tenant_id}`) },
                    ]} />
                  </td>
                </tr>
              ))}
              {!loading && !campaigns.length && (
                <tr><td colSpan={10}>
                  <EmptyState message="No campaigns found" className="pt-8" />
                  <p className="text-xs text-gray-400 text-center pb-8">Try changing your search or filters.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={total} pageSize={PAGE_SIZE} />}
      </div>

      {createOpen && (
        <Modal title="Create Campaign" onClose={() => !creating && closeCreate()}
          footer={<>
            <button onClick={closeCreate} disabled={creating} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            <button onClick={handleCreate} disabled={creating} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
              {creating ? 'Creating…' : 'Create Campaign'}
            </button>
          </>}>
          {formError && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Organization <span className="text-red-500">*</span></label>
              <select value={form.tenant_id} onChange={e => setField('tenant_id', e.target.value)} className={INPUT_CLASS}>
                <option value="">Select organization</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Campaign Name <span className="text-red-500">*</span></label>
              <input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="e.g. Diwali Offer" className={INPUT_CLASS} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Source</label>
              <select value={form.source} onChange={e => setField('source', e.target.value)} className={INPUT_CLASS}>
                {SOURCE_CHOICES.map(o => <option key={o} value={o}>{prettify(o)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={e => setField('status', e.target.value)} className={INPUT_CLASS}>
                {['active', 'draft', 'paused', 'completed'].map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Budget (₹)</label>
              <input type="number" min="0" value={form.budget} onChange={e => setField('budget', e.target.value)} placeholder="0" className={INPUT_CLASS} />
            </div>
            <div className="hidden sm:block" />
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => setField('start_date', e.target.value)} className={INPUT_CLASS} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
              <input type="date" min={form.start_date || undefined} value={form.end_date} onChange={e => setField('end_date', e.target.value)} className={INPUT_CLASS} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <textarea rows={2} value={form.description} onChange={e => setField('description', e.target.value)} className={INPUT_CLASS} />
            </div>
          </div>
        </Modal>
      )}

      {statusChange && (
        <Modal title={statusChange.next === 'paused' ? 'Pause Campaign?' : 'Resume Campaign?'} onClose={() => !statusBusy && setStatusChange(null)}
          footer={<>
            <button onClick={() => setStatusChange(null)} disabled={statusBusy} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            <button onClick={confirmStatusChange} disabled={statusBusy} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
              {statusBusy ? 'Saving…' : statusChange.next === 'paused' ? 'Pause Campaign' : 'Resume Campaign'}
            </button>
          </>}>
          {statusError && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{statusError}</div>}
          <p className="text-sm text-gray-600">
            {statusChange.next === 'paused'
              ? 'Are you sure you want to pause this campaign? Further campaign activity will stop.'
              : 'Are you sure you want to resume this campaign?'}
          </p>
          <p className="text-xs text-gray-400 mt-2">{statusChange.campaign.name} · {statusChange.campaign.tenant_name}</p>
        </Modal>
      )}

      {c && (
        <>
          <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setSelected(null)} />
          <aside className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-40 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b shrink-0">
              <h3 className="font-semibold text-gray-900">{selected.view === 'analytics' ? 'Campaign Analytics' : 'Campaign Details'}</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={18} /></button>
            </div>
            <div className="p-5 overflow-y-auto">
              <div className="mb-4">
                <p className="font-semibold text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-500 mb-2">{c.tenant_name || '—'}</p>
                <StatusBadge status={c.status} />
              </div>
              {selected.view === 'details' ? (
                <>
                  <dl className="mb-4">
                    <DetailRow label="Organization">{c.tenant_name || '—'}</DetailRow>
                    {(c.owner_name || c.created_by_name) && <DetailRow label="Owner">{c.owner_name || c.created_by_name}</DetailRow>}
                    <DetailRow label="Source"><span className="capitalize">{prettify(c.source) || '—'}</span></DetailRow>
                    <DetailRow label="Created">{fmtDate(c.created_at)}</DetailRow>
                    {c.start_date && <DetailRow label="Start Date">{fmtDate(c.start_date)}</DetailRow>}
                    {c.end_date && <DetailRow label="End Date">{fmtDate(c.end_date)}</DetailRow>}
                  </dl>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <MetricTile label="Leads" value={c.total_leads} />
                    <MetricTile label="Conversions" value={c.won_leads} />
                    <MetricTile label="Spent" value={fmtMoney(c.actual_spend)} />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Performance</h4>
                  <dl className="mb-5">
                    <DetailRow label="Conversion Rate">{conversionRate(c)}</DetailRow>
                    <DetailRow label="Cost per Lead">₹{c.cpl}</DetailRow>
                  </dl>
                  <button onClick={() => setSelected({ campaign: c, view: 'analytics' })}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
                    <BarChart3 size={15} /> View Analytics
                  </button>
                  {statusActions(c).map(a => (
                    <button key={a.label} onClick={a.onClick} className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium text-gray-700 hover:bg-gray-50">
                      <a.icon size={15} /> {a.label}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <button onClick={() => setSelected({ campaign: c, view: 'details' })} className="flex items-center gap-1 text-xs text-indigo-600 hover:underline mb-3">
                    <ArrowLeft size={13} /> Back to details
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <MetricTile label="Leads Generated" value={c.total_leads} />
                    <MetricTile label="Conversions" value={c.won_leads} />
                    <MetricTile label="Spent" value={fmtMoney(c.actual_spend)} />
                    <MetricTile label="Cost per Lead" value={`₹${c.cpl}`} />
                    <MetricTile label="Conversion Rate" value={conversionRate(c)} />
                  </div>
                </>
              )}

              <button onClick={() => navigate(`/super-admin/workspaces/${c.tenant_id}`)}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50">
                <Store size={15} /> View Organization
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

export default SuperAdminCampaignsPage;
