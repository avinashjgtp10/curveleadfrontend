import { findTemplate } from './templateCheck.js';

// Industry-neutral ready-made automations. Each one is a sequence plus what starts it, the WhatsApp templates it needs,
// and when it stops. Wording is generic on purpose. Nothing here is sent: presets are created switched off and reviewed first.

const T = (name, category, body, examples = ['Priya']) => ({ name, category, language: 'en_US', body_text: body, examples, params: ['name'] });

// Suggested WhatsApp templates (numbered gaps, as Meta requires). The user submits these; Meta decides whether to approve.
export const SUGGESTED_TEMPLATES = {
  lead_welcome: T('lead_welcome', 'UTILITY', 'Hi {{1}}, thanks for getting in touch. We have received your enquiry and will contact you shortly. Reply here if you would like to add anything.'),
  lead_checkin: T('lead_checkin', 'MARKETING', 'Hi {{1}}, just checking in on your enquiry. Do you have any questions we can help with? Reply here and we will be happy to help.'),
  demo_confirmation: T('demo_confirmation', 'UTILITY', 'Hi {{1}}, your demo is booked. We will send the details before it starts. Reply here if you need to change the time.'),
  demo_reminder: T('demo_reminder', 'UTILITY', 'Hi {{1}}, a reminder that your demo is booked with us. Reply here if you need to change the time.'),
  noshow_reschedule: T('noshow_reschedule', 'UTILITY', 'Hi {{1}}, we missed you at your scheduled demo. Would you like to pick a new time? Reply here and we will arrange it.'),
  demo_thanks: T('demo_thanks', 'UTILITY', 'Hi {{1}}, thank you for your time today. If you have any questions about what we covered, reply here.'),
  demo_followup: T('demo_followup', 'MARKETING', 'Hi {{1}}, following up after your demo. Is there anything you would like us to explain or send across? Reply here and we will help.'),
  quote_followup: T('quote_followup', 'MARKETING', 'Hi {{1}}, we sent you a quotation recently. Do you have any questions, or would you like us to adjust anything? Reply here and we will help.'),
  quote_decision: T('quote_decision', 'MARKETING', 'Hi {{1}}, a quick follow-up on your quotation. Would you like to go ahead, or is there anything holding you back? Reply here and we will help.'),
  win_back: T('win_back', 'MARKETING', 'Hi {{1}}, it has been a while since we spoke. If your needs have changed, we would be glad to help. Reply here if you would like to pick up where we left off.'),
  upsell_intro: T('upsell_intro', 'MARKETING', 'Hi {{1}}, thank you for choosing us. If you would like to hear about other options that may suit you, reply here and we will share them.'),
};
export const suggestedTemplate = (key) => SUGGESTED_TEMPLATES[key] || null;

const DAY = 1440;
// trigger: { type: 'new_lead' } | { type: 'stage', hints: [regex], wantWon?: bool, label }  (stages are the workspace's own, picked by the user)
export const PRESETS = [
  { id: 'new_lead_nurture', label: 'New lead nurture', description: 'Greet every new lead, then check in twice over the first few days.',
    trigger: { type: 'new_lead' }, stops: { on_reply: true, demo_booked: true, customer_converted: true },
    steps: [{ delay: 0, need: 'lead_welcome' }, { delay: DAY, need: 'lead_checkin' }, { delay: 3 * DAY, need: 'lead_checkin' }] },
  { id: 'no_response_followup', label: 'No-response follow-up', description: 'Gentle reminders for leads who have not answered, spread over a week.',
    trigger: { type: 'stage', hints: [/contact/i, /attempt/i, /follow/i], label: 'a lead reaches the stage where you are waiting for their answer' },
    stops: { on_reply: true, demo_booked: true, customer_converted: true },
    steps: [{ delay: DAY, need: 'lead_checkin' }, { delay: 3 * DAY, need: 'lead_checkin' }, { delay: 7 * DAY, need: 'lead_checkin' }] },
  { id: 'demo_booking', label: 'Demo booking and reminders', description: 'Confirm a booked demo straight away and remind the lead the next day.',
    note: 'The reminder goes out a day after booking. For reminders timed to the demo itself, use Booking messages.',
    trigger: { type: 'stage', hints: [/demo.*(book|sched)/i, /(book|sched).*demo/i, /appointment/i], label: 'a demo is booked' },
    stops: { on_reply: false, demo_booked: false, customer_converted: true },
    steps: [{ delay: 0, need: 'demo_confirmation' }, { delay: DAY, need: 'demo_reminder' }] },
  { id: 'noshow_recovery', label: 'No-show recovery', description: 'Offer a new time to leads who missed their demo.',
    trigger: { type: 'stage', hints: [/no.?show/i, /miss/i], label: 'a lead misses their demo' },
    stops: { on_reply: true, demo_booked: false, customer_converted: true },
    steps: [{ delay: 60, need: 'noshow_reschedule' }, { delay: 2 * DAY, need: 'lead_checkin' }] },
  { id: 'post_demo', label: 'Post-demo follow-up', description: 'Thank the lead after a demo, then ask if they have questions.',
    trigger: { type: 'stage', hints: [/demo.*(done|complet|held)/i, /post.?demo/i, /after.*demo/i], label: 'a demo has taken place' },
    stops: { on_reply: true, demo_booked: false, customer_converted: true },
    steps: [{ delay: 120, need: 'demo_thanks' }, { delay: 2 * DAY, need: 'demo_followup' }] },
  { id: 'quotation_followup', label: 'Quotation follow-up', description: 'Nudge a lead who has a quotation but has not decided.',
    trigger: { type: 'stage', hints: [/quot/i, /proposal/i, /negotiat/i], label: 'a quotation is sent' },
    stops: { on_reply: true, demo_booked: false, customer_converted: true },
    steps: [{ delay: DAY, need: 'quote_followup' }, { delay: 4 * DAY, need: 'quote_decision' }] },
  { id: 'lost_reactivation', label: 'Lost-lead reactivation', description: 'One careful message to bring back a lead who went quiet.',
    note: 'Automation always stops for leads in a Lost stage, so this starts from a different stage, for example one called “Revisit later”.',
    trigger: { type: 'stage', hints: [/revisit/i, /later/i, /nurture/i, /cold/i, /dormant/i], noLost: true, label: 'a lead moves to a “revisit later” stage' },
    stops: { on_reply: true, demo_booked: false, customer_converted: true },
    steps: [{ delay: 14 * DAY, need: 'win_back' }] },
  { id: 'customer_upsell', label: 'Customer upsell', description: 'Share other options with a lead who has just become a customer.',
    note: 'This starts when a lead becomes a customer, so it does not stop on conversion. It stops on a reply or an opt-out.',
    trigger: { type: 'stage', hints: [/won/i, /customer/i, /closed/i], wantWon: true, label: 'a lead becomes a customer' },
    stops: { on_reply: true, demo_booked: false, customer_converted: false },
    steps: [{ delay: 7 * DAY, need: 'upsell_intro' }] },
];

