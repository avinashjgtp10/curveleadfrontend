import { useEffect, useMemo, useState } from 'react';
import { CreditCard, SlidersHorizontal, Columns3, Search, X, Building2, UserRound, Tag, CheckCircle2, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import SelectFilter from '../components/ui/SelectFilter';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { superAdminAPI } from '../../services/api';

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const STATUS_OPTIONS = ['trial', 'active', 'cancelled', 'expired', 'halted'];
const COLUMNS = [
  { key: 'owner', label: 'Owner', icon: UserRound },
  { key: 'plan', label: 'Plan', icon: Tag },
  { key: 'status', label: 'Subscription Status', icon: CheckCircle2 },
  { key: 'start', label: 'Start Date', icon: CalendarDays },
  { key: 'end', label: 'End Date', icon: CalendarDays },
  { key: 'trialEnds', label: 'Trial Ends', icon: CalendarDays },
  { key: 'created', label: 'Created', icon: CalendarDays },
];

const statusLabel = (s) => (s === 'halted' ? 'Suspended' : s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const BTN = 'px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed';

const OrgBadge = ({ name, size = 'w-9 h-9' }) => (
  <span className={`${size} rounded-lg bg-indigo-500 text-white font-bold text-sm flex items-center justify-center shrink-0`}>
    {(name || '?').charAt(0).toUpperCase()}
  </span>
);

const PlanPill = ({ name }) => (name
  ? <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">{name}</span>
  : <span className="text-gray-400">—</span>);

const SuperAdminSubscriptionsPage = () => {
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All Plans');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [hidden, setHidden] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [configuredId, setConfiguredId] = useState(null);
  const [planId, setPlanId] = useState('');
  const [days, setDays] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = () => Promise.all([superAdminAPI.getTenants(), superAdminAPI.getPlans()])
    .then(([tRes, pRes]) => { setTenants(tRes.data.tenants || []); setPlans(pRes.data.plans || []); })
    .catch(console.error);

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const filtered = useMemo(() => tenants.filter(t => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || t.name?.toLowerCase().includes(q) || t.owner_name?.toLowerCase().includes(q) || t.owner_email?.toLowerCase().includes(q);
    return matchesSearch
      && (planFilter === 'All Plans' || t.plan_name === planFilter)
      && (statusFilter === 'All Status' || t.subscription_status === statusFilter);
  }), [tenants, search, planFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const start = filtered.length ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, filtered.length);
  const visible = (key) => !hidden.includes(key);
  const toggleColumn = (key) => setHidden(h => (h.includes(key) ? h.filter(k => k !== key) : [...h, key]));
  const visibleCount = 2 + COLUMNS.filter(c => visible(c.key)).length;
  const filtersActive = planFilter !== 'All Plans' || statusFilter !== 'All Status';

  const configured = tenants.find(t => t.id === configuredId) || null;
  const openConfigure = (t) => {
    setConfiguredId(t.id);
    setPlanId(plans.find(p => p.name === t.plan_name)?.id || '');
    setDays('');
    setPeriodStart(t.subscription_start ? String(t.subscription_start).slice(0, 10) : '');
    setPeriodEnd(t.subscription_end ? String(t.subscription_end).slice(0, 10) : '');
    setActionError('');
  };

  // Runs a real backend action, then re-fetches so the table and modal reflect the saved state.
  const run = async (action) => {
    setBusy(true);
    setActionError('');
    try { await action(); await load(); }
    catch (err) { setActionError(err.response?.data?.error || 'Action failed. Please try again.'); }
    finally { setBusy(false); }
  };

  const daysNumber = Number(days);
  const daysValid = Number.isInteger(daysNumber) && daysNumber > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0"><CreditCard size={20} /></span>
        <div>
          <h1 className="text-2xl font-bold text-[#141a3d] tracking-tight">Subscriptions</h1>
          <p className="text-sm text-gray-500">Click an organization to control its subscription actions.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setShowFilters(o => !o)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-white text-sm font-medium ${filtersActive ? 'border-indigo-300 text-indigo-600' : 'text-gray-700'}`}>
          <SlidersHorizontal size={15} /> Filters
        </button>
        <div className="relative flex-1 min-w-[220px] max-w-xl">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by organization name or owner email..."
            className="w-full pl-10 pr-3 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2.5 w-full">
            <SelectFilter value={planFilter} onChange={v => { setPlanFilter(v); setPage(1); }} allLabel="All Plans" options={plans.map(p => p.name)} />
            <SelectFilter value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} allLabel="All Status" options={STATUS_OPTIONS} />
            {filtersActive && (
              <button onClick={() => { setPlanFilter('All Plans'); setStatusFilter('All Status'); setPage(1); }} className="text-sm text-indigo-600 hover:underline">Clear</button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border">
        <div className="flex justify-end p-4 relative">
          <button onClick={() => setShowColumns(o => !o)} className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-white text-sm font-medium text-gray-700">
            <Columns3 size={15} /> Columns
          </button>
          {showColumns && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowColumns(false)} />
              <div className="absolute right-4 top-14 w-52 bg-white border rounded-xl shadow-lg z-20 py-1">
                {COLUMNS.map(c => (
                  <label key={c.key} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={visible(c.key)} onChange={() => toggleColumn(c.key)} className="accent-indigo-600" />
                    {c.label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="overflow-x-auto border-t">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-700 border-b bg-slate-50/60">
                <th className="text-left px-4 py-3 font-semibold whitespace-nowrap"><span className="inline-flex items-center gap-2"><Building2 size={14} /> Organization</span></th>
                {COLUMNS.filter(c => visible(c.key)).map(c => (
                  <th key={c.key} className="text-left px-4 py-3 font-semibold whitespace-nowrap"><span className="inline-flex items-center gap-2"><c.icon size={14} /> {c.label}</span></th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={visibleCount} className="text-center text-gray-400 py-10">Loading…</td></tr>
              ) : pageItems.map(t => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => openConfigure(t)}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-3 font-semibold text-gray-900"><OrgBadge name={t.name} />{t.name}</span>
                  </td>
                  {visible('owner') && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-gray-800">{t.owner_name || '—'}</p>
                      <p className="text-xs text-gray-400">{t.owner_email || ''}</p>
                    </td>
                  )}
                  {visible('plan') && <td className="px-4 py-3 whitespace-nowrap"><PlanPill name={t.plan_name} /></td>}
                  {visible('status') && <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={statusLabel(t.subscription_status)} /></td>}
                  {visible('start') && <td className="px-4 py-3 whitespace-nowrap text-gray-700">{fmtDate(t.subscription_start)}</td>}
                  {visible('end') && <td className="px-4 py-3 whitespace-nowrap text-gray-700">{fmtDate(t.subscription_end)}</td>}
                  {visible('trialEnds') && <td className="px-4 py-3 whitespace-nowrap text-gray-700">{fmtDate(t.trial_ends_at)}</td>}
                  {visible('created') && <td className="px-4 py-3 whitespace-nowrap text-gray-700">{fmtDate(t.created_at)}</td>}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button onClick={e => { e.stopPropagation(); openConfigure(t); }} className="text-sm font-medium text-indigo-600 hover:underline">Configure →</button>
                  </td>
                </tr>
              ))}
              {!loading && !pageItems.length && (
                <tr><td colSpan={visibleCount}><EmptyState message="No subscriptions found." /></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-4 border-t text-sm text-gray-500">
            <label className="flex items-center gap-3">
              Rows per page:
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="px-3 py-2 border rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <span>Showing {start} – {end} of {filtered.length} results</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="flex items-center gap-1 px-3 py-2 rounded-xl border text-gray-500 disabled:opacity-40"><ChevronLeft size={14} /> Prev</button>
              <span className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center font-semibold">{page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="flex items-center gap-1 px-3 py-2 rounded-xl border text-gray-500 disabled:opacity-40">Next <ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {configured && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !busy && setConfiguredId(null)} />
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 px-6 py-4 border-b">
              <OrgBadge name={configured.name} size="w-11 h-11" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 truncate">{configured.name}</p>
                <p className="text-xs text-gray-500 truncate">{configured.owner_name || '—'}{configured.owner_email ? ` · ${configured.owner_email}` : ''}</p>
              </div>
              <PlanPill name={configured.plan_name} />
              <StatusBadge status={statusLabel(configured.subscription_status)} />
              <button onClick={() => setConfiguredId(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={18} /></button>
            </div>

            {actionError && <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{actionError}</div>}

            <div className="px-6 py-5 border-b">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Subscription Status</h4>
                  <p className="text-xs text-gray-500 mt-1">Start: <b className="text-gray-800">{fmtDate(configured.subscription_start)}</b> &nbsp; End: <b className="text-gray-800">{fmtDate(configured.subscription_end)}</b> &nbsp; Trial ends: <b className="text-gray-800">{fmtDate(configured.trial_ends_at)}</b></p>
                </div>
                <StatusBadge status={statusLabel(configured.subscription_status)} />
              </div>
              <p className="text-xs text-gray-400 mt-4 mb-3">Apply a subscription by choosing a start and end date — sets the organization active for that period.</p>
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} disabled={busy} aria-label="Start date"
                  className="px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <input type="date" value={periodEnd} min={periodStart || undefined} onChange={e => setPeriodEnd(e.target.value)} disabled={busy} aria-label="End date"
                  className="px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <button disabled={busy || !periodStart || !periodEnd || periodEnd < periodStart}
                  onClick={() => run(() => superAdminAPI.updateTenant(configured.id, { subscription_status: 'active', subscription_start: periodStart, subscription_end: periodEnd }))}
                  className={`${BTN} bg-indigo-600 text-white hover:bg-indigo-700`}>Apply Subscription</button>
              </div>
              <p className="text-xs text-gray-400 mb-3">Or choose a plan for this organization, or activate / remove its subscription.</p>
              <div className="flex flex-wrap items-center gap-2.5">
                <select value={planId} onChange={e => setPlanId(e.target.value)} disabled={busy}
                  className="px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="" disabled>Select plan</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button disabled={busy || !planId || planId === plans.find(p => p.name === configured.plan_name)?.id}
                  onClick={() => run(() => superAdminAPI.updateTenant(configured.id, { plan_id: planId }))}
                  className={`${BTN} bg-indigo-600 text-white hover:bg-indigo-700`}>Apply Plan</button>
                {configured.subscription_status === 'active' ? (
                  <button disabled={busy} onClick={() => run(() => superAdminAPI.updateTenant(configured.id, { subscription_status: 'cancelled' }))}
                    className={`${BTN} border border-red-200 text-red-600 hover:bg-red-50`}>Remove Subscription</button>
                ) : (
                  <button disabled={busy} onClick={() => run(() => superAdminAPI.updateTenant(configured.id, { subscription_status: 'active' }))}
                    className={`${BTN} border border-emerald-200 text-emerald-600 hover:bg-emerald-50`}>Activate Subscription</button>
                )}
              </div>
            </div>

            <div className="px-6 py-5 bg-slate-50/60 rounded-b-2xl">
              <h4 className="font-bold text-gray-900 text-sm">Grant Subscription Days</h4>
              <p className="text-xs text-gray-400 mt-1 mb-3">Extends this organization&apos;s trial / subscription period by the given number of days.</p>
              <div className="flex items-center gap-2.5">
                <input type="number" min="1" value={days} onChange={e => setDays(e.target.value)} placeholder="e.g. 30" disabled={busy}
                  className="w-28 px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <span className="text-sm text-gray-400">days</span>
                <button disabled={busy || !daysValid}
                  onClick={() => run(async () => { await superAdminAPI.extendTrial(configured.id, daysNumber); setDays(''); })}
                  className={`${BTN} bg-indigo-600 text-white hover:bg-indigo-700`}>Grant Days</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminSubscriptionsPage;
