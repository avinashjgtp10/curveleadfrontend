import { useMemo, useState } from 'react';
import { Search, MoreHorizontal } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { MOCK_BOOKINGS, MOCK_SALONS } from '../mockData';

const STATUS_OPTIONS = ['All Status', 'Confirmed', 'Pending', 'Completed', 'Canceled'];

const SuperAdminBookingsPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [salonFilter, setSalonFilter] = useState('All Salons');

  const filtered = useMemo(() => MOCK_BOOKINGS.filter(b => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || b.customer.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All Status' || b.status === statusFilter;
    const matchesSalon = salonFilter === 'All Salons' || b.salon === salonFilter;
    return matchesSearch && matchesStatus && matchesSalon;
  }), [search, statusFilter, salonFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-500">View and manage all bookings</p>
      </div>

      <div className="bg-white rounded-2xl border">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={salonFilter} onChange={e => setSalonFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option>All Salons</option>
            {MOCK_SALONS.map(s => <option key={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase border-b">
                <th className="text-left px-4 py-3 font-semibold">Customer</th>
                <th className="text-left px-4 py-3 font-semibold">Service</th>
                <th className="text-left px-4 py-3 font-semibold">Salon</th>
                <th className="text-left px-4 py-3 font-semibold">Date & Time</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{b.customer}</td>
                  <td className="px-4 py-3 text-gray-500">{b.service}</td>
                  <td className="px-4 py-3 text-gray-500">{b.salon}</td>
                  <td className="px-4 py-3 text-gray-400">{b.datetime}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3">
                    <button className="p-1 text-gray-400 hover:text-gray-700"><MoreHorizontal size={16} /></button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-10">No bookings match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-gray-400">
          <div className="flex gap-1">
            {[1, 2, 3].map(n => (
              <button key={n} className={`w-7 h-7 rounded-lg ${n === 1 ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>{n}</button>
            ))}
          </div>
          <span>Showing 1-{filtered.length} of {MOCK_BOOKINGS.length} bookings</span>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminBookingsPage;
