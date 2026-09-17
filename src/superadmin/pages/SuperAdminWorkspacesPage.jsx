import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit2, Ban, CheckCircle2, Layers } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import SelectFilter from '../components/ui/SelectFilter';
import ActionMenu from '../components/ui/ActionMenu';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { superAdminAPI } from '../../services/api';

const PAGE_SIZE = 8;

const SuperAdminWorkspacesPage = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All Plans');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [page, setPage] = useState(1);
  const [planModal, setPlanModal] = useState(null);
  const [newPlanId, setNewPlanId] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([superAdminAPI.getTenants(), superAdminAPI.getPlans()])
      .then(([tRes, pRes]) => { setTenants(tRes.data.tenants || []); setPlans(pRes.data.plans || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => tenants.filter(t => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || t.name?.toLowerCase().includes(q) || t.owner_name?.toLowerCase().includes(q) || t.owner_email?.toLowerCase().includes(q);
    return matchesSearch
      && (planFilter === 'All Plans' || t.plan_name === planFilter)
      && (statusFilter === 'All Status' || t.subscription_status === statusFilter);
  }), [tenants, search, planFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const setStatus = async (t, subscription_status) => {
    await superAdminAPI.updateTenant(t.id, { subscription_status });
    load();
  };

  const openChangePlan = (t) => { setPlanModal(t); setNewPlanId(plans.find(p => p.name === t.plan_name)?.id || ''); };
  const saveChangePlan = async () => {
    await superAdminAPI.updateTenant(planModal.id, { plan_id: newPlanId });
    setPlanModal(null);
    load();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader title="Workspaces" subtitle="Every salon/business workspace running on CurveLead." />

      <div className="bg-white rounded-2xl border">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b">
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by workspace, owner, or email..." className="flex-1 min-w-[220px]" />
          <SelectFilter value={planFilter} onChange={v => { setPlanFilter(v); setPage(1); }} allLabel="All Plans" options={plans.map(p => p.name)} />
          <SelectFilter value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} allLabel="All Status" options={['trial', 'active', 'cancelled', 'expired', 'halted']} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase border-b">
                <th className="text-left px-4 py-3 font-semibold">Workspace</th>
                <th className="text-left px-4 py-3 font-semibold">Owner</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Phone</th>
                <th className="text-left px-4 py-3 font-semibold">Plan</th>
                <th className="text-left px-4 py-3 font-semibold">Team</th>
                <th className="text-left px-4 py-3 font-semibold">Leads</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Created</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center text-gray-400 py-10">Loading…</td></tr>
              ) : pageItems.map(t => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/super-admin/workspaces/${t.id}`)}>
                  <td className="px-4 py-3 font-medium text-gray-800">{t.name}</td>
                  <td className="px-4 py-3 text-gray-600">{t.owner_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{t.owner_email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{t.owner_phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{t.plan_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{t.user_count}</td>
                  <td className="px-4 py-3 text-gray-500">{t.lead_count}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.subscription_status} /></td>
                  <td className="px-4 py-3 text-gray-400">{new Date(t.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <ActionMenu items={[
                      { label: 'View Workspace', icon: Eye, onClick: () => navigate(`/super-admin/workspaces/${t.id}`) },
                      { label: 'Edit Workspace', icon: Edit2, onClick: () => navigate(`/super-admin/workspaces/${t.id}`) },
                      t.subscription_status === 'halted'
                        ? { label: 'Activate Workspace', icon: CheckCircle2, onClick: () => setStatus(t, 'active') }
                        : { label: 'Suspend Workspace', icon: Ban, onClick: () => setStatus(t, 'halted') },
                      { label: 'Change Plan', icon: Layers, onClick: () => openChangePlan(t) },
                    ]} />
                  </td>
                </tr>
              ))}
              {!loading && !pageItems.length && (
                <tr><td colSpan={10}><EmptyState message="No workspaces found." /></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />}
      </div>

      {planModal && (
        <Modal title={`Change plan — ${planModal.name}`} onClose={() => setPlanModal(null)}
          footer={<>
            <button onClick={() => setPlanModal(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={saveChangePlan} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">Save</button>
          </>}>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Plan</label>
          <select value={newPlanId} onChange={e => setNewPlanId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Modal>
      )}
    </div>
  );
};

export default SuperAdminWorkspacesPage;
