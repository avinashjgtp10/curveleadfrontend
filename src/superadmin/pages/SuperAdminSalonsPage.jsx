import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
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
    return !q || t.name?.toLowerCase().includes(q) || t.slug?.toLowerCase().includes(q);
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
      <div>
        <h1 className="text-xl font-bold text-gray-900">Salons</h1>
        <p className="text-sm text-gray-500">Every business (tenant) using CurveLead.</p>
      </div>

      <div className="bg-white rounded-2xl border">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by salon name..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase border-b">
                <th className="text-left px-4 py-3 font-semibold">Salon Name</th>
                <th className="text-left px-4 py-3 font-semibold">Plan</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Users</th>
                <th className="text-left px-4 py-3 font-semibold">Leads</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center text-gray-400 py-10">Loading…</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{t.name}</td>
                  <td className="px-4 py-3 text-gray-500">{t.plan_name || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.subscription_status} /></td>
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
                <tr><td colSpan={6} className="text-center text-gray-400 py-10">No salons found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-gray-400">
            <span>Showing {filtered.length} of {tenants.length} salons</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminSalonsPage;
