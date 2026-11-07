import { parseFailure } from './failureReason.js';
import { describeDelay } from './delay.js';

// Plain-language wording for the lead timeline and sequence results. Pure; fed by
// GET /automations/leads/:id/timeline and GET /automations/sequences/:id/analytics.

export const STOP_TEXT = {
  replied: 'The lead replied',
  reply_routed: 'The lead answered and moved to another sequence',
  demo_booked: 'A demo was booked',
  customer_converted: 'The lead became a customer',
  stage_lost: 'The lead was marked lost',
  opted_out: 'The lead opted out',
  blocked_no_opt_in: 'No WhatsApp opt-in on record',
  manual: 'Someone stopped it by hand',
};
export const stopText = (reason) => STOP_TEXT[reason] || (reason ? `Stopped (${String(reason).replace(/_/g, ' ')})` : 'Stopped');

// A reason stored on an enrollment or attempt: a known code, a "[131049] …" failure, or a sentence the system wrote.
export const reasonText = (raw) => {
  if (!raw) return 'No reason recorded';
  if (raw === 'blocked_no_opt_in') return 'No WhatsApp marketing opt-in on record for this lead.';
  if (raw === 'blocked_no_consent') return 'This lead has not opted in or asked to be contacted, so only they can start the conversation.';
  return parseFailure(raw).text;
};

const DELIVERY = { sent: 'sent', delivered: 'delivered', read: 'read' };

// One timeline event as { title, detail, tone } (tone: ok | warn | bad | muted).
export const timelineLine = (e) => {
  const step = e.step_number ? `Step ${e.step_number}` : 'Step';
  const via = e.channel === 'email' ? 'email' : 'WhatsApp message';
  switch (e.kind) {
    case 'enrolled': return { title: `Added to “${e.sequence_name}”`, detail: e.trigger ? `Started by: ${e.trigger}` : 'Added by hand or by a trigger', tone: 'muted' };
    case 'sent':
      if (e.delivery === 'failed') return { title: `${step}: ${via} was not delivered`, detail: reasonText(e.error), tone: 'bad' };
      return { title: `${step}: ${via} ${DELIVERY[e.delivery] || 'sent'}`, detail: e.template ? `Template “${e.template}”` : null, tone: 'ok' };
    case 'retrying': return { title: `${step}: will try again`, detail: reasonText(e.error), tone: 'warn' };
    case 'failed': return { title: `${step}: could not be sent`, detail: reasonText(e.error), tone: 'bad' };
    case 'blocked': return { title: `${step}: held back`, detail: reasonText(e.error), tone: 'warn' };
    case 'uncertain': return { title: `${step}: unsure if it was delivered`, detail: 'Check WhatsApp before sending it again.', tone: 'warn' };
    case 'reply': return { title: e.classification ? `Replied: ${e.classification}` : 'Replied', detail: e.outcome === 'human_review' ? 'Sent to a team member to review' : null, tone: 'ok' };
    case 'completed': return { title: 'Finished all steps', detail: null, tone: 'ok' };
    case 'stopped': return { title: `Stopped: ${stopText(e.reason)}`, detail: null, tone: 'muted' };
    default: return { title: String(e.kind || 'Event'), detail: null, tone: 'muted' };
  }
};

// What is happening now for an unfinished enrollment.
export const currentLine = (c, now = Date.now()) => {
  if (c.status === 'active') {
    const due = c.next_send_at ? new Date(c.next_send_at).getTime() : null;
    if (due && due > now) return { text: `Step ${c.next_step_number} is due in ${describeDelay(Math.max(1, Math.round((due - now) / 60000)))}.`, tone: 'ok' };
    return { text: `Step ${c.next_step_number} is due now.`, tone: 'ok' };
  }
  if (c.status === 'awaiting_reply') return { text: 'Waiting for the lead to answer.', tone: 'ok' };
  if (c.status === 'human_review') return { text: 'Their reply needs a team member to review.', tone: 'warn' };
  if (c.status === 'uncertain') return { text: 'Unsure if the last message was delivered. Needs a check.', tone: 'warn' };
  return { text: `${c.status === 'failed' ? 'Failed' : 'Blocked'}: ${reasonText(c.reason)}`, tone: c.status === 'failed' ? 'bad' : 'warn' };
};

const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '–');
// Rows for the step table. Email steps have no delivery or read data, so those cells say so instead of showing zero.
export const funnelRows = (steps = []) => steps.map((s) => {
  const email = s.channel === 'email';
  return { step: s.step_number, what: email ? 'Email' : (s.template ? `WhatsApp · ${s.template}` : 'WhatsApp'), sent: s.sent,
    delivered: email ? '–' : pct(s.delivered, s.sent), read: email ? '–' : pct(s.read, s.sent), replied: pct(s.replied, s.sent), failed: s.failed };
});

// One honest sentence on opt-in coverage for the leads in a sequence.
export const coverageText = (c) => {
  if (!c || !c.total) return 'No leads yet.';
  let t = `${c.opted_in} of ${c.total} leads (${c.coverage_rate}%) have a WhatsApp opt-in.`;
  if (c.opted_out) t += ` ${c.opted_out} opted out.`;
  if (c.held_for_opt_in) t += ` ${c.held_for_opt_in} ${c.held_for_opt_in === 1 ? 'is' : 'are'} held until they opt in.`;
  return t;
};
