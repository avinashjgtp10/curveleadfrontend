import { useMemo, useState } from 'react';
import { Search, MoreHorizontal } from 'lucide-react';
import { MOCK_CUSTOMERS } from '../mockData';

const SuperAdminCustomersPage = () => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => MOCK_CUSTOMERS.filter(c => {
    const q = search.trim().toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q);
  }), [search]);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500">Manage your customer database.</p>
      </div>

      <div className="bg-white rounded-2xl border">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, email..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase border-b">
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-semibold">Phone</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Total Bookings</th>
                <th className="text-left px-4 py-3 font-semibold">Last Visit</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email}</td>
                  <td className="px-4 py-3 text-gray-500">{c.totalBookings}</td>
                  <td className="px-4 py-3 text-gray-400">{c.lastVisit}</td>
                  <td className="px-4 py-3">
                    <button className="p-1 text-gray-400 hover:text-gray-700"><MoreHorizontal size={16} /></button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-10">No customers found.</td></tr>
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
          <span>Showing 1-{filtered.length} of {MOCK_CUSTOMERS.length} customers</span>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminCustomersPage;
