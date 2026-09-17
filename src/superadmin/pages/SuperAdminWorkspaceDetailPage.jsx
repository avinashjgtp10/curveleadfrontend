import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, Users, CreditCard } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { superAdminAPI } from '../../services/api';

const TABS = ['Overview', 'Team Members', 'Leads', 'Subscription', 'Payment History', 'Activity Logs'];

const SuperAdminWorkspaceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState(null);
  const [team, setTeam] = useState([]);
  const [leads, setLeads] = useState([]);
  const [payments, setPayments] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      superAdminAPI.getTenants(),
      superAdminAPI.getUsers(),
      superAdminAPI.getLeads({ tenant_id: id, limit: 50 }),
      superAdminAPI.getPaymentHistory(),
      superAdminAPI.getActivityLogs(),
    ]).then(([tRes, uRes, lRes, pRes, aRes]) => {
      const w = (tRes.data.tenants || []).find(t => String(t.id) === String(id));
      setWorkspace(w || null);
      setTeam((uRes.data.users || []).filter(u => String(u.tenant_id) === String(id)));
      setLeads(lRes.data.leads || []);
      setPayments((pRes.data.payments || []).filter(p => w && p.workspace === w.name));
      setLogs((aRes.data.logs || []).filter(l => w && l.workspace === w.name));
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!workspace) return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/super-admin/workspaces')} className="flex items-center gap-1 text-sm text-indigo-600 hover:underline mb-4">
        <ArrowLeft size={14} /> Back to Workspaces
      </button>
      <EmptyState message="Workspace not found." />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <button onClick={() => navigate('/super-admin/workspaces')} className="flex items-center gap-1 text-sm text-indigo-600 hover:underline">
        <ArrowLeft size={14} /> Back to Workspaces
      </button>

      <div className="bg-white rounded-2xl p-5 border flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Building2 size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{workspace.name}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1"><Mail size={13} /> {workspace.owner_email || '—'}</span>
              <span className="flex items-center gap-1"><Phone size={13} /> {workspace.owner_phone || '—'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={workspace.subscription_status} />
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600">{workspace.plan_name || 'No plan'}</span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto bg-white border rounded-xl p-1.5">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              tab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border">
            <h3 className="font-semibold text-gray-900 mb-3">Salon Information</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Name</dt><dd className="font-medium text-gray-800">{workspace.name}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Created</dt><dd className="font-medium text-gray-800">{new Date(workspace.created_at).toLocaleDateString('en-IN')}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Team Members</dt><dd className="font-medium text-gray-800">{workspace.user_count}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Total Leads</dt><dd className="font-medium text-gray-800">{workspace.lead_count}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd><StatusBadge status={workspace.subscription_status} /></dd></div>
            </dl>
          </div>
          <div className="bg-white rounded-2xl p-5 border">
            <h3 className="font-semibold text-gray-900 mb-3">Owner Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Name</dt><dd className="font-medium text-gray-800">{workspace.owner_name || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd className="font-medium text-gray-800">{workspace.owner_email || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Phone</dt><dd className="font-medium text-gray-800">{workspace.owner_phone || '—'}</dd></div>
            </dl>
          </div>
        </div>
      )}

      {tab === 'Team Members' && (
        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-[11px] text-gray-400 uppercase border-b">
              <th className="text-left px-4 py-3 font-semibold">Name</th>
              <th className="text-left px-4 py-3 font-semibold">Email</th>
              <th className="text-left px-4 py-3 font-semibold">Role</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Last Login</th>
            </tr></thead>
            <tbody>
              {team.map(u => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2"><Users size={14} className="text-gray-400" /> {u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{u.role}</td>
                  <td className="px-4 py-3"><StatusBadge status={u.is_active ? 'Active' : 'Inactive'} /></td>
                  <td className="px-4 py-3 text-gray-400">{u.last_login ? new Date(u.last_login).toLocaleDateString('en-IN') : '—'}</td>
                </tr>
              ))}
              {!team.length && <tr><td colSpan={5}><EmptyState message="No team members yet." /></td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Leads' && (
        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-[11px] text-gray-400 uppercase border-b">
              <th className="text-left px-4 py-3 font-semibold">Name</th>
              <th className="text-left px-4 py-3 font-semibold">Phone</th>
              <th className="text-left px-4 py-3 font-semibold">Stage</th>
              <th className="text-left px-4 py-3 font-semibold">Score</th>
              <th className="text-left px-4 py-3 font-semibold">Assigned To</th>
            </tr></thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-800">{l.name}</td>
                  <td className="px-4 py-3 text-gray-500">{l.phone}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{l.stage}</td>
                  <td className="px-4 py-3"><StatusBadge status={l.lead_score} /></td>
                  <td className="px-4 py-3 text-gray-500">{l.assigned_to_name || '—'}</td>
                </tr>
              ))}
              {!leads.length && <tr><td colSpan={5}><EmptyState message="No leads yet." /></td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Subscription' && (
        <div className="bg-white rounded-2xl p-5 border max-w-md">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><CreditCard size={16} className="text-indigo-500" /> Subscription Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Plan</dt><dd className="font-medium text-gray-800">{workspace.plan_name || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd><StatusBadge status={workspace.subscription_status} /></dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Team Members</dt><dd className="font-medium text-gray-800">{workspace.user_count}</dd></div>
          </dl>
        </div>
      )}

      {tab === 'Payment History' && (
        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-[11px] text-gray-400 uppercase border-b">
              <th className="text-left px-4 py-3 font-semibold">Invoice</th>
              <th className="text-left px-4 py-3 font-semibold">Amount</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Date</th>
            </tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-800 font-mono text-xs">{p.id}</td>
                  <td className="px-4 py-3 text-gray-500">₹{Number(p.total || p.amount || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 capitalize"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-gray-400">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {!payments.length && <tr><td colSpan={4}><EmptyState message="No payments recorded yet." /></td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Activity Logs' && (
        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-[11px] text-gray-400 uppercase border-b">
              <th className="text-left px-4 py-3 font-semibold">Date &amp; Time</th>
              <th className="text-left px-4 py-3 font-semibold">User</th>
              <th className="text-left px-4 py-3 font-semibold">Action</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-gray-400">{new Date(l.created_at).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{l.actor_name}</td>
                  <td className="px-4 py-3 text-gray-700">{l.action}</td>
                  <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                </tr>
              ))}
              {!logs.length && <tr><td colSpan={4}><EmptyState message="No activity recorded yet." /></td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SuperAdminWorkspaceDetailPage;
