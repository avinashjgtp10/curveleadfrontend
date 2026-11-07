import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Power, X } from 'lucide-react';
import { automationAPI, stageAPI, statusAPI, campaignAPI, templateAPI, whatsappAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import AssignmentRulesSection from './AssignmentRulesSection';
import SequenceEditor from './SequenceEditor';
import CheckRow from './CheckRow';
import WelcomeStatusCard from '../../components/whatsapp/WelcomeStatusCard';
import { toggleAction, duplicatePayload, stepPayload } from '../../utils/sequenceStatus';
import SequenceList from './SequenceList';
import SequenceResults from './SequenceResults';

const defaultStops = { on_reply: true, demo_booked: false, customer_converted: false };
const emptyStep = () => ({ always_template: false, template_language: '', template_parameters: [], reply_routes: [], channel: 'whatsapp', delay_minutes: 0, delay_unit: 'hours', message: '', email_subject: '', approved_template_name: '', ai_generated: false, ai_instructions: '', media: [], business_hours_only: false });

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

// part: 'automation' = quick start, sequences and triggers only (the WhatsApp tab); otherwise everything, including assignment rules.
const AutomationBuilder = ({ part } = {}) => {
  const { user } = useAuth();
  const confirm = useConfirmDialog();
  const toast = useToast();

  const [sequences, setSequences] = useState([]);
  const [seqModal, setSeqModal] = useState(false);
  const [editingSeq, setEditingSeq] = useState(null);
  const [seqForm, setSeqForm] = useState({ name: '', description: '', is_active: false, stop_conditions: { ...defaultStops }, steps: [emptyStep()] });
  const [seqErrors, setSeqErrors] = useState({});

  const [rules, setRules] = useState([]);
  const [ruleModal, setRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({ name: '', trigger_type: 'new_lead', stage_name: '', campaign_id: '', source_value: '', status_value: '', product_interest: '', is_active: false, sequence_id: '' });
  const [ruleErrors, setRuleErrors] = useState({});

  const [stages, setStages] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [pendingRulePreset, setPendingRulePreset] = useState(null);
  const [messageTemplates, setMessageTemplates] = useState([]);
  const [approvedTemplates, setApprovedTemplates] = useState([]);
  const [optIn, setOptIn] = useState(null);
  const [resultsFor, setResultsFor] = useState(null);

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
    try { setOptIn((await whatsappAPI.hubOptIns()).data?.summary || null); } catch (e) { /* the review just omits the counts */ }
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
    setSeqForm(preset ? { ...preset, is_active: false, stop_conditions: { ...defaultStops }, steps: preset.steps.map(s => ({ ...s })) } : { name: '', description: '', is_active: false, stop_conditions: { ...defaultStops }, steps: [emptyStep()] });
    setSeqErrors({});
    setSeqModal(true);
  };

  const openEditSeq = (s) => {
    setEditingSeq(s);
    setSeqForm({
      name: s.name, description: s.description || '', is_active: s.is_active, stop_conditions: { ...defaultStops, ...s.stop_conditions },
      steps: s.steps?.length ? s.steps.map(st => ({
        ...emptyStep(), ...st,
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
  const moveStep = (idx, dir) => setSeqForm(f => {
    const j = idx + dir;
    if (j < 0 || j >= f.steps.length) return f;
    const steps = [...f.steps]; [steps[idx], steps[j]] = [steps[j], steps[idx]];
    return { ...f, steps };
  });

  const handleSaveSeq = async () => {
    const errors = {};
    if (!seqForm.name.trim()) errors.name = 'Sequence name is required';
    // The server drops steps without a message, so flag each one rather than
    // letting a save silently lose them.
    const emptySteps = seqForm.steps.map((s, i) => (s.always_template || s.ai_generated || s.message?.trim() || s.media?.length ? null : i + 1)).filter(Boolean);
    if (emptySteps.length) errors.steps = `Add a message or a file to step ${emptySteps.join(', ')} (or use AI), or remove ${emptySteps.length > 1 ? 'them' : 'it'}. The message is sent inside the 24h window; the approved template is only used outside it.`;
    if (seqForm.steps.some(s => s.always_template && (!s.approved_template_name || !s.template_language))) errors.steps = 'Always-template steps require a template and its exact language.';
    if (seqForm.steps.filter(s => s.reply_routes?.length).length > 1) errors.steps = 'Configure one reply question per sequence.';
    if (seqForm.steps.some(s => (s.reply_routes || []).some(r => !r.answer?.trim() || !r.classification?.trim() || !r.sequence_id))) errors.steps = 'Complete each reply route answer, classification and target sequence.';
    setSeqErrors(errors);
    if (Object.keys(errors).length) return;
    const payload = { ...seqForm, steps: seqForm.steps.map(stepPayload) };
    try {
      let sequenceId = editingSeq?.id;
      if (editingSeq) {
        await automationAPI.updateSequence(editingSeq.id, payload);
      } else {
        const { data } = await automationAPI.createSequence(payload);
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

  const handleDeleteSeq = async (seq) => {
    const inIt = Number(seq.enrolled_active) || 0;
    const ok = await confirm({
      title: `Delete \u201C${seq.name}\u201D?`,
      message: `${inIt ? `${inIt} lead${inIt === 1 ? ' is' : 's are'} in it right now and will stop getting its messages. ` : ''}Trigger rules that start it will be deleted too. This can\u2019t be undone.`,
      confirmText: 'Delete', destructive: true,
    });
    if (!ok) return;
    try {
      await automationAPI.deleteSequence(seq.id);
      loadSequences();
      loadRules();
    } catch (e) { toast.error('Failed to delete'); }
  };

  const openCreateRule = (preset) => {
    setEditingRule(null);
    setRuleForm(preset
      ? { name: preset.name, trigger_type: preset.trigger_type, stage_name: preset.stage_name || '', campaign_id: preset.campaign_id || '', source_value: preset.source_value || '', status_value: preset.status_value || '', product_interest: preset.product_interest || '', is_active: false, sequence_id: preset.sequence_id || sequences[0]?.id || '' }
      : { name: '', trigger_type: 'new_lead', stage_name: '', campaign_id: '', source_value: '', status_value: '', product_interest: '', is_active: false, sequence_id: sequences[0]?.id || '' });
    setRuleErrors({});
    setRuleModal(true);
  };

  const openEditRule = (r) => {
    setEditingRule(r);
    setRuleForm({ name: r.name, trigger_type: r.trigger_type, stage_name: r.stage_name || '', campaign_id: r.campaign_id || '', source_value: r.source_value || '', status_value: r.status_value || '', product_interest: r.product_interest || '', is_active: r.is_active, sequence_id: r.sequence_id });
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

  // Pause a live sequence, resume a paused one, turn on a draft. Pausing asks first: leads already in it stop getting messages.
  const handleToggleSeq = async (seq) => {
    const action = toggleAction(seq);
    if (action.key === 'pause') {
      const inIt = Number(seq.enrolled_active) || 0;
      const ok = await confirm({
        title: `Pause \u201C${seq.name}\u201D?`,
        message: inIt ? `${inIt} lead${inIt === 1 ? ' is' : 's are'} in it right now. They won\u2019t get more messages until you resume it.` : 'Nothing will be sent while it is paused. You can resume it any time.',
        confirmText: 'Pause', destructive: false,
      });
      if (!ok) return;
    }
    try {
      await automationAPI.updateSequence(seq.id, { is_active: action.next });
      toast.success(action.next ? `\u201C${seq.name}\u201D is on.` : `\u201C${seq.name}\u201D is paused.`);
      loadSequences();
    } catch (e) { toast.error('Failed to update'); }
  };

  // Copies the steps and stop rules into a new sequence that is switched off, so nothing starts sending by surprise.
  const handleDuplicateSeq = async (seq) => {
    const payload = duplicatePayload(seq, sequences.map(x => x.name));
    try {
      await automationAPI.createSequence(payload);
      toast.success(`Created \u201C${payload.name}\u201D. It is off until you turn it on.`);
      loadSequences();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to duplicate'); }
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

  const isAdmin = ['admin','super_admin'].includes(user?.role);

  // What starts the sequence being edited: its saved trigger rules, or the rule a Quick Start will create after saving.
  const editorTriggers = editingSeq
    ? rules.filter(r => r.sequence_id === editingSeq.id).map(r => ({ label: TRIGGER_LABEL(r, campaigns), off: !r.is_active }))
    : (pendingRulePreset ? [{ label: TRIGGER_LABEL(pendingRulePreset, campaigns), off: false }] : []);
  const editorTriggerHint = editingSeq
    ? 'No trigger starts this sequence yet. Add one under Automated Triggers after you save.'
    : 'You choose what starts it right after you save, under Automated Triggers.';

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">What do you want to achieve?</h2>
            <p className="text-xs text-gray-400 mt-0.5">Pick a goal to prefill the sequence and what starts it. You review everything, including WhatsApp rules, before anything is turned on.</p>
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
          <SequenceList sequences={sequences} rules={rules} isAdmin={isAdmin} triggerLabel={(r) => TRIGGER_LABEL(r, campaigns)}
            onEdit={openEditSeq} onToggle={handleToggleSeq} onDuplicate={handleDuplicateSeq} onDelete={handleDeleteSeq} onResults={setResultsFor} />
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
                        {TRIGGER_LABEL(r, campaigns)}{r.product_interest ? ` · Product: ${r.product_interest}` : ''}
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
                      <button aria-label={`Edit rule ${r.name}`} onClick={() => openEditRule(r)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 size={13} /></button>
                      <button onClick={() => handleDeleteRule(r.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {part !== 'automation' && <AssignmentRulesSection />}

      {resultsFor && <SequenceResults sequence={resultsFor} onClose={() => setResultsFor(null)} />}

      {seqModal && (
        <SequenceEditor editing={!!editingSeq} form={seqForm} setForm={setSeqForm} errors={seqErrors} setErrors={setSeqErrors}
          updateStep={updateStep} addStep={addStep} removeStep={removeStep} moveStep={moveStep}
          triggers={editorTriggers} triggerHint={editorTriggerHint}
          approvedTemplates={approvedTemplates} messageTemplates={messageTemplates} optIn={optIn}
          otherSequences={sequences.filter(seq => seq.id !== editingSeq?.id)}
          onSave={handleSaveSeq} onClose={() => { setSeqModal(false); setPendingRulePreset(null); }} />
      )}

      {ruleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">{editingRule ? 'Edit Rule' : 'New Rule'}</h3>
              <button onClick={() => setRuleModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name <span className="text-red-500">*</span></label>
                <input value={ruleForm.name}
                  onChange={e => { setRuleForm({ ...ruleForm, name: e.target.value }); if (ruleErrors.name) setRuleErrors(er => ({ ...er, name: undefined })); }}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm ${ruleErrors.name ? 'border-red-500' : ''}`} placeholder="e.g. Welcome new leads" />
                {ruleErrors.name && <p className="text-xs text-red-500 mt-1">{ruleErrors.name}</p>}
              </div>
              <CheckRow checked={!!ruleForm.is_active} onChange={e => setRuleForm({ ...ruleForm, is_active: e.target.checked })} label="Turn this rule on" hint="While it is off, this rule does not start the sequence for any lead." />
              <label className="block text-xs">Product interest (optional exact filter)<input className="w-full border rounded-lg p-2" value={ruleForm.product_interest || ''} onChange={e => setRuleForm({ ...ruleForm, product_interest: e.target.value })} placeholder="Leave empty for all products" /></label>
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
              {ruleForm.trigger_type === 'new_lead' && <WelcomeStatusCard where="rule" />}
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
