import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Shuffle, ArrowUp, ArrowDown, X } from 'lucide-react';
import { staffAPI, teamAPI, campaignAPI, automationAPI, assignmentRuleAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';

const SOURCE_OPTIONS = ['meta_ads', 'google_ads', 'whatsapp', 'referral', 'manual', 'website', 'walkin'];

const AssignmentRulesSection = () => {
  const { user } = useAuth();
  const confirm = useConfirmDialog();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';

  const [rules, setRules] = useState([]);
  const [staff, setStaff] = useState([]);
  const [teams, setTeams] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [sequences, setSequences] = useState([]);
  const [ruleModal, setRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const emptyRuleForm = { name: '', sources: [], campaign_ids: [], location_contains: '', target_type: 'user', assign_to_user_id: '', assign_to_team_id: '', sequence_id: '' };
  const [ruleForm, setRuleForm] = useState(emptyRuleForm);
  const [ruleErrors, setRuleErrors] = useState({});

  useEffect(() => { loadRules(); loadStaff(); loadTeams(); loadCampaigns(); loadSequences(); }, []);

  const loadRules = async () => {
    try { const { data } = await assignmentRuleAPI.getAll(); setRules(data.rules || []); }
    catch (e) { console.error(e); }
  };

  const loadStaff = async () => {
    try { const { data } = await staffAPI.getAll(); setStaff(data.staff || []); }
    catch (e) { console.error(e); }
  };

  const loadTeams = async () => {
    try { const { data } = await teamAPI.getAll(); setTeams(data.teams || []); }
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
    const confirmed = rule.is_active
      ? await confirm({
          title: `Pause "${rule.name}"?`,
          message: 'New leads matching this rule will stop being auto-assigned until you reactivate it.',
          confirmText: 'Pause',
          destructive: false,
        })
      : await confirm({
          title: `Activate "${rule.name}"?`,
          message: 'New leads matching this rule will start being auto-assigned again.',
          confirmText: 'Activate',
          destructive: false,
        });
    if (!confirmed) return;
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Shuffle size={18} className="text-brand-600" /> Lead Assignment Rules</h2>
          <p className="text-xs text-gray-400 mt-0.5">Auto-assign new leads to a person or team based on source, campaign, or location.</p>
        </div>
        {isAdmin && (
          <button onClick={openCreateRule}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 whitespace-nowrap">
            <Plus size={14} /> New Rule
          </button>
        )}
      </div>

      {rules.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No rules yet — auto-assign new leads to a person or team based on source, campaign, or location.</p>
      ) : (
        <div className="space-y-2">
          {rules.map((r, i) => (
            <div key={r.id} className={`border rounded-xl p-4 ${r.is_active ? '' : 'opacity-50'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-sm font-semibold">{r.name}</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {r.sources?.length ? `source: ${r.sources.join(', ')}` : 'any source'}
                    {r.location_contains ? ` · location: "${r.location_contains}"` : ''}
                    {' → '}{r.assign_to_user_name || r.assign_to_team_name}
                    {r.sequence_name ? ` · starts "${r.sequence_name}"` : ''}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => moveRule(i, -1)} disabled={i === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ArrowUp size={12} /></button>
                    <button onClick={() => moveRule(i, 1)} disabled={i === rules.length - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ArrowDown size={12} /></button>
                    <button onClick={() => handleToggleRule(r)} className="text-[10px] font-semibold px-2 py-1 rounded-full border">
                      {r.is_active ? 'Active' : 'Paused'}
                    </button>
                    <button onClick={() => openEditRule(r)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 size={13} /></button>
                    <button onClick={() => handleDeleteRule(r.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
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

export default AssignmentRulesSection;
