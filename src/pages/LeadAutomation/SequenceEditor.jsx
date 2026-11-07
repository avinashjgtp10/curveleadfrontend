import { useState } from 'react';
import { X, Plus, Trash2, Clock, ChevronUp, ChevronDown, Zap, MessageCircle, Mail, Settings2 } from 'lucide-react';
import { DELAY_UNIT_MINUTES, describeDelay, unitFor, delayValue } from '../../utils/delay';
import { TEMPLATE_FIELD_OPTIONS, unknownVariables, fillExamples } from '../../utils/leadVariables';
import { stepSentence, previewTemplateBody, usesAdvanced } from '../../utils/sequenceSteps';
import StepAttachment from './StepAttachment';
import CheckRow from './CheckRow';
import ReplyRoutesEditor from './ReplyRoutesEditor';
import TestSend from './TestSend';
import SequenceReview from './SequenceReview';
import TemplatePicker from '../../components/whatsapp/TemplatePicker';
import VariableHelp, { UnknownVariables } from '../../components/whatsapp/VariableHelp';

// What the lead will see, for one step.
function Preview({ step, approvedTemplates }) {
  const tpl = approvedTemplates.find((t) => t.name === step.approved_template_name && (!step.template_language || t.language === step.template_language));
  const tplBody = tpl?.components?.find((c) => c.type === 'BODY')?.text;
  let text = null; let note = null;
  if (step.channel === 'whatsapp' && step.ai_generated) note = 'AI writes this message when it is sent, using the lead’s conversation. It only goes out inside WhatsApp’s 24-hour window.';
  else if (step.channel === 'whatsapp' && step.always_template) text = tplBody ? previewTemplateBody(tplBody, step.template_parameters) : null;
  else text = step.message ? fillExamples(step.message) : null;
  if (step.channel === 'whatsapp' && !step.always_template && !step.ai_generated && step.approved_template_name) {
    note = `Outside the 24-hour window the approved template “${step.approved_template_name}” is sent instead.`;
  }
  if (!text && !note) return <p className="text-[11px] text-gray-400 mt-2">Write the message to see a preview.</p>;
  return (
    <div className="mt-2" aria-label="Message preview">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Preview (example lead)</p>
      {text && <p className="text-xs text-gray-700 whitespace-pre-wrap bg-[#e7fbe0] border border-green-100 rounded-lg px-3 py-2">{text}</p>}
      {note && <p className="text-[11px] text-gray-500 mt-1">{note}</p>}
    </div>
  );
}

