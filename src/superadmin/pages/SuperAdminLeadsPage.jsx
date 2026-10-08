import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, CheckCircle2, XCircle, Eye, Store, History, X, Mail, Phone } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import SelectFilter from '../components/ui/SelectFilter';
import Pagination from '../components/ui/Pagination';
import ActionMenu from '../components/ui/ActionMenu';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { superAdminAPI } from '../../services/api';

const SOURCE_OPTIONS = ['manual', 'website', 'meta_ads', 'google_ads', 'whatsapp', 'referral', 'walkin'];
const SCORE_OPTIONS = ['hot', 'warm', 'cold'];
const STATUS_OPTIONS = ['Active', 'Converted', 'Lost'];
const DATE_OPTIONS = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days'];
const DATE_DAYS = { 'Last 7 Days': 7, 'Last 30 Days': 30, 'Last 90 Days': 90 };
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const ALL_ORGS = 'All Organizations';
const ALL_SOURCES = 'All Sources';
const ALL_STAGES = 'All Stages';
const ALL_SCORES = 'All Scores';
const ALL_USERS = 'All Assigned Users';
const ALL_STATUS = 'All Status';
const ALL_DATES = 'All Time';

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
const prettify = (s) => capitalize((s || '').replace(/_/g, ' '));
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const timeAgo = (d) => {
  if (!d) return '—';
  const mins = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
};

const DetailRow = ({ label, children }) => (
  <div className="flex items-center justify-between gap-4 py-2.5 border-b last:border-0 text-sm">
    <dt className="text-gray-500">{label}</dt>
    <dd className="font-medium text-gray-800 text-right">{children}</dd>
  </div>
);

