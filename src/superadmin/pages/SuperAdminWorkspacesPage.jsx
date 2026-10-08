import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, Edit2, Ban, CheckCircle2, Layers, Building2, Users, Clock, ShieldOff, UserRound, UserPlus, CreditCard, X, Plus, Trash2,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import SelectFilter from '../components/ui/SelectFilter';
import ActionMenu from '../components/ui/ActionMenu';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import LinkStatCard from '../components/ui/LinkStatCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { useConfirmDialog } from '../../components/ui/ConfirmDialog';
import { superAdminAPI } from '../../services/api';

const PAGE_SIZE = 10;
const AVATAR_COLORS = ['bg-indigo-500', 'bg-violet-500', 'bg-pink-500', 'bg-emerald-500', 'bg-orange-500', 'bg-teal-500', 'bg-blue-500'];
const DRAWER_TABS = ['Details', 'Users', 'Leads', 'Subscription'];
const CAMPAIGN_FETCH_LIMIT = 1000;
const BUSINESS_TYPES = [
  { id: 'lead_management', name: 'Lead Management' }, { id: 'real_estate', name: 'Real Estate' }, { id: 'salon', name: 'Salon / Spa' },
  { id: 'gym', name: 'Gym / Fitness' }, { id: 'clinic', name: 'Clinic / Doctor' }, { id: 'other', name: 'Other' },
];
const EMPTY_FORM = { businessName: '', name: '', email: '', phone: '', password: '', businessType: 'other', plan_id: '', status: 'trial' };
const INPUT_CLASS = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400';

