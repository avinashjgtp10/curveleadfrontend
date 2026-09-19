import { useEffect, useState } from 'react';
import { LifeBuoy, Mail, Phone } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import SelectFilter from '../components/ui/SelectFilter';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { superAdminAPI } from '../../services/api';

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'];
const STATUS_LABEL = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };

const SuperAdminSupportPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [expandedId, setExpandedId] = useState(null);

  const load = () => {
    setLoading(true);
    const params = {
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(statusFilter !== 'All Status' ? { status: statusFilter } : {}),
    };
    superAdminAPI.getSupportTickets(params)
      .then(({ data }) => setTickets(data.tickets || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  const changeStatus = async (id, status) => {
    try {
      await superAdminAPI.updateSupportTicket(id, { status });
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <PageHeader title="Support" subtitle="Platform support tickets and escalations." />

      <div className="bg-white rounded-2xl border">
        <div className="flex flex-wrap items-center gap-2.5 p-4 border-b">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, or message..." className="flex-1 min-w-[220px]" />
          <SelectFilter value={statusFilter} onChange={setStatusFilter} allLabel="All Status" options={STATUS_OPTIONS} />
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading…</div>
        ) : tickets.length === 0 ? (
          <div className="p-10">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <LifeBuoy size={26} />
            </div>
            <EmptyState message="No support tickets match your filters." />
          </div>
        ) : (
          <div className="divide-y">
            {tickets.map(t => (
              <div key={t.id} className="p-4">
                <button onClick={() => setExpandedId(id => id === t.id ? null : t.id)} className="w-full text-left flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-800">{t.name}</span>
                      <StatusBadge status={STATUS_LABEL[t.status] || t.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{t.message}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{new Date(t.created_at).toLocaleDateString('en-IN')}</span>
                </button>

                {expandedId === t.id && (
                  <div className="mt-3 pt-3 border-t space-y-3">
                    <p className="text-sm text-gray-700 whitespace-pre-line">{t.message}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <a href={`mailto:${t.email}`} className="flex items-center gap-1 hover:text-indigo-600"><Mail size={12} /> {t.email}</a>
                      {t.phone && <a href={`tel:${t.phone}`} className="flex items-center gap-1 hover:text-indigo-600"><Phone size={12} /> {t.phone}</a>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500">Status:</span>
                      <select value={t.status} onChange={e => changeStatus(t.id, e.target.value)}
                        className="px-2 py-1 border rounded-lg text-xs bg-white">
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminSupportPage;
