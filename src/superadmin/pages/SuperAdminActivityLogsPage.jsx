import { useEffect, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import SelectFilter from '../components/ui/SelectFilter';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { superAdminAPI } from '../../services/api';

const MODULE_OPTIONS = ['Workspaces', 'Users', 'Leads', 'Subscriptions', 'Billing', 'Plans'];
const STATUS_OPTIONS = ['Success', 'Warning', 'Failed'];
const MODULE_COLORS = {
  Workspaces: 'bg-violet-50 text-violet-600',
  Users: 'bg-blue-50 text-blue-600',
  Leads: 'bg-amber-50 text-amber-600',
  Subscriptions: 'bg-emerald-50 text-emerald-600',
  Billing: 'bg-pink-50 text-pink-600',
  Plans: 'bg-indigo-50 text-indigo-600',
};

const timeAgo = (iso) => {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN');
};

const SuperAdminActivityLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All Modules');
  const [statusFilter, setStatusFilter] = useState('All Status');

  useEffect(() => {
    setLoading(true);
    const params = {
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(moduleFilter !== 'All Modules' ? { module: moduleFilter } : {}),
      ...(statusFilter !== 'All Status' ? { status: statusFilter } : {}),
    };
    const t = setTimeout(() => {
      superAdminAPI.getActivityLogs(params)
        .then(({ data }) => setLogs(data.logs || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [search, moduleFilter, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader title="Activity Logs" subtitle="Audit trail of platform-wide actions." />

      <div className="bg-white rounded-2xl border">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by user, workspace, or action..." className="flex-1 min-w-[220px]" />
          <SelectFilter value={moduleFilter} onChange={setModuleFilter} allLabel="All Modules" options={MODULE_OPTIONS} />
          <SelectFilter value={statusFilter} onChange={setStatusFilter} allLabel="All Status" options={STATUS_OPTIONS} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase border-b">
                <th className="text-left px-4 py-3 font-semibold">Date &amp; Time</th>
                <th className="text-left px-4 py-3 font-semibold">User</th>
                <th className="text-left px-4 py-3 font-semibold">Workspace</th>
                <th className="text-left px-4 py-3 font-semibold">Action</th>
                <th className="text-left px-4 py-3 font-semibold">Module</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center text-gray-400 py-10">Loading…</td></tr>
              ) : logs.map(l => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400" title={new Date(l.created_at).toLocaleString('en-IN')}>{timeAgo(l.created_at)}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{l.actor_name}</td>
                  <td className="px-4 py-3 text-gray-500">{l.workspace || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{l.action}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${MODULE_COLORS[l.module] || 'bg-gray-100 text-gray-600'}`}>
                      {l.module}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                </tr>
              ))}
              {!loading && !logs.length && (
                <tr><td colSpan={6}><EmptyState message="No activity recorded yet — actions taken from this console will start appearing here." /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminActivityLogsPage;
