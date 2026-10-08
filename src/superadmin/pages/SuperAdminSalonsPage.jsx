import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, Building2, Users, Clock, ShieldOff, ChevronRight } from 'lucide-react';
import LinkStatCard from '../components/ui/LinkStatCard';
import OwnerCell from '../components/ui/OwnerCell';
import StatusBadge from '../components/StatusBadge';
import { superAdminAPI } from '../../services/api';

const SuperAdminSalonsPage = () => {
  const [search, setSearch] = useState('');
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [extendingId, setExtendingId] = useState(null);

  const load = () => {
    setLoading(true);
    superAdminAPI.getTenants()
      .then(({ data }) => setTenants(data.tenants || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => tenants.filter(t => {
    const q = search.trim().toLowerCase();
    return !q || t.name?.toLowerCase().includes(q) || t.slug?.toLowerCase().includes(q) || t.owner_email?.toLowerCase().includes(q);
  }), [search, tenants]);

  const handleExtendTrial = async (id) => {
    setExtendingId(id);
    try {
      await superAdminAPI.extendTrial(id, 14);
      load();
    } catch (e) { console.error(e); }
    finally { setExtendingId(null); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <nav className="flex items-center gap-1 text-xs text-gray-400">
        <Link to="/super-admin/dashboard" className="hover:text-indigo-600">Dashboard</Link>
        <ChevronRight size={12} />
        <span className="text-gray-500">Business Management</span>
      </nav>
      <div>
        <h1 className="text-2xl font-bold text-[#141a3d] tracking-tight">Business Management</h1>
        <p className="text-sm text-gray-500">Manage all your businesses in one place.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <LinkStatCard label="Businesses Registered" value={tenants.length} icon={Building2} tint="bg-indigo-50 text-indigo-500" />
        <LinkStatCard label="Active Businesses" value={tenants.filter(t => t.subscription_status === 'active').length} icon={Users} tint="bg-emerald-50 text-emerald-500" />
        <LinkStatCard label="On Trial" value={tenants.filter(t => t.subscription_status === 'trial').length} icon={Clock} tint="bg-amber-50 text-amber-500" />
        <LinkStatCard label="Suspended" value={tenants.filter(t => t.subscription_status === 'halted').length} icon={ShieldOff} tint="bg-red-50 text-red-500" />
      </div>

      <div className="bg-white rounded-2xl border">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search businesses or email..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase border-b">
                <th className="text-left px-4 py-3 font-semibold">Business</th>
                <th className="text-left px-4 py-3 font-semibold">Owner</th>
                <th className="text-left px-4 py-3 font-semibold">Plan</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Date Remaining</th>
                <th className="text-left px-4 py-3 font-semibold">Staff</th>
                <th className="text-left px-4 py-3 font-semibold">Clients</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center text-gray-400 py-10">Loading…</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{t.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><OwnerCell name={t.owner_name} /></td>
                  <td className="px-4 py-3 text-gray-500">{t.plan_name || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.subscription_status} /></td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{t.trial_ends_at ? new Date(t.trial_ends_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{t.user_count}</td>
                  <td className="px-4 py-3 text-gray-500">{t.lead_count}</td>
                  <td className="px-4 py-3">
                    {t.subscription_status === 'trial' && (
                      <button onClick={() => handleExtendTrial(t.id)} disabled={extendingId === t.id}
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:underline disabled:opacity-50">
                        <RefreshCw size={12} className={extendingId === t.id ? 'animate-spin' : ''} /> Extend trial +14d
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && !filtered.length && (
                <tr><td colSpan={9} className="text-center text-gray-400 py-10">No businesses found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-gray-400">
            <span>Showing {filtered.length} of {tenants.length} businesses</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminSalonsPage;
