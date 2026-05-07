import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { staffAPI } from '../services/api';
import { ArrowLeft, Phone, Clock, CheckCircle, XCircle, IndianRupee, Plus, Trash2, X, Calendar } from 'lucide-react';

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const StaffDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIncentiveModal, setShowIncentiveModal] = useState(false);
  const [incentiveForm, setIncentiveForm] = useState({ amount: '', reason: '' });

  useEffect(() => { loadData(); }, [month, year]);

  const loadData = async () => {
    setLoading(true);
    try { const { data: res } = await staffAPI.getOne(id, { month, year }); setData(res); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const changeMonth = (d) => {
    let m = month + d, y = year;
    if (m > 12) { m = 1; y++; } if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  const handleAddIncentive = async () => {
    if (!incentiveForm.amount || !incentiveForm.reason) return alert('Amount and reason required.');
    try {
      await staffAPI.addIncentive({ staff_id: id, month, year, ...incentiveForm });
      setShowIncentiveModal(false); setIncentiveForm({ amount: '', reason: '' }); loadData();
    } catch (e) { alert('Failed'); }
  };

  const handleDeleteIncentive = async (incId) => {
    if (!window.confirm('Delete this incentive?')) return;
    try { await staffAPI.deleteIncentive(incId); loadData(); } catch (e) { alert('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-center py-12"><p className="text-gray-500">Staff not found.</p></div>;

  const { staff, timeLogs, attendanceSummary: att, currentMonthSalary: sal, incentives, salaryHistory, gracePeriod } = data;

  const statusColor = (s) => ({ present: 'bg-green-100 text-green-700', half_day: 'bg-amber-100 text-amber-700', absent: 'bg-red-100 text-red-700' }[s] || 'bg-gray-100 text-gray-600');

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft size={16} /> Back to Staff</button>

      {/* Staff Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center">
            <span className="text-brand-700 font-bold text-xl">{staff.name?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{staff.name}</h1>
            <p className="text-sm text-gray-500">{staff.role}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-400">
              <span className="flex items-center gap-1"><Phone size={14} /> {staff.phone}</span>
              <span className="flex items-center gap-1"><Clock size={14} /> Shift: {staff.shift_start_time?.slice(0,5)}</span>
              <span>Grace: {gracePeriod} min</span>
              <span>Joined: {staff.join_date ? new Date(staff.join_date).toLocaleDateString('en-IN') : '—'}</span>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${staff.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{staff.status}</span>
        </div>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3">
        <button onClick={() => changeMonth(-1)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">←</button>
        <span className="text-lg font-semibold">{monthNames[month - 1]} {year}</span>
        <button onClick={() => changeMonth(1)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">→</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-green-50 rounded-xl p-4"><p className="text-xs text-green-500">Present</p><p className="text-2xl font-bold text-green-700">{att.present}</p></div>
        <div className="bg-amber-50 rounded-xl p-4"><p className="text-xs text-amber-500">Half Day</p><p className="text-2xl font-bold text-amber-700">{att.half_day}</p></div>
        <div className="bg-red-50 rounded-xl p-4"><p className="text-xs text-red-500">Absent</p><p className="text-2xl font-bold text-red-700">{att.absent}</p></div>
        <div className="bg-blue-50 rounded-xl p-4"><p className="text-xs text-blue-500">Late Count</p><p className="text-2xl font-bold text-blue-700">{att.late_count}</p></div>
      </div>

      {/* Salary Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Salary — {monthNames[month - 1]} {year}</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Base Salary</span><span>₹{sal.baseSalary.toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Deductions ({att.absent} absent × ₹{parseFloat(staff.deduction_per_day)} + {att.half_day} half × ₹{(parseFloat(staff.deduction_per_day) * 0.5).toFixed(0)})</span><span className="text-red-600">-₹{sal.deductions.toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Incentives</span><span className="text-green-600">+₹{sal.incentives.toLocaleString('en-IN')}</span></div>
          <hr />
          <div className="flex justify-between font-bold text-base"><span>Net Salary</span><span className="text-brand-700">₹{sal.netSalary.toLocaleString('en-IN')}</span></div>
        </div>
      </div>

      {/* Incentives */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Incentives — {monthNames[month - 1]} {year}</h3>
          <button onClick={() => setShowIncentiveModal(true)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium"><Plus size={14} /> Add</button>
        </div>
        {incentives.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No incentives this month</p>
        ) : (
          <div className="space-y-2">
            {incentives.map(inc => (
              <div key={inc.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div><span className="font-semibold text-green-700">₹{parseFloat(inc.amount).toLocaleString('en-IN')}</span><span className="text-sm text-gray-600 ml-2">{inc.reason}</span></div>
                <button onClick={() => handleDeleteIncentive(inc.id)} className="p-1.5 hover:bg-red-100 rounded text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Time Logs */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Daily Time Log</h3>
        {timeLogs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No time logs this month</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Date</th>
                <th className="text-center px-3 py-2 font-medium text-gray-600">In</th>
                <th className="text-center px-3 py-2 font-medium text-gray-600">Out</th>
                <th className="text-center px-3 py-2 font-medium text-gray-600">Late</th>
                <th className="text-center px-3 py-2 font-medium text-gray-600">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {timeLogs.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{new Date(t.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', weekday:'short' })}</td>
                    <td className="px-3 py-2 text-center font-medium">{t.check_in?.slice(0,5) || '—'}</td>
                    <td className="px-3 py-2 text-center">{t.check_out?.slice(0,5) || '—'}</td>
                    <td className="px-3 py-2 text-center">{t.late_by_minutes > 0 ? <span className="text-red-600">{t.late_by_minutes}m</span> : <span className="text-green-600">—</span>}</td>
                    <td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(t.final_status || t.auto_status)}`}>{(t.final_status || t.auto_status || '—').replace('_', ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Salary History */}
      {salaryHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Salary History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Month</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">Base</th>
                <th className="text-right px-3 py-2 font-medium text-red-600">Deductions</th>
                <th className="text-right px-3 py-2 font-medium text-green-600">Bonus</th>
                <th className="text-right px-3 py-2 font-medium text-gray-800">Net</th>
                <th className="text-center px-3 py-2 font-medium text-gray-600">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {salaryHistory.map(sh => (
                  <tr key={sh.id}>
                    <td className="px-3 py-2 font-medium">{monthNames[sh.month - 1]} {sh.year}</td>
                    <td className="px-3 py-2 text-right">₹{parseFloat(sh.base_salary).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right text-red-600">-₹{parseFloat(sh.deductions).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right text-green-600">+₹{parseFloat(sh.bonus).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right font-semibold">₹{parseFloat(sh.net_salary).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sh.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{sh.payment_status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Incentive Modal */}
      {showIncentiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowIncentiveModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5">
            <h2 className="text-lg font-bold mb-4">Add Incentive — {monthNames[month - 1]} {year}</h2>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input type="number" value={incentiveForm.amount} onChange={e => setIncentiveForm({...incentiveForm, amount:e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <input type="text" value={incentiveForm.reason} onChange={e => setIncentiveForm({...incentiveForm, reason:e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="e.g. Extra batches handled" required /></div>
              <div className="flex gap-3">
                <button onClick={() => setShowIncentiveModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm">Cancel</button>
                <button onClick={handleAddIncentive} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold">Add Incentive</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDetailPage;
