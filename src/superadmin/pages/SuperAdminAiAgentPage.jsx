import { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  MessageSquareText, PhoneCall, BookOpen, Layers, Eye, Cpu, Mic, X, Building2, Activity, Plus, Pencil, Trash2, Power, PowerOff, PlugZap,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import SelectFilter from '../components/ui/SelectFilter';
import ActionMenu from '../components/ui/ActionMenu';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { superAdminAPI } from '../../services/api';

const USAGE_STYLES = {
  High: 'bg-emerald-50 text-emerald-600',
  Medium: 'bg-amber-50 text-amber-600',
  Low: 'bg-gray-100 text-gray-600',
  None: 'bg-gray-50 text-gray-400',
};
const ORG_PREVIEW_COUNT = 8;
const INPUT_CLASS = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400';
const EMPTY_FORM = { provider: 'groq', name: '', credential: '', status: 'active' };

const fmtNumber = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const fmtDuration = (s) => (s ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s` : null);
const timeAgo = (d) => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
};
const providerLabel = (name) => (name === '11labs' ? 'ElevenLabs' : name === 'playht' ? 'PlayHT' : name.charAt(0).toUpperCase() + name.slice(1));

const Pill = ({ on, onLabel = 'Enabled', offLabel = 'Disabled' }) => (
  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${on ? 'bg-emerald-50 text-emerald-600' : 'bg-pink-50 text-pink-500'}`}>{on ? onLabel : offLabel}</span>
);

