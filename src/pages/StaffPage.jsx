import { useEffect, useState } from 'react';
import { staffAPI, teamAPI, campaignAPI, automationAPI, assignmentRuleAPI } from '../services/api';
import { Plus, UserCog, X, Trash2, Users, Edit2, Mail, RotateCcw, MessageCircle, ArrowUp, ArrowDown, Shuffle, KeyRound, ShieldCheck, MoreVertical } from 'lucide-react';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';

const SOURCE_OPTIONS = ['meta_ads', 'google_ads', 'whatsapp', 'referral', 'manual', 'website', 'walkin'];

const StaffPage = () => {
  const confirm = useConfirmDialog();
  const toast = useToast();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'staff', team_id: '' });
  const [inviteErrors, setInviteErrors] = useState({});

  const [teams, setTeams] = useState([]);
  const [teamModal, setTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamForm, setTeamForm] = useState({ name: '' });

  const [invitations, setInvitations] = useState([]);
  const [openMenuStaffId, setOpenMenuStaffId] = useState(null);

  const [myWhatsApp, setMyWhatsApp] = useState(null);
  const [myWaForm, setMyWaForm] = useState({ whatsapp_phone_number_id: '', whatsapp_access_token: '' });
  const [waModalStaff, setWaModalStaff] = useState(null); // { id, name } — admin editing someone else's number
  const [waForm, setWaForm] = useState({ whatsapp_phone_number_id: '', whatsapp_access_token: '' });

  const [pwModalStaff, setPwModalStaff] = useState(null); // { id, name }
  const [pwForm, setPwForm] = useState({ password: '', confirm: '' });

  const [permModalStaff, setPermModalStaff] = useState(null); // { id, name }
  const [permissions, setPermissions] = useState([]);
  const [permsLoading, setPermsLoading] = useState(false);

  const [rules, setRules] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [sequences, setSequences] = useState([]);
  const [ruleModal, setRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const emptyRuleForm = { name: '', sources: [], campaign_ids: [], location_contains: '', target_type: 'user', assign_to_user_id: '', assign_to_team_id: '', sequence_id: '' };
  const [ruleForm, setRuleForm] = useState(emptyRuleForm);
  const [ruleErrors, setRuleErrors] = useState({});

  useEffect(() => {
    loadData(); loadTeams(); loadInvitations();
    loadMyWhatsApp(); loadRules(); loadCampaigns(); loadSequences();
  }, []);

  const loadMyWhatsApp = async () => {
    try { const { data } = await staffAPI.getMyWhatsAppNumber(); setMyWhatsApp(data); }
    catch (e) { console.error(e); }
  };

  const handleSaveMyWhatsApp = async () => {
    try {
      await staffAPI.updateMyWhatsAppNumber(myWaForm);
      setMyWaForm({ whatsapp_phone_number_id: '', whatsapp_access_token: '' });
      loadMyWhatsApp();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save WhatsApp number'); }
  };

  const openStaffWhatsApp = async (s) => {
    setWaModalStaff(s);
    setWaForm({ whatsapp_phone_number_id: '', whatsapp_access_token: '' });
    try {
      const { data } = await staffAPI.getWhatsAppNumber(s.id);
      setWaForm({ whatsapp_phone_number_id: data.whatsapp_phone_number_id || '', whatsapp_access_token: '' });
    } catch (e) { console.error(e); }
  };

  const handleSaveStaffWhatsApp = async () => {
    try {
      await staffAPI.updateWhatsAppNumber(waModalStaff.id, waForm);
      setWaModalStaff(null);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save WhatsApp number'); }
  };

  const handleToggleActive = async (s) => {
    try { await staffAPI.update(s.id, { is_active: !s.is_active }); loadData(); }
    catch (e) { alert(e.response?.data?.error || 'Failed to update status'); }
  };

  const openPasswordModal = (s) => { setPwModalStaff(s); setPwForm({ password: '', confirm: '' }); };

  const handleSetPassword = async () => {
    if (!pwForm.password || pwForm.password.length < 6) return alert('Password must be at least 6 characters');
    if (pwForm.password !== pwForm.confirm) return alert('Passwords do not match');
    try {
      await staffAPI.setPassword(pwModalStaff.id, pwForm.password);
      setPwModalStaff(null);
    } catch (e) { alert(e.response?.data?.error || 'Failed to update password'); }
  };

  const openPermissionsModal = async (s) => {
    setPermModalStaff(s);
    setPermsLoading(true);
    try {
      const { data } = await staffAPI.getPermissions(s.id);
      setPermissions(data.permissions || []);
    } catch (e) { alert('Failed to load permissions'); setPermModalStaff(null); }
    finally { setPermsLoading(false); }
  };

  const togglePermission = (key) => {
    setPermissions(prev => prev.map(p => p.key === key ? { ...p, granted: !p.granted } : p));
  };

  const handleSavePermissions = async () => {
    try {
      const permsObj = Object.fromEntries(permissions.map(p => [p.key, p.granted]));
      await staffAPI.updatePermissions(permModalStaff.id, permsObj);
      setPermModalStaff(null);
    } catch (e) { alert(e.response?.data?.error || 'Failed to save permissions'); }
  };

  const loadRules = async () => {
    try { const { data } = await assignmentRuleAPI.getAll(); setRules(data.rules || []); }
    catch (e) { console.error(e); }
  };

  const loadCampaigns = async () => {
    try { const { data } = await campaignAPI.getAll(); setCampaigns(data.campaigns || []); }
    catch (e) { console.error(e); }
  };

  const loadSequences = async () => {
    try { const { data } = await automationAPI.getSequences(); setSequences(data.sequences || []); }
    catch (e) { console.error(e); }
  };

  const openCreateRule = () => { setEditingRule(null); setRuleForm(emptyRuleForm); setRuleErrors({}); setRuleModal(true); };

  const openEditRule = (r) => {
    setEditingRule(r);
    setRuleErrors({});
    setRuleForm({
      name: r.name,
      sources: r.sources || [],
      campaign_ids: r.campaign_ids || [],
      location_contains: r.location_contains || '',
      target_type: r.assign_to_team_id ? 'team' : 'user',
      assign_to_user_id: r.assign_to_user_id || '',
      assign_to_team_id: r.assign_to_team_id || '',
      sequence_id: r.sequence_id || '',
    });
    setRuleModal(true);
  };

  const handleSaveRule = async () => {
    const newErrors = {};
    if (!ruleForm.name.trim()) newErrors.name = 'Rule name is required';
    if (ruleForm.target_type === 'user' && !ruleForm.assign_to_user_id) newErrors.target = 'Pick a team member to assign to';
    if (ruleForm.target_type === 'team' && !ruleForm.assign_to_team_id) newErrors.target = 'Pick a team to assign to';
    setRuleErrors(newErrors);
    if (Object.keys(newErrors).length) return;
    const payload = {
      name: ruleForm.name,
      sources: ruleForm.sources,
      campaign_ids: ruleForm.campaign_ids,
      location_contains: ruleForm.location_contains || undefined,
      assign_to_user_id: ruleForm.target_type === 'user' ? ruleForm.assign_to_user_id : undefined,
      assign_to_team_id: ruleForm.target_type === 'team' ? ruleForm.assign_to_team_id : undefined,
      sequence_id: ruleForm.sequence_id || undefined,
    };
    try {
      if (editingRule) await assignmentRuleAPI.update(editingRule.id, payload);
      else await assignmentRuleAPI.create(payload);
      setRuleModal(false);
      setEditingRule(null);
      loadRules();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save rule'); }
  };

  const handleDeleteRule = async (id) => {
    if (!await confirm({ title: 'Delete this assignment rule?' })) return;
    try { await assignmentRuleAPI.delete(id); loadRules(); } catch (e) { toast.error('Failed to delete'); }
  };

  const handleToggleRule = async (rule) => {
    try { await assignmentRuleAPI.update(rule.id, { is_active: !rule.is_active }); loadRules(); }
    catch (e) { toast.error('Failed to update'); }
  };

  const moveRule = async (index, direction) => {
    const newOrder = [...rules];
    const target = index + direction;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
    setRules(newOrder);
    try { await assignmentRuleAPI.reorder(newOrder.map(r => r.id)); }
    catch (e) { toast.error('Failed to reorder'); loadRules(); }
  };

  const toggleSource = (src) => {
    setRuleForm(f => ({ ...f, sources: f.sources.includes(src) ? f.sources.filter(s => s !== src) : [...f.sources, src] }));
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await staffAPI.getAll();
      setStaff(data.staff || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadTeams = async () => {
    try {
      const { data } = await teamAPI.getAll();
      setTeams(data.teams || []);
    } catch (e) { console.error(e); }
  };

  const openCreateTeam = () => { setEditingTeam(null); setTeamForm({ name: '' }); setTeamModal(true); };
  const openEditTeam = (t) => { setEditingTeam(t); setTeamForm({ name: t.name }); setTeamModal(true); };

  const handleSaveTeam = async () => {
    if (!teamForm.name.trim()) return toast.error('Team name is required');
    try {
      if (editingTeam) await teamAPI.update(editingTeam.id, teamForm);
      else await teamAPI.create(teamForm);
      setTeamModal(false);
      loadTeams();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save team'); }
  };

  const handleDeleteTeam = async (id) => {
    if (!await confirm({ title: 'Delete this team?', message: 'Members will be unassigned, not removed.' })) return;
    try { await teamAPI.delete(id); loadTeams(); loadData(); } catch (e) { toast.error('Failed to delete'); }
  };

  const handleAssignTeam = async (staffId, teamId) => {
    try {
      await staffAPI.update(staffId, { team_id: teamId });
      loadData();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to assign team'); }
  };

  const loadInvitations = async () => {
    try {
      const { data } = await staffAPI.getInvitations();
      setInvitations(data.invitations || []);
    } catch (e) { console.error(e); }
  };

  const handleInvite = async () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) newErrors.email = 'Enter a valid email address';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (form.phone.replace(/\D/g, '').length < 10) newErrors.phone = 'Enter a valid phone number';
    setInviteErrors(newErrors);
    if (Object.keys(newErrors).length) return;
    try {
      await staffAPI.invite({ ...form, team_id: form.team_id || undefined });
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', role: 'staff', team_id: '' });
      setInviteErrors({});
      loadInvitations();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const handleResendInvite = async (id) => {
    try { await staffAPI.resendInvitation(id); loadInvitations(); toast.error('Invite resent.'); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed to resend'); }
  };

  const handleRevokeInvite = async (id) => {
    if (!await confirm({ title: 'Revoke this invitation?', confirmText: 'Revoke' })) return;
    try { await staffAPI.revokeInvitation(id); loadInvitations(); }
    catch (e) { toast.error('Failed to revoke'); }
  };

  const handleDelete = async (id) => {
    if (!await confirm({ title: 'Remove this team member?', confirmText: 'Remove' })) return;
    try { await staffAPI.delete(id); loadData(); } catch (e) { toast.error('Failed'); }
  };

  const activeStaffCount = staff.filter(s => s.is_active !== false).length;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500">Manage your team members, teams, and lead assignment</p>
        </div>
        <button onClick={() => { setInviteErrors({}); setShowModal(true); }}
          className="px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 flex items-center gap-2 shadow-sm">
          <Plus size={16} /> Add Member
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><UserCog size={18} /></div>
          <div>
            <p className="text-lg font-bold leading-none">{staff.length}</p>
            <p className="text-xs text-gray-400 mt-1">Members</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><ShieldCheck size={18} /></div>
          <div>
            <p className="text-lg font-bold leading-none">{activeStaffCount}</p>
            <p className="text-xs text-gray-400 mt-1">Active</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Users size={18} /></div>
          <div>
            <p className="text-lg font-bold leading-none">{teams.length}</p>
            <p className="text-xs text-gray-400 mt-1">Teams</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><MessageCircle size={16} className="text-brand-600" /> My WhatsApp Number</h2>
          {myWhatsApp?.configured && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Connected</span>}
        </div>
        <p className="text-xs text-gray-400 -mt-2">Connect your own WhatsApp Business number so messages to leads assigned to you send from it instead of the shared number.</p>
        <div className="grid grid-cols-2 gap-2">
          <input type="text" placeholder="Phone number ID"
            value={myWaForm.whatsapp_phone_number_id !== '' ? myWaForm.whatsapp_phone_number_id : (myWhatsApp?.whatsapp_phone_number_id || '')}
            onChange={e => setMyWaForm({ ...myWaForm, whatsapp_phone_number_id: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400" />
          <input type="password" placeholder={myWhatsApp?.whatsapp_access_token ? 'Access token (saved — leave blank to keep)' : 'Access token'}
            value={myWaForm.whatsapp_access_token}
            onChange={e => setMyWaForm({ ...myWaForm, whatsapp_access_token: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400" />
        </div>
        <button onClick={handleSaveMyWhatsApp} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700">Save</button>
      </div>

      <div className="bg-white rounded-2xl border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><Users size={16} className="text-amber-600" /> Teams</h2>
          <button onClick={openCreateTeam} className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700">
            <Plus size={13} /> New Team
          </button>
        </div>
        {teams.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-xl">
            <Users size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-400">No teams yet — group staff by branch, location, or specialty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {teams.map(t => (
              <div key={t.id} className="group relative flex flex-col gap-2 p-4 border rounded-xl hover:border-brand-300 hover:shadow-sm transition">
                <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                  <Users size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold truncate">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.member_count} member{t.member_count === '1' ? '' : 's'}</p>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => openEditTeam(t)} className="p-1 bg-white hover:bg-gray-100 rounded shadow-sm border"><Edit2 size={12} /></button>
                  <button onClick={() => handleDeleteTeam(t.id)} className="p-1 bg-white hover:bg-red-50 rounded shadow-sm border text-red-500"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {invitations.length > 0 && (
        <div className="bg-white rounded-2xl border p-5 space-y-2">
          <h2 className="font-semibold flex items-center gap-2"><Mail size={16} className="text-brand-600" /> Pending Invitations</h2>
          <div className="space-y-1.5">
            {invitations.map(inv => (
              <div key={inv.id} className="flex items-center justify-between px-3 py-2.5 border rounded-xl bg-gray-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Mail size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{inv.name || inv.email}</p>
                    <p className="text-xs text-gray-400 truncate">{inv.email} · {inv.role}{inv.team_name ? ` · ${inv.team_name}` : ''} · expires {new Date(inv.expires_at).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleResendInvite(inv.id)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Resend"><RotateCcw size={13} /></button>
                  <button onClick={() => handleRevokeInvite(inv.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500" title="Revoke"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><UserCog size={16} className="text-brand-600" /> Active Members</h2>
        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
        ) : staff.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl">
            <UserCog size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No team members yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {staff.map(s => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 p-3.5 border rounded-xl hover:border-brand-200 hover:bg-gray-50/50 transition">
                <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-brand-700 font-semibold text-sm">{s.name?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.email}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 capitalize">{s.role}</span>
                <button onClick={() => handleToggleActive(s)}
                  className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${s.is_active !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {s.is_active !== false ? 'Active' : 'Inactive'}
                </button>
                <select value={s.team_id || ''} onChange={e => handleAssignTeam(s.id, e.target.value)}
                  className="text-xs border rounded-lg px-2 py-1.5 bg-white text-gray-600 max-w-[140px]">
                  <option value="">No team</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <div className="relative ml-auto">
                  <button onClick={() => setOpenMenuStaffId(openMenuStaffId === s.id ? null : s.id)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500" title="More options">
                    <MoreVertical size={16} />
                  </button>
                  {openMenuStaffId === s.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenuStaffId(null)} />
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white border rounded-xl shadow-lg z-20 py-1">
                        <button onClick={() => { openStaffWhatsApp(s); setOpenMenuStaffId(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <MessageCircle size={14} /> WhatsApp number
                        </button>
                        {s.role !== 'admin' && (
                          <button onClick={() => { openPermissionsModal(s); setOpenMenuStaffId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <ShieldCheck size={14} /> Permissions
                          </button>
                        )}
                        <button onClick={() => { openPasswordModal(s); setOpenMenuStaffId(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <KeyRound size={14} /> Change password
                        </button>
                        {s.role !== 'admin' && (
                          <button onClick={() => { setOpenMenuStaffId(null); handleDelete(s.id); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                            <Trash2 size={14} /> Remove member
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><Shuffle size={16} className="text-brand-600" /> Lead Assignment Rules</h2>
          <button onClick={openCreateRule} className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700">
            <Plus size={13} /> New Rule
          </button>
        </div>
        {rules.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-xl">
            <Shuffle size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-400">No rules yet — auto-assign new leads to a person or team based on source, campaign, or location.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {rules.map((r, i) => (
              <div key={r.id} className={`flex items-center justify-between px-3 py-2.5 border rounded-xl ${r.is_active ? '' : 'opacity-50'}`}>
                <div className="min-w-0">
                  <span className="text-sm font-medium">{r.name}</span>
                  <p className="text-xs text-gray-400 truncate">
                    {r.sources?.length ? `source: ${r.sources.join(', ')}` : 'any source'}
                    {r.location_contains ? ` · location: "${r.location_contains}"` : ''}
                    {' → '}{r.assign_to_user_name || r.assign_to_team_name}
                    {r.sequence_name ? ` · starts "${r.sequence_name}"` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => moveRule(i, -1)} disabled={i === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ArrowUp size={12} /></button>
                  <button onClick={() => moveRule(i, 1)} disabled={i === rules.length - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ArrowDown size={12} /></button>
                  <button onClick={() => handleToggleRule(r)} className="text-[10px] font-semibold px-2 py-1 rounded-full border">
                    {r.is_active ? 'Active' : 'Paused'}
                  </button>
                  <button onClick={() => openEditRule(r)} className="p-1 hover:bg-gray-100 rounded"><Edit2 size={12} /></button>
                  <button onClick={() => handleDeleteRule(r.id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">Invite Team Member</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-gray-500 -mt-1">They'll get an email with a link to set their own password.</p>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.name}
                  onChange={e => { setForm({ ...form, name: e.target.value }); if (inviteErrors.name) setInviteErrors(er => ({ ...er, name: undefined })); }}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm ${inviteErrors.name ? 'border-red-500' : ''}`} />
                {inviteErrors.name && <p className="text-xs text-red-500 mt-1">{inviteErrors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" value={form.email}
                  onChange={e => { setForm({ ...form, email: e.target.value }); if (inviteErrors.email) setInviteErrors(er => ({ ...er, email: undefined })); }}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm ${inviteErrors.email ? 'border-red-500' : ''}`} />
                {inviteErrors.email && <p className="text-xs text-red-500 mt-1">{inviteErrors.email}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone <span className="text-red-500">*</span></label>
                <input type="tel" value={form.phone}
                  onChange={e => { setForm({ ...form, phone: e.target.value }); if (inviteErrors.phone) setInviteErrors(er => ({ ...er, phone: undefined })); }}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm ${inviteErrors.phone ? 'border-red-500' : ''}`} />
                {inviteErrors.phone && <p className="text-xs text-red-500 mt-1">{inviteErrors.phone}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Team</label>
                <select value={form.team_id} onChange={e => setForm({ ...form, team_id: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                  <option value="">No team</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={handleInvite} className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold">Send Invite</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {teamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setTeamModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">{editingTeam ? 'Rename Team' : 'New Team'}</h2>
              <button onClick={() => setTeamModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <input type="text" placeholder="Team name (e.g. Downtown Branch)" value={teamForm.name}
                onChange={e => setTeamForm({ name: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <div className="flex gap-2 pt-2">
                <button onClick={() => setTeamModal(false)} className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={handleSaveTeam} className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold">
                  {editingTeam ? 'Save' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {waModalStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setWaModalStaff(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">{waModalStaff.name}'s WhatsApp Number</h2>
              <button onClick={() => setWaModalStaff(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <input type="text" placeholder="Phone number ID" value={waForm.whatsapp_phone_number_id}
                onChange={e => setWaForm({ ...waForm, whatsapp_phone_number_id: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <input type="password" placeholder="Access token (leave blank to keep existing)" value={waForm.whatsapp_access_token}
                onChange={e => setWaForm({ ...waForm, whatsapp_access_token: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <div className="flex gap-2 pt-2">
                <button onClick={() => setWaModalStaff(null)} className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={handleSaveStaffWhatsApp} className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pwModalStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setPwModalStaff(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">Change {pwModalStaff.name}'s Password</h2>
              <button onClick={() => setPwModalStaff(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <input type="password" placeholder="New password" value={pwForm.password}
                onChange={e => setPwForm({ ...pwForm, password: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <input type="password" placeholder="Confirm password" value={pwForm.confirm}
                onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <div className="flex gap-2 pt-2">
                <button onClick={() => setPwModalStaff(null)} className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={handleSetPassword} className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {permModalStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setPermModalStaff(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">{permModalStaff.name}'s Permissions</h2>
              <button onClick={() => setPermModalStaff(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-2">
              {permsLoading ? (
                <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
              ) : (
                permissions.map(p => (
                  <label key={p.key} className="flex items-center justify-between gap-2 px-3 py-2 border rounded-lg cursor-pointer">
                    <span className="text-sm">{p.label}</span>
                    <input type="checkbox" checked={p.granted} onChange={() => togglePermission(p.key)} className="w-4 h-4" />
                  </label>
                ))
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setPermModalStaff(null)} className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={handleSavePermissions} disabled={permsLoading} className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {ruleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => { setRuleModal(false); setEditingRule(null); setRuleErrors({}); }} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">{editingRule ? 'Edit Assignment Rule' : 'New Assignment Rule'}</h2>
              <button onClick={() => { setRuleModal(false); setEditingRule(null); setRuleErrors({}); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Rule name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. Meta leads → Priya" value={ruleForm.name}
                  onChange={e => { setRuleForm({ ...ruleForm, name: e.target.value }); if (ruleErrors.name) setRuleErrors(er => ({ ...er, name: undefined })); }}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm ${ruleErrors.name ? 'border-red-500' : ''}`} />
                {ruleErrors.name && <p className="text-xs text-red-500 mt-1">{ruleErrors.name}</p>}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Match source (leave blank for any)</p>
                <div className="flex flex-wrap gap-1.5">
                  {SOURCE_OPTIONS.map(src => (
                    <button key={src} type="button" onClick={() => toggleSource(src)}
                      className={`text-xs px-2.5 py-1 rounded-full border ${ruleForm.sources.includes(src) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600'}`}>
                      {src}
                    </button>
                  ))}
                </div>
              </div>

              {campaigns.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Campaigns</label>
                  <select multiple value={ruleForm.campaign_ids}
                    onChange={e => setRuleForm({ ...ruleForm, campaign_ids: Array.from(e.target.selectedOptions, o => o.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white h-24">
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                <input type="text" placeholder="Location contains (e.g. Downtown)" value={ruleForm.location_contains}
                  onChange={e => setRuleForm({ ...ruleForm, location_contains: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Assign to <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <select value={ruleForm.target_type} onChange={e => setRuleForm({ ...ruleForm, target_type: e.target.value })}
                    className="px-3 py-2.5 border rounded-lg text-sm bg-white">
                    <option value="user">Assign to person</option>
                    <option value="team">Round-robin team</option>
                  </select>
                  {ruleForm.target_type === 'user' ? (
                    <select value={ruleForm.assign_to_user_id}
                      onChange={e => { setRuleForm({ ...ruleForm, assign_to_user_id: e.target.value }); if (ruleErrors.target) setRuleErrors(er => ({ ...er, target: undefined })); }}
                      className={`flex-1 px-3 py-2.5 border rounded-lg text-sm bg-white ${ruleErrors.target ? 'border-red-500' : ''}`}>
                      <option value="">Select team member...</option>
                      {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  ) : (
                    <select value={ruleForm.assign_to_team_id}
                      onChange={e => { setRuleForm({ ...ruleForm, assign_to_team_id: e.target.value }); if (ruleErrors.target) setRuleErrors(er => ({ ...er, target: undefined })); }}
                      className={`flex-1 px-3 py-2.5 border rounded-lg text-sm bg-white ${ruleErrors.target ? 'border-red-500' : ''}`}>
                      <option value="">Select team...</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  )}
                </div>
                {ruleErrors.target && <p className="text-xs text-red-500 mt-1">{ruleErrors.target}</p>}
              </div>

              {sequences.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Follow-up sequence</label>
                  <select value={ruleForm.sequence_id} onChange={e => setRuleForm({ ...ruleForm, sequence_id: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                    <option value="">No follow-up sequence</option>
                    {sequences.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={() => { setRuleModal(false); setEditingRule(null); setRuleErrors({}); }} className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={handleSaveRule} className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold">{editingRule ? 'Save' : 'Create'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;
