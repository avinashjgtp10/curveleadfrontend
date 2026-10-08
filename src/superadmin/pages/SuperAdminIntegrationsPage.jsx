import { useEffect, useMemo, useState } from 'react';
import { Megaphone, Plug, Search, Webhook, Check, Minus } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { superAdminAPI } from '../../services/api';

const CARDS = {
  meta: { desc: 'Lead ads, pages and conversion signals.', icon: Megaphone },
  google: { desc: 'Lead forms, ads and profile activity.', icon: Search },
  whatsapp: { desc: 'Business API messaging and templates.', icon: Plug },
  webhooks: { desc: 'Developer API keys and outgoing events.', icon: Webhook },
};
const COLUMNS = [
  { key: 'meta', label: 'Meta' },
  { key: 'google', label: 'Google' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'api', label: 'API / Webhooks' },
];

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null);
const statusLabel = (s) => (s === 'halted' ? 'Suspended' : s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');

const Connected = ({ on }) => (on
  ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600"><Check size={12} /> Connected</span>
  : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-400"><Minus size={12} /> Not connected</span>);

const SuperAdminIntegrationsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(null); // integration key highlighted as a table filter

  useEffect(() => {
    superAdminAPI.getIntegrationsOverview()
      .then(({ data: res }) => setData(res))
      .catch((e) => { console.error(e); setError(e.response?.data?.error || 'Could not load integrations.'); })
      .finally(() => setLoading(false));
  }, []);

  const organizations = useMemo(() => (data?.organizations || []).filter(o => {
    const q = search.trim().toLowerCase();
    const filterKey = active === 'webhooks' ? 'api' : active;
    return (!q || o.name.toLowerCase().includes(q)) && (!active || o[filterKey]);
  }), [data, search, active]);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <PageHeader title="Integrations" subtitle="Platform-level overview of connected systems across organizations." />

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        {(data?.integrations || Object.keys(CARDS).map(key => ({ key, name: key, stats: [] }))).map(item => {
          const { desc, icon: Icon } = CARDS[item.key];
          const selected = active === item.key;
          const last = fmtDateTime(item.last_activity);
          return (
            <button key={item.key} onClick={() => setActive(a => (a === item.key ? null : item.key))} disabled={!data}
              className={`text-left bg-white rounded-2xl border p-5 flex items-start gap-4 transition-shadow hover:shadow-md ${selected ? 'border-indigo-400 ring-2 ring-indigo-100' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Icon size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  {data && (
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5 shrink-0">
                      {item.connected_orgs} / {data.total_organizations} organizations
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{desc}</p>
                {item.stats.length > 0 && (
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    {item.stats.map(s => (
                      <div key={s.label} className="flex items-center justify-between gap-2">
                        <dt className="text-gray-500 truncate">{s.label}</dt>
                        <dd className="font-semibold text-gray-800">{Number(s.value).toLocaleString('en-IN')}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {last && <p className="text-[11px] text-gray-400 mt-2">Last activity: {last}</p>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b">
          <div>
            <h3 className="font-semibold text-gray-900">Organization Integrations</h3>
            <p className="text-xs text-gray-500">
              {active ? `Showing organizations with ${data.integrations.find(i => i.key === active)?.name} connected. Click the card again to clear.` : 'Click an integration above to filter the organizations.'}
            </p>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search organizations..." className="w-56" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase border-b bg-slate-50/60">
                <th className="text-left px-4 py-3 font-semibold">Organization</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                {COLUMNS.map(c => <th key={c.key} className="text-left px-4 py-3 font-semibold whitespace-nowrap">{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center text-gray-400 py-10">Loading…</td></tr>
              ) : organizations.map(o => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{o.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={statusLabel(o.status)} /></td>
                  {COLUMNS.map(c => <td key={c.key} className="px-4 py-3 whitespace-nowrap"><Connected on={o[c.key]} /></td>)}
                </tr>
              ))}
              {!loading && !organizations.length && <tr><td colSpan={6}><EmptyState message="No organizations match." /></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminIntegrationsPage;