// The stage that most likely matches a preset's trigger, or '' when none does (the user then picks). Lost stages never qualify:
// the automation engine never enrols a lead into a lost stage.
export const suggestStage = (stages = [], trigger) => {
  if (trigger?.type !== 'stage') return '';
  const usable = stages.filter((s) => !s.is_lost);
  if (trigger.wantWon) { const won = usable.find((s) => s.is_won); if (won) return won.name; }
  for (const re of trigger.hints || []) { const hit = usable.find((s) => re.test(s.name)); if (hit) return hit.name; }
  return '';
};
export const selectableStages = (stages = []) => stages.filter((s) => !s.is_lost);

// Each template a preset needs, with where it stands in the workspace: approved | pending | rejected | missing.
export const templateNeeds = (preset, templates = []) => {
  const keys = [...new Set(preset.steps.map((s) => s.need))];
  return keys.map((key) => {
    const suggestion = SUGGESTED_TEMPLATES[key];
    const r = findTemplate(templates, suggestion.name);
    const status = r.state === 'verified' ? 'approved' : r.state === 'not_approved'
      ? (['REJECTED', 'DISABLED', 'PAUSED'].includes(String(r.status).toUpperCase()) ? 'rejected' : 'pending') : 'missing';
    return { key, name: suggestion.name, category: suggestion.category, status, template: r.template || null };
  });
};

const toVar = (body) => body.replace(/\{\{1\}\}/g, '{{name}}');
// The sequence the editor opens with. A step uses its approved template when the workspace has it; otherwise it keeps the plain
// message and no template, so the review warns about it instead of the step failing silently.
export const buildPreset = (preset, { templates = [], stageName = '' } = {}) => {
  const steps = preset.steps.map((s) => {
    const suggestion = SUGGESTED_TEMPLATES[s.need];
    const found = findTemplate(templates, suggestion.name);
    const ready = found.state === 'verified';
    return {
      channel: 'whatsapp', delay_minutes: s.delay, delay_unit: s.delay % DAY === 0 && s.delay ? 'days' : s.delay % 60 === 0 && s.delay ? 'hours' : 'minutes',
      message: toVar(suggestion.body_text), email_subject: '',
      ...(ready ? { approved_template_name: found.template.name, template_language: found.template.language, always_template: true, template_parameters: suggestion.params.map((field) => ({ field })) } : {}),
    };
  });
  const trigger = preset.trigger.type === 'new_lead'
    ? { name: preset.label, trigger_type: 'new_lead', stage_name: '' }
    : { name: preset.label, trigger_type: 'stage_change', stage_name: stageName };
  return { label: preset.label, description: preset.description, sequence: { name: preset.label, description: preset.description, stop_conditions: { ...preset.stops }, steps }, rule: trigger };
};

// Plain-English "when it stops", from the preset's stop conditions (opt-out always stops).
export const stopsText = (stops) => {
  const parts = [stops.on_reply && 'the lead replies', stops.demo_booked && 'a demo is booked', stops.customer_converted && 'the lead becomes a customer', 'the lead opts out'].filter(Boolean);
  return `Stops when ${parts.slice(0, -1).join(', ')}${parts.length > 1 ? ' or ' : ''}${parts[parts.length - 1]}.`;
};
