import { useState, useEffect } from 'react';
import { superAdminAPI } from '../services/api';
import {
  Building2, Users, GraduationCap, IndianRupee, TrendingUp, Search,
  CheckCircle, Clock, XCircle, ChevronRight, X, Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const statusColors = {
  trial: 'bg-blue-100 text-blue-700', active: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-600',
  suspended: 'bg-amber-100 text-amber-700', past_due: 'bg-orange-100 text-orange-700',
};

const SuperAdminPage = () => {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  useEffect(() => { loadStats(); loadPlans(); }, []);
  useEffect(() => { if (tab === 'tenants') loadTenants(); }, [tab, filters.status, pagination.page]);

  const loadStats = async () => {
    try { const { data } = await superAdminAPI.getStats(); setStats(data); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadTenants = async () => {
    setLoading(true);
    try { const { data } = await superAdminAPI.getTenants({ ...filters, page: pagination.page }); setTenants(data.tenants); setPagination(data.pagination); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadPlans = async () => {
    try { const { data } = await superAdminAPI.getPlans(); setPlans(data.plans); }
    catch (e) { console.error(e); }
  };

  const handleSearch = (e) => { e.preventDefault(); setPagination(p => ({ ...p, page: 1 })); loadTenants(); };

  const openAction = (tenant) => { setSelectedTenant(tenant); setShowActionModal(true); };

  const handleUpdateStatus = async (status) => {
    try {
      await superAdminAPI.updateTenant(selectedTenant.id, { subscription_status: status });
      setShowActionModal(false); loadTenants(); loadStats();
    } catch (e) { alert('Failed'); }
  };

  const handleChangePlan = async (planId) => {
    try {
      await superAdminAPI.updateTenant(selectedTenant.id, { plan_id: planId });
      setShowActionModal(false); loadTenants();
    } catch (e) { alert('Failed'); }
  };

  const handleExtendTrial = async (days) => {
    try {
      await superAdminAPI.extendTrial(selectedTenant.id, days);
      setShowActionModal(false); loadTenants();
      alert(`Trial extended by ${days} days`);
    } catch (e) { alert('Failed'); }
  };

  const formatMonth = (m) => { const [y, mo] = m.split('-'); return `${monthNames[parseInt(mo)-1]} ${y.slice(2)}`; };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">CL</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Super Admin Panel</h1>
          <p className="text-xs text-gray-500">CurveLead Platform Management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[{ key: 'dashboard', label: 'Dashboard' }, { key: 'tenants', label: 'Academies' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && stats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-brand-50 rounded-xl p-4">
              <p className="text-xs font-medium text-brand-500">Total Academies</p>
              <p className="text-2xl font-bold text-brand-700 mt-1">{stats.totalTenants}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-xs font-medium text-green-500">MRR</p>
              <p className="text-2xl font-bold text-green-700 mt-1">₹{stats.mrr.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-xs font-medium text-purple-500">Total Students</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">{stats.totalStudents.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs font-medium text-blue-500">Total Leads</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{stats.totalLeads.toLocaleString()}</p>
            </div>
          </div>

          {/* Second row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">New This Month</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{stats.newThisMonth}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <Clock size={20} className="text-blue-500" />
              <div><p className="text-xs text-gray-500">On Trial</p><p className="text-xl font-bold">{stats.trialCount}</p></div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <CheckCircle size={20} className="text-green-500" />
              <div><p className="text-xs text-gray-500">Paid</p><p className="text-xl font-bold">{stats.paidCount}</p></div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <XCircle size={20} className="text-red-500" />
              <div><p className="text-xs text-gray-500">Expired/Cancelled</p><p className="text-xl font-bold">{stats.expiredCount}</p></div>
            </div>
          </div>

          {/* Signup Trend */}
          {stats.signupTrend.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Signup Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.signupTrend.map(s => ({ name: formatMonth(s.month), count: parseInt(s.count) }))}>
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" name="Signups" fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Plan Distribution */}
          {stats.planDistribution.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Plan Distribution</h3>
              <div className="grid grid-cols-3 gap-3">
                {stats.planDistribution.map(p => (
                  <div key={p.name} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{p.count}</p>
                    <p className="text-sm text-gray-500">{p.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'tenants' && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2 max-w-md">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search academy..." value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none" />
              </div>
              <button type="submit" className="px-4 py-2.5 bg-gray-100 rounded-lg text-sm font-medium">Search</button>
            </form>
            <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPagination(p => ({ ...p, page: 1 })); }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="">All Status</option>
              <option value="trial">Trial</option><option value="active">Active</option>
              <option value="expired">Expired</option><option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Tenants Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-12 text-gray-500"><Building2 size={40} className="mx-auto mb-3 text-gray-300" /><p>No academies found</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b"><tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Academy</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Plan</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Leads</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Students</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Joined</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {tenants.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{t.name}</p>
                          <p className="text-xs text-gray-400">{t.email}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="px-2 py-1 bg-brand-50 text-brand-700 text-xs font-medium rounded">{t.plan_name || '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-center hidden md:table-cell">{t.lead_count}</td>
                        <td className="px-4 py-3 text-center hidden md:table-cell">{t.student_count}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[t.subscription_status] || 'bg-gray-100'}`}>
                            {t.subscription_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{new Date(t.created_at).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => openAction(t)} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200">Manage</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page <= 1} className="px-3 py-1.5 text-sm text-gray-600 rounded disabled:opacity-40">Previous</button>
                <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</span>
                <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pagination.pages} className="px-3 py-1.5 text-sm text-gray-600 rounded disabled:opacity-40">Next</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Tenant Action Modal */}
      {showActionModal && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowActionModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">Manage: {selectedTenant.name}</h2>
              <button onClick={() => setShowActionModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{selectedTenant.email}</span></div>
                <div className="flex justify-between mt-1"><span className="text-gray-500">Plan</span><span className="font-medium">{selectedTenant.plan_name}</span></div>
                <div className="flex justify-between mt-1"><span className="text-gray-500">Status</span><span className="font-medium capitalize">{selectedTenant.subscription_status}</span></div>
                <div className="flex justify-between mt-1"><span className="text-gray-500">Students</span><span>{selectedTenant.student_count}</span></div>
                <div className="flex justify-between mt-1"><span className="text-gray-500">Leads</span><span>{selectedTenant.lead_count}</span></div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Change Status</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['active', 'suspended', 'cancelled'].map(s => (
                    <button key={s} onClick={() => handleUpdateStatus(s)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border capitalize ${
                        selectedTenant.subscription_status === s ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 hover:bg-gray-50'
                      }`}>{s}</button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Change Plan</h3>
                <div className="grid grid-cols-3 gap-2">
                  {plans.map(p => (
                    <button key={p.id} onClick={() => handleChangePlan(p.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border ${
                        selectedTenant.plan_id === p.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 hover:bg-gray-50'
                      }`}>{p.name}<br/>₹{parseFloat(p.price).toLocaleString('en-IN')}/mo</button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Extend Trial</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[7, 14, 30].map(d => (
                    <button key={d} onClick={() => handleExtendTrial(d)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-blue-50 hover:border-blue-300">+{d} days</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPage;
