import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import SelectFilter from '../components/ui/SelectFilter';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { superAdminAPI } from '../../services/api';

const PAGE_SIZE = 20;
const SOURCE_OPTIONS = ['manual', 'website', 'meta_ads', 'google_ads', 'whatsapp', 'referral', 'walkin'];
const STAGE_OPTIONS = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
const SCORE_OPTIONS = ['hot', 'warm', 'cold'];

const SuperAdminLeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState('All Workspaces');
  const [sourceFilter, setSourceFilter] = useState('All Sources');
  const [stageFilter, setStageFilter] = useState('All Stages');
  const [scoreFilter, setScoreFilter] = useState('All Scores');
  const [page, setPage] = useState(1);

  useEffect(() => {
    superAdminAPI.getTenants().then(({ data }) => setTenants(data.tenants || [])).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const tenant = tenants.find(t => t.name === tenantFilter);
    const params = {
      page, limit: PAGE_SIZE,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(tenant ? { tenant_id: tenant.id } : {}),
      ...(sourceFilter !== 'All Sources' ? { source: sourceFilter } : {}),
      ...(stageFilter !== 'All Stages' ? { stage: stageFilter } : {}),
      ...(scoreFilter !== 'All Scores' ? { score: scoreFilter } : {}),
    };
    superAdminAPI.getLeads(params)
      .then(({ data }) => { setLeads(data.leads || []); setTotal(data.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, tenantFilter, sourceFilter, stageFilter, scoreFilter, tenants]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const workspaceNames = useMemo(() => tenants.map(t => t.name), [tenants]);

  const resetPage = (setter) => (v) => { setter(v); setPage(1); };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader title="Leads" subtitle="Leads across every workspace on the platform." />

      <div className="bg-white rounded-2xl border">
        <div className="flex flex-wrap items-center gap-2.5 p-4 border-b">
          <SearchInput value={search} onChange={resetPage(setSearch)} placeholder="Search by name, phone, or email..." className="flex-1 min-w-[220px]" />
          <SelectFilter value={tenantFilter} onChange={resetPage(setTenantFilter)} allLabel="All Workspaces" options={workspaceNames} />
          <SelectFilter value={sourceFilter} onChange={resetPage(setSourceFilter)} allLabel="All Sources" options={SOURCE_OPTIONS} />
          <SelectFilter value={stageFilter} onChange={resetPage(setStageFilter)} allLabel="All Stages" options={STAGE_OPTIONS} />
          <SelectFilter value={scoreFilter} onChange={resetPage(setScoreFilter)} allLabel="All Scores" options={SCORE_OPTIONS} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase border-b">
                <th className="text-left px-4 py-3 font-semibold">Lead ID</th>
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-semibold">Phone</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Created</th>
                <th className="text-left px-4 py-3 font-semibold">Source</th>
                <th className="text-left px-4 py-3 font-semibold">Score</th>
                <th className="text-left px-4 py-3 font-semibold">Stage</th>
                <th className="text-left px-4 py-3 font-semibold">Assigned To</th>
                <th className="text-left px-4 py-3 font-semibold">Workspace</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center text-gray-400 py-10">Loading…</td></tr>
              ) : leads.map(l => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{l.lead_number}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{l.name}</td>
                  <td className="px-4 py-3 text-gray-500">{l.phone}</td>
                  <td className="px-4 py-3 text-gray-500">{l.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(l.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{l.source}</td>
                  <td className="px-4 py-3"><StatusBadge status={l.lead_score} /></td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{l.stage}</td>
                  <td className="px-4 py-3 text-gray-500">{l.assigned_to_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{l.tenant_name}</td>
                </tr>
              ))}
              {!loading && !leads.length && (
                <tr><td colSpan={10}><EmptyState message="No leads match your filters." /></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={total} pageSize={PAGE_SIZE} />}
      </div>
    </div>
  );
};

export default SuperAdminLeadsPage;
