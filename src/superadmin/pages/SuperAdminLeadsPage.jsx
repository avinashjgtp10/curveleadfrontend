import { useMemo, useState } from 'react';
import { Plus, Search, MoreHorizontal } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import AddLeadModal from '../components/AddLeadModal';
import LeadDetailPanel from '../components/LeadDetailPanel';
import { INITIAL_LEADS, SERVICE_OPTIONS } from '../mockData';

const STATUS_OPTIONS = ['All Status', 'New', 'Contacted', 'Interested'];

const SuperAdminLeadsPage = () => {
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [serviceFilter, setServiceFilter] = useState('All Services');
  const [showAdd, setShowAdd] = useState(false);
  const [activeLead, setActiveLead] = useState(null);

  const filtered = useMemo(() => leads.filter(l => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || l.name.toLowerCase().includes(q) || l.phone.includes(q) || (l.email || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All Status' || l.status === statusFilter;
    const matchesService = serviceFilter === 'All Services' || l.service === serviceFilter;
    return matchesSearch && matchesStatus && matchesService;
  }), [leads, search, statusFilter, serviceFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500">Manage and track all your leads</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">
          <Plus size={16} /> Add Lead
        </button>
      </div>

      <div className="bg-white rounded-2xl border">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, email..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm">
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm">
            <option>All Services</option>
            {SERVICE_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase border-b">
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-semibold">Phone</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Service</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Created At</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => setActiveLead(l)}>
                  <td className="px-4 py-3 font-medium text-gray-800">{l.name}</td>
                  <td className="px-4 py-3 text-gray-500">{l.phone}</td>
                  <td className="px-4 py-3 text-gray-500">{l.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{l.service}</td>
                  <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                  <td className="px-4 py-3 text-gray-400">{l.createdAt}</td>
                  <td className="px-4 py-3">
                    <button onClick={e => e.stopPropagation()} className="p-1 text-gray-400 hover:text-gray-700">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={7} className="text-center text-gray-400 py-10">No leads match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-gray-400">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} className={`w-7 h-7 rounded-lg ${n === 1 ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>{n}</button>
            ))}
          </div>
          <span>Showing 1-{filtered.length} of {leads.length} leads</span>
        </div>
      </div>

      {showAdd && (
        <AddLeadModal
          onClose={() => setShowAdd(false)}
          onAdd={(lead) => { setLeads(prev => [lead, ...prev]); setShowAdd(false); }}
        />
      )}
      {activeLead && <LeadDetailPanel lead={activeLead} onClose={() => setActiveLead(null)} />}
    </div>
  );
};

export default SuperAdminLeadsPage;
