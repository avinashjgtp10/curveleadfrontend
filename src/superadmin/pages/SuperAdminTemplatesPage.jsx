import { useEffect, useMemo, useState } from 'react';
import { Eye, Trash2, X, MessageSquare, Mail, Smartphone, Pencil, Power, PowerOff } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import SelectFilter from '../components/ui/SelectFilter';
import ActionMenu from '../components/ui/ActionMenu';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/StatusBadge';
import { useConfirmDialog } from '../../components/ui/ConfirmDialog';
import { superAdminAPI } from '../../services/api';

const PAGE_SIZE = 20;
const ALL_ORGS = 'All Organizations';
const ALL_CHANNELS = 'All Channels';
const ALL_STATUS = 'All Status';
const CHANNEL_CHOICES = ['whatsapp', 'email', 'sms'];
const INPUT_CLASS = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400';
const CHANNEL_ICONS = { whatsapp: MessageSquare, email: Mail, sms: Smartphone };

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const ChannelCell = ({ channel }) => {
  const Icon = CHANNEL_ICONS[channel] || MessageSquare;
  return (
    <span className="inline-flex items-center gap-2 text-gray-600">
      <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0"><Icon size={13} /></span>
      {capitalize(channel)}
    </span>
  );
};

const SuperAdminTemplatesPage = () => {
  const confirm = useConfirmDialog();
  const [templates, setTemplates] = useState([]);
  const [total, setTotal] = useState(0);
  const [channels, setChannels] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState(ALL_ORGS);
  const [channelFilter, setChannelFilter] = useState(ALL_CHANNELS);
  const [statusFilter, setStatusFilter] = useState(ALL_STATUS);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', category: '', channel: 'whatsapp', message: '' });
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    superAdminAPI.getTenants().then(({ data }) => setTenants(data.tenants || [])).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const tenant = tenants.find(t => t.id === tenantFilter);
    const params = {
      page, limit: PAGE_SIZE,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(tenant ? { tenant_id: tenant.id } : {}),
      ...(channelFilter !== ALL_CHANNELS ? { channel: channelFilter } : {}),
      ...(statusFilter !== ALL_STATUS ? { status: statusFilter.toLowerCase() } : {}),
    };
    superAdminAPI.getTemplates(params)
      .then(({ data }) => { setTemplates(data.templates || []); setTotal(data.total || 0); setChannels(data.channels || []); setError(''); })
      .catch((e) => { console.error(e); setError(e.response?.data?.error || 'Could not load templates.'); })
      .finally(() => setLoading(false));
  }, [page, search, tenantFilter, channelFilter, statusFilter, tenants, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const organizationNames = useMemo(() => tenants.map(t => ({ value: t.id, label: t.name })), [tenants]);
  const resetPage = (setter) => (v) => { setter(v); setPage(1); };

  const openEdit = (t) => {
    setEditing(t);
    setEditForm({ name: t.name || '', category: t.category || '', channel: t.channel || 'whatsapp', message: t.message || '' });
    setEditError('');
  };
  const saveEdit = async () => {
    if (!editForm.name.trim() || !editForm.message.trim()) return setEditError('Name and message are required.');
    setSaving(true);
    setEditError('');
    try {
      const { data } = await superAdminAPI.updateTemplate(editing.id, {
        name: editForm.name.trim(), category: editForm.category.trim() || undefined, channel: editForm.channel, message: editForm.message.trim(),
      });
      if (viewing?.id === editing.id) setViewing({ ...viewing, ...editForm, name: data.template.name });
      setEditing(null);
      setReloadKey(k => k + 1);
    } catch (err) {
      setEditError(err.response?.data?.error || 'Could not save the template.');
    } finally { setSaving(false); }
  };
  const toggleActive = async (t) => {
    try {
      await superAdminAPI.updateTemplate(t.id, { is_active: !t.is_active });
      if (viewing?.id === t.id) setViewing({ ...viewing, is_active: !t.is_active });
      setReloadKey(k => k + 1);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not change the template status.');
    }
  };

  const handleDelete = async (t) => {
    const ok = await confirm({
      title: 'Delete template?',
      message: `"${t.name}" will be permanently removed from ${t.tenant_name || 'its organization'}. This cannot be undone.`,
      confirmText: 'Delete',
    });
    if (!ok) return;
    try {
      await superAdminAPI.deleteTemplate(t.id);
      if (viewing?.id === t.id) setViewing(null);
      setReloadKey(k => k + 1);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete the template.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader title="Templates" subtitle="Manage reusable campaign and messaging templates across organizations." />

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-2xl border">
        <div className="flex flex-wrap items-center gap-2.5 p-4 border-b">
          <SearchInput value={search} onChange={resetPage(setSearch)} placeholder="Search by template name..." className="flex-1 min-w-[220px]" />
          <SelectFilter value={tenantFilter} onChange={resetPage(setTenantFilter)} allLabel={ALL_ORGS} options={organizationNames} />
          <SelectFilter value={channelFilter} onChange={resetPage(setChannelFilter)} allLabel={ALL_CHANNELS} options={channels} />
          <SelectFilter value={statusFilter} onChange={resetPage(setStatusFilter)} allLabel={ALL_STATUS} options={['Active', 'Inactive']} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase border-b bg-slate-50/60">
                <th className="text-left px-4 py-3 font-semibold">Template</th>
                <th className="text-left px-4 py-3 font-semibold">Organization</th>
                <th className="text-left px-4 py-3 font-semibold">Channel</th>
                <th className="text-left px-4 py-3 font-semibold">Category</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Times Used</th>
                <th className="text-left px-4 py-3 font-semibold">Created</th>
                <th className="text-left px-4 py-3 font-semibold">Updated</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center text-gray-400 py-10">Loading…</td></tr>
              ) : templates.map(t => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => setViewing(t)}>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{t.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600">{t.tenant_name || '—'}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap"><ChannelCell channel={t.channel} /></td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">{capitalize(t.category)}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={t.is_active === false ? 'Inactive' : 'Active'} /></td>
                  <td className="px-4 py-3 text-right text-gray-600">{t.use_count ?? 0}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-400">{fmtDate(t.created_at)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-400">{fmtDate(t.updated_at)}</td>
                  <td className="px-4 py-3">
                    <ActionMenu items={[
                      { label: 'View', icon: Eye, onClick: () => setViewing(t) },
                      { label: 'Edit', icon: Pencil, onClick: () => openEdit(t) },
                      t.is_active === false
                        ? { label: 'Activate', icon: Power, onClick: () => toggleActive(t) }
                        : { label: 'Deactivate', icon: PowerOff, onClick: () => toggleActive(t) },
                      { label: 'Delete', icon: Trash2, danger: true, onClick: () => handleDelete(t) },
                    ]} />
                  </td>
                </tr>
              ))}
              {!loading && !templates.length && (
                <tr><td colSpan={9}>
                  <EmptyState message="No templates found" className="pt-8" />
                  <p className="text-xs text-gray-400 text-center pb-8">Try changing your search or filters.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={total} pageSize={PAGE_SIZE} />}
      </div>

      {editing && (
        <Modal title={`Edit template — ${editing.name}`} onClose={() => !saving && setEditing(null)}
          footer={<>
            <button onClick={() => setEditing(null)} disabled={saving} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            <button onClick={saveEdit} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
          </>}>
          {editError && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{editError}</div>}
          <p className="text-xs text-gray-400 mb-3">Organization: {editing.tenant_name || '—'}</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Template Name</label>
              <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={INPUT_CLASS} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Channel</label>
                <select value={editForm.channel} onChange={e => setEditForm(f => ({ ...f, channel: e.target.value }))} className={INPUT_CLASS}>
                  {[...new Set([...CHANNEL_CHOICES, editForm.channel])].map(c => <option key={c} value={c}>{capitalize(c)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                <input value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} className={INPUT_CLASS} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Message</label>
              <textarea rows={5} value={editForm.message} onChange={e => setEditForm(f => ({ ...f, message: e.target.value }))} className={INPUT_CLASS} />
            </div>
          </div>
        </Modal>
      )}

      {viewing && (
        <>
          <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setViewing(null)} />
          <aside className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-40 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b shrink-0">
              <h3 className="font-semibold text-gray-900 truncate">{viewing.name}</h3>
              <button onClick={() => setViewing(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={18} /></button>
            </div>
            <div className="p-5 overflow-y-auto">
              <dl className="text-sm divide-y mb-4">
                {[
                  ['Organization', viewing.tenant_name || '—'],
                  ['Channel', capitalize(viewing.channel)],
                  ['Category', capitalize(viewing.category)],
                  ['Status', viewing.is_active === false ? 'Inactive' : 'Active'],
                  ['Times Used', viewing.use_count ?? 0],
                  ['Created', fmtDate(viewing.created_at)],
                  ['Updated', fmtDate(viewing.updated_at)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="font-medium text-gray-800 text-right">{value}</dd>
                  </div>
                ))}
              </dl>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Message</h4>
              <p className="text-sm text-gray-700 whitespace-pre-line break-words bg-slate-50 rounded-xl p-3 border">{viewing.message}</p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button onClick={() => openEdit(viewing)} className="flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <Pencil size={15} /> Edit
                </button>
                <button onClick={() => toggleActive(viewing)} className="flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {viewing.is_active === false ? <><Power size={15} /> Activate</> : <><PowerOff size={15} /> Deactivate</>}
                </button>
              </div>
              <button onClick={() => handleDelete(viewing)}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50">
                <Trash2 size={15} /> Delete Template
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

export default SuperAdminTemplatesPage;
