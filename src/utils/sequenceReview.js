import { stepSentence } from './sequenceSteps.js';
import { categoryOf, groupOf, marketingWarning } from './templatePicker.js';

const findTemplate = (step, templates) => templates.find((t) => t.name === step.approved_template_name && (!step.template_language || t.language === step.template_language));
const purposeOf = (name) => (groupOf(name).id === 'booking' ? 'confirmation' : groupOf(name).id === 'welcome' ? 'welcome' : 'followup');
const list = (items) => items.join(', ');

// A plain-English review of a sequence before it is switched on: what it will do, and whether it follows WhatsApp's rules.
// Pure. templates: approved templates (Meta shape). optIn: { total, opted_in } or null.
export const reviewSequence = ({ form, templates = [], optIn = null, triggers = [] }) => {
  const steps = form?.steps || [];
  const stopOnReply = !!form?.stop_conditions?.on_reply;
  const summary = [
    triggers.length ? `Starts when ${list(triggers.map((t) => t.label))}.` : 'No trigger starts it yet. Add one after you save.',
    ...steps.map((s, i) => `${i + 1}. ${stepSentence(s, i, { stopOnReply })}${s.business_hours_only ? ', in business hours' : ''}.`),
  ];

  const checks = [];
  const wa = steps.map((s, i) => ({ s, n: i + 1 })).filter(({ s }) => s.channel === 'whatsapp');

  // 1. Templates are approved. Without one, a step only reaches leads who wrote in the last 24 hours.
  const missing = wa.filter(({ s }) => s.approved_template_name && !findTemplate(s, templates));
  const none = wa.filter(({ s }) => !s.approved_template_name && !s.ai_generated);
  if (missing.length) checks.push({ key: 'templates', tone: 'bad', text: `${missing.map(({ n }) => `Step ${n}`).join(', ')} use${missing.length === 1 ? 's' : ''} a template that is not approved or was not found. Pick an approved one, or create and submit it first.` });
  else if (none.length) checks.push({ key: 'templates', tone: 'warn', text: `${none.map(({ n }) => `Step ${n}`).join(', ')} ha${none.length === 1 ? 's' : 've'} no approved template, so ${none.length === 1 ? 'it reaches' : 'they reach'} only leads who messaged you in the last 24 hours. Add one under Advanced options to reach everyone.` });
  else if (wa.length) checks.push({ key: 'templates', tone: 'ok', text: 'Every WhatsApp step has an approved template to use outside the 24-hour window.' });

  // 2. Marketing templates used for things every lead should get (confirmations, reminders, welcome).
  const used = wa.map(({ s, n }) => ({ n, t: findTemplate(s, templates) })).filter(({ t }) => t);
  const warned = used.map(({ n, t }) => ({ n, w: marketingWarning({ template: { category: categoryOf(t) }, purpose: purposeOf(t.name), optIn }) })).filter(({ w }) => w);
  const marketing = used.filter(({ t }) => categoryOf(t) === 'MARKETING');
  if (warned.length) checks.push({ key: 'category', tone: 'warn', text: `${warned.map(({ n }) => `Step ${n}`).join(', ')}: a Marketing template is used for a message every lead should get. WhatsApp only lets you send Marketing templates to leads who opted in, so a Utility template is the right fit.` });
  else if (used.length) checks.push({ key: 'category', tone: 'ok', text: 'Template categories match what the messages are for.' });

  // 3. Opt-in coverage for Marketing templates.
  if (marketing.length) {
    const total = Number(optIn?.total); const opted = Number(optIn?.opted_in);
    const known = Number.isFinite(total) && total > 0 && Number.isFinite(opted);
    checks.push({ key: 'optin', tone: known && opted >= total ? 'ok' : 'warn', text: known
      ? `Marketing templates reach only leads who opted in: ${opted} of ${total} leads (${Math.round((opted / total) * 100)}%) today. The rest are skipped, never messaged.`
      : 'Marketing templates reach only leads who opted in. Leads without an opt-in are skipped, never messaged.' });
  } else if (used.length) {
    checks.push({ key: 'optin', tone: 'ok', text: 'Utility templates reach leads who opted in or asked to be contacted.' });
  }

  // 4. It stops when it should.
  const stops = [['on_reply', 'the lead replies'], ['demo_booked', 'a demo is booked'], ['customer_converted', 'they become a customer']].filter(([k]) => form?.stop_conditions?.[k]);
  const hasButtons = steps.some((s) => (s.reply_routes || []).length);
  checks.push(stops.length || hasButtons
    ? { key: 'stops', tone: 'ok', text: `Stops when ${list([...stops.map(([, t]) => t), 'the lead opts out'])}.${hasButtons ? ' Button answers carry the lead on to the sequence you chose.' : ''}` }
    : { key: 'stops', tone: 'warn', text: 'Only an opt-out stops this sequence. Consider stopping when the lead replies or books a demo, so nobody gets messages they no longer need.' });

  if (steps.some((s) => (s.reply_routes || []).length)) checks.push({ key: 'default', tone: 'ok', text: 'Any reply that is not one of your buttons goes to a team member to review.' });
  const hours = steps.map((s, i) => (s.business_hours_only ? i + 1 : null)).filter(Boolean);
  if (hours.length) checks.push({ key: 'hours', tone: 'ok', text: `Step ${hours.join(', ')} wait${hours.length === 1 ? 's' : ''} for business hours in each lead’s time zone.` });

  return { summary, checks, blocking: checks.some((c) => c.tone === 'bad') };
};
