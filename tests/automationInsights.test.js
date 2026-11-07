import test from 'node:test';
import assert from 'node:assert/strict';
import { stopText, reasonText, timelineLine, currentLine, funnelRows, coverageText } from '../src/utils/automationInsights.js';

test('stop reasons and stored reasons read in plain language', () => {
  assert.equal(stopText('opted_out'), 'The lead opted out');
  assert.equal(stopText('replied'), 'The lead replied');
  assert.equal(stopText('something_new'), 'Stopped (something new)');
  assert.match(reasonText('blocked_no_opt_in'), /opt-in/);
  assert.match(reasonText('[131049] (#131049) Graph API error'), /Meta chose not to deliver this marketing message/);
  assert.equal(reasonText(null), 'No reason recorded');
  assert.equal(reasonText('Template catalogue connection needs attention.'), 'Template catalogue connection needs attention.');
});
test('each timeline event gets a title, detail and tone', () => {
  const t = (e) => timelineLine({ step_number: 2, channel: 'whatsapp', ...e });
  assert.deepEqual(t({ kind: 'sent', delivery: 'read', template: 'welcome' }), { title: 'Step 2: WhatsApp message read', detail: 'Template “welcome”', tone: 'ok' });
  assert.equal(t({ kind: 'sent', delivery: 'failed', error: '[131047] x' }).tone, 'bad');
  assert.match(t({ kind: 'sent', delivery: 'failed', error: '[131047] (#131047) Graph API error' }).detail, /24 hours/);
  assert.equal(t({ kind: 'sent', channel: 'email' }).title, 'Step 2: email sent');
  assert.equal(t({ kind: 'failed', error: 'Template missing' }).detail, 'Template missing');
  assert.equal(t({ kind: 'stopped', reason: 'demo_booked' }).title, 'Stopped: A demo was booked');
  assert.equal(t({ kind: 'reply', classification: 'Yes', outcome: 'human_review' }).detail, 'Sent to a team member to review');
  assert.equal(t({ kind: 'enrolled', sequence_name: 'Welcome', trigger: 'New lead' }).title, 'Added to “Welcome”');
});
test('what is happening now is stated for every unfinished state', () => {
  const now = Date.parse('2026-01-01T10:00:00Z');
  assert.equal(currentLine({ status: 'active', next_step_number: 2, next_send_at: '2026-01-01T12:00:00Z' }, now).text, 'Step 2 is due in 2 hours.');
  assert.equal(currentLine({ status: 'active', next_step_number: 2, next_send_at: '2026-01-01T09:00:00Z' }, now).text, 'Step 2 is due now.');
  assert.match(currentLine({ status: 'blocked', reason: 'blocked_no_opt_in' }).text, /^Blocked: No WhatsApp marketing opt-in/);
  assert.equal(currentLine({ status: 'human_review' }).tone, 'warn');
});
test('the step table never shows made-up numbers for email, and rates handle zero sends', () => {
  const rows = funnelRows([{ step_number: 1, channel: 'whatsapp', template: 'welcome', sent: 4, delivered: 3, read: 2, replied: 1, failed: 0 }, { step_number: 2, channel: 'email', sent: 2, delivered: 0, read: 0, replied: 0, failed: 0 }, { step_number: 3, channel: 'whatsapp', sent: 0, delivered: 0, read: 0, replied: 0, failed: 1 }]);
  assert.deepEqual(JSON.parse(JSON.stringify(rows[0])), { step: 1, what: 'WhatsApp · welcome', sent: 4, delivered: '75%', read: '50%', replied: '25%', failed: 0 });
  assert.deepEqual([rows[1].delivered, rows[1].read], ['–', '–']);
  assert.deepEqual([rows[2].delivered, rows[2].replied], ['–', '–']);
});
test('opt-in coverage is stated honestly', () => {
  assert.equal(coverageText({ total: 0 }), 'No leads yet.');
  assert.equal(coverageText({ total: 10, opted_in: 4, coverage_rate: 40, opted_out: 1, held_for_opt_in: 2 }), '4 of 10 leads (40%) have a WhatsApp opt-in. 1 opted out. 2 are held until they opt in.');
});
