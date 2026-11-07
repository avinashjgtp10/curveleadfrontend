import { describeDelay } from './delay.js';
import { LEAD_VARIABLES } from './leadVariables.js';

// What a step sends, in a few words.
export const stepWhat = (step) => {
  if (step?.channel === 'email') return 'an email';
  if (step?.ai_generated) return 'an AI-written message';
  if (step?.always_template && step.approved_template_name) return `the template “${step.approved_template_name}”`;
  return 'a WhatsApp message';
};

// "Send a WhatsApp message straight away" / "Wait 1 day, then send the template “welcome”" /
// "If no reply after 1 day, send an email". The "no reply" wording is used for later steps when the sequence stops on a reply,
// because then the step only goes to leads who have not answered.
export const stepSentence = (step, idx, { stopOnReply = false } = {}) => {
  const what = stepWhat(step);
  const minutes = Number(step?.delay_minutes) || 0;
  if (minutes <= 0) return `Send ${what} ${idx === 0 ? 'straight away' : 'right after the previous step'}`;
  const wait = describeDelay(minutes);
  return idx > 0 && stopOnReply ? `If no reply after ${wait}, send ${what}` : `Wait ${wait}, then send ${what}`;
};

// An example for one numbered template gap, from the lead detail chosen for it ({ field, value }).
export const slotExample = (mapping) => {
  if (!mapping) return LEAD_VARIABLES[0].example;
  if (mapping.field === 'literal') return mapping.value || '…';
  if (mapping.field === 'product') return 'Haircut';
  return LEAD_VARIABLES.find((v) => v.field === mapping.field)?.example || LEAD_VARIABLES[0].example;
};

// A template's text with each {{1}}, {{2}}… replaced by the example for the lead detail chosen for that gap.
export const previewTemplateBody = (body, mappings = []) =>
  String(body || '').replace(/\{\{(\d+)\}\}/g, (m, n) => slotExample(mappings[Number(n) - 1]));

// Advanced options open by default when the step already uses one, so nothing set is ever hidden.
export const usesAdvanced = (step) => !!(step?.always_template || step?.approved_template_name || step?.ai_generated
  || (step?.template_parameters || []).length || (step?.reply_routes || []).length);
