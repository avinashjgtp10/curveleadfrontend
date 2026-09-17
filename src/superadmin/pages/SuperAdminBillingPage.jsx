import { useEffect, useState } from 'react';
import { IndianRupee, TrendingUp, CheckCircle2, XCircle, RotateCcw, Clock } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { superAdminAPI } from '../../services/api';

const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const SuperAdminBillingPage = () => {
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      superAdminAPI.getBillingSummary(),
      superAdminAPI.getWorkspaceRevenue(),
      superAdminAPI.getPaymentHistory(),
    ]).then(([sRes, rRes, pRes]) => {
      setSummary(sRes.data.summary);
      setRevenue(rRes.data.revenue || []);
      setPayments(pRes.data.payments || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  );

  const statCards = [
    { label: 'Total Revenue', value: fmtMoney(summary?.total_revenue), icon: IndianRupee, cls: 'bg-emerald-50 text-emerald-600' },
    { label: 'Monthly Revenue', value: fmtMoney(summary?.monthly_revenue), icon: TrendingUp, cls: 'bg-blue-50 text-blue-600' },
    { label: 'Successful Payments', value: summary?.successful_payments || 0, icon: CheckCircle2, cls: 'bg-teal-50 text-teal-600' },
    { label: 'Failed Payments', value: summary?.failed_payments || 0, icon: XCircle, cls: 'bg-red-50 text-red-600' },
    { label: 'Refunded Payments', value: summary?.refunded_payments || 0, icon: RotateCcw, cls: 'bg-violet-50 text-violet-600' },
    { label: 'Pending Payments', value: summary?.pending_payments || 0, icon: Clock, cls: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader title="Billing" subtitle="Platform-wide revenue and payment activity." />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="bg-white rounded-2xl border">
        <div className="px-4 py-3 border-b"><h3 className="font-semibold text-gray-900">Workspace-wise Revenue</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase border-b">
                <th className="text-left px-4 py-3 font-semibold">Workspace</th>
                <th className="text-right px-4 py-3 font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {revenue.map(w => (
                <tr key={w.tenant_id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-800">{w.workspace}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{fmtMoney(w.revenue)}</td>
                </tr>
              ))}
              {!revenue.length && <tr><td colSpan={2}><EmptyState message="No revenue recorded yet." /></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border">
        <div className="px-4 py-3 border-b"><h3 className="font-semibold text-gray-900">Payment History</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase border-b">
                <th className="text-left px-4 py-3 font-semibold">Invoice</th>
                <th className="text-left px-4 py-3 font-semibold">Workspace</th>
                <th className="text-left px-4 py-3 font-semibold">Amount</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-800 font-mono text-xs">{p.id}</td>
                  <td className="px-4 py-3 text-gray-600">{p.workspace || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{fmtMoney(p.total || p.amount)}</td>
                  <td className="px-4 py-3 capitalize"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-gray-400">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {!payments.length && <tr><td colSpan={5}><EmptyState message="No payments recorded yet." /></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminBillingPage;
