import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import SelectFilter from '../components/ui/SelectFilter';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { superAdminAPI } from '../../services/api';

const PAGE_SIZE = 20;
const SOURCE_OPTIONS = ['meta_ads', 'google_ads', 'manual', 'referral', 'website', 'walkin'];
const STATUS_OPTIONS = ['active', 'paused', 'completed', 'draft'];

const SuperAdminCampaignsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [total, setTotal] = useState(0);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState('All Workspaces');
  const [sourceFilter, setSourceFilter] = useState('All Sources');
  const [statusFilter, setStatusFilter] = useState('All Status');
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
      ...(statusFilter !== 'All Status' ? { status: statusFilter } : {}),
    };
    superAdminAPI.getCampaigns(params)
      .then(({ data }) => { setCampaigns(data.campaigns || []); setTotal(data.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, tenantFilter, sourceFilter, statusFilter, tenants]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const workspaceNames = useMemo(() => tenants.map(t => t.name), [tenants]);

  const resetPage = (setter) => (v) => { setter(v); setPage(1); };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader title="Campaigns" subtitle="Ad campaign performance across every workspace." />

      <div className="bg-white rounded-2xl border">
        <div className="flex flex-wrap items-center gap-2.5 p-4 border-b">
          <SearchInput value={search} onChange={resetPage(setSearch)} placeholder="Search by campaign name..." className="flex-1 min-w-[220px]" />
          <SelectFilter value={tenantFilter} onChange={resetPage(setTenantFilter)} allLabel="All Workspaces" options={workspaceNames} />
          <SelectFilter value={sourceFilter} onChange={resetPage(setSourceFilter)} allLabel="All Sources" options={SOURCE_OPTIONS} />
          <SelectFilter value={statusFilter} onChange={resetPage(setStatusFilter)} allLabel="All Status" options={STATUS_OPTIONS} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase border-b">
                <th className="text-left px-4 py-3 font-semibold">Campaign</th>
                <th className="text-left px-4 py-3 font-semibold">Workspace</th>
                <th className="text-left px-4 py-3 font-semibold">Source</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Spent</th>
                <th className="text-right px-4 py-3 font-semibold">Leads</th>
                <th className="text-right px-4 py-3 font-semibold">Won</th>
                <th className="text-right px-4 py-3 font-semibold">CPL</th>
                <th className="text-left px-4 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center text-gray-400 py-10">Loading…</td></tr>
              ) : campaigns.map(c => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate" title={c.name}>{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.tenant_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{(c.source || '').replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-right text-gray-600">₹{Number(c.actual_spend || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{c.total_leads}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{c.won_leads}</td>
                  <td className="px-4 py-3 text-right text-gray-600">₹{c.cpl}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {!loading && !campaigns.length && (
                <tr><td colSpan={9}><EmptyState message="No campaigns match your filters." /></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={total} pageSize={PAGE_SIZE} />}
      </div>
    </div>
  );
};

export default SuperAdminCampaignsPage;
