import { useEffect, useState } from 'react';
import { History, Search, Columns3, Building2, Mail, User, MessageSquare, Clock, Tag, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import SelectFilter from '../components/ui/SelectFilter';
import EmptyState from '../../components/ui/EmptyState';
import { superAdminAPI } from '../../services/api';

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const TYPE_FILTERS = [{ value: 'organization', label: 'Organizations' }, { value: 'user', label: 'Users' }];
const ALL_TYPES = 'All Types';

const prettify = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '—');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' }) : '—');

const Person = ({ name, email }) => (name || email
  ? <div><p className="font-semibold text-gray-900">{name || '—'}</p>{email && <p className="text-xs text-gray-400">{email}</p>}</div>
  : <span className="text-gray-300">—</span>);
const Dash = ({ value }) => (value ? <span className="text-gray-700">{value}</span> : <span className="text-gray-300">—</span>);

const TABS = {
  cleanups: {
    label: 'Clean Up Account History',
    searchPlaceholder: 'Search by organization name or owner email...',
    load: (params) => superAdminAPI.getCleanupHistory(params),
    empty: 'No organization clean-ups have been recorded.',
    columns: [
      { key: 'org', label: 'Organization', icon: Building2, render: r => <span className="font-semibold text-gray-900">{r.tenant_name || '—'}</span> },
      { key: 'owner', label: 'Owner Email', icon: Mail, render: r => <Dash value={r.owner_email} /> },
      { key: 'by', label: 'Cleared By', icon: User, render: r => <Person name={r.cleared_by_name} email={r.cleared_by_email} /> },
      { key: 'reason', label: 'Reason', icon: MessageSquare, render: r => <Dash value={r.reason} /> },
      { key: 'at', label: 'Cleared At', icon: Clock, render: r => <span className="text-gray-700">{fmtDateTime(r.cleared_at)}</span> },
    ],
  },
  deletions: {
    label: 'Delete Account History',
    searchPlaceholder: 'Search by name or email...',
    hasTypeFilter: true,
    load: (params) => superAdminAPI.getDeletionHistory(params),
    empty: 'No accounts have been deleted.',
    columns: [
      { key: 'name', label: 'Name', icon: User, render: r => <span className="font-semibold text-gray-900">{r.name || '—'}</span> },
      { key: 'email', label: 'Email', icon: Mail, render: r => <Dash value={r.email} /> },
      { key: 'type', label: 'Type', icon: Tag, render: r => <span className="text-gray-700">{r.account_type === 'organization' ? 'Organization' : 'User'}</span> },
      { key: 'role', label: 'Role', icon: Briefcase, render: r => <Dash value={prettify(r.role)} /> },
      { key: 'org', label: 'Organization', icon: Building2, render: r => <Dash value={r.tenant_name} /> },
      { key: 'by', label: 'Deleted By', icon: User, render: r => <Person name={r.deleted_by_name} email={r.deleted_by_email} /> },
      { key: 'reason', label: 'Reason', icon: MessageSquare, render: r => <Dash value={r.reason} /> },
      { key: 'at', label: 'Deleted At', icon: Clock, render: r => <span className="text-gray-700">{fmtDateTime(r.deleted_at)}</span> },
    ],
  },
};

const SuperAdminHistoryPage = () => {
  const [tab, setTab] = useState('cleanups');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(ALL_TYPES);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [hidden, setHidden] = useState([]);
  const [showColumns, setShowColumns] = useState(false);

  const config = TABS[tab];
  const visibleColumns = config.columns.filter(c => !hidden.includes(c.key));

  useEffect(() => {
    setLoading(true);
    config.load({
      page, limit: pageSize,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(config.hasTypeFilter && typeFilter !== ALL_TYPES ? { type: typeFilter } : {}),
    })
      .then(({ data }) => { setRows(data.history || []); setTotal(data.total || 0); setNeedsMigration(!!data.needs_migration); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab, page, pageSize, search, typeFilter]);

  const switchTab = (next) => { setTab(next); setPage(1); setSearch(''); setTypeFilter(ALL_TYPES); setHidden([]); setShowColumns(false); };
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);
  const toggleColumn = (key) => setHidden(h => (h.includes(key) ? h.filter(k => k !== key) : [...h, key]));

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0"><History size={20} /></span>
        <div>
          <h1 className="text-2xl font-bold text-[#141a3d] tracking-tight">History</h1>
          <p className="text-sm text-gray-500">Activity trails across the platform</p>
        </div>
      </div>

      <div className="flex gap-6 border-b">
        {Object.entries(TABS).map(([key, t]) => (
          <button key={key} onClick={() => switchTab(key)}
            className={`pb-2.5 text-sm font-semibold -mb-px border-b-2 ${tab === key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {needsMigration && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          History is not set up in the database yet. Run <code>models/migration_account_history.sql</code> on the backend database.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder={config.searchPlaceholder}
            className="w-full pl-10 pr-3 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        {config.hasTypeFilter && (
          <SelectFilter value={typeFilter} onChange={v => { setTypeFilter(v); setPage(1); }} allLabel={ALL_TYPES} options={TYPE_FILTERS} className="py-2.5 rounded-xl" />
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
                {config.columns.map(c => (
                  <label key={c.key} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={!hidden.includes(c.key)} onChange={() => toggleColumn(c.key)} className="accent-indigo-600" />
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
                {visibleColumns.map(c => (
                  <th key={c.key} className="text-left px-4 py-3 font-semibold whitespace-nowrap"><span className="inline-flex items-center gap-2"><c.icon size={14} /> {c.label}</span></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={visibleColumns.length} className="text-center text-gray-400 py-10">Loading…</td></tr>
              ) : rows.map(r => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                  {visibleColumns.map(c => <td key={c.key} className="px-4 py-3 align-top whitespace-nowrap">{c.render(r)}</td>)}
                </tr>
              ))}
              {!loading && !rows.length && (
                <tr><td colSpan={visibleColumns.length}><EmptyState message={search || typeFilter !== ALL_TYPES ? 'No records match your search.' : config.empty} className="py-10" /></td></tr>
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
            <span>Showing {start} – {end} of {total} results</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="flex items-center gap-1 px-3 py-2 rounded-xl border text-gray-500 disabled:opacity-40"><ChevronLeft size={14} /> Prev</button>
              <span className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center font-semibold">{page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="flex items-center gap-1 px-3 py-2 rounded-xl border text-gray-500 disabled:opacity-40">Next <ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminHistoryPage;