const SuperAdminLeadsPage = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [tenants, setTenants] = useState([]);
  const [summary, setSummary] = useState({ totals: { total: 0, active: 0, converted: 0, lost: 0 }, organizations: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState(ALL_ORGS);
  const [sourceFilter, setSourceFilter] = useState(ALL_SOURCES);
  const [stageFilter, setStageFilter] = useState(ALL_STAGES);
  const [scoreFilter, setScoreFilter] = useState(ALL_SCORES);
  const [userFilter, setUserFilter] = useState(ALL_USERS);
  const [statusFilter, setStatusFilter] = useState(ALL_STATUS);
  const [dateFilter, setDateFilter] = useState(ALL_DATES);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState(null);
  const [timeline, setTimeline] = useState({ loading: false, items: [], error: '' });

  useEffect(() => {
    superAdminAPI.getTenants().then(({ data }) => setTenants(data.tenants || [])).catch(console.error);
    superAdminAPI.getLeadsSummary().then(({ data }) => setSummary(data)).catch(console.error);
  }, []);

  // Users offered in the "Assigned" filter — narrowed to the selected organization.
  const assignableUsers = useMemo(() => {
    return summary.users.filter(u => tenantFilter === ALL_ORGS || u.tenant_id === tenantFilter);
  }, [summary.users, tenantFilter]);
  const userLabel = (u) => `${u.name} (${u.tenant_name || '—'})`;

  useEffect(() => {
    setLoading(true);
    const tenant = tenants.find(t => t.id === tenantFilter);
    const assigned = assignableUsers.find(u => u.id === userFilter);
    const params = {
      page, limit: pageSize,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(tenant ? { tenant_id: tenant.id } : {}),
      ...(sourceFilter !== ALL_SOURCES ? { source: sourceFilter } : {}),
      ...(stageFilter !== ALL_STAGES ? { stage: stageFilter } : {}),
      ...(scoreFilter !== ALL_SCORES ? { score: scoreFilter } : {}),
      ...(assigned ? { assigned_to: assigned.id } : {}),
      ...(statusFilter !== ALL_STATUS ? { status: statusFilter } : {}),
      ...(dateFilter !== ALL_DATES ? { days: DATE_DAYS[dateFilter] } : {}),
    };
    superAdminAPI.getLeads(params)
      .then(({ data }) => { setLeads(data.leads || []); setTotal(data.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, pageSize, search, tenantFilter, sourceFilter, stageFilter, scoreFilter, userFilter, statusFilter, dateFilter, tenants, assignableUsers]);

  const openLead = (lead) => {
    setSelected(lead);
    setTimeline({ loading: true, items: [], error: '' });
    superAdminAPI.getLeadActivity(lead.id)
      .then(({ data }) => setTimeline({ loading: false, items: data.activity || [], error: '' }))
      .catch(() => setTimeline({ loading: false, items: [], error: 'Could not load activity.' }));
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const organizationNames = useMemo(() => tenants.map(t => ({ value: t.id, label: t.name })), [tenants]);
  const resetPage = (setter) => (v) => { setter(v); setPage(1); };
  const { totals } = summary;

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader title="Leads" subtitle="View and manage leads across every organization on the platform." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={totals.total} icon={Users} cls="bg-indigo-50 text-indigo-600" />
        <StatCard label="Active Leads" value={totals.active} icon={Activity} cls="bg-emerald-50 text-emerald-600" />
        <StatCard label="Converted Leads" value={totals.converted} icon={CheckCircle2} cls="bg-violet-50 text-violet-600" />
        <StatCard label="Lost Leads" value={totals.lost} icon={XCircle} cls="bg-red-50 text-red-600" />
      </div>

      <div className="bg-white rounded-2xl border">
        <div className="flex flex-wrap items-center gap-2.5 p-4 border-b">
          <SearchInput value={search} onChange={resetPage(setSearch)} placeholder="Search by name, phone, or email..." className="flex-1 min-w-[220px]" />
          <SelectFilter value={tenantFilter} onChange={v => { setTenantFilter(v); setUserFilter(ALL_USERS); setPage(1); }} allLabel={ALL_ORGS} options={organizationNames} />
          <SelectFilter value={sourceFilter} onChange={resetPage(setSourceFilter)} allLabel={ALL_SOURCES} options={SOURCE_OPTIONS} />
          <SelectFilter value={scoreFilter} onChange={resetPage(setScoreFilter)} allLabel={ALL_SCORES} options={SCORE_OPTIONS} />
          <SelectFilter value={userFilter} onChange={resetPage(setUserFilter)} allLabel={ALL_USERS} options={assignableUsers.map(u => ({ value: u.id, label: userLabel(u) }))} />
          <SelectFilter value={statusFilter} onChange={resetPage(setStatusFilter)} allLabel={ALL_STATUS} options={STATUS_OPTIONS} />
          <SelectFilter value={dateFilter} onChange={resetPage(setDateFilter)} allLabel={ALL_DATES} options={DATE_OPTIONS} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase border-b">
                <th className="text-left px-4 py-3 font-semibold">Lead ID</th>
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-semibold">Phone</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Organization</th>
                <th className="text-left px-4 py-3 font-semibold">Assigned To</th>
                <th className="text-left px-4 py-3 font-semibold">Created</th>
                <th className="text-left px-4 py-3 font-semibold">Source</th>
                <th className="text-left px-4 py-3 font-semibold">Score</th>
                <th className="text-left px-4 py-3 font-semibold">Stage</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Last Activity</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={13} className="text-center text-gray-400 py-10">Loading…</td></tr>
              ) : leads.map(l => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => openLead(l)}>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs whitespace-nowrap">{l.lead_number}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{l.name}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{l.phone}</td>
                  <td className="px-4 py-3 text-gray-500">{l.email || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600">{l.tenant_name}</span></td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{l.assigned_to_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtDate(l.created_at)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{prettify(l.source)}</td>
                  <td className="px-4 py-3"><StatusBadge status={l.lead_score} /></td>
                  <td className="px-4 py-3 text-gray-500 capitalize whitespace-nowrap">{l.stage}</td>
                  <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{timeAgo(l.last_activity_at)}</td>
                  <td className="px-4 py-3">
                    <ActionMenu items={[
                      { label: 'View Details', icon: Eye, onClick: () => openLead(l) },
                      { label: 'View Activity', icon: History, onClick: () => openLead(l) },
                      { label: 'View Organization', icon: Store, onClick: () => navigate(`/super-admin/workspaces/${l.tenant_id}`) },
                    ]} />
                  </td>
                </tr>
              ))}
              {!loading && !leads.length && (
                <tr><td colSpan={13}>
                  <EmptyState message="No leads found" className="pt-8" />
                  <p className="text-xs text-gray-400 text-center pb-8">Try changing your search or filters.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <div className="flex items-center">
            <label className="pl-4 text-xs text-gray-400 flex items-center gap-2 border-t py-3 self-stretch">
              Rows per page
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1 border rounded-lg text-xs bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <div className="flex-1">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={total} pageSize={pageSize} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border">
          <div className="px-4 py-3 border-b"><h3 className="font-semibold text-gray-900">Organization Lead Summary</h3></div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-gray-400 uppercase border-b">
                  <th className="text-left px-4 py-3 font-semibold">Organization</th>
                  <th className="text-right px-4 py-3 font-semibold">Total</th>
                  <th className="text-right px-4 py-3 font-semibold">Active</th>
                  <th className="text-right px-4 py-3 font-semibold">Converted</th>
                  <th className="text-right px-4 py-3 font-semibold">Lost</th>
                </tr>
              </thead>
              <tbody>
                {summary.organizations.map(o => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => { setTenantFilter(o.id); setUserFilter(ALL_USERS); setPage(1); }}>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{o.name}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{o.total}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{o.active}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{o.converted}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{o.lost}</td>
                  </tr>
                ))}
                {!summary.organizations.length && <tr><td colSpan={5}><EmptyState message="No organizations yet." /></td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border">
          <div className="px-4 py-3 border-b"><h3 className="font-semibold text-gray-900">User Lead Summary</h3></div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-gray-400 uppercase border-b">
                  <th className="text-left px-4 py-3 font-semibold">User</th>
                  <th className="text-left px-4 py-3 font-semibold">Organization</th>
                  <th className="text-left px-4 py-3 font-semibold">Role</th>
                  <th className="text-right px-4 py-3 font-semibold">Leads</th>
                </tr>
              </thead>
              <tbody>
                {summary.users.map(u => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                    onClick={() => { setTenantFilter(u.tenant_id || ALL_ORGS); setUserFilter(u.id); setPage(1); }}>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{u.name}</td>
                    <td className="px-4 py-2.5 text-gray-500">{u.tenant_name || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-500 capitalize">{u.role || '—'}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{u.leads}</td>
                  </tr>
                ))}
                {!summary.users.length && <tr><td colSpan={4}><EmptyState message="No assigned leads yet." /></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <>
          <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setSelected(null)} />
          <aside className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-40 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b shrink-0">
              <h3 className="font-semibold text-gray-900">Lead Details</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={18} /></button>
            </div>
            <div className="p-5 overflow-y-auto">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold shrink-0">
                  {(selected.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{selected.name}</p>
                  <StatusBadge status={selected.status} />
                </div>
              </div>
              <p className="flex items-center gap-2 text-sm text-gray-600 mb-1"><Phone size={14} className="text-gray-400" /> {selected.phone || '—'}</p>
              <p className="flex items-center gap-2 text-sm text-gray-600 mb-4"><Mail size={14} className="text-gray-400" /> {selected.email || '—'}</p>
              <dl>
                <DetailRow label="Lead ID"><span className="font-mono text-xs">{selected.lead_number}</span></DetailRow>
                <DetailRow label="Organization">{selected.tenant_name}</DetailRow>
                <DetailRow label="Assigned To">{selected.assigned_to_name || '—'}</DetailRow>
                <DetailRow label="Source">{prettify(selected.source)}</DetailRow>
                <DetailRow label="Score"><StatusBadge status={selected.lead_score} /></DetailRow>
                <DetailRow label="Stage"><span className="capitalize">{selected.stage}</span></DetailRow>
                <DetailRow label="Created">{fmtDateTime(selected.created_at)}</DetailRow>
                <DetailRow label="Last Activity">{fmtDateTime(selected.last_activity_at)}</DetailRow>
              </dl>

              <h4 className="text-sm font-semibold text-gray-900 mt-5 mb-3">Activity Timeline</h4>
              {timeline.loading && <p className="text-sm text-gray-400">Loading…</p>}
              {timeline.error && <p className="text-sm text-red-600">{timeline.error}</p>}
              {!timeline.loading && !timeline.error && !timeline.items.length && <p className="text-sm text-gray-400">No activity recorded for this lead yet.</p>}
              <ol className="relative border-l border-indigo-100 ml-2 space-y-4">
                {timeline.items.map(a => (
                  <li key={`${a.type}-${a.id}`} className="pl-4">
                    <span className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-indigo-400 ring-4 ring-white" />
                    <p className="text-sm font-medium text-gray-800">{a.title || prettify(a.type)}</p>
                    {a.description && <p className="text-xs text-gray-500 mt-0.5 break-words">{a.description}</p>}
                    <p className="text-[11px] text-gray-400 mt-0.5">{fmtDateTime(a.created_at)}{a.created_by_name ? ` · ${a.created_by_name}` : ''}</p>
                  </li>
                ))}
              </ol>

              <button onClick={() => navigate(`/super-admin/workspaces/${selected.tenant_id}`)}
                className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50">
                <Store size={15} /> View Organization
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

export default SuperAdminLeadsPage;
