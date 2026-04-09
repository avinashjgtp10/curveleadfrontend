import { useState, useEffect } from 'react';
import { expenseAPI } from '../services/api';
import {
  Plus, Search, X, Edit2, Trash2, Receipt, Calendar, IndianRupee,
  Banknote, Smartphone, CreditCard
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const modeLabels = { cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank Transfer' };
const PIE_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ category_id: '', month: new Date().toISOString().slice(0, 7) });
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [newCatName, setNewCatName] = useState('');
  const [tab, setTab] = useState('list');
  const [monthlyReport, setMonthlyReport] = useState([]);

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { loadExpenses(); }, [filters.category_id, filters.month, pagination.page]);
  useEffect(() => { if (tab === 'report') loadReport(); }, [tab]);

  const loadCategories = async () => {
    try { const { data } = await expenseAPI.getCategories(); setCategories(data.categories); }
    catch (e) { console.error(e); }
  };

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const { data } = await expenseAPI.getAll({ ...filters, page: pagination.page });
      setExpenses(data.expenses);
      setCategoryBreakdown(data.categoryBreakdown);
      setMonthTotal(data.monthTotal);
      setPagination(data.pagination);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadReport = async () => {
    try { const { data } = await expenseAPI.getMonthlyReport(6); setMonthlyReport(data.monthly); }
    catch (e) { console.error(e); }
  };

  const openAdd = () => {
    setSelected(null);
    setForm({ category_id: categories[0]?.id || '', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0], payment_mode: 'cash' });
    setShowModal(true);
  };

  const openEdit = (exp) => {
    setSelected(exp);
    setForm({ category_id: exp.category_id, description: exp.description || '', amount: exp.amount, expense_date: exp.expense_date?.split('T')[0], payment_mode: exp.payment_mode || 'cash' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selected) { await expenseAPI.update(selected.id, form); }
      else { await expenseAPI.create(form); }
      setShowModal(false); loadExpenses();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await expenseAPI.delete(id); loadExpenses(); } catch (e) { alert('Failed'); }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      await expenseAPI.createCategory({ name: newCatName.trim() });
      setNewCatName(''); setShowCatModal(false); loadCategories();
    } catch (e) { alert('Failed'); }
  };

  const formatMonth = (m) => {
    const [y, mo] = m.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(mo) - 1]} ${y}`;
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[{ key: 'list', label: 'Expenses' }, { key: 'report', label: 'Monthly Report' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'list' ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-red-50 rounded-xl p-5">
              <p className="text-sm text-red-500 font-medium">This Month Total</p>
              <p className="text-2xl font-bold text-red-700 mt-1">₹{monthTotal.toLocaleString('en-IN')}</p>
            </div>
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Category Breakdown</h3>
              {categoryBreakdown.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {categoryBreakdown.map((c, i) => (
                    <div key={c.category} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-gray-600">{c.category}</span>
                      <span className="text-xs font-semibold">₹{parseFloat(c.total).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400">No expenses this month</p>}
            </div>
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex gap-2 flex-wrap">
              <input type="month" value={filters.month} onChange={e => setFilters(f => ({ ...f, month: e.target.value }))}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
              <select value={filters.category_id} onChange={e => setFilters(f => ({ ...f, category_id: e.target.value }))}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCatModal(true)} className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">+ Category</button>
              <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">
                <Plus size={18} /> Add Expense
              </button>
            </div>
          </div>

          {/* Expense List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-12 text-gray-500"><Receipt size={40} className="mx-auto mb-3 text-gray-300" /><p>No expenses found</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Description</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Mode</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">{new Date(exp.expense_date).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{exp.category_name}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{exp.description || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 capitalize text-xs hidden md:table-cell">{modeLabels[exp.payment_mode] || exp.payment_mode}</td>
                        <td className="px-4 py-3 text-right font-semibold text-red-600">₹{parseFloat(exp.amount).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEdit(exp)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400"><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(exp.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Monthly Report Tab */
        <>
          {monthlyReport.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Monthly Expense Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyReport.map(m => ({ name: formatMonth(m.month), amount: parseFloat(m.total) }))}>
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
                  <Bar dataKey="amount" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Month</th>
                <th className="text-right px-4 py-3 font-medium text-red-600">Total Expenses</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {monthlyReport.map(m => (
                  <tr key={m.month} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{formatMonth(m.month)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">₹{parseFloat(m.total).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t font-semibold"><tr>
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right text-red-600">₹{monthlyReport.reduce((s, m) => s + parseFloat(m.total), 0).toLocaleString('en-IN')}</td>
              </tr></tfoot>
            </table>
          </div>
        </>
      )}

      {/* Add/Edit Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">{selected ? 'Edit Expense' : 'Add Expense'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white" required>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={form.expense_date} onChange={e => setForm({...form, expense_date: e.target.value})}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" required /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="What was this expense for?" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{v:'cash',l:'Cash',I:Banknote},{v:'upi',l:'UPI',I:Smartphone},{v:'bank_transfer',l:'Bank',I:CreditCard}].map(m => (
                    <button key={m.v} type="button" onClick={() => setForm({...form, payment_mode: m.v})}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border ${form.payment_mode === m.v ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200'}`}>
                      <m.I size={15} /> {m.l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">{selected ? 'Update' : 'Add Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCatModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5">
            <h2 className="text-lg font-bold mb-4">Add Category</h2>
            <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm mb-4" placeholder="Category name" />
            <div className="flex gap-3">
              <button onClick={() => setShowCatModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={handleAddCategory} className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
