import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import SelectFilter from '../components/ui/SelectFilter';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { superAdminAPI } from '../../services/api';

const PAGE_SIZE = 20;
const TYPE_OPTIONS = ['call', 'whatsapp', 'visit', 'email', 'demo'];
const STATUS_OPTIONS = ['Pending', 'Completed', 'Canceled'];

const SuperAdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [search, setSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState('All Workspaces');
  const [typeFilter, setTypeFilter] = useState('All Types');
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
      ...(typeFilter !== 'All Types' ? { type: typeFilter } : {}),
      ...(statusFilter !== 'All Status' ? { status: statusFilter } : {}),
    };
    superAdminAPI.getBookings(params)
      .then(({ data }) => { setBookings(data.bookings || []); setTotal(data.total || 0); setUnavailable(false); })
      .catch((e) => { if (e.response?.status === 404) setUnavailable(true); else console.error(e); })
      .finally(() => setLoading(false));
  }, [page, search, tenantFilter, typeFilter, statusFilter, tenants]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const workspaceNames = useMemo(() => tenants.map(t => t.name), [tenants]);

  const resetPage = (setter) => (v) => { setter(v); setPage(1); };

  if (unavailable) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <PageHeader title="Bookings" subtitle="Appointments booked across every workspace." />
        <div className="bg-white rounded-2xl border p-10">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <CalendarCheck size={26} />
          </div>
          <EmptyState message="Booking data isn't tracked in a dedicated table yet, so there's nothing real to show here." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader title="Bookings" subtitle="Appointments booked across every workspace." />

      <div className="bg-white rounded-2xl border">
        <div className="flex flex-wrap items-center gap-2.5 p-4 border-b">
          <SearchInput value={search} onChange={resetPage(setSearch)} placeholder="Search by lead name or phone..." className="flex-1 min-w-[220px]" />
          <SelectFilter value={tenantFilter} onChange={resetPage(setTenantFilter)} allLabel="All Workspaces" options={workspaceNames} />
          <SelectFilter value={typeFilter} onChange={resetPage(setTypeFilter)} allLabel="All Types" options={TYPE_OPTIONS} />
          <SelectFilter value={statusFilter} onChange={resetPage(setStatusFilter)} allLabel="All Status" options={STATUS_OPTIONS} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase border-b">
                <th className="text-left px-4 py-3 font-semibold">Lead</th>
                <th className="text-left px-4 py-3 font-semibold">Phone</th>
                <th className="text-left px-4 py-3 font-semibold">Type</th>
                <th className="text-left px-4 py-3 font-semibold">Scheduled For</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Assigned To</th>
                <th className="text-left px-4 py-3 font-semibold">Workspace</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center text-gray-400 py-10">Loading…</td></tr>
              ) : bookings.map(b => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{b.lead_name}</td>
                  <td className="px-4 py-3 text-gray-500">{b.lead_phone}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{b.type}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(b.scheduled_at).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{b.assigned_to_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{b.tenant_name}</td>
                </tr>
              ))}
              {!loading && !bookings.length && (
                <tr><td colSpan={7}><EmptyState message="No bookings match your filters." /></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={total} pageSize={PAGE_SIZE} />}
      </div>
    </div>
  );
};

export default SuperAdminBookingsPage;
