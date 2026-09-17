import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Store } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { superAdminAPI } from '../../services/api';

const SuperAdminAutomationsPage = () => {
  const navigate = useNavigate();
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAdminAPI.getAutomations()
      .then(({ data }) => setAutomations(data.automations || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader title="Automations" subtitle="Follow-up sequences configured across every workspace." />

      <div className="bg-white rounded-2xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase border-b">
                <th className="text-left px-4 py-3 font-semibold">Sequence</th>
                <th className="text-left px-4 py-3 font-semibold">Workspace</th>
                <th className="text-left px-4 py-3 font-semibold">Steps</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Created</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center text-gray-400 py-10">Loading…</td></tr>
              ) : automations.map(a => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2"><Zap size={14} className="text-indigo-400" /> {a.name}</td>
                  <td className="px-4 py-3 text-gray-500">{a.tenant_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{a.step_count}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.is_active ? 'Active' : 'Inactive'} /></td>
                  <td className="px-4 py-3 text-gray-400">{new Date(a.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    {a.tenant_id && (
                      <button onClick={() => navigate(`/super-admin/workspaces/${a.tenant_id}`)}
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                        <Store size={12} /> View Workspace
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && !automations.length && (
                <tr><td colSpan={6}><EmptyState message="No automation sequences have been created by any workspace yet." /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminAutomationsPage;
