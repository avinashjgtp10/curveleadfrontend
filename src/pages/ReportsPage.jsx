import { useEffect, useState } from 'react';
import { reportsAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, Target, Megaphone } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const ReportsPage = () => {
  const [conversion, setConversion] = useState(null);
  const [bySource, setBySource] = useState([]);
  const [byStaff, setByStaff] = useState([]);
  const [byCampaign, setByCampaign] = useState([]);
  const [period, setPeriod] = useState('this_month');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadReports(); }, [period]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [convRes, srcRes, staffRes, campRes] = await Promise.all([
        reportsAPI.conversion({ period }).catch(() => ({ data: {} })),
        reportsAPI.bySource({ period }).catch(() => ({ data: { sources: [] } })),
        reportsAPI.byStaff({ period }).catch(() => ({ data: { staff: [] } })),
        reportsAPI.byCampaign({ period }).catch(() => ({ data: { campaigns: [] } })),
      ]);
      setConversion(convRes.data);
      setBySource(srcRes.data.sources || []);
      setByStaff(staffRes.data.staff || []);
      setByCampaign(campRes.data.campaigns || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const conversionRate = conversion?.total_leads > 0
    ? ((conversion.won_count / conversion.total_leads) * 100).toFixed(1)
    : 0;

  const stats = [
    { label: 'Total Leads', value: conversion?.total_leads || 0, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Won', value: conversion?.won_count || 0, icon: Target, color: 'bg-green-100 text-green-600' },
    { label: 'Conversion Rate', value: `${conversionRate}%`, icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
    { label: 'Active Campaigns', value: byCampaign.length, icon: Megaphone, color: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-gray-500">Track conversion, sources, and campaign performance</p>
        <select value={period} onChange={e => setPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="today">Today</option>
          <option value="this_week">This Week</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="this_year">This Year</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-4 border">
                <div className={`w-9 h-9 ${s.color} rounded-xl flex items-center justify-center mb-2`}>
                  <s.icon size={18} />
                </div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* By Source */}
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-semibold mb-4">Leads by Source</h3>
              {bySource.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={bySource} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={80} label>
                      {bySource.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* By Stage */}
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-semibold mb-4">Conversion Funnel</h3>
              {conversion?.by_stage?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={conversion.by_stage}>
                    <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-gray-400 text-center py-8">No data</p>}
            </div>
          </div>

          {/* Staff Performance */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-4">Staff Performance</h3>
            {byStaff.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No data</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="text-left py-2">Name</th>
                      <th className="text-right py-2">Leads</th>
                      <th className="text-right py-2">Won</th>
                      <th className="text-right py-2">Lost</th>
                      <th className="text-right py-2">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byStaff.map((s, i) => (
                      <tr key={i} className="border-t">
                        <td className="py-2.5 font-medium">{s.name}</td>
                        <td className="text-right">{s.total_leads}</td>
                        <td className="text-right text-green-600 font-semibold">{s.won_count}</td>
                        <td className="text-right text-red-500">{s.lost_count}</td>
                        <td className="text-right font-semibold">{s.total_leads > 0 ? ((s.won_count / s.total_leads) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Campaign ROI */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-4">Campaign ROI</h3>
            {byCampaign.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No campaigns yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="text-left py-2">Campaign</th>
                      <th className="text-left py-2">Source</th>
                      <th className="text-right py-2">Spent</th>
                      <th className="text-right py-2">Leads</th>
                      <th className="text-right py-2">CPL</th>
                      <th className="text-right py-2">Won</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byCampaign.map((c, i) => {
                      const cpl = c.leads_count > 0 ? (parseFloat(c.actual_spend) / c.leads_count).toFixed(0) : 0;
                      return (
                        <tr key={i} className="border-t">
                          <td className="py-2.5 font-medium">{c.name}</td>
                          <td className="capitalize text-gray-600">{c.source?.replace(/_/g, ' ')}</td>
                          <td className="text-right">₹{parseFloat(c.actual_spend || 0).toLocaleString('en-IN')}</td>
                          <td className="text-right">{c.leads_count}</td>
                          <td className="text-right font-semibold text-brand-600">₹{cpl}</td>
                          <td className="text-right text-green-600">{c.won_count || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
