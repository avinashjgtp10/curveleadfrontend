import { useEffect, useState } from 'react';
import { staffAPI, teamAPI } from '../services/api';
import { Plus, UserCog, X, Trash2, Users, Edit2, Mail, RotateCcw } from 'lucide-react';

const StaffPage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'staff', team_id: '' });

  const [teams, setTeams] = useState([]);
  const [teamModal, setTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamForm, setTeamForm] = useState({ name: '' });

  const [invitations, setInvitations] = useState([]);

  useEffect(() => { loadData(); loadTeams(); loadInvitations(); }, []);

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
    if (!teamForm.name.trim()) return alert('Team name is required');
    try {
      if (editingTeam) await teamAPI.update(editingTeam.id, teamForm);
      else await teamAPI.create(teamForm);
      setTeamModal(false);
      loadTeams();
    } catch (e) { alert(e.response?.data?.error || 'Failed to save team'); }
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm('Delete this team? Members will be unassigned, not removed.')) return;
    try { await teamAPI.delete(id); loadTeams(); loadData(); } catch (e) { alert('Failed to delete'); }
  };

  const handleAssignTeam = async (staffId, teamId) => {
    try {
      await staffAPI.update(staffId, { team_id: teamId });
      loadData();
    } catch (e) { alert(e.response?.data?.error || 'Failed to assign team'); }
  };

  const loadInvitations = async () => {
    try {
      const { data } = await staffAPI.getInvitations();
      setInvitations(data.invitations || []);
    } catch (e) { console.error(e); }
  };

  const handleInvite = async () => {
    if (!form.name || !form.email) return alert('Name and email are required');
    try {
      await staffAPI.invite({ ...form, team_id: form.team_id || undefined });
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', role: 'staff', team_id: '' });
      loadInvitations();
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const handleResendInvite = async (id) => {
    try { await staffAPI.resendInvitation(id); loadInvitations(); alert('Invite resent.'); }
    catch (e) { alert(e.response?.data?.error || 'Failed to resend'); }
  };

  const handleRevokeInvite = async (id) => {
    if (!window.confirm('Revoke this invitation?')) return;
    try { await staffAPI.revokeInvitation(id); loadInvitations(); }
    catch (e) { alert('Failed to revoke'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this team member?')) return;
    try { await staffAPI.delete(id); loadData(); } catch (e) { alert('Failed'); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Manage your team members</p>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 flex items-center gap-2">
          <Plus size={16} /> Add Member
        </button>
      </div>

      <div className="bg-white rounded-2xl border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><Users size={16} /> Teams</h2>
          <button onClick={openCreateTeam} className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700">
            <Plus size={13} /> New Team
          </button>
        </div>
        {teams.length === 0 ? (
          <p className="text-xs text-gray-400">No teams yet — group staff by branch, location, or specialty.</p>
        ) : (
          <div className="space-y-1.5">
            {teams.map(t => (
              <div key={t.id} className="flex items-center justify-between px-3 py-2 border rounded-lg">
                <div>
                  <span className="text-sm font-medium">{t.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{t.member_count} member{t.member_count === '1' ? '' : 's'}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditTeam(t)} className="p-1 hover:bg-gray-100 rounded"><Edit2 size={12} /></button>
                  <button onClick={() => handleDeleteTeam(t.id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {invitations.length > 0 && (
        <div className="bg-white rounded-2xl border p-5 space-y-2">
          <h2 className="font-semibold flex items-center gap-2"><Mail size={16} /> Pending Invitations</h2>
          {invitations.map(inv => (
            <div key={inv.id} className="flex items-center justify-between px-3 py-2 border rounded-lg">
              <div>
                <p className="text-sm font-medium">{inv.name || inv.email}</p>
                <p className="text-xs text-gray-400">{inv.email} · {inv.role}{inv.team_name ? ` · ${inv.team_name}` : ''} · expires {new Date(inv.expires_at).toLocaleDateString('en-IN')}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleResendInvite(inv.id)} className="p-1.5 hover:bg-gray-100 rounded" title="Resend"><RotateCcw size={13} /></button>
                <button onClick={() => handleRevokeInvite(inv.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Revoke"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
      ) : staff.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <UserCog size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No team members yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border divide-y">
          {staff.map(s => (
            <div key={s.id} className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                <span className="text-brand-700 font-semibold text-sm">{s.name?.charAt(0)?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{s.name}</p>
                <p className="text-xs text-gray-500">{s.email}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 capitalize">{s.role}</span>
              <select value={s.team_id || ''} onChange={e => handleAssignTeam(s.id, e.target.value)}
                className="text-xs border rounded-lg px-2 py-1.5 bg-white text-gray-600 max-w-[140px]">
                <option value="">No team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {s.role !== 'admin' && (
                <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={14} /></button>
              )}
            </div>
          ))}
        </div>
      )}

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
              <input type="text" placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <input type="email" placeholder="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              <select value={form.team_id} onChange={e => setForm({ ...form, team_id: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                <option value="">No team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
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
              <input type="text" placeholder="Team name (e.g. Baramati Branch)" value={teamForm.name}
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
    </div>
  );
};

export default StaffPage;
