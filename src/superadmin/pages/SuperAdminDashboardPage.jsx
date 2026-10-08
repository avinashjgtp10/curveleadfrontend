import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Building2, Users, UserRound, UserPlus, MessageSquareHeart, Zap, ArrowRight, TrendingUp, PieChart as PieIcon, Clock, ChevronDown,
} from 'lucide-react';
import LinkStatCard from '../components/ui/LinkStatCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { superAdminAPI } from '../../services/api';

const SOURCE_COLORS = ['#8b7cf6', '#60a5fa', '#4ade80', '#c7d7ee'];
const RANGE_OPTIONS = [{ label: 'Last 7 days', days: 7 }, { label: 'Last 14 days', days: 14 }, { label: 'Last 30 days', days: 30 }];
const LEAD_SAMPLE_LIMIT = 1000;

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
};

const fmtDateTime = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  const date = d.toLocaleDateString('en-GB');
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
};

const prettySource = (s) => {
  const v = (s || 'others').replace(/_/g, ' ');
  return v.charAt(0).toUpperCase() + v.slice(1);
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-indigo-50 shadow-[0_2px_12px_rgba(99,102,241,0.05)] ${className}`}>{children}</div>
);

const SuperAdminDashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [leadsTrend, setLeadsTrend] = useState([]);
  const [leadSample, setLeadSample] = useState([]);
  const [leadTotal, setLeadTotal] = useState(0);
  const [runningCampaigns, setRunningCampaigns] = useState(0);
  const [automationCount, setAutomationCount] = useState(0);
  const [rangeDays, setRangeDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const safe = (p) => p.catch((e) => { console.error(e); return null; });
    Promise.all([
      safe(superAdminAPI.getStats()),
      safe(superAdminAPI.getActivityLogs()),
      safe(superAdminAPI.getLeadsTrend()),
      safe(superAdminAPI.getLeads({ page: 1, limit: LEAD_SAMPLE_LIMIT })),
      safe(superAdminAPI.getCampaigns({ page: 1, limit: 1, status: 'active' })),
      safe(superAdminAPI.getAutomations()),
    ]).then(([statsRes, logsRes, trendRes, leadsRes, campRes, autoRes]) => {
      setStats(statsRes?.data?.stats || null);
      setLogs((logsRes?.data?.logs || []).slice(0, 5));
      setLeadsTrend(trendRes?.data?.trend || []);
      setLeadSample(leadsRes?.data?.leads || []);
      setLeadTotal(leadsRes?.data?.total || 0);
      setRunningCampaigns(campRes?.data?.total ?? (campRes?.data?.campaigns || []).length);
      setAutomationCount((autoRes?.data?.automations || []).length);
    }).finally(() => setLoading(false));
  }, []);

  const totalLeads = stats?.total_leads ?? leadTotal;

  // Group by source: top 3 sources get their own slice, the rest collapse into "Others".
  const sourceData = useMemo(() => {
    const counts = leadSample.reduce((acc, l) => {
      const key = l.source || 'others';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 3).map(([name, value]) => ({ name: prettySource(name), value }));
    const rest = sorted.slice(3).reduce((sum, [, v]) => sum + v, 0);
    if (rest) top.push({ name: 'Others', value: rest });
    return top;
  }, [leadSample]);
  const sourceTotal = sourceData.reduce((s, d) => s + d.value, 0);

  const trendData = useMemo(() => leadsTrend.slice(-rangeDays), [leadsTrend, rangeDays]);

  const statCards = [
    { label: 'Total Organizations', value: stats?.total_tenants || 0, icon: Building2, tint: 'bg-indigo-50 text-indigo-500', to: '/super-admin/workspaces' },
    { label: 'Active Organizations', value: stats?.active_tenants || 0, icon: Users, tint: 'bg-emerald-50 text-emerald-500', to: '/super-admin/workspaces' },
    { label: 'Total Users', value: stats?.total_users || 0, icon: UserRound, tint: 'bg-violet-50 text-violet-500', to: '/super-admin/users' },
    { label: 'Total Leads', value: totalLeads || 0, icon: UserPlus, tint: 'bg-amber-50 text-amber-500', to: '/super-admin/leads' },
    { label: 'Running Campaigns', value: runningCampaigns, icon: MessageSquareHeart, tint: 'bg-pink-50 text-pink-500', to: '/super-admin/campaigns' },
    { label: 'Automation Workflows', value: automationCount, icon: Zap, tint: 'bg-blue-50 text-blue-500', to: '/super-admin/automations' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#141a3d]">{greeting()}, Super Admin</h1>
        <p className="text-sm text-slate-500 mt-1">Here&apos;s what&apos;s happening across all organizations today.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(({ to, ...card }) => <LinkStatCard key={card.label} {...card} onClick={() => navigate(to)} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center"><TrendingUp size={18} /></div>
              <h3 className="font-semibold text-[#141a3d]">Leads Growth</h3>
            </div>
            <div className="relative">
              <select value={rangeDays} onChange={(e) => setRangeDays(Number(e.target.value))}
                className="appearance-none text-xs text-slate-500 border border-slate-200 rounded-lg pl-3 pr-7 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
                {RANGE_OPTIONS.map(o => <option key={o.days} value={o.days}>{o.label}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          {trendData.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#eef0f6" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Area type="monotone" dataKey="leads" name="Leads" stroke="#6366f1" strokeWidth={2} fill="url(#leadsFill)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No lead data for this period." />}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center"><PieIcon size={18} /></div>
            <h3 className="font-semibold text-[#141a3d]">Leads by Source</h3>
          </div>
          {sourceTotal ? (
            <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
              <div className="relative w-[190px] h-[190px] shrink-0 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourceData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={0} stroke="#fff" strokeWidth={2}>
                      {sourceData.map((_, i) => <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-[#141a3d]">{totalLeads || sourceTotal}</span>
                  <span className="text-[11px] text-slate-500">Total Leads</span>
                </div>
              </div>
              <ul className="flex-1 w-full space-y-3.5">
                {sourceData.map((d, i) => (
                  <li key={d.name} className="flex items-center text-sm">
                    <span className="w-3 h-3 rounded-full mr-3 shrink-0" style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                    <span className="flex-1 text-slate-600">{d.name}</span>
                    <span className="w-8 text-right font-semibold text-[#141a3d]">{d.value}</span>
                    <span className="w-12 text-right text-xs text-slate-400">{Math.round((d.value / sourceTotal) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : <EmptyState message="No leads yet." />}
          {leadTotal > LEAD_SAMPLE_LIMIT && (
            <p className="text-[11px] text-slate-400 mt-3">Breakdown based on the latest {LEAD_SAMPLE_LIMIT} leads.</p>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-indigo-500" />
            <h3 className="font-semibold text-[#141a3d]">Recent Activities</h3>
          </div>
          <button onClick={() => navigate('/super-admin/activity')} className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1">
            View All <ArrowRight size={13} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-slate-400 uppercase bg-slate-50/80">
                <th className="text-left px-3 py-3 font-semibold rounded-l-lg">Date &amp; Time</th>
                <th className="text-left px-3 py-3 font-semibold">User</th>
                <th className="text-left px-3 py-3 font-semibold">Organization</th>
                <th className="text-left px-3 py-3 font-semibold">Action</th>
                <th className="text-left px-3 py-3 font-semibold rounded-r-lg">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(a => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{fmtDateTime(a.created_at)}</td>
                  <td className="px-3 py-3 text-slate-700">{a.actor_name}</td>
                  <td className="px-3 py-3 text-slate-600">{a.workspace || '—'}</td>
                  <td className="px-3 py-3 text-slate-700">{a.action}</td>
                  <td className="px-3 py-3"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
              {!logs.length && <tr><td colSpan={5}><EmptyState message="No activity recorded yet." /></td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default SuperAdminDashboardPage;
