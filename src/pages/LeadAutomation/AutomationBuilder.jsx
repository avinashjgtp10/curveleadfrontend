import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Clock, Power } from 'lucide-react';
import { automationAPI, stageAPI, statusAPI, campaignAPI, templateAPI, whatsappAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';

const emptyStep = () => ({ channel: 'whatsapp', delay_minutes: 0, message: '', email_subject: '', approved_template_name: '', ai_generated: false, ai_instructions: '' });

const SOURCE_OPTIONS = ['manual', 'website', 'meta_ads', 'google_ads', 'whatsapp', 'referral', 'walkin'];

const TRIGGER_LABEL = (r, campaigns) => {
  if (r.trigger_type === 'new_lead') return 'New lead received';
  if (r.trigger_type === 'campaign') return `Campaign → ${campaigns.find(c => c.id === r.campaign_id)?.name || 'Unknown'}`;
  if (r.trigger_type === 'lead_source') return `Source → ${r.source_value}`;
  if (r.trigger_type === 'lead_status') return `Status → ${r.status_value}`;
  return `Stage → ${r.stage_name}`;
};

// Quick-start presets — common real-world automations built from the two
// trigger types and two step channels the backend actually supports today.
// Picking one pre-fills both the New Sequence and New Rule forms.
const SCENARIO_PRESETS = [
  {
    label: 'Welcome new leads',
    description: 'Send an instant WhatsApp greeting the moment a lead comes in.',
    sequence: { name: 'New Lead Welcome', description: 'Instant greeting for every new lead.', steps: [
      { channel: 'whatsapp', delay_minutes: 0, message: 'Hi {{name}}, thanks for reaching out! We’ll get back to you shortly.', email_subject: '' },
    ] },
    rule: { name: 'Welcome new leads', trigger_type: 'new_lead', stage_name: '' },
  },
  {
    label: 'Nudge leads stuck in a stage',
    description: 'Follow up a lead a few hours after they reach a given stage.',
    sequence: { name: 'Stage Follow-up', description: 'Check in after a lead reaches a stage.', steps: [
      { channel: 'whatsapp', delay_minutes: 180, message: 'Hi {{name}}, just checking in — do you have any questions so far?', email_subject: '' },
    ] },
    rule: { name: 'Follow up in stage', trigger_type: 'stage_change', stage_name: '' },
  },
  {
    label: 'Multi-touch nurture',
    description: 'A same-day WhatsApp message followed by a next-day email.',
    sequence: { name: 'New Lead Nurture', description: 'WhatsApp on day 0, email on day 1.', steps: [
      { channel: 'whatsapp', delay_minutes: 0, message: 'Hi {{name}}, thanks for your interest! We’ll follow up with more details soon.', email_subject: '' },
      { channel: 'email', delay_minutes: 1440, message: 'Hi {{name}}, following up on your enquiry — happy to answer any questions.', email_subject: 'Following up on your enquiry' },
    ] },
    rule: { name: 'New lead nurture', trigger_type: 'new_lead', stage_name: '' },
  },
];

const AutomationBuilder = () => {
  const { user } = useAuth();
  const confirm = useConfirmDialog();
  const toast = useToast();

  const [sequences, setSequences] = useState([]);
  const [seqModal, setSeqModal] = useState(false);
  const [editingSeq, setEditingSeq] = useState(null);
  const [seqForm, setSeqForm] = useState({ name: '', description: '', steps: [emptyStep()] });
  const [seqErrors, setSeqErrors] = useState({});

  const [rules, setRules] = useState([]);
  const [ruleModal, setRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({ name: '', trigger_type: 'new_lead', stage_name: '', campaign_id: '', source_value: '', status_value: '', sequence_id: '' });
  const [ruleErrors, setRuleErrors] = useState({});

  const [stages, setStages] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [pendingRulePreset, setPendingRulePreset] = useState(null);
  const [messageTemplates, setMessageTemplates] = useState([]);
  const [approvedTemplates, setApprovedTemplates] = useState([]);

  useEffect(() => { loadSequences(); loadRules(); loadStages(); loadCampaigns(); loadMessageTemplates(); loadApprovedTemplates(); loadLeadStatuses(); }, []);

  const loadLeadStatuses = async () => {
    try {
      const { data } = await statusAPI.getAll();
      setLeadStatuses(data.statuses || []);
    } catch (e) { console.error(e); }
  };

  const loadMessageTemplates = async () => {
    try {
      const { data } = await templateAPI.getAll();
      setMessageTemplates(data.templates || []);
    } catch (e) { console.error(e); }
  };

  // Meta-approved WhatsApp templates — same source the Broadcast picker uses.
  // Fails silently (WhatsApp not connected yet, or no permission): the step
  // editor just falls back to manual entry for approved_template_name.
  const loadApprovedTemplates = async () => {
    try {
      const { data } = await whatsappAPI.getBroadcastTemplates();
      setApprovedTemplates((data.templates || []).filter(t => t.status === 'APPROVED'));
    } catch (e) { /* not connected / not permitted — picker stays empty */ }
  };

  const loadSequences = async () => {
    try {
      const { data } = await automationAPI.getSequences();
      setSequences(data.sequences || []);
    } catch (e) { console.error(e); }
  };

  const loadRules = async () => {
    try {
      const { data } = await automationAPI.getRules();
      setRules(data.rules || []);
    } catch (e) { console.error(e); }
  };

  const loadStages = async () => {
    try {
      const { data } = await statusAPI.byStage();
      setStages(data.stages || []);
    } catch {
      try {
        const { data } = await stageAPI.getAll();
        setStages((data.stages || []).map(s => ({ ...s, statuses: [] })));
      } catch (e) { console.error(e); }
    }
  };

  const loadCampaigns = async () => {
    try {
      const { data } = await campaignAPI.getAll();
      setCampaigns(data.campaigns || []);
    } catch (e) { console.error(e); }
  };

  const openCreateSeq = (preset) => {
    setEditingSeq(null);
    setSeqForm(preset ? { ...preset, steps: preset.steps.map(s => ({ ...s })) } : { name: '', description: '', steps: [emptyStep()] });
    setSeqErrors({});
    setSeqModal(true);
  };

  const openEditSeq = (s) => {
    setEditingSeq(s);
    setSeqForm({
      name: s.name, description: s.description || '',
      steps: s.steps?.length ? s.steps.map(st => ({
        ...st,
        email_subject: st.email_subject || '',
        approved_template_name: st.approved_template_name || '',
        ai_generated: st.ai_generated || false,
        ai_instructions: st.ai_instructions || '',
      })) : [emptyStep()],
    });
    setSeqErrors({});
    setSeqModal(true);
  };

  const updateStep = (idx, patch) => {
    setSeqForm(f => ({ ...f, steps: f.steps.map((s, i) => i === idx ? { ...s, ...patch } : s) }));
    if ((patch.message?.trim() || patch.ai_generated) && seqErrors.steps) setSeqErrors(er => ({ ...er, steps: undefined }));
  };
  const addStep = () => setSeqForm(f => ({ ...f, steps: [...f.steps, emptyStep()] }));
  const removeStep = (idx) => setSeqForm(f => ({ ...f, steps: f.steps.filter((_, i) => i !== idx) }));

  const handleSaveSeq = async () => {
    const errors = {};
    if (!seqForm.name.trim()) errors.name = 'Sequence name is required';
    if (!seqForm.steps.some(s => s.ai_generated || s.message.trim())) errors.steps = 'At least one step needs a message';
    setSeqErrors(errors);
    if (Object.keys(errors).length) return;
    try {
      let sequenceId = editingSeq?.id;
      if (editingSeq) {
        await automationAPI.updateSequence(editingSeq.id, seqForm);
      } else {
        const { data } = await automationAPI.createSequence(seqForm);
        sequenceId = data.id;
      }
      setSeqModal(false);
      await loadSequences();
      toast.success(editingSeq ? 'Sequence updated.' : 'Sequence created.');
      // If this sequence was created from a scenario preset, immediately open
      // the matching rule prefilled and pointed at the new sequence.
      if (pendingRulePreset && sequenceId) {
        openCreateRule({ ...pendingRulePreset, sequence_id: sequenceId });
        setPendingRulePreset(null);
      }
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save sequence'); }
  };

  const handleDeleteSeq = async (id) => {
    if (!await confirm({ title: 'Delete this sequence?', message: 'Rules pointing to it will also be deleted.' })) return;
    try {
      await automationAPI.deleteSequence(id);
      loadSequences();
      loadRules();
    } catch (e) { toast.error('Failed to delete'); }
  };

  const openCreateRule = (preset) => {
    setEditingRule(null);
    setRuleForm(preset
      ? { name: preset.name, trigger_type: preset.trigger_type, stage_name: preset.stage_name || '', campaign_id: preset.campaign_id || '', source_value: preset.source_value || '', status_value: preset.status_value || '', sequence_id: preset.sequence_id || sequences[0]?.id || '' }
      : { name: '', trigger_type: 'new_lead', stage_name: '', campaign_id: '', source_value: '', status_value: '', sequence_id: sequences[0]?.id || '' });
    setRuleErrors({});
    setRuleModal(true);
  };

  const openEditRule = (r) => {
    setEditingRule(r);
    setRuleForm({ name: r.name, trigger_type: r.trigger_type, stage_name: r.stage_name || '', campaign_id: r.campaign_id || '', source_value: r.source_value || '', status_value: r.status_value || '', sequence_id: r.sequence_id });
    setRuleErrors({});
    setRuleModal(true);
  };

  const handleSaveRule = async () => {
    const errs = {};
    if (!ruleForm.name.trim()) errs.name = 'Rule name is required';
    if (ruleForm.trigger_type === 'stage_change' && !ruleForm.stage_name) errs.stage_name = 'Pick which stage triggers this rule';
    if (ruleForm.trigger_type === 'campaign' && !ruleForm.campaign_id) errs.campaign_id = 'Pick which campaign triggers this rule';
    if (ruleForm.trigger_type === 'lead_source' && !ruleForm.source_value) errs.source_value = 'Pick which source triggers this rule';
    if (ruleForm.trigger_type === 'lead_status' && !ruleForm.status_value) errs.status_value = 'Pick which status triggers this rule';
    if (!ruleForm.sequence_id) errs.sequence_id = 'Pick a sequence for this rule to enroll leads into';
    setRuleErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      if (editingRule) {
        await automationAPI.updateRule(editingRule.id, ruleForm);
      } else {
        await automationAPI.createRule(ruleForm);
      }
      setRuleModal(false);
      loadRules();
      toast.success(editingRule ? 'Rule updated.' : 'Rule created.');
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save rule'); }
  };

  const toggleSeqActive = async (s) => {
    try {
      await automationAPI.updateSequence(s.id, { is_active: !s.is_active });
      loadSequences();
    } catch (e) { toast.error('Failed to update'); }
  };

  const toggleRuleActive = async (r) => {
    try {
      await automationAPI.updateRule(r.id, { is_active: !r.is_active });
      loadRules();
    } catch (e) { toast.error('Failed to update'); }
  };

  const handleDeleteRule = async (id) => {
    if (!await confirm({ title: 'Delete this rule?' })) return;
    try {
      await automationAPI.deleteRule(id);
      loadRules();
    } catch (e) { toast.error('Failed to delete'); }
  };

  const useScenario = (scenario) => {
    setPendingRulePreset(scenario.rule);
    openCreateSeq(scenario.sequence);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Quick Start</h2>
            <p className="text-xs text-gray-400 mt-0.5">Common automations, ready to customize — pick one to prefill a sequence and its trigger rule.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {SCENARIO_PRESETS.map(sc => (
            <button key={sc.label} onClick={() => useScenario(sc)} disabled={!isAdmin}
              className="text-left border rounded-xl p-3.5 hover:border-brand-300 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <p className="font-semibold text-sm text-gray-800">{sc.label}</p>
              <p className="text-xs text-gray-500 mt-1">{sc.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Sequences</h2>
            <p className="text-xs text-gray-400 mt-0.5">Multi-step WhatsApp/email nurture sequences — build these first, then attach a trigger rule below.</p>
          </div>
          {isAdmin && (
            <button onClick={() => openCreateSeq()}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 whitespace-nowrap">
              <Plus size={14} /> New Sequence
            </button>
          )}
        </div>

        {sequences.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No sequences yet. Create one to get started.</p>
        ) : (
          <div className="space-y-2">
            {sequences.map(s => (
              <div key={s.id} className="border rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">{s.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 text-brand-700">{s.steps?.length || 0} step{s.steps?.length === 1 ? '' : 's'}</span>
                      {isAdmin ? (
                        <button onClick={() => toggleSeqActive(s)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${s.is_active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                          <Power size={9} /> {s.is_active ? 'Active' : 'Inactive'}
                        </button>
                      ) : (
                        !s.is_active && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">Inactive</span>
                      )}
                    </div>
                    {s.description && <p className="text-xs text-gray-500 line-clamp-2">{s.description}</p>}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEditSeq(s)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 size={13} /></button>
                      <button onClick={() => handleDeleteSeq(s.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Automated Triggers</h2>
            <p className="text-xs text-gray-400 mt-0.5">Rules that automatically enroll a lead into a sequence when something happens.</p>
          </div>
          {isAdmin && (
            <button onClick={() => openCreateRule()} disabled={!sequences.length}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
              <Plus size={14} /> New Rule
            </button>
          )}
        </div>

        {rules.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            {sequences.length ? 'No trigger rules yet.' : 'Create a sequence first, then add a rule to trigger it.'}
          </p>
        ) : (
          <div className="space-y-2">
            {rules.map(r => (
              <div key={r.id} className="border rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">{r.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
                        {TRIGGER_LABEL(r, campaigns)}
                      </span>
                      {isAdmin ? (
                        <button onClick={() => toggleRuleActive(r)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${r.is_active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                          <Power size={9} /> {r.is_active ? 'Active' : 'Inactive'}
                        </button>
                      ) : (
                        !r.is_active && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Enrolls into <span className="font-medium">{r.sequence_name}</span></p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEditRule(r)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 size={13} /></button>
                      <button onClick={() => handleDeleteRule(r.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {seqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl">
            <h3 className="font-bold text-base mb-4">{editingSeq ? 'Edit Sequence' : 'New Sequence'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name <span className="text-red-500">*</span></label>
                <input value={seqForm.name} onChange={e => { setSeqForm({ ...seqForm, name: e.target.value }); if (seqErrors.name) setSeqErrors(er => ({ ...er, name: undefined })); }}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm ${seqErrors.name ? 'border-red-500' : ''}`} placeholder="e.g. New Lead Intro Sequence" />
                {seqErrors.name && <p className="text-xs text-red-500 mt-1">{seqErrors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <input value={seqForm.description} onChange={e => setSeqForm({ ...seqForm, description: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm" placeholder="Optional — what this sequence is for" />
              </div>

              <div className="pt-2">
                <label className="block text-xs font-medium text-gray-500 mb-2">Steps</label>
                <div className="space-y-3">
                  {seqForm.steps.map((step, idx) => (
                    <div key={idx} className="border rounded-xl p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-600">Step {idx + 1}</span>
                        {seqForm.steps.length > 1 && (
                          <button onClick={() => removeStep(idx)} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 size={12} /></button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="block text-[10px] font-medium text-gray-400 mb-1">Channel</label>
                          <select value={step.channel} onChange={e => updateStep(idx, { channel: e.target.value })}
                            className="w-full px-2.5 py-2 border rounded-lg text-xs bg-white">
                            <option value="whatsapp">WhatsApp</option>
                            <option value="email">Email</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-gray-400 mb-1 flex items-center gap-1"><Clock size={10} /> Delay after previous step (minutes)</label>
                          <input type="number" min="0" value={step.delay_minutes || ''}
                            onChange={e => updateStep(idx, { delay_minutes: parseInt(e.target.value, 10) || 0 })}
                            onFocus={e => e.target.select()}
                            className="w-full px-2.5 py-2 border rounded-lg text-xs" placeholder="0" />
                        </div>
                      </div>
                      {step.channel === 'email' && (
                        <input value={step.email_subject} onChange={e => updateStep(idx, { email_subject: e.target.value })}
                          className="w-full px-2.5 py-2 border rounded-lg text-xs mb-2" placeholder="Email subject" />
                      )}
                      {step.channel === 'whatsapp' && (
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-2 cursor-pointer">
                          <input type="checkbox" checked={!!step.ai_generated}
                            onChange={e => updateStep(idx, { ai_generated: e.target.checked })} />
                          Let AI write this message
                        </label>
                      )}
                      {step.channel === 'whatsapp' && step.ai_generated ? (
                        <>
                          <label className="block text-[10px] font-medium text-gray-400 mb-1">Instructions for the AI (optional)</label>
                          <textarea value={step.ai_instructions} onChange={e => updateStep(idx, { ai_instructions: e.target.value })}
                            rows={3} className="w-full px-2.5 py-2 border rounded-lg text-xs"
                            placeholder="e.g. mention our new autumn discount, keep it under 3 lines, casual tone" />
                          <p className="text-[10px] text-gray-400 mt-1">
                            AI writes the actual message using this guidance plus the lead's own conversation. Applies only within the 24h WhatsApp session window — outside it, the approved template below (if set) is sent instead, unchanged.
                          </p>
                        </>
                      ) : (
                        <>
                          {messageTemplates.filter(t => t.channel === step.channel).length > 0 && (
                            <select value="" onChange={e => {
                              const tmpl = messageTemplates.find(t => String(t.id) === e.target.value);
                              if (tmpl) updateStep(idx, { message: tmpl.message });
                            }} className="w-full px-2.5 py-2 border rounded-lg text-xs bg-white mb-2">
                              <option value="">Insert saved template...</option>
                              {messageTemplates.filter(t => t.channel === step.channel).map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          )}
                          <textarea value={step.message} onChange={e => updateStep(idx, { message: e.target.value })}
                            rows={3} className="w-full px-2.5 py-2 border rounded-lg text-xs font-mono"
                            placeholder={'Hi {{name}}, ...'} />
                        </>
                      )}
                      {step.channel === 'whatsapp' && (
                        <div className="mt-2">
                          {approvedTemplates.length > 0 ? (
                            <select value={step.approved_template_name || ''} onChange={e => updateStep(idx, { approved_template_name: e.target.value })}
                              className="w-full px-2.5 py-2 border rounded-lg text-xs bg-white">
                              <option value="">No fallback template</option>
                              {approvedTemplates.map(t => (
                                <option key={`${t.name}::${t.language}`} value={t.name}>{t.name} ({t.language})</option>
                              ))}
                            </select>
                          ) : (
                            <input value={step.approved_template_name || ''} onChange={e => updateStep(idx, { approved_template_name: e.target.value })}
                              className="w-full px-2.5 py-2 border rounded-lg text-xs" placeholder="Approved template name (optional fallback)" />
                          )}
                          <p className="text-[10px] text-gray-400 mt-1">
                            Used only if this step would send after 24h+ of silence — WhatsApp requires a pre-approved template at that point, not free text.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addStep} className="mt-2 flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700">
                  <Plus size={13} /> Add Step
                </button>
                {seqErrors.steps && <p className="text-xs text-red-500 mt-2">{seqErrors.steps}</p>}
                <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                  Variables:{' '}
                  {['{{name}}', '{{phone}}', '{{email}}', '{{city}}', '{{source}}'].map(v => (
                    <code key={v} className="bg-gray-100 px-1 rounded mr-1">{v}</code>
                  ))}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setSeqModal(false); setPendingRulePreset(null); }} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveSeq} className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700">
                {editingSeq ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {ruleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-lg shadow-xl">
            <h3 className="font-bold text-base mb-4">{editingRule ? 'Edit Rule' : 'New Rule'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name <span className="text-red-500">*</span></label>
                <input value={ruleForm.name}
                  onChange={e => { setRuleForm({ ...ruleForm, name: e.target.value }); if (ruleErrors.name) setRuleErrors(er => ({ ...er, name: undefined })); }}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm ${ruleErrors.name ? 'border-red-500' : ''}`} placeholder="e.g. Welcome new leads" />
                {ruleErrors.name && <p className="text-xs text-red-500 mt-1">{ruleErrors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">When...</label>
                <select value={ruleForm.trigger_type} onChange={e => setRuleForm({ ...ruleForm, trigger_type: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                  <option value="new_lead">A new lead is received</option>
                  <option value="stage_change">A lead moves into a stage</option>
                  <option value="campaign">A lead comes from a specific campaign</option>
                  <option value="lead_source">A lead comes from a specific source</option>
                  <option value="lead_status">A lead's status changes to a specific status</option>
                </select>
              </div>
              {ruleForm.trigger_type === 'stage_change' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Stage</label>
                  <select value={ruleForm.stage_name}
                    onChange={e => { setRuleForm({ ...ruleForm, stage_name: e.target.value }); if (ruleErrors.stage_name) setRuleErrors(er => ({ ...er, stage_name: undefined })); }}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white ${ruleErrors.stage_name ? 'border-red-500' : ''}`}>
                    <option value="">Select a stage...</option>
                    {stages.map(s => <option key={s.id || s.name} value={s.name}>{s.name}</option>)}
                  </select>
                  {ruleErrors.stage_name && <p className="text-xs text-red-500 mt-1">{ruleErrors.stage_name}</p>}
                </div>
              )}
              {ruleForm.trigger_type === 'campaign' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Campaign</label>
                  <select value={ruleForm.campaign_id}
                    onChange={e => { setRuleForm({ ...ruleForm, campaign_id: e.target.value }); if (ruleErrors.campaign_id) setRuleErrors(er => ({ ...er, campaign_id: undefined })); }}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white ${ruleErrors.campaign_id ? 'border-red-500' : ''}`}>
                    <option value="">Select a campaign...</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {ruleErrors.campaign_id && <p className="text-xs text-red-500 mt-1">{ruleErrors.campaign_id}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">Takes priority over a "new lead" rule for leads from this campaign — only this sequence will fire.</p>
                </div>
              )}
              {ruleForm.trigger_type === 'lead_source' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Source</label>
                  <select value={ruleForm.source_value}
                    onChange={e => { setRuleForm({ ...ruleForm, source_value: e.target.value }); if (ruleErrors.source_value) setRuleErrors(er => ({ ...er, source_value: undefined })); }}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white ${ruleErrors.source_value ? 'border-red-500' : ''}`}>
                    <option value="">Select a source...</option>
                    {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                  {ruleErrors.source_value && <p className="text-xs text-red-500 mt-1">{ruleErrors.source_value}</p>}
                </div>
              )}
              {ruleForm.trigger_type === 'lead_status' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select value={ruleForm.status_value}
                    onChange={e => { setRuleForm({ ...ruleForm, status_value: e.target.value }); if (ruleErrors.status_value) setRuleErrors(er => ({ ...er, status_value: undefined })); }}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white ${ruleErrors.status_value ? 'border-red-500' : ''}`}>
                    <option value="">Select a status...</option>
                    {leadStatuses.map(s => <option key={s.id || s.name} value={s.name}>{s.name}</option>)}
                  </select>
                  {ruleErrors.status_value && <p className="text-xs text-red-500 mt-1">{ruleErrors.status_value}</p>}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Enroll into sequence</label>
                <select value={ruleForm.sequence_id}
                  onChange={e => { setRuleForm({ ...ruleForm, sequence_id: e.target.value }); if (ruleErrors.sequence_id) setRuleErrors(er => ({ ...er, sequence_id: undefined })); }}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white ${ruleErrors.sequence_id ? 'border-red-500' : ''}`}>
                  <option value="">Select a sequence...</option>
                  {sequences.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {ruleErrors.sequence_id && <p className="text-xs text-red-500 mt-1">{ruleErrors.sequence_id}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setRuleModal(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveRule} className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700">
                {editingRule ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationBuilder;
