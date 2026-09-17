import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Ban, CheckCircle2, Trash2, Store } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import SelectFilter from '../components/ui/SelectFilter';
import ActionMenu from '../components/ui/ActionMenu';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { useConfirmDialog } from '../../components/ui/ConfirmDialog';
import { superAdminAPI } from '../../services/api';

const PAGE_SIZE = 10;
const ROLE_OPTIONS = ['super_admin', 'admin', 'staff'];

const SuperAdminUsersPage = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [page, setPage] = useState(1);
  const [roleModal, setRoleModal] = useState(null);
  const [newRole, setNewRole] = useState('');

  const load = () => {
    setLoading(true);
    superAdminAPI.getUsers().then(({ data }) => setUsers(data.users || [])).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => users.filter(u => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    return matchesSearch
      && (roleFilter === 'All Roles' || u.role === roleFilter)
      && (statusFilter === 'All Status' || (statusFilter === 'Active') === u.is_active);
  }), [users, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleActive = async (u) => { await superAdminAPI.updateUser(u.id, { is_active: !u.is_active }); load(); };

  const handleDelete = async (u) => {
    if (!await confirm({ title: `Remove ${u.name}?`, confirmText: 'Remove' })) return;
    await superAdminAPI.deleteUser(u.id);
    load();
  };

  const openEditRole = (u) => { setRoleModal(u); setNewRole(u.role); };
  const saveRole = async () => { await superAdminAPI.updateUser(roleModal.id, { role: newRole }); setRoleModal(null); load(); };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader title="Users" subtitle="Every account across every workspace and role." />

      <div className="bg-white rounded-2xl border">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b">
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by name or email..." className="flex-1 min-w-[220px]" />
          <SelectFilter value={roleFilter} onChange={v => { setRoleFilter(v); setPage(1); }} allLabel="All Roles" options={ROLE_OPTIONS} />
          <SelectFilter value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} allLabel="All Status" options={['Active', 'Inactive']} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase border-b">
                <th className="text-left px-4 py-3 font-semibold">User</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Workspace</th>
                <th className="text-left px-4 py-3 font-semibold">Role</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Last Login</th>
                <th className="text-left px-4 py-3 font-semibold">Created</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center text-gray-400 py-10">Loading…</td></tr>
              ) : pageItems.map(u => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">{u.tenant_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{u.role.replace('_', ' ')}</td>
                  <td className="px-4 py-3"><StatusBadge status={u.is_active ? 'Active' : 'Inactive'} /></td>
                  <td className="px-4 py-3 text-gray-400">{u.last_login ? new Date(u.last_login).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <ActionMenu items={[
                      { label: 'Edit Role', icon: Edit2, onClick: () => openEditRole(u) },
                      u.is_active
                        ? { label: 'Deactivate', icon: Ban, onClick: () => toggleActive(u) }
                        : { label: 'Activate', icon: CheckCircle2, onClick: () => toggleActive(u) },
                      ...(u.tenant_id ? [{ label: 'View Workspace', icon: Store, onClick: () => navigate(`/super-admin/workspaces/${u.tenant_id}`) }] : []),
                      { label: 'Remove User', icon: Trash2, danger: true, onClick: () => handleDelete(u) },
                    ]} />
                  </td>
                </tr>
              ))}
              {!loading && !pageItems.length && (
                <tr><td colSpan={8}><EmptyState message="No users found." /></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />}
      </div>

      {roleModal && (
        <Modal title={`Edit role — ${roleModal.name}`} onClose={() => setRoleModal(null)}
          footer={<>
            <button onClick={() => setRoleModal(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={saveRole} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">Save</button>
          </>}>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Role</label>
          <select value={newRole} onChange={e => setNewRole(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </Modal>
      )}
    </div>
  );
};

export default SuperAdminUsersPage;