function StepCard({ idx, count, step, form, updateStep, removeStep, moveStep, approvedTemplates, messageTemplates, otherSequences }) {
  const [advanced, setAdvanced] = useState(usesAdvanced(step));
  const stopOnReply = !!form.stop_conditions?.on_reply;
  const Icon = step.channel === 'email' ? Mail : MessageCircle;
  const n = idx + 1;
  return (
    <div className="border rounded-xl bg-white shadow-sm">
      <div className="flex items-start justify-between gap-2 px-3 pt-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Step {n}</p>
          <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5"><Icon size={14} className="text-brand-600 shrink-0" /><span>{stepSentence(step, idx, { stopOnReply })}</span></p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button type="button" onClick={() => moveStep(idx, -1)} disabled={idx === 0} aria-label={`Move step ${n} up`} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronUp size={14} /></button>
          <button type="button" onClick={() => moveStep(idx, 1)} disabled={idx === count - 1} aria-label={`Move step ${n} down`} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronDown size={14} /></button>
          {count > 1 && <button type="button" onClick={() => removeStep(idx)} aria-label={`Remove step ${n}`} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 size={13} /></button>}
        </div>
      </div>

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-medium text-gray-400 mb-1">Send by</label>
            <select value={step.channel} onChange={(e) => updateStep(idx, { channel: e.target.value, ...(e.target.value === 'email' ? { media: [] } : {}) })} className="w-full px-2.5 py-2 border rounded-lg text-xs bg-white">
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-400 mb-1 flex items-center gap-1"><Clock size={10} /> Wait {idx === 0 ? 'after the sequence starts' : 'after the previous step'}</label>
            <div className="flex gap-1.5">
              <input type="number" min="0" value={delayValue(step)} aria-label={`Step ${n} wait`}
                onChange={(e) => updateStep(idx, { delay_unit: unitFor(step), delay_minutes: (parseInt(e.target.value, 10) || 0) * DELAY_UNIT_MINUTES[unitFor(step)] })}
                onFocus={(e) => e.target.select()} className="w-full px-2.5 py-2 border rounded-lg text-xs" placeholder="0" />
              <select value={unitFor(step)} aria-label={`Step ${n} delay unit`}
                onChange={(e) => updateStep(idx, { delay_unit: e.target.value, delay_minutes: (delayValue(step) || 0) * DELAY_UNIT_MINUTES[e.target.value] })}
                className="px-2 py-2 border rounded-lg text-xs bg-white shrink-0">
                <option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option>
              </select>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">{step.delay_minutes ? `Sends ${describeDelay(step.delay_minutes)} after ${idx === 0 ? 'the sequence starts' : 'the previous step'}.` : 'Sends straight away.'}</p>
          </div>
        </div>

        {step.channel === 'email' && (
          <input value={step.email_subject} onChange={(e) => updateStep(idx, { email_subject: e.target.value })} aria-label={`Step ${n} email subject`}
            className="w-full px-2.5 py-2 border rounded-lg text-xs" placeholder="Email subject" />
        )}

        {step.channel === 'whatsapp' && step.ai_generated ? (
          <div>
            <label className="block text-[10px] font-medium text-gray-400 mb-1">Instructions for the AI (optional)</label>
            <textarea value={step.ai_instructions} onChange={(e) => updateStep(idx, { ai_instructions: e.target.value })} rows={3} className="w-full px-2.5 py-2 border rounded-lg text-xs"
              placeholder="e.g. mention our new autumn discount, keep it under 3 lines, casual tone" />
          </div>
        ) : (
          <div>
            {messageTemplates.filter((t) => t.channel === step.channel).length > 0 && (
              <select value="" aria-label={`Step ${n} insert saved template`} onChange={(e) => {
                const tmpl = messageTemplates.find((t) => String(t.id) === e.target.value);
                if (tmpl) updateStep(idx, { message: tmpl.message });
              }} className="w-full px-2.5 py-2 border rounded-lg text-xs bg-white mb-2">
                <option value="">Insert saved template...</option>
                {messageTemplates.filter((t) => t.channel === step.channel).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
            <textarea value={step.message} onChange={(e) => updateStep(idx, { message: e.target.value })} rows={3} aria-label={`Step ${n} message`}
              className="w-full px-2.5 py-2 border rounded-lg text-xs font-mono" placeholder={'Hi {{name}}, ...'} />
            <UnknownVariables items={unknownVariables(step.message)} />
          </div>
        )}

        {step.channel === 'whatsapp' && !step.always_template && (
          <StepAttachment stepNumber={n} media={step.media} onChange={(media) => updateStep(idx, { media })} />
        )}

        <Preview step={step} approvedTemplates={approvedTemplates} />
        {step.channel === 'whatsapp' && <TestSend step={step} n={n} />}

        {step.channel === 'whatsapp' && (
          <div>
            <button type="button" onClick={() => setAdvanced((a) => !a)} aria-expanded={advanced} className="text-xs font-semibold text-brand-700 flex items-center gap-1">
              <Settings2 size={12} /> {advanced ? 'Hide advanced options' : 'Advanced options'}
            </button>
            {advanced && (
              <div className="mt-2 border rounded-lg p-3 space-y-3 bg-gray-50">
                <CheckRow checked={!!step.ai_generated} onChange={(e) => updateStep(idx, { ai_generated: e.target.checked })} label="Let AI write this message"
                  hint="AI uses the lead’s own conversation and your instructions. It only applies inside WhatsApp’s 24-hour window." />
                <CheckRow checked={!!step.always_template} onChange={(e) => updateStep(idx, { always_template: e.target.checked, ...(e.target.checked ? { media: [] } : {}) })}
                  label="Always send an approved template" hint="Use this when the lead may not have messaged you in the last 24 hours. Otherwise the template is only the fallback outside that window." />
                <CheckRow checked={!!step.business_hours_only} onChange={(e) => updateStep(idx, { business_hours_only: e.target.checked })} label="Only send during business hours"
                  hint="If this step comes due at night, it waits for your business-hours window in the lead’s own time zone (taken from their phone number when the country has one time zone; otherwise your workspace time zone). Set the hours under Automation settings." />
                {approvedTemplates.length > 0 ? (
                  <TemplatePicker label={step.always_template ? 'Approved template' : 'Fallback template'} templates={approvedTemplates} identity="name_language" purpose="followup"
                    emptyLabel="No fallback template"
                    value={step.approved_template_name ? `${step.approved_template_name}::${step.template_language || approvedTemplates.find((t) => t.name === step.approved_template_name)?.language || ''}` : ''}
                    onChange={(_, template) => {
                      const text = template?.components?.find((c) => c.type === 'BODY')?.text || '';
                      const count = new Set([...text.matchAll(/\{\{(\d+)\}\}/g)].map((m) => m[1])).size;
                      updateStep(idx, { approved_template_name: template?.name || '', template_language: template?.language || '', template_parameters: Array.from({ length: count }, () => ({ field: 'name' })) });
                    }} />
                ) : (
                  <input value={step.approved_template_name || ''} onChange={(e) => updateStep(idx, { approved_template_name: e.target.value })}
                    className="w-full px-2.5 py-2 border rounded-lg text-xs" placeholder="Approved template name (optional fallback)" />
                )}
                <label className="block text-xs">Template language<input aria-label={`Step ${n} template language`} value={step.template_language || ''} onChange={(e) => updateStep(idx, { template_language: e.target.value })} className="w-full px-2 py-1 border rounded" placeholder="e.g. en_US" /></label>
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-500">An approved WhatsApp template has numbered gaps ({'{{1}}'}, {'{{2}}'}…). Choose which lead detail fills each one, in order.</p>
                  {(step.template_parameters || []).map((mapping, mi) => (
                    <div key={mi} className="flex gap-2 items-center text-xs">
                      <span>{`{{${mi + 1}}}`}</span>
                      <select aria-label={`Step ${n} parameter ${mi + 1}`} className="border rounded p-1" value={mapping.field}
                        onChange={(e) => updateStep(idx, { template_parameters: step.template_parameters.map((m, j) => (j === mi ? { field: e.target.value, value: '' } : m)) })}>
                        {TEMPLATE_FIELD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      {mapping.field === 'literal' && <input aria-label={`Step ${n} parameter ${mi + 1} text`} className="border rounded p-1 min-w-0" value={mapping.value || ''}
                        onChange={(e) => updateStep(idx, { template_parameters: step.template_parameters.map((m, j) => (j === mi ? { ...m, value: e.target.value } : m)) })} />}
                      <button type="button" onClick={() => updateStep(idx, { template_parameters: step.template_parameters.filter((_, j) => j !== mi) })}>Remove</button>
                    </div>
                  ))}
                  <button type="button" className="text-xs text-brand-600" onClick={() => updateStep(idx, { template_parameters: [...(step.template_parameters || []), { field: 'name' }] })}>Add body parameter</button>
                </div>

                <ReplyRoutesEditor n={n} idx={idx} step={step} otherSequences={otherSequences} updateStep={updateStep}
                  template={approvedTemplates.find((t) => t.name === step.approved_template_name && (!step.template_language || t.language === step.template_language))} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// The sequence editor as a vertical timeline: what starts it, then each step as "Wait 1 day, then send ...", then when it stops.
// All state and saving stay in AutomationBuilder; this component only draws and edits the form it is given.
export default function SequenceEditor({
  editing, form, setForm, errors, setErrors, updateStep, addStep, removeStep, moveStep,
  triggers, triggerHint, approvedTemplates, messageTemplates, otherSequences, optIn, onSave, onClose,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div role="dialog" aria-modal="true" aria-label={editing ? 'Edit sequence' : 'New sequence'} className="bg-white rounded-2xl p-5 w-full max-w-3xl max-h-[88vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base">{editing ? 'Edit Sequence' : 'New Sequence'}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors((er) => ({ ...er, name: undefined })); }}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm ${errors.name ? 'border-red-500' : ''}`} placeholder="e.g. New Lead Intro Sequence" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 border rounded-lg text-sm" placeholder="Optional — what this sequence is for" />
          </div>

          <ol className="relative border-l-2 border-brand-100 ml-3 pl-6 space-y-4 pt-1">
            <li className="relative">
              <span className="absolute -left-[34px] top-3 w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center"><Zap size={11} /></span>
              <div className="border rounded-xl bg-brand-50/50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-700">Starts when</p>
                {triggers.length ? (
                  <ul className="text-sm text-gray-800 mt-0.5">{triggers.map((t, i) => <li key={i}>{t.label}{t.off ? <span className="text-gray-400"> (trigger is off)</span> : null}</li>)}</ul>
                ) : <p className="text-sm text-amber-800 mt-0.5">{triggerHint}</p>}
              </div>
            </li>
            {form.steps.map((step, idx) => (
              <li key={idx} className="relative">
                <span className="absolute -left-[34px] top-3 w-5 h-5 rounded-full bg-white border-2 border-brand-600 text-brand-700 text-[10px] font-bold flex items-center justify-center">{idx + 1}</span>
                <StepCard idx={idx} count={form.steps.length} step={step} form={form} updateStep={updateStep} removeStep={removeStep} moveStep={moveStep}
                  approvedTemplates={approvedTemplates} messageTemplates={messageTemplates} otherSequences={otherSequences} />
              </li>
            ))}
            <li className="relative">
              <span className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-brand-200" />
              <button type="button" onClick={addStep} className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"><Plus size={13} /> Add a step</button>
            </li>
          </ol>
          {errors.steps && <p className="text-xs text-red-500">{errors.steps}</p>}

          <fieldset className="border rounded-xl p-3 space-y-2">
            <legend className="text-sm font-semibold">When it stops, and when it runs</legend>
            <CheckRow checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              label="Turn this sequence on" hint="Leave it off to save a draft. Nothing is sent while a sequence is off; you can turn it on whenever you are ready." />
            {[
              ['on_reply', 'Stop when the lead replies', 'Good for simple follow-ups. Later steps then read “If no reply after…”. Leave it off if a step asks a question with reply buttons, so their answer can carry the sequence on.'],
              ['demo_booked', 'Stop when a demo is booked', 'No more messages once a demo is booked for the lead.'],
              ['customer_converted', 'Stop when the lead becomes a customer', 'No more messages once they become a customer.'],
            ].map(([key, label, hint]) => (
              <CheckRow key={key} checked={!!form.stop_conditions?.[key]} label={label} hint={hint}
                onChange={(e) => setForm({ ...form, stop_conditions: { ...form.stop_conditions, [key]: e.target.checked } })} />
            ))}
            <p className="text-xs text-gray-600">Opt-out always stops sending. Manual pause suspends sending until resumed.</p>
          </fieldset>
          <SequenceReview form={form} templates={approvedTemplates} optIn={optIn} triggers={triggers} />
          <VariableHelp />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="button" onClick={onSave} className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700">{editing ? 'Update' : 'Create'}</button>
        </div>
      </div>
    </div>
  );
}
