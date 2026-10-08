import { useEffect, useMemo, useState } from 'react';
import { LifeBuoy, Mail, Phone, Building2, Inbox, Loader2, CheckCircle2, Archive, ChevronDown } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import SelectFilter from '../components/ui/SelectFilter';
import LinkStatCard from '../components/ui/LinkStatCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { superAdminAPI } from '../../services/api';

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'];
const STATUS_LABEL = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };
const PRIORITY_STYLES = {
  low: { dot: 'bg-gray-400', pill: 'bg-gray-100 text-gray-600' },
  medium: { dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700' },
  high: { dot: 'bg-red-500', pill: 'bg-red-50 text-red-600' },
};

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
// Tickets come from different forms; every field beyond name/email/message may be absent.
const ticketOrg = (t) => t.tenant_name || t.workspace || t.organization || '';
const ticketPriority = (t) => (t.priority || '').toLowerCase();

const PriorityBadge = ({ priority }) => {
  const style = PRIORITY_STYLES[priority];
  if (!style) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${style.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />{capitalize(priority)}
    </span>
  );
};

const SuperAdminSupportPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [expandedId, setExpandedId] = useState(null);
  const [counts, setCounts] = useState({});

  const load = () => {
    setLoading(true);
    const params = {
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(statusFilter !== 'All Status' ? { status: statusFilter } : {}),
    };
    superAdminAPI.getSupportTickets(params)
      .then(({ data }) => { setTickets(data.tickets || []); setError(''); })
      .catch((e) => { console.error(e); setError('Could not load support tickets.'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  // Counts for the summary tiles come from the unfiltered ticket list.
  const loadCounts = () => superAdminAPI.getSupportTickets({})
    .then(({ data }) => setCounts((data.tickets || []).reduce((acc, t) => ({ ...acc, [t.status]: (acc[t.status] || 0) + 1 }), {})))
    .catch(console.error);
  useEffect(() => { loadCounts(); }, []);

  const changeStatus = async (id, status) => {
    try {
      await superAdminAPI.updateSupportTicket(id, { status });
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      loadCounts();
    } catch (e) { console.error(e); setError('Could not update the ticket status.'); }
  };

  const visible = useMemo(
    () => tickets.filter(t => priorityFilter === 'All Priorities' || ticketPriority(t) === priorityFilter.toLowerCase()),
    [tickets, priorityFilter],
  );
  const hasPriority = tickets.some(t => ticketPriority(t));

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <PageHeader title="Support" subtitle="Support requests submitted by users across every organization." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <LinkStatCard label="Open" value={counts.open || 0} icon={Inbox} tint="bg-red-50 text-red-500" onClick={() => setStatusFilter('open')} />
        <LinkStatCard label="In Progress" value={counts.in_progress || 0} icon={Loader2} tint="bg-amber-50 text-amber-500" onClick={() => setStatusFilter('in_progress')} />
        <LinkStatCard label="Resolved" value={counts.resolved || 0} icon={CheckCircle2} tint="bg-emerald-50 text-emerald-500" onClick={() => setStatusFilter('resolved')} />
        <LinkStatCard label="Closed" value={counts.closed || 0} icon={Archive} tint="bg-gray-100 text-gray-500" onClick={() => setStatusFilter('closed')} />
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-2xl border">
        <div className="flex flex-wrap items-center gap-2.5 p-4 border-b">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, subject or message..." className="flex-1 min-w-[220px]" />
          <SelectFilter value={statusFilter} onChange={setStatusFilter} allLabel="All Status" options={STATUS_OPTIONS} />
          {hasPriority && <SelectFilter value={priorityFilter} onChange={setPriorityFilter} allLabel="All Priorities" options={['High', 'Medium', 'Low']} />}
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="p-10">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <LifeBuoy size={26} />
            </div>
            <EmptyState message="No support tickets match your filters." />
          </div>
        ) : (
          <div className="divide-y">
            {visible.map(t => {
              const open = expandedId === t.id;
              const org = ticketOrg(t);
              return (
                <div key={t.id} className="p-4">
                  <button onClick={() => setExpandedId(id => (id === t.id ? null : t.id))} className="w-full text-left flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900 break-words">{t.subject || t.name}</span>
                        <StatusBadge status={STATUS_LABEL[t.status] || t.status} />
                        <PriorityBadge priority={ticketPriority(t)} />
                        {t.category && <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-semibold">{capitalize(t.category)}</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        {t.subject && <span>{t.name}</span>}
                        {org && <span className="inline-flex items-center gap-1"><Building2 size={11} /> {org}</span>}
                        <span>{fmtDateTime(t.created_at)}</span>
                      </p>
                      {!open && <p className="text-xs text-gray-400 mt-1 truncate">{t.message}</p>}
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 shrink-0 mt-1 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>

                  {open && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      <p className="text-sm text-gray-700 whitespace-pre-line break-words">{t.message}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        {t.email && <a href={`mailto:${t.email}`} className="flex items-center gap-1 hover:text-indigo-600"><Mail size={12} /> {t.email}</a>}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminSupportPage;
