import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Store, Target, Users, MessageCircle, CalendarCheck, IndianRupee, CreditCard, Mail, Crown,
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { superAdminAPI } from '../../services/api';

const PLAN_COLORS = ['#94a3b8', '#6366f1', '#10b981', '#f59e0b'];

const ROLE_PERMISSIONS = [
  'View all leads, bookings, customers and salons',
  'Manage automation settings and templates',
  'Configure WhatsApp API and webhooks',
  'Add / manage salons and users',
  'View analytics and export data',
];

const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const SuperAdminDashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [logs, setLogs] = useState([]);
  const [workspaceGrowth, setWorkspaceGrowth] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [leadsTrend, setLeadsTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      superAdminAPI.getStats(), superAdminAPI.getTenants(), superAdminAPI.getActivityLogs(),
      superAdminAPI.getWorkspaceGrowthTrend(), superAdminAPI.getRevenueTrend(), superAdminAPI.getLeadsTrend(),
    ])
      .then(([statsRes, tenantsRes, logsRes, growthRes, revenueRes, leadsRes]) => {
        setStats(statsRes.data.stats);
        setTenants(tenantsRes.data.tenants || []);
        setLogs((logsRes.data.logs || []).slice(0, 5));
        setWorkspaceGrowth(growthRes.data.trend || []);
        setRevenueTrend(revenueRes.data.trend || []);
        setLeadsTrend(leadsRes.data.trend || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  );

  const planDistribution = Object.entries(
    tenants.reduce((acc, t) => { const name = t.plan_name || 'No plan'; acc[name] = (acc[name] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const statCards = [
    { label: 'Total Workspaces', value: stats?.total_tenants || 0, icon: Store, cls: 'bg-blue-50 text-blue-600' },
    { label: 'Active Workspaces', value: stats?.active_tenants || 0, icon: Target, cls: 'bg-emerald-50 text-emerald-600' },
    { label: 'Total Users', value: stats?.total_users || 0, icon: Users, cls: 'bg-violet-50 text-violet-600' },
    { label: 'Total Leads', value: stats?.total_leads || 0, icon: MessageCircle, cls: 'bg-amber-50 text-amber-600' },
    { label: 'Total Bookings', value: '—', icon: CalendarCheck, cls: 'bg-pink-50 text-pink-600' },
    { label: 'Monthly Revenue', value: fmtMoney(stats?.mrr), icon: IndianRupee, cls: 'bg-teal-50 text-teal-600' },
    { label: 'Active Subscriptions', value: stats?.active_tenants || 0, icon: CreditCard, cls: 'bg-indigo-50 text-indigo-600' },
    { label: 'Pending Invitations', value: stats?.pending_invitations || 0, icon: Mail, cls: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Platform-wide overview across every workspace on CurveLead.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>
      <p className="text-xs text-gray-400 -mt-2">Total Bookings has no backing table yet, so it isn't shown as a real number.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border">
          <h3 className="font-semibold text-gray-900 mb-4">Workspace Growth</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={workspaceGrowth} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f4" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Line type="monotone" dataKey="workspaces" name="Workspaces" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 border">
          <h3 className="font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f4" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} formatter={v => fmtMoney(v)} />
              <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 border">
          <h3 className="font-semibold text-gray-900 mb-4">Leads Created Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={leadsTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f4" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Line type="monotone" dataKey="leads" name="Leads" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 border">
          <h3 className="font-semibold text-gray-900 mb-4">Subscription Plan Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={planDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {planDistribution.map((_, i) => <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} stroke="#fff" strokeWidth={2} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Recent Platform Activities</h3>
          <button onClick={() => navigate('/super-admin/activity-logs')} className="text-xs text-indigo-600 hover:underline">View All</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-gray-400 uppercase border-b">
              <th className="text-left pb-2 font-semibold">Date &amp; Time</th>
              <th className="text-left pb-2 font-semibold">User</th>
              <th className="text-left pb-2 font-semibold">Workspace</th>
              <th className="text-left pb-2 font-semibold">Action</th>
              <th className="text-left pb-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(a => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="py-2.5 text-gray-400">{new Date(a.created_at).toLocaleString('en-IN')}</td>
                <td className="py-2.5 font-medium text-gray-700">{a.actor_name}</td>
                <td className="py-2.5 text-gray-500">{a.workspace || '—'}</td>
                <td className="py-2.5 text-gray-700">{a.action}</td>
                <td className="py-2.5"><StatusBadge status={a.status} /></td>
              </tr>
            ))}
            {!logs.length && <tr><td colSpan={5}><EmptyState message="No activity recorded yet." /></td></tr>}
          </tbody>
        </table>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-6">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Crown size={22} className="text-amber-300" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Role: Super Admin</h3>
            <p className="text-indigo-100 text-sm mb-3">Access all features and manage the entire platform.</p>
            <ul className="space-y-1.5">
              {ROLE_PERMISSIONS.map(p => (
                <li key={p} className="flex items-center gap-2 text-sm text-white/90">
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] shrink-0">✓</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-white text-2xl font-extrabold leading-tight italic">Full Control.</p>
          <p className="text-white text-2xl font-extrabold leading-tight italic">Better Growth.</p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboardPage;
