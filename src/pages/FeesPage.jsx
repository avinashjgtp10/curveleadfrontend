import { useState, useEffect } from 'react';
import { feeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/ui/PageLoader';
import {
  IndianRupee, Search, Phone, MessageCircle, X, ChevronRight,
  AlertCircle, Clock, CheckCircle, Download, TrendingUp, Calendar,
  CreditCard, Banknote, Smartphone, FileText
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const modeIcons = { cash: Banknote, upi: Smartphone, bank_transfer: CreditCard };
const modeLabels = { cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank Transfer' };

const FeesPage = () => {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('fees');

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'fees', label: 'All Fees' },
          { key: 'reminders', label: 'Reminders' },
          { key: 'revenue', label: 'Revenue Report' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'fees' && <FeesTab />}
      {tab === 'reminders' && <RemindersTab />}
      {tab === 'revenue' && <RevenueTab />}
    </div>
  );
};

// ============ FEES TAB ============
const FeesTab = () => {
  const [fees, setFees] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selectedFee, setSelectedFee] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);

  useEffect(() => { loadFees(); }, [filters.status, pagination.page]);

  const loadFees = async () => {
    setLoading(true);
    try {
      const { data } = await feeAPI.getAll({ ...filters, page: pagination.page });
      setFees(data.fees);
      setSummary(data.summary);
      setPagination(data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => { e.preventDefault(); setPagination(p => ({ ...p, page: 1 })); loadFees(); };

  const openPayment = async (fee) => {
    try {
      const { data } = await feeAPI.getDetails(fee.id);
      setSelectedFee(data);
      setShowPayModal(true);
    } catch (e) { console.error(e); }
  };

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Booked', value: summary.total_booked, color: 'text-blue-600 bg-blue-50' },
          { label: 'Collected', value: summary.total_collected, color: 'text-green-600 bg-green-50' },
          { label: 'Pending', value: summary.total_pending, color: 'text-red-600 bg-red-50' },
          { label: 'Students', value: summary.total_students, color: 'text-purple-600 bg-purple-50', noRupee: true },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-xs font-medium opacity-70">{s.label}</p>
            <p className="text-xl font-bold mt-1">
              {s.noRupee ? s.value : `₹${parseFloat(s.value || 0).toLocaleString('en-IN')}`}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search student..." value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none" />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-gray-100 rounded-lg text-sm font-medium">Search</button>
        </form>
        <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPagination(p => ({ ...p, page: 1 })); }}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">All Status</option>
          <option value="paid">Fully Paid</option>
          <option value="partial">Partial</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
        ) : fees.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><IndianRupee size={40} className="mx-auto mb-3 text-gray-300" /><p>No fee records found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Course</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Net Fee</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Paid</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Balance</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fees.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{f.student_name}</p>
                      <p className="text-xs text-gray-400">{f.student_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{f.course_name || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{parseFloat(f.net_fee).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">₹{parseFloat(f.amount_paid).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-medium">₹{parseFloat(f.balance).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        f.status === 'paid' ? 'bg-green-100 text-green-700' :
                        f.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                        f.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                      }`}>{f.status.charAt(0).toUpperCase() + f.status.slice(1)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {parseFloat(f.balance) > 0 && (
                        <button onClick={() => openPayment(f)}
                          className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700">
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page <= 1}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded disabled:opacity-40">Previous</button>
            <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</span>
            <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pagination.pages}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayModal && selectedFee && (
        <PaymentModal feeData={selectedFee} onClose={() => setShowPayModal(false)} onSaved={() => { setShowPayModal(false); loadFees(); }} />
      )}
    </>
  );
};

// ============ PAYMENT MODAL ============
const PaymentModal = ({ feeData, onClose, onSaved }) => {
  const { fee, installments, payments } = feeData;
  const [form, setForm] = useState({
    amount: '', payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'cash', installment_id: '', notes: ''
  });
  const [loading, setLoading] = useState(false);

  const pendingInstallments = installments.filter(i => i.status === 'pending');

  const selectInstallment = (inst) => {
    setForm(f => ({ ...f, installment_id: inst.id, amount: inst.amount }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await feeAPI.recordPayment(fee.id, { ...form, installment_id: form.installment_id || null });
      onSaved();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold">Record Payment</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Student info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">{fee.student_name}</p>
            <div className="flex gap-4 text-xs text-gray-500 mt-1">
              <span>Fee: ₹{parseFloat(fee.net_fee).toLocaleString('en-IN')}</span>
              <span className="text-green-600">Paid: ₹{parseFloat(fee.amount_paid).toLocaleString('en-IN')}</span>
              <span className="text-red-600">Due: ₹{parseFloat(fee.balance).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Pending installments */}
          {pendingInstallments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Installment</label>
              <div className="space-y-2">
                {pendingInstallments.map(inst => (
                  <button key={inst.id} type="button" onClick={() => selectInstallment(inst)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition text-sm ${
                      form.installment_id === inst.id ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <div>
                      <span className="font-medium">Installment {inst.installment_number}</span>
                      <span className="text-gray-400 ml-2">Due: {new Date(inst.due_date).toLocaleDateString('en-IN')}</span>
                    </div>
                    <span className="font-semibold">₹{parseFloat(inst.amount).toLocaleString('en-IN')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="Enter amount" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" required />
              </div>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode *</label>
              <div className="grid grid-cols-3 gap-2">
                {['cash', 'upi', 'bank_transfer'].map(mode => {
                  const Icon = modeIcons[mode];
                  return (
                    <button key={mode} type="button" onClick={() => setForm({ ...form, payment_mode: mode })}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition ${
                        form.payment_mode === mode ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-200' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      <Icon size={16} /> {modeLabels[mode]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="Optional notes" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Recording...' : `Record ₹${form.amount || '0'} Payment`}
            </button>
          </form>

          {/* Payment History */}
          {payments.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment History</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <span className="font-medium text-green-600">₹{parseFloat(p.amount).toLocaleString('en-IN')}</span>
                      <span className="text-gray-400 ml-2">{new Date(p.payment_date).toLocaleDateString('en-IN')}</span>
                      <span className="text-gray-400 ml-2 capitalize">{modeLabels[p.payment_mode] || p.payment_mode}</span>
                    </div>
                    <span className="text-xs text-gray-400">{p.receipt_number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============ REMINDERS TAB ============
const RemindersTab = () => {
  const [data, setData] = useState({ reminders: [], summary: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadReminders(); }, []);

  const loadReminders = async () => {
    try { const { data: res } = await feeAPI.getReminders(); setData(res); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAction = async (installmentId, action) => {
    try {
      await feeAPI.actionReminder(installmentId, { action, notes: `Marked as ${action}` });
      loadReminders();
    } catch (e) { alert('Failed'); }
  };

  if (loading) return <PageLoader className="h-40" />;

  return (
    <>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{data.summary.overdue || 0}</p>
          <p className="text-xs font-medium text-red-500">Overdue</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{data.summary.dueToday || 0}</p>
          <p className="text-xs font-medium text-amber-500">Due Today</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{data.summary.upcoming || 0}</p>
          <p className="text-xs font-medium text-blue-500">Upcoming (7 days)</p>
        </div>
      </div>

      {data.reminders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <CheckCircle size={40} className="mx-auto mb-3 text-green-400" />
          <p className="font-medium text-gray-500">No pending fee reminders!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {data.reminders.map(r => (
              <div key={r.installment_id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{r.student_name}</p>
                    {r.urgency === 'overdue' && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                        {r.days_overdue}d overdue
                      </span>
                    )}
                    {r.urgency === 'due_today' && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">Due Today</span>
                    )}
                    {r.urgency === 'upcoming' && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Upcoming</span>
                    )}
                  </div>
                  <div className="flex gap-3 text-xs text-gray-400 mt-1">
                    <span>{r.course_name}</span>
                    <span>Installment {r.installment_number}</span>
                    <span>Due: {new Date(r.due_date).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">₹{parseFloat(r.amount).toLocaleString('en-IN')}</span>
                  <div className="flex gap-1">
                    <a href={`tel:${r.student_phone}`} className="p-2 hover:bg-green-50 rounded-lg text-green-600" title="Call">
                      <Phone size={16} />
                    </a>
                    <a href={`https://wa.me/91${r.student_phone?.replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noreferrer"
                      className="p-2 hover:bg-green-50 rounded-lg text-green-600" title="WhatsApp">
                      <MessageCircle size={16} />
                    </a>
                    <button onClick={() => handleAction(r.installment_id, 'called')}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200">Called</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

// ============ REVENUE TAB ============
const RevenueTab = () => {
  const [data, setData] = useState({ monthly: [], totals: {}, byPaymentMode: [] });
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(6);

  useEffect(() => { loadRevenue(); }, [months]);

  const loadRevenue = async () => {
    setLoading(true);
    try { const { data: res } = await feeAPI.getMonthlyRevenue(months); setData(res); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const formatMonth = (m) => {
    const [y, mo] = m.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(mo) - 1]} ${y}`;
  };

  if (loading) return <PageLoader className="h-40" />;

  return (
    <>
      {/* Period selector */}
      <div className="flex justify-end">
        <select value={months} onChange={e => setMonths(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value={3}>Last 3 Months</option>
          <option value={6}>Last 6 Months</option>
          <option value={12}>Last 12 Months</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs font-medium text-blue-500">Total Booked</p>
          <p className="text-xl font-bold text-blue-700 mt-1">₹{(data.totals.booked || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs font-medium text-green-500">Total Collected</p>
          <p className="text-xl font-bold text-green-700 mt-1">₹{(data.totals.collected || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-xs font-medium text-red-500">Total Pending</p>
          <p className="text-xl font-bold text-red-700 mt-1">₹{(data.totals.pending || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <p className="text-xs font-medium text-purple-500">New Students</p>
          <p className="text-xl font-bold text-purple-700 mt-1">{data.totals.students || 0}</p>
        </div>
      </div>

      {/* Chart */}
      {data.monthly.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthly.map(m => ({ ...m, name: formatMonth(m.month) }))}>
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
              <Legend />
              <Bar dataKey="collected" name="Collected" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pending" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Month</th>
                <th className="text-right px-4 py-3 font-medium text-blue-600">Booked</th>
                <th className="text-right px-4 py-3 font-medium text-green-600">Collected</th>
                <th className="text-right px-4 py-3 font-medium text-red-600">Pending</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.monthly.map(m => (
                <tr key={m.month} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{formatMonth(m.month)}</td>
                  <td className="px-4 py-3 text-right">₹{m.booked.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">₹{m.collected.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium">₹{m.pending.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-center">{m.new_students}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t font-semibold">
              <tr>
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right">₹{(data.totals.booked || 0).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right text-green-600">₹{(data.totals.collected || 0).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right text-red-600">₹{(data.totals.pending || 0).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-center">{data.totals.students || 0}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payment Mode Breakdown */}
      {data.byPaymentMode.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Collection by Payment Mode</h3>
          <div className="grid grid-cols-3 gap-3">
            {data.byPaymentMode.map(m => {
              const Icon = modeIcons[m.payment_mode] || CreditCard;
              return (
                <div key={m.payment_mode} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Icon size={20} className="text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 capitalize">{modeLabels[m.payment_mode] || m.payment_mode}</p>
                    <p className="font-semibold text-gray-900">₹{parseFloat(m.total).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default FeesPage;
