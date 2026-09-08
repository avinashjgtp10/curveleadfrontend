import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, Phone, Sparkles, CalendarCheck, TrendingUp, Crown, ChevronRight } from 'lucide-react';
import { INITIAL_LEADS, MOCK_LEAD_GROWTH } from '../mockData';

const PERIODS = ['This Month', 'Last Month', 'Custom'];

const STAT_CARDS = [
  { label: 'Total Leads', value: 124, trend: '+12%', icon: Users, cls: 'bg-blue-50 text-blue-600' },
  { label: 'Contacted', value: 78, trend: '+18%', icon: Phone, cls: 'bg-emerald-50 text-emerald-600' },
  { label: 'Interested', value: 32, trend: '+22%', icon: Sparkles, cls: 'bg-violet-50 text-violet-600' },
  { label: 'Bookings', value: 18, trend: '+15%', icon: CalendarCheck, cls: 'bg-amber-50 text-amber-600' },
  { label: 'Converted', value: 15, trend: '+20%', icon: TrendingUp, cls: 'bg-pink-50 text-pink-600' },
];

const ROLE_PERMISSIONS = [
  'View all leads, bookings, customers and salons',
  'Manage automation settings and templates',
  'Configure WhatsApp API and webhooks',
  'Add / manage salons and users',
  'View analytics and export data',
];

const SuperAdminDashboardPage = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('This Month');

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of your leads, bookings and automation performance.</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                period === p ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.cls}`}>
                <s.icon size={18} />
              </div>
              <span className="text-xs font-semibold text-emerald-600">↑ {s.trend}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border">
          <h3 className="font-semibold text-gray-900 mb-4">Lead Growth</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MOCK_LEAD_GROWTH} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f4" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Total" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Converted" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Recent Leads</h3>
            <button onClick={() => navigate('/super-admin/leads')}
              className="text-xs text-indigo-600 flex items-center gap-0.5 hover:underline">
              View All <ChevronRight size={12} />
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase border-b">
                <th className="text-left pb-2 font-semibold">Name</th>
                <th className="text-left pb-2 font-semibold">Service</th>
                <th className="text-left pb-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {INITIAL_LEADS.map(l => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="py-2.5 font-medium text-gray-700">{l.name}</td>
                  <td className="py-2.5 text-gray-500">{l.service}</td>
                  <td className="py-2.5 text-gray-500">{l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
