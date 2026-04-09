import { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, IndianRupee } from 'lucide-react';

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ReportsPage = () => {
  const [view, setView] = useState('monthly');
  const now = new Date();
  const [fy, setFy] = useState(now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1);
  const [data, setData] = useState({ data: [], totals: {}, monthlyData: [], expenseByCategory: [] });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPnL(); loadSummary(); }, [view, fy]);

  const loadPnL = async () => {
    setLoading(true);
    try { const { data: res } = await reportsAPI.getPnL(view, fy); setData(res); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadSummary = async () => {
    try { const { data: res } = await reportsAPI.getSummary(); setSummary(res); }
    catch (e) { console.error(e); }
  };

  const formatPeriod = (period) => {
    if (period.includes('Q') || period.includes('FY')) return period;
    const [y, m] = period.split('-');
    return `${monthNames[parseInt(m) - 1]} ${y.slice(2)}`;
  };

  const fyOptions = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) {
    fyOptions.push({ value: y, label: `FY ${y}-${String(y + 1).slice(2)}` });
  }

  return (
    <div className="space-y-5">
      {/* This Month Summary */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-xs font-medium text-green-500">This Month Revenue</p>
            <p className="text-xl font-bold text-green-700 mt-1">₹{summary.thisMonth.revenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-xs font-medium text-red-500">This Month Expenses</p>
            <p className="text-xl font-bold text-red-700 mt-1">₹{summary.thisMonth.expenses.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-xs font-medium text-amber-500">This Month Salaries</p>
            <p className="text-xl font-bold text-amber-700 mt-1">₹{summary.thisMonth.salaries.toLocaleString('en-IN')}</p>
          </div>
          <div className={`rounded-xl p-4 ${summary.thisMonth.profit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <p className="text-xs font-medium opacity-70">Net Profit</p>
            <p className={`text-xl font-bold mt-1 flex items-center gap-1 ${summary.thisMonth.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {summary.thisMonth.profit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              ₹{Math.abs(summary.thisMonth.profit).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {[{ key: 'monthly', label: 'Monthly' }, { key: 'quarterly', label: 'Quarterly' }, { key: 'yearly', label: 'Yearly' }].map(t => (
            <button key={t.key} onClick={() => setView(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${view === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <select value={fy} onChange={e => setFy(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          {fyOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* FY Totals */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Booked', value: data.totals.booked, color: 'text-blue-600 bg-blue-50' },
          { label: 'Collected', value: data.totals.collected, color: 'text-green-600 bg-green-50' },
          { label: 'Expenses', value: data.totals.expenses, color: 'text-red-600 bg-red-50' },
          { label: 'Salaries', value: data.totals.salaries, color: 'text-amber-600 bg-amber-50' },
          { label: 'Net Profit', value: data.totals.profit, color: (data.totals.profit || 0) >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
            <p className="text-xs font-medium opacity-70">{s.label}</p>
            <p className="text-lg font-bold mt-1">₹{((s.value || 0) >= 0 ? (s.value || 0) : Math.abs(s.value || 0)).toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {!loading && data.monthlyData && data.monthlyData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">P&L Trend — {data.fyLabel}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthlyData.map(m => ({ name: formatPeriod(m.month), ...m }))}>
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
              <Legend />
              <Bar dataKey="collected" name="Revenue" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="salaries" name="Salaries" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Profit Line Chart */}
      {!loading && data.monthlyData && data.monthlyData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Net Profit Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.monthlyData.map(m => ({ name: formatPeriod(m.month), profit: m.profit }))}>
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* P&L Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Period</th>
                  <th className="text-right px-4 py-3 font-medium text-blue-600">Booked</th>
                  <th className="text-right px-4 py-3 font-medium text-green-600">Collected</th>
                  <th className="text-right px-4 py-3 font-medium text-red-600">Expenses</th>
                  <th className="text-right px-4 py-3 font-medium text-amber-600">Salaries</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-800">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map(row => (
                  <tr key={row.period} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{formatPeriod(row.period)}</td>
                    <td className="px-4 py-3 text-right">₹{(row.booked || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">₹{(row.collected || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-red-600">₹{(row.expenses || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-amber-600">₹{(row.salaries || 0).toLocaleString('en-IN')}</td>
                    <td className={`px-4 py-3 text-right font-bold ${(row.profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {(row.profit || 0) >= 0 ? '' : '-'}₹{Math.abs(row.profit || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t font-semibold">
                <tr>
                  <td className="px-4 py-3">FY Total</td>
                  <td className="px-4 py-3 text-right">₹{(data.totals.booked || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right text-green-600">₹{(data.totals.collected || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right text-red-600">₹{(data.totals.expenses || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right text-amber-600">₹{(data.totals.salaries || 0).toLocaleString('en-IN')}</td>
                  <td className={`px-4 py-3 text-right font-bold ${(data.totals.profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {(data.totals.profit || 0) >= 0 ? '' : '-'}₹{Math.abs(data.totals.profit || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Expense Category Breakdown */}
      {data.expenseByCategory && data.expenseByCategory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Expense Breakdown — {data.fyLabel}</h3>
          <div className="space-y-2">
            {data.expenseByCategory.map((c, i) => {
              const total = data.totals.expenses || 1;
              const pct = ((parseFloat(c.total) / total) * 100).toFixed(0);
              return (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-32 truncate">{c.category}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div className="bg-red-400 rounded-full h-3" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-24 text-right">₹{parseFloat(c.total).toLocaleString('en-IN')}</span>
                  <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
