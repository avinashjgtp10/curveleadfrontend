import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import PageLoader from '../components/ui/PageLoader';
import { useAuth } from '../context/AuthContext';
import {
  Users, GraduationCap, IndianRupee, TrendingUp, AlertCircle,
  Phone, Plus, ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, subtext, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </div>
);

const DashboardPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: res } = await dashboardAPI.get();
      setData(res);
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="mx-auto mb-3" size={40} />
        <p>Failed to load dashboard. Please refresh.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate('/leads?new=true')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition"
        >
          <Plus size={16} /> Add Lead
        </button>
        {isAdmin && (
          <>
            <button
              onClick={() => navigate('/fees?new=true')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              <IndianRupee size={16} /> Record Payment
            </button>
            <button
              onClick={() => navigate('/expenses?new=true')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              <Plus size={16} /> Add Expense
            </button>
          </>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Leads This Month"
          value={data.leads.thisMonth}
          icon={Users}
          color="bg-blue-500"
          onClick={() => navigate('/leads')}
        />
        <StatCard
          title="Conversion Rate"
          value={`${data.leads.conversionRate}%`}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard
          title="Active Students"
          value={data.students.active}
          icon={GraduationCap}
          color="bg-purple-500"
          subtext={`+${data.students.newThisMonth} this month`}
          onClick={() => navigate('/students')}
        />
        {isAdmin && (
          <StatCard
            title="Revenue This Month"
            value={`₹${data.finance.monthRevenue.toLocaleString('en-IN')}`}
            icon={IndianRupee}
            color="bg-emerald-500"
            onClick={() => navigate('/fees')}
          />
        )}
      </div>

      {/* Second row - Follow-ups & Finance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's Follow-ups */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Follow-ups</h3>
            <button
              onClick={() => navigate('/leads?tab=followups')}
              className="text-brand-600 text-sm font-medium hover:text-brand-700"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Today's Follow-ups</span>
              </div>
              <span className="text-lg font-bold text-amber-700">{data.leads.todayFollowups}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle size={18} className="text-red-600" />
                <span className="text-sm font-medium text-red-800">Overdue</span>
              </div>
              <span className="text-lg font-bold text-red-700">{data.leads.overdueFollowups}</span>
            </div>
          </div>
        </div>

        {/* Pipeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Lead Pipeline</h3>
          <div className="space-y-2.5">
            {['new', 'contacted', 'interested', 'enrolled', 'dropped'].map((stage) => {
              const count = data.leads.byStage.find(s => s.stage === stage)?.count || 0;
              const colors = {
                new: 'bg-blue-500', contacted: 'bg-yellow-500', interested: 'bg-purple-500',
                enrolled: 'bg-green-500', dropped: 'bg-red-500'
              };
              return (
                <div key={stage} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${colors[stage]}`} />
                  <span className="text-sm text-gray-600 capitalize flex-1">{stage}</span>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* P&L Summary (Admin only) */}
        {isAdmin && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">This Month P&L</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpRight size={16} className="text-green-500" />
                  <span className="text-sm text-gray-600">Revenue</span>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  ₹{data.finance.monthRevenue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDownRight size={16} className="text-red-500" />
                  <span className="text-sm text-gray-600">Expenses</span>
                </div>
                <span className="text-sm font-semibold text-red-600">
                  ₹{data.finance.monthExpenses.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDownRight size={16} className="text-red-500" />
                  <span className="text-sm text-gray-600">Salaries</span>
                </div>
                <span className="text-sm font-semibold text-red-600">
                  ₹{data.finance.monthSalaries.toLocaleString('en-IN')}
                </span>
              </div>
              <hr className="my-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">Net Profit</span>
                <span className={`text-base font-bold ${data.finance.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{data.finance.netProfit.toLocaleString('en-IN')}
                </span>
              </div>
              {data.finance.pendingFees > 0 && (
                <div className="mt-3 p-2.5 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-700 font-medium">
                    ₹{data.finance.pendingFees.toLocaleString('en-IN')} fees pending collection
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Overdue Payments */}
      {isAdmin && data.overduePayments.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 p-5">
          <h3 className="font-semibold text-red-700 mb-4 flex items-center gap-2">
            <AlertCircle size={18} />
            Overdue Payments ({data.overduePayments.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Student</th>
                  <th className="pb-2 font-medium">Phone</th>
                  <th className="pb-2 font-medium">Due Date</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.overduePayments.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2.5 font-medium text-gray-900">{item.student_name}</td>
                    <td className="py-2.5 text-gray-600">{item.phone}</td>
                    <td className="py-2.5 text-red-600">{new Date(item.due_date).toLocaleDateString('en-IN')}</td>
                    <td className="py-2.5 font-semibold">₹{parseFloat(item.installment_amount).toLocaleString('en-IN')}</td>
                    <td className="py-2.5">
                      <a href={`tel:${item.phone}`} className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium">
                        <Phone size={14} /> Call
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
