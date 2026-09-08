import { useMemo, useState } from 'react';
import { Plus, Search, MoreHorizontal } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { MOCK_SALONS } from '../mockData';

const SuperAdminSalonsPage = () => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => MOCK_SALONS.filter(s => {
    const q = search.trim().toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q);
  }), [search]);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Salons</h1>
          <p className="text-sm text-gray-500">Manage and track all salons.</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">
          <Plus size={16} /> Add Salon
        </button>
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
                <th className="text-left px-4 py-3 font-semibold">Location</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Total Bookings</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.location}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{s.totalBookings}</td>
                  <td className="px-4 py-3">
                    <button className="p-1 text-gray-400 hover:text-gray-700"><MoreHorizontal size={16} /></button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={5} className="text-center text-gray-400 py-10">No salons found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-gray-400">
          <div className="flex gap-1">
            {[1, 2].map(n => (
              <button key={n} className={`w-7 h-7 rounded-lg ${n === 1 ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>{n}</button>
            ))}
          </div>
          <span>Showing 1-{filtered.length} of {MOCK_SALONS.length} salons</span>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSalonsPage;