const SectionCard = ({ icon: Icon, tint, title, children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-indigo-50 shadow-[0_2px_12px_rgba(99,102,241,0.05)] p-5 ${className}`}>
    <div className="flex items-center gap-3 mb-4">
      <span className={`w-9 h-9 rounded-full flex items-center justify-center ${tint}`}><Icon size={17} /></span>
      <h3 className="font-semibold text-[#141a3d]">{title}</h3>
    </div>
    {children}
  </div>
);

const OverviewCard = ({ icon: Icon, tint, title, left, right }) => (
  <div className="bg-white rounded-2xl border border-indigo-50 shadow-[0_2px_12px_rgba(99,102,241,0.05)] p-5 flex items-center gap-4">
    <span className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${tint}`}><Icon size={22} /></span>
    <div className="min-w-0 flex-1">
      <p className="font-semibold text-sm text-[#141a3d] mb-1.5">{title}</p>
      <div className="flex items-start gap-5">
        {[left, right].filter(Boolean).map(m => (
          <div key={m.label} className="min-w-0">
            <p className="text-2xl font-bold text-[#141a3d] leading-none">{m.value}</p>
            <p className="text-[11px] text-gray-500 mt-1">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Metric = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50/70 px-3 py-2.5">
    <p className="text-[11px] text-gray-500">{label}</p>
    <p className="text-lg font-bold text-[#141a3d] mt-0.5 truncate">{value}</p>
  </div>
);

const SuperAdminAiAgentPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [showAllOrgs, setShowAllOrgs] = useState(false);
  const [detail, setDetail] = useState(null);

  const [supported, setSupported] = useState([]);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(null); // { mode: 'create' | 'edit', integration? }
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { kind: 'disable' | 'enable' | 'delete', integration }
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState(null); // { ok, text }

  useEffect(() => {
    superAdminAPI.getAiOverview()
      .then(({ data: res }) => setData(res))
      .catch((e) => { console.error(e); setError(e.response?.data?.error || 'Could not load AI overview.'); })
      .finally(() => setLoading(false));
    superAdminAPI.getAiIntegrations()
      .then(({ data: res }) => { setSupported(res.supported_providers || []); setNeedsMigration(!!res.needs_migration); })
      .catch(console.error);
  }, [reloadKey]);

  const refresh = () => setReloadKey(k => k + 1);
  const openCreate = (provider = 'groq') => { setForm({ ...EMPTY_FORM, provider }); setFormError(''); setFormOpen({ mode: 'create' }); };
  const openEdit = (integration) => { setForm({ provider: integration.provider || 'groq', name: integration.name || '', credential: '', status: integration.status }); setFormError(''); setFormOpen({ mode: 'edit', integration }); };
  const closeForm = () => { setFormOpen(null); setForm(EMPTY_FORM); setFormError(''); };

  const saveForm = async () => {
    const editing = formOpen.mode === 'edit';
    if (!editing && form.credential.trim().length < 8) return setFormError('Enter the provider API key.');
    if (editing && form.credential && form.credential.trim().length < 8) return setFormError('That API key looks too short.');
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await superAdminAPI.updateAiIntegration(formOpen.integration.id, {
          name: form.name.trim() || undefined, status: form.status, ...(form.credential.trim() ? { credential: form.credential.trim() } : {}),
        });
      } else {
        await superAdminAPI.createAiIntegration({ provider: form.provider, name: form.name.trim() || undefined, credential: form.credential.trim(), status: form.status });
      }
      closeForm();
      setNotice({ ok: true, text: editing ? 'Integration updated.' : 'Integration added.' });
      refresh();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Could not save the integration.');
    } finally { setSaving(false); }
  };

  const testConnection = async (integration) => {
    setNotice({ ok: true, text: 'Testing connection…' });
    try {
      const { data: res } = await superAdminAPI.testAiIntegration(integration.id);
      setNotice({ ok: res.ok, text: res.ok ? `${integration.name || 'Integration'}: connection successful.` : `${integration.name || 'Integration'}: ${res.error}` });
      refresh();
    } catch (err) {
      setNotice({ ok: false, text: err.response?.data?.error || 'Could not test the connection.' });
    }
  };

  const runConfirmed = async () => {
    const { kind, integration } = confirmAction;
    setActionBusy(true);
    setActionError('');
    try {
      if (kind === 'delete') await superAdminAPI.deleteAiIntegration(integration.id);
      else await superAdminAPI.updateAiIntegration(integration.id, { status: kind === 'enable' ? 'active' : 'disabled' });
      setConfirmAction(null);
      setDetail(null);
      setNotice({ ok: true, text: kind === 'delete' ? 'Integration deleted.' : kind === 'enable' ? 'Integration enabled.' : 'Integration disabled.' });
      refresh();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Action failed. Please try again.');
    } finally { setActionBusy(false); }
  };

  const providerActions = (p) => {
    const items = [{ label: 'View Details', icon: Eye, onClick: () => setDetail(p) }];
    if (p.key !== 'groq' || needsMigration) return items;
    const integ = p.integration;
    if (!integ) return [...items, { label: 'Add Integration', icon: Plus, onClick: () => openCreate('groq') }];
    return [
      ...items,
      { label: 'Edit Integration', icon: Pencil, onClick: () => openEdit(integ) },
      { label: 'Test Connection', icon: PlugZap, onClick: () => testConnection(integ) },
      integ.status === 'active'
        ? { label: 'Disable', icon: PowerOff, onClick: () => { setActionError(''); setConfirmAction({ kind: 'disable', integration: integ }); } }
        : { label: 'Enable', icon: Power, onClick: () => { setActionError(''); setConfirmAction({ kind: 'enable', integration: integ }); } },
      { label: 'Delete', icon: Trash2, danger: true, onClick: () => { setActionError(''); setConfirmAction({ kind: 'delete', integration: integ }); } },
    ];
  };

  const providers = data?.providers || [];
  const typeOptions = useMemo(() => [...new Set(providers.map(p => p.type))], [providers]);
  const filteredProviders = useMemo(() => providers.filter(p => {
    const q = search.trim().toLowerCase();
    return (!q || providerLabel(p.name).toLowerCase().includes(q))
      && (typeFilter === 'All Types' || p.type === typeFilter)
      && (statusFilter === 'All Status' || (statusFilter === 'Connected') === (p.status === 'connected'));
  }), [providers, search, typeFilter, statusFilter]);

  const connectedCount = providers.filter(p => p.status === 'connected').length;
  const donut = [
    { name: 'Connected', value: connectedCount, color: '#10b981' },
    { name: 'Not configured', value: providers.length - connectedCount, color: '#a78bfa' },
  ];
  const organizations = data?.organizations || [];
  const shownOrgs = showAllOrgs ? organizations : organizations.slice(0, ORG_PREVIEW_COUNT);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  );

  if (error || !data) return (
    <div className="max-w-6xl mx-auto space-y-4">
      <PageHeader title="AI Agent" subtitle="Manage AI providers, calling, AI replies and knowledge capabilities across CurveLead." />
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error || 'Could not load AI overview.'}</div>
    </div>
  );

  const { auto_reply: autoReply, calling, knowledge, activity } = data;

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="AI Agent" subtitle="Manage AI providers, calling, AI replies and knowledge capabilities across CurveLead."
        action={!needsMigration && supported.length > 0 && (
          <button onClick={() => openCreate(supported[0].provider)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
            <Plus size={16} /> Add AI Integration
          </button>
        )} />

      {needsMigration && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          Managing AI integrations needs a one-time database update. Run <code>models/migration_super_admin_features.sql</code> on the backend database.
        </div>
      )}
      {notice && (
        <div role="status" className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${notice.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span className="flex-1">{notice.text}</span>
          <button onClick={() => setNotice(null)} className="p-0.5 rounded hover:bg-black/5" aria-label="Dismiss"><X size={15} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <OverviewCard icon={MessageSquareText} tint="bg-violet-50 text-violet-500" title="AI Auto-Reply"
          left={{ value: autoReply.enabled_orgs, label: 'Enabled Orgs' }} right={{ value: autoReply.disabled_orgs, label: 'Disabled Orgs' }} />
        <OverviewCard icon={PhoneCall} tint="bg-emerald-50 text-emerald-500" title="AI Calling"
          left={{ value: calling.connected_orgs, label: 'Connected Orgs' }} right={{ value: calling.active_provider || '—', label: 'Active Provider' }} />
        <OverviewCard icon={BookOpen} tint="bg-orange-50 text-orange-500" title="Knowledge"
          left={{ value: knowledge.orgs_with_playbooks, label: 'Orgs with Playbooks' }} />
        <OverviewCard icon={Layers} tint="bg-blue-50 text-blue-500" title="AI Providers"
          left={{ value: connectedCount, label: 'Connected Providers' }} right={{ value: providers.length - connectedCount, label: 'Not Configured' }} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4 min-w-0">
          <div className="bg-white rounded-2xl border border-indigo-50 shadow-[0_2px_12px_rgba(99,102,241,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
              <div>
                <h3 className="font-semibold text-[#141a3d]">AI Integrations</h3>
                <p className="text-xs text-gray-500">Manage AI providers used by CurveLead organizations.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <SearchInput value={search} onChange={setSearch} placeholder="Search providers..." className="w-44" />
                <SelectFilter value={typeFilter} onChange={setTypeFilter} allLabel="All Types" options={typeOptions} />
                <SelectFilter value={statusFilter} onChange={setStatusFilter} allLabel="All Status" options={['Connected', 'Not configured']} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-gray-400 uppercase border-y bg-slate-50/60">
                    <th className="text-left px-5 py-3 font-semibold">Provider</th>
                    <th className="text-left px-4 py-3 font-semibold">Type</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Organizations</th>
                    <th className="text-left px-4 py-3 font-semibold">Usage</th>
                    <th className="text-left px-4 py-3 font-semibold">Last Sync</th>
                    <th className="text-left px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProviders.map(p => (
                    <tr key={p.key} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-3 font-medium text-gray-800">
                          <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">{p.type === 'LLM / AI Reply' ? <Cpu size={15} /> : <Mic size={15} />}</span>
                          {providerLabel(p.name)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">{p.type}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><Pill on={p.status === 'connected'} onLabel="Connected" offLabel="Not configured" /></td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{p.organizations} {p.organizations === 1 ? 'organization' : 'organizations'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{p.usage ? `${fmtNumber(p.usage)} ${p.usage_unit}` : '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">{p.last_sync ? fmtDateTime(p.last_sync) : '—'}</td>
                      <td className="px-4 py-3">
                        <ActionMenu items={providerActions(p)} />
                      </td>
                    </tr>
                  ))}
                  {!filteredProviders.length && <tr><td colSpan={7}><EmptyState message="No providers match your filters." /></td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard icon={PhoneCall} tint="bg-emerald-50 text-emerald-500" title="AI Calling">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <Metric label="Provider" value={calling.active_provider || '—'} />
                <Metric label="Connected Orgs" value={calling.connected_orgs} />
                <Metric label="Active Agents" value={calling.active_agents} />
                <Metric label="Calls Today" value={fmtNumber(calling.calls_today)} />
                <Metric label="Minutes Used" value={fmtNumber(calling.minutes_used)} />
                <Metric label="Recordings" value={fmtNumber(calling.recordings)} />
              </div>
            </SectionCard>

            <SectionCard icon={MessageSquareText} tint="bg-violet-50 text-violet-500" title="AI Auto-Reply">
              <div className="grid grid-cols-2 gap-2.5">
                <Metric label="Enabled Organizations" value={autoReply.enabled_orgs} />
                <Metric label="Disabled Organizations" value={autoReply.disabled_orgs} />
                <Metric label="Messages Processed" value={fmtNumber(autoReply.messages_processed)} />
                <Metric label="Success Rate" value={autoReply.success_rate === null ? '—' : `${autoReply.success_rate}%`} />
              </div>
              {autoReply.enabled_organizations.length > 0 && (
                <p className="text-xs text-gray-500 mt-3">Enabled for: {autoReply.enabled_organizations.map(o => o.name).join(', ')}</p>
              )}
            </SectionCard>
          </div>

          <SectionCard icon={BookOpen} tint="bg-orange-50 text-orange-500" title="Knowledge">
            <p className="text-xs text-gray-500 -mt-2 mb-3">AI sales playbooks learned from each organization&apos;s call outcomes.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <Metric label="Organizations with Playbooks" value={knowledge.orgs_with_playbooks} />
              <Metric label="Playbook Versions" value={knowledge.playbooks} />
              <Metric label="Last Updated" value={knowledge.last_updated ? fmtDateTime(knowledge.last_updated) : '—'} />
            </div>
          </SectionCard>

          <div className="bg-white rounded-2xl border border-indigo-50 shadow-[0_2px_12px_rgba(99,102,241,0.05)]">
            <div className="flex items-center justify-between p-5 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center"><Building2 size={17} /></span>
                <h3 className="font-semibold text-[#141a3d]">Organization AI Usage</h3>
              </div>
              {organizations.length > ORG_PREVIEW_COUNT && (
                <button onClick={() => setShowAllOrgs(o => !o)} className="text-xs text-indigo-600 hover:underline">{showAllOrgs ? 'Show less' : 'View All'}</button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-gray-400 uppercase border-y bg-slate-50/60">
                    <th className="text-left px-5 py-3 font-semibold">Organization</th>
                    <th className="text-left px-4 py-3 font-semibold">AI Reply</th>
                    <th className="text-left px-4 py-3 font-semibold">AI Calling</th>
                    <th className="text-right px-4 py-3 font-semibold">Calls</th>
                    <th className="text-right px-4 py-3 font-semibold">Messages</th>
                    <th className="text-left px-4 py-3 font-semibold">AI Usage</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shownOrgs.map(o => (
                    <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-3 whitespace-nowrap font-medium text-gray-800">{o.name}</td>
                      <td className="px-4 py-3"><Pill on={o.auto_reply_enabled} /></td>
                      <td className="px-4 py-3"><Pill on={o.calling_connected} /></td>
                      <td className="px-4 py-3 text-right text-gray-600">{fmtNumber(o.calls)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{fmtNumber(o.messages)}</td>
                      <td className="px-4 py-3"><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${USAGE_STYLES[o.usage]}`}>{o.usage === 'None' ? '—' : o.usage}</span></td>
                      <td className="px-4 py-3"><StatusBadge status={o.status === 'halted' ? 'Suspended' : o.status ? o.status.charAt(0).toUpperCase() + o.status.slice(1) : '—'} /></td>
                    </tr>
                  ))}
                  {!organizations.length && <tr><td colSpan={7}><EmptyState message="No organizations yet." /></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4 min-w-0">
          <SectionCard icon={Layers} tint="bg-indigo-50 text-indigo-500" title="AI Provider Status">
            <div className="flex items-center gap-4">
              <div className="relative w-36 h-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={providers.length ? donut : [{ name: 'None', value: 1, color: '#e5e7eb' }]} dataKey="value" innerRadius={44} outerRadius={64} stroke="#fff" strokeWidth={2}>
                      {(providers.length ? donut : [{ color: '#e5e7eb' }]).map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-[#141a3d]">{connectedCount}/{providers.length}</span>
                  <span className="text-[11px] text-gray-500">Connected</span>
                </div>
              </div>
              <ul className="flex-1 space-y-2.5 text-sm">
                {donut.map(d => (
                  <li key={d.name} className="flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full mr-2.5 shrink-0" style={{ background: d.color }} />
                    <span className="flex-1 text-gray-600">{d.name}</span>
                    <span className="font-semibold text-[#141a3d]">{d.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </SectionCard>

          <SectionCard icon={Activity} tint="bg-violet-50 text-violet-500" title="Recent AI Activity">
            {activity.length ? (
              <ul className="space-y-4">
                {activity.map(a => (
                  <li key={a.id} className="flex items-start gap-3">
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${a.type === 'call' ? 'bg-emerald-50 text-emerald-500' : 'bg-violet-50 text-violet-500'}`}>
                      {a.type === 'call' ? <PhoneCall size={16} /> : <MessageSquareText size={16} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-800">{a.title}</p>
                        <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(a.at)}</span>
                      </div>
                      <p className="text-xs text-gray-500">Organization: {a.organization || '—'}</p>
                      {fmtDuration(a.duration_seconds) && <p className="text-xs text-gray-500">Duration: {fmtDuration(a.duration_seconds)}</p>}
                      <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${['completed', 'success'].includes(a.status) ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}>
                        {String(a.status).replace(/_/g, ' ')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <EmptyState message="No AI activity recorded yet." />}
          </SectionCard>
        </div>
      </div>

      {formOpen && (
        <Modal title={formOpen.mode === 'edit' ? 'Edit AI Integration' : 'Add AI Integration'} onClose={() => !saving && closeForm()}
          footer={<>
            <button onClick={closeForm} disabled={saving} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            <button onClick={saveForm} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
          </>}>
          {formError && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Provider</label>
              <select value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} disabled={formOpen.mode === 'edit'} className={INPUT_CLASS}>
                {supported.map(sp => <option key={sp.provider} value={sp.provider}>{sp.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Integration Type</label>
              <input value={supported.find(sp => sp.provider === form.provider)?.type_label || ''} readOnly className={`${INPUT_CLASS} bg-gray-50 text-gray-500`} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Name <span className="text-gray-400 font-normal">(optional)</span></label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Production key" className={INPUT_CLASS} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                API Key {formOpen.mode === 'create' && <span className="text-red-500">*</span>}
              </label>
              <input type="password" autoComplete="off" value={form.credential} onChange={e => setForm(f => ({ ...f, credential: e.target.value }))}
                placeholder={formOpen.mode === 'edit' ? `Leave blank to keep ${formOpen.integration.credential_hint}` : 'Paste the provider API key'} className={INPUT_CLASS} />
              <p className="text-[11px] text-gray-400 mt-1">Stored encrypted on the server. It is never shown again — only a masked hint.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={INPUT_CLASS}>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
              {form.status === 'active' && <p className="text-[11px] text-gray-400 mt-1">Making this active replaces any other active key for this provider.</p>}
            </div>
          </div>
        </Modal>
      )}

      {confirmAction && (
        <Modal title={confirmAction.kind === 'delete' ? 'Delete AI Integration?' : confirmAction.kind === 'disable' ? 'Disable AI Integration?' : 'Enable AI Integration?'}
          onClose={() => !actionBusy && setConfirmAction(null)}
          footer={<>
            <button onClick={() => setConfirmAction(null)} disabled={actionBusy} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            <button onClick={runConfirmed} disabled={actionBusy}
              className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 ${confirmAction.kind === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              {actionBusy ? 'Working…' : confirmAction.kind === 'delete' ? 'Delete' : confirmAction.kind === 'disable' ? 'Disable' : 'Enable'}
            </button>
          </>}>
          {actionError && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{actionError}</div>}
          <p className="text-sm text-gray-600">
            {confirmAction.kind === 'delete' && 'This removes the stored key. AI features fall back to the server environment key, or stop working if none is set.'}
            {confirmAction.kind === 'disable' && 'AI features will stop using this key. They fall back to the server environment key, or stop working if none is set.'}
            {confirmAction.kind === 'enable' && 'AI features will start using this key immediately.'}
          </p>
          <p className="text-xs text-gray-400 mt-2">{confirmAction.integration.name} · {confirmAction.integration.credential_hint}</p>
        </Modal>
      )}

      {detail && (
        <>
          <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setDetail(null)} />
          <aside className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-40 shadow-xl">
            <div className="flex items-center justify-between px-5 h-16 border-b">
              <h3 className="font-semibold text-gray-900">{providerLabel(detail.name)}</h3>
              <button onClick={() => setDetail(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={18} /></button>
            </div>
            <dl className="p-5 text-sm divide-y">
              {[
                ['Type', detail.type],
                ['Status', <Pill key="s" on={detail.status === 'connected'} onLabel="Connected" offLabel="Not configured" />],
                ['Organizations', detail.organizations],
                ['Usage', detail.usage ? `${fmtNumber(detail.usage)} ${detail.usage_unit}` : '—'],
                ['Last Activity', detail.last_sync ? fmtDateTime(detail.last_sync) : '—'],
                ['Credential Source', detail.credential_source === 'integration' ? 'Managed integration' : detail.credential_source === 'environment' ? 'Server environment' : detail.key === 'groq' ? 'None yet' : 'Set per organization'],
                ...(detail.integration ? [
                  ['API Key', detail.integration.credential_hint],
                  ['Last Test', detail.integration.last_tested_at ? `${detail.integration.last_test_ok ? 'Passed' : 'Failed'} · ${fmtDateTime(detail.integration.last_tested_at)}` : 'Not tested yet'],
                ] : []),
                ['Secrets', 'Full keys are never displayed'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-800 text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </>
      )}
    </div>
  );
};

export default SuperAdminAiAgentPage;