const statusLabel = (s) => (s === 'halted' ? 'Suspended' : s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const OrgAvatar = ({ index, className = 'w-8 h-8' }) => (
  <span className={`${className} rounded-lg ${AVATAR_COLORS[Math.max(index, 0) % AVATAR_COLORS.length]} text-white flex items-center justify-center shrink-0`}>
    <Building2 size={15} />
  </span>
);

const DetailRow = ({ label, children }) => (
  <div className="flex items-center justify-between gap-4 py-2 text-sm">
    <dt className="text-gray-500">{label}</dt>
    <dd className="font-medium text-gray-800 text-right">{children}</dd>
  </div>
);

const SuperAdminWorkspacesPage = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All Plans');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [page, setPage] = useState(1);
  const [planModal, setPlanModal] = useState(null);
  const [newPlanId, setNewPlanId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('Details');
  const [drawerData, setDrawerData] = useState({ users: [], leads: [], campaigns: [], campaignTotal: 0, loading: false });

  const load = () => {
    setLoading(true);
    Promise.all([superAdminAPI.getTenants(), superAdminAPI.getPlans()])
      .then(([tRes, pRes]) => { setTenants(tRes.data.tenants || []); setPlans(pRes.data.plans || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openDrawer = (t) => {
    setSelected(t);
    setTab('Details');
    setDrawerData({ users: [], leads: [], campaigns: [], campaignTotal: 0, loading: true });
    Promise.all([
      superAdminAPI.getUsers().catch(() => null),
      superAdminAPI.getLeads({ tenant_id: t.id, page: 1, limit: 5 }).catch(() => null),
      superAdminAPI.getCampaigns({ tenant_id: t.id, page: 1, limit: CAMPAIGN_FETCH_LIMIT }).catch(() => null),
    ]).then(([uRes, lRes, cRes]) => setDrawerData({
      users: (uRes?.data?.users || []).filter(u => u.tenant_id === t.id),
      leads: lRes?.data?.leads || [],
      campaigns: cRes?.data?.campaigns || [],
      campaignTotal: cRes?.data?.total || 0,
      loading: false,
    }));
  };

  const filtered = useMemo(() => tenants.filter(t => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || t.name?.toLowerCase().includes(q) || t.owner_name?.toLowerCase().includes(q) || t.owner_email?.toLowerCase().includes(q);
    return matchesSearch
      && (planFilter === 'All Plans' || t.plan_name === planFilter)
      && (statusFilter === 'All Status' || t.subscription_status === statusFilter);
  }), [tenants, search, planFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const count = (status) => tenants.filter(t => t.subscription_status === status).length;

  const setStatus = async (t, subscription_status) => {
    await superAdminAPI.updateTenant(t.id, { subscription_status });
    if (selected?.id === t.id) setSelected({ ...selected, subscription_status });
    load();
  };

  const openChangePlan = (t) => { setPlanModal(t); setNewPlanId(plans.find(p => p.name === t.plan_name)?.id || ''); };
  const saveChangePlan = async () => {
    await superAdminAPI.updateTenant(planModal.id, { plan_id: newPlanId });
    setPlanModal(null);
    load();
  };

  const setField = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (formErrors[field]) setFormErrors(er => ({ ...er, [field]: undefined }));
  };
  const closeCreate = () => { setCreateOpen(false); setForm(EMPTY_FORM); setFormErrors({}); setCreateError(''); };

  const handleCreate = async () => {
    const errors = {};
    if (!form.businessName.trim()) errors.businessName = 'Organization name is required';
    if (!form.name.trim()) errors.name = 'Owner name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address';
    if (form.phone.trim() && form.phone.replace(/\D/g, '').length < 3) errors.phone = 'Enter a valid phone number';
    if (form.password.length < 6) errors.password = 'Password must be at least 6 characters';
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    setCreating(true);
    setCreateError('');
    try {
      await superAdminAPI.createTenant({
        businessType: form.businessType, businessName: form.businessName.trim(), name: form.name.trim(),
        email: form.email.trim(), phone: form.phone.trim(), password: form.password,
        ...(form.plan_id ? { plan_id: form.plan_id } : {}),
        ...(form.status !== 'trial' ? { subscription_status: form.status } : {}),
      });
      closeCreate();
      setPage(1);
      load();
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Could not create the organization.');
    } finally { setCreating(false); }
  };

  const handleDelete = async (t) => {
    const ok = await confirm({
      title: 'Delete organization?',
      message: `"${t.name}" and all of its users, leads and data will be permanently deleted. This cannot be undone.`,
      confirmText: 'Delete',
    });
    if (!ok) return;
    try {
      await superAdminAPI.deleteTenant(t.id);
      if (selected?.id === t.id) setSelected(null);
      load();
    } catch (err) {
      window.alert(err.response?.data?.error || 'Could not delete the organization.');
    }
  };

  const detailPath = (t) => `/super-admin/workspaces/${t.id}`;
  const performance = useMemo(() => ({
    total: drawerData.campaignTotal,
    conversions: drawerData.campaigns.reduce((s, c) => s + Number(c.won_leads || 0), 0),
    spent: drawerData.campaigns.reduce((s, c) => s + Number(c.actual_spend || 0), 0),
  }), [drawerData]);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader title="Organizations" subtitle="Manage every business organization running on CurveLead."
        action={
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
            <Plus size={16} /> Create Organization
          </button>
        } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <LinkStatCard label="Total Organizations" value={tenants.length} icon={Building2} tint="bg-indigo-50 text-indigo-500" />
        <LinkStatCard label="Active Organizations" value={count('active')} icon={Users} tint="bg-emerald-50 text-emerald-500" onClick={() => { setStatusFilter('active'); setPage(1); }} />
        <LinkStatCard label="Trial Organizations" value={count('trial')} icon={Clock} tint="bg-amber-50 text-amber-500" onClick={() => { setStatusFilter('trial'); setPage(1); }} />
        <LinkStatCard label="Suspended Organizations" value={count('halted')} icon={ShieldOff} tint="bg-pink-50 text-pink-500" onClick={() => { setStatusFilter('halted'); setPage(1); }} />
      </div>

      <div className="bg-white rounded-2xl border">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b">
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by organization, owner or email..." className="flex-1 min-w-[220px]" />
          <SelectFilter value={planFilter} onChange={v => { setPlanFilter(v); setPage(1); }} allLabel="All Plans" options={plans.map(p => p.name)} />
          <SelectFilter value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} allLabel="All Status" options={['trial', 'active', 'cancelled', 'expired', 'halted']} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase border-b bg-slate-50/60">
                <th className="text-left px-4 py-3 font-semibold">Organization</th>
                <th className="text-left px-4 py-3 font-semibold">Owner</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Phone</th>
                <th className="text-left px-4 py-3 font-semibold">Plan</th>
                <th className="text-left px-4 py-3 font-semibold">Users</th>
                <th className="text-left px-4 py-3 font-semibold">Leads</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Created</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center text-gray-400 py-10">Loading…</td></tr>
              ) : pageItems.map((t, i) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => openDrawer(t)}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2.5 font-medium text-gray-800"><OrgAvatar index={i} />{t.name}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">{t.owner_name || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">{t.owner_email || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">{t.owner_phone || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {t.plan_name ? <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600">{t.plan_name}</span> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">{t.user_count}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">{t.lead_count}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={statusLabel(t.subscription_status)} /></td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-400">{fmtDate(t.created_at)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ActionMenu items={[
                      { label: 'View Organization', icon: Eye, onClick: () => openDrawer(t) },
                      { label: 'Edit Organization', icon: Edit2, onClick: () => navigate(detailPath(t)) },
                      { label: 'View Users', icon: UserRound, onClick: () => navigate('/super-admin/users') },
                      { label: 'View Leads', icon: UserPlus, onClick: () => navigate('/super-admin/leads') },
                      { label: 'View Subscription', icon: CreditCard, onClick: () => navigate('/super-admin/subscriptions') },
                      { label: 'Change Plan', icon: Layers, onClick: () => openChangePlan(t) },
                      t.subscription_status === 'halted'
                        ? { label: 'Activate Organization', icon: CheckCircle2, onClick: () => setStatus(t, 'active') }
                        : { label: 'Suspend Organization', icon: Ban, danger: true, onClick: () => setStatus(t, 'halted') },
                      { label: 'Delete', icon: Trash2, danger: true, onClick: () => handleDelete(t) },
                    ]} />
                  </td>
                </tr>
              ))}
              {!loading && !pageItems.length && (
                <tr><td colSpan={10}><EmptyState message="No organizations found." /></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />}
      </div>

      {selected && (
        <>
          <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setSelected(null)} />
          <aside className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-40 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b shrink-0">
              <h3 className="font-semibold text-gray-900">View Organization</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={18} /></button>
            </div>
            <div className="p-5 overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                <OrgAvatar index={tenants.findIndex(t => t.id === selected.id)} className="w-11 h-11" />
                <p className="font-semibold text-gray-900 flex-1 min-w-0 truncate">{selected.name}</p>
                <StatusBadge status={statusLabel(selected.subscription_status)} />
              </div>

              <div className="flex gap-5 border-b mb-3">
                {DRAWER_TABS.map(name => (
                  <button key={name} onClick={() => setTab(name)}
                    className={`pb-2 text-xs font-semibold -mb-px border-b-2 ${tab === name ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {name}
                  </button>
                ))}
              </div>

              {tab === 'Details' && (
                <>
                  <dl className="mb-5">
                    <DetailRow label="Organization Name">{selected.name}</DetailRow>
                    <DetailRow label="Owner">{selected.owner_name || '—'}</DetailRow>
                    <DetailRow label="Email">{selected.owner_email || '—'}</DetailRow>
                    <DetailRow label="Phone">{selected.owner_phone || '—'}</DetailRow>
                    <DetailRow label="Plan">{selected.plan_name || '—'}</DetailRow>
                    <DetailRow label="Status"><StatusBadge status={statusLabel(selected.subscription_status)} /></DetailRow>
                    <DetailRow label="Created Date">{fmtDate(selected.created_at)}</DetailRow>
                  </dl>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Overview</h4>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="rounded-xl border p-3 flex items-center gap-3">
                      <span className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center"><UserRound size={16} /></span>
                      <div><p className="text-[11px] text-gray-500">Total Users</p><p className="font-bold text-[#141a3d]">{selected.user_count}</p></div>
                    </div>
                    <div className="rounded-xl border p-3 flex items-center gap-3">
                      <span className="w-9 h-9 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center"><UserPlus size={16} /></span>
                      <div><p className="text-[11px] text-gray-500">Total Leads</p><p className="font-bold text-[#141a3d]">{selected.lead_count}</p></div>
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Performance</h4>
                  <dl className="rounded-xl border px-3 mb-5 divide-y">
                    <DetailRow label="Total Campaigns">{drawerData.loading ? '…' : performance.total}</DetailRow>
                    <DetailRow label="Total Conversions">{drawerData.loading ? '…' : performance.conversions}</DetailRow>
                    <DetailRow label="Total Spent">{drawerData.loading ? '…' : fmtMoney(performance.spent)}</DetailRow>
                  </dl>
                </>
              )}

              {tab === 'Users' && (
                <ul className="divide-y mb-5">
                  {drawerData.loading && <li className="py-4 text-sm text-gray-400">Loading…</li>}
                  {!drawerData.loading && !drawerData.users.length && <li><EmptyState message="No users found." /></li>}
                  {drawerData.users.map(u => (
                    <li key={u.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0"><p className="font-medium text-gray-800 truncate">{u.name}</p><p className="text-xs text-gray-400 truncate">{u.email}</p></div>
                      <span className="text-xs text-gray-500 capitalize shrink-0">{u.role}</span>
                    </li>
                  ))}
                </ul>
              )}

              {tab === 'Leads' && (
                <div className="mb-5">
                  <ul className="divide-y">
                    {drawerData.loading && <li className="py-4 text-sm text-gray-400">Loading…</li>}
                    {!drawerData.loading && !drawerData.leads.length && <li><EmptyState message="No leads yet." /></li>}
                    {drawerData.leads.map(l => (
                      <li key={l.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0"><p className="font-medium text-gray-800 truncate">{l.name}</p><p className="text-xs text-gray-400">{l.phone}</p></div>
                        <span className="text-xs text-gray-500 capitalize shrink-0">{l.stage}</span>
                      </li>
                    ))}
                  </ul>
                  {selected.lead_count > drawerData.leads.length && <p className="text-xs text-gray-400 mt-2">Showing the latest {drawerData.leads.length} of {selected.lead_count} leads.</p>}
                </div>
              )}

              {tab === 'Subscription' && (
                <dl className="mb-5">
                  <DetailRow label="Plan">{selected.plan_name || '—'}</DetailRow>
                  <DetailRow label="Status"><StatusBadge status={statusLabel(selected.subscription_status)} /></DetailRow>
                  <DetailRow label="Trial Ends">{fmtDate(selected.trial_ends_at)}</DetailRow>
                  <DetailRow label="Team Members">{selected.user_count}</DetailRow>
                </dl>
              )}

              <button onClick={() => navigate(detailPath(selected))}
                className="w-full py-2.5 rounded-xl border border-indigo-300 text-sm font-semibold text-indigo-600 hover:bg-indigo-50">
                View Full Details
              </button>
            </div>
          </aside>
        </>
      )}

      {createOpen && (
        <Modal title="Create Organization" onClose={closeCreate}
          footer={<>
            <button onClick={closeCreate} disabled={creating} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            <button onClick={handleCreate} disabled={creating} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
              {creating ? 'Creating…' : 'Create Organization'}
            </button>
          </>}>
          {createError && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{createError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Organization Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.businessName} onChange={e => setField('businessName', e.target.value)} placeholder="Enter organization name" className={INPUT_CLASS} />
              {formErrors.businessName && <p className="text-xs text-red-500 mt-1">{formErrors.businessName}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Owner Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Enter owner name" className={INPUT_CLASS} />
              {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
              <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="Enter email address" className={INPUT_CLASS} />
              {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="Enter phone number" className={INPUT_CLASS} />
              {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Password <span className="text-red-500">*</span></label>
              <input type="password" value={form.password} onChange={e => setField('password', e.target.value)} placeholder="Create a password" className={INPUT_CLASS} />
              {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Business Type</label>
              <select value={form.businessType} onChange={e => setField('businessType', e.target.value)} className={INPUT_CLASS}>
                {BUSINESS_TYPES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Plan</label>
              <select value={form.plan_id} onChange={e => setField('plan_id', e.target.value)} className={INPUT_CLASS}>
                <option value="">Default plan</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={e => setField('status', e.target.value)} className={INPUT_CLASS}>
                <option value="trial">Trial</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>
        </Modal>
      )}

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
