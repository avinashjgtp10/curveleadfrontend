import test from 'node:test';
import assert from 'node:assert/strict';
import { mapSdkState, formatDuration, formatMinor, denialMessage, OUTCOMES } from '../src/utils/voiceCall.js';

test('SDK states map to UI phases; unknown states never look active', () => {
  assert.equal(mapSdkState('active'), 'active');
  assert.equal(mapSdkState('HELD'), 'held');
  assert.equal(mapSdkState('early'), 'ringing');
  for (const s of ['hangup', 'destroy', 'purge']) assert.equal(mapSdkState(s), 'ended');
  assert.equal(mapSdkState('something-new'), 'connecting');
  assert.equal(mapSdkState(undefined), 'connecting');
});
test('durations format as m:ss and h:mm:ss', () => {
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(65), '1:05');
  assert.equal(formatDuration(3725), '1:02:05');
  assert.equal(formatDuration(-4), '0:00');
});
test('minor units display without losing the value', () => {
  assert.match(formatMinor('12345', 'INR'), /123\.45/);
  assert.equal(formatMinor(null), '—');
});
test('server denial codes become actionable copy, with safe fallbacks', () => {
  assert.match(denialMessage({ response: { data: { code: 'INSUFFICIENT_BALANCE' } } }), /Recharge/);
  assert.equal(denialMessage({ response: { data: { error: 'Custom', code: 'X' } } }), 'Custom');
  assert.match(denialMessage({}), /Cannot reach the server/);
});
test('all required outcomes are offered', () => {
  const v = OUTCOMES.map(o => o.value);
  for (const o of ['connected', 'no_answer', 'busy', 'wrong_number', 'interested', 'not_interested', 'follow_up_required']) assert.ok(v.includes(o));
});

import { decimalToUnits, toMinor, toMicro, percentToBps } from '../src/utils/voiceCall.js';
test('money input is converted with integer math only, and malformed input is refused', () => {
  assert.equal(toMinor('123.45'), '12345');
  assert.equal(toMinor('1000'), '100000');
  assert.equal(toMinor('0.07'), '7');
  assert.equal(toMinor('0.1'), '10');
  assert.equal(toMinor('19.99'), '1999'); // a float would give 1998.9999…
  assert.equal(toMicro('1.5'), '1500000');
  assert.equal(toMicro('0.000001'), '1');
  assert.equal(percentToBps('15'), '1500');
  assert.equal(percentToBps('12.5'), '1250');
  for (const bad of ['', '-5', '1e3', '1,000', 'abc', '1.234', '.5', ' ', '99999999999999']) assert.equal(toMinor(bad), null, bad);
  assert.equal(decimalToUnits('0', 2), '0');
});

import { hangupReason, CAPACITY_MESSAGE } from '../src/utils/voiceCall.js';
test('a SIP 403 channel-limit hangup is recognised as "all lines busy"; other endings are not', () => {
  assert.equal(hangupReason({ sipCode: 403, sipReason: 'User channel limit exceeded D1' }), 'capacity');
  assert.equal(hangupReason({ sipCode: '403', cause: 'Channel limit exceeded' }), 'capacity');
  assert.equal(hangupReason({ sipCode: 403, sipReason: 'Forbidden' }), null);            // some other 403
  assert.equal(hangupReason({ sipCode: 486, sipReason: 'User channel limit exceeded' }), null); // busy is not capacity
  assert.equal(hangupReason({ sipCode: 200, sipReason: 'OK', cause: 'NORMAL_CLEARING' }), null);
  assert.equal(hangupReason(null), null);
  assert.match(CAPACITY_MESSAGE, /lines are busy/);
});

import { isFirstCall } from '../src/utils/voiceCall.js';
test('first call = no earlier call that reached the network; the current authorization does not count', () => {
  const cur = 'auth-now';
  assert.equal(isFirstCall([{ id: cur, status: 'authorized' }], cur), true);                 // only this attempt
  assert.equal(isFirstCall([], cur), true);
  assert.equal(isFirstCall([{ id: 'a', status: 'canceled' }, { id: 'b', status: 'failed' }, { id: 'c', status: 'expired' }], cur), true); // never reached the phone
  for (const status of ['completed', 'no_answer', 'busy', 'answered', 'ringing']) assert.equal(isFirstCall([{ id: 'old', status }], cur), false, status);
  assert.equal(isFirstCall(undefined, cur), true);                                          // unreadable history: show the reminder
  assert.equal(isFirstCall('oops', cur), true);
});

import { playbookTips } from '../src/utils/voiceCall.js';
test('playbook tips are trimmed to a few lines, tolerate junk, and are null when empty', () => {
  assert.equal(playbookTips(null), null);
  assert.equal(playbookTips({}), null);
  assert.equal(playbookTips({ best_practices: [], common_objections: [], phrases_that_work: 'oops', phrases_to_avoid: null }), null);
  const t = playbookTips({
    best_practices: ['  Ask about budget early  ', '', 5, 'b2', 'b3', 'b4'],
    common_objections: [{ objection: 'Too expensive', recommended_response: 'Show ROI' }, { objection: '  ' }, { objection: 'Later' }, null],
    phrases_that_work: ['p1'], phrases_to_avoid: ['a1'],
  });
  assert.deepEqual(t.practices, ['Ask about budget early', 'b2', 'b3']);          // trimmed, junk dropped, max 3
  assert.deepEqual(t.objections, [{ objection: 'Too expensive', response: 'Show ROI' }, { objection: 'Later', response: '' }]);
  assert.deepEqual(t.phrases, ['p1']); assert.deepEqual(t.avoid, ['a1']);
  assert.equal(playbookTips({ phrases_that_work: ['only this'] }).practices.length, 0);
});

import { callResult, durationText, chargeText, isStuck, allowedOutcomes, defaultOutcome, fillScript, timeAgo, lastCallLine, nextSteps, outcomeLabel, OUTCOME_OPTIONS } from '../src/utils/voiceCall.js';

const NOW = Date.parse('2026-11-06T12:00:00Z');
const call = (o) => ({ id: 'c', status: 'completed', started_at: '2026-11-06T11:00:00Z', ...o });

test('a failed or unanswered call is never shown as "Connected", whatever outcome the agent typed', () => {
  for (const status of ['failed', 'no_answer', 'busy', 'canceled']) {
    const r = callResult(call({ status, outcome: 'connected' }), NOW);
    assert.equal(r.connected, false, status); assert.equal(r.label, 'Not connected', status); assert.equal(r.outcome, null, status);
    assert.ok(r.reason, status);
  }
  assert.equal(callResult(call({ status: 'completed', answered_at: null, outcome: 'interested' }), NOW).connected, false); // "completed" without an answer is not a connection
  const ok = callResult(call({ status: 'completed', answered_at: '2026-11-06T11:00:05Z', outcome: 'interested' }), NOW);
  assert.deepEqual([ok.connected, ok.label, ok.outcome], [true, 'Connected', 'interested']);
});
test('reasons are plain: invalid number, busy, no answer, unreachable, with a generic fallback', () => {
  assert.equal(callResult(call({ status: 'failed', hangup_cause: 'unallocated_number' }), NOW).reason, 'Invalid number');
  assert.equal(callResult(call({ status: 'failed', hangup_cause: 'NETWORK_OUT_OF_ORDER' }), NOW).reason, 'Unreachable');
  assert.equal(callResult(call({ status: 'failed', hangup_cause: 'weird' }), NOW).reason, 'Couldn’t connect');
  assert.equal(callResult(call({ status: 'failed' }), NOW).reason, 'Couldn’t connect');
  assert.equal(callResult(call({ status: 'no_answer' }), NOW).reason, 'No answer');
  assert.equal(callResult(call({ status: 'busy' }), NOW).reason, 'Busy');
});
test('outcomes that fit a call that did not connect are kept (no answer, busy, wrong number)', () => {
  assert.equal(callResult(call({ status: 'failed', outcome: 'wrong_number' }), NOW).outcome, 'wrong_number');
  assert.equal(callResult(call({ status: 'no_answer', outcome: 'no_answer' }), NOW).outcome, 'no_answer');
  assert.equal(callResult(call({ status: 'busy', outcome: 'not_interested' }), NOW).outcome, null);
});
test('a call stuck on "initiating" for over 60 seconds is "Timed out" and can be retried', () => {
  const fresh = call({ status: 'initiating', started_at: new Date(NOW - 30_000).toISOString() });
  const old = call({ status: 'initiating', started_at: new Date(NOW - 61_000).toISOString() });
  assert.equal(isStuck(fresh, NOW), false); assert.equal(isStuck(old, NOW), true);
  assert.equal(callResult(fresh, NOW).label, 'Starting');
  const r = callResult(old, NOW); assert.deepEqual([r.label, r.retryable], ['Timed out', true]);
  assert.equal(isStuck(call({ status: 'ringing', started_at: new Date(NOW - 600_000).toISOString() }), NOW), false); // only "initiating" counts
  assert.equal(isStuck({ status: 'initiating' }, NOW), false); // no timestamp: do not guess
});
test('duration and charge show a dash unless the call connected', () => {
  const done = call({ status: 'completed', answered_at: '2026-11-06T11:00:05Z', duration_seconds: 75, customer_cost: '4200', currency: 'INR' });
  assert.equal(durationText(done), '1:15'); assert.match(chargeText(done), /42/);
  for (const status of ['failed', 'no_answer', 'busy', 'canceled', 'initiating']) {
    const c = call({ status, duration_seconds: 0, customer_cost: '0', currency: 'INR' });
    assert.equal(durationText(c), '—', status); assert.equal(chargeText(c), '—', status);
  }
  assert.equal(chargeText({ ...done, customer_cost: null }), '—');
});
test('only sensible outcomes are offered for a call that did not connect', () => {
  assert.deepEqual(allowedOutcomes(false).map((o) => o.value), ['no_answer', 'busy', 'wrong_number']);
  assert.equal(allowedOutcomes(true).length, OUTCOME_OPTIONS.length);
  assert.equal(defaultOutcome(true), 'connected'); assert.equal(defaultOutcome(false), 'no_answer');
  assert.deepEqual(OUTCOME_OPTIONS.map((o) => o.label), ['Connected', 'No answer', 'Busy', 'Wrong number', 'Not interested', 'Call back later']);
  assert.equal(OUTCOME_OPTIONS.find((o) => o.label === 'Call back later').value, 'follow_up_required'); // maps onto the API's existing value
  assert.equal(outcomeLabel('interested'), 'Interested'); assert.equal(outcomeLabel(null), '');
});
test('script placeholders are filled in for the lead and the agent', () => {
  assert.equal(fillScript('Hi [Name], this is [Your name] from Salonox.', { name: 'Shani', agent: 'Avi' }), 'Hi Shani, this is Avi from Salonox.');
  assert.equal(fillScript('Hello [name]! I am [ YOUR NAME ].', { name: 'A', agent: 'B' }), 'Hello A! I am B.');
  assert.equal(fillScript('Hi [Name]', {}), 'Hi there');
  assert.equal(fillScript('No placeholders'), 'No placeholders'); assert.equal(fillScript(null), '');
  assert.equal(fillScript('[Name] and [Name]', { name: 'Z' }), 'Z and Z');
});
test('relative time and the "Last call" line use the newest finished call', () => {
  assert.equal(timeAgo('2026-11-06T11:59:30Z', NOW), 'just now'); assert.equal(timeAgo('2026-11-06T11:15:00Z', NOW), '45m ago');
  assert.equal(timeAgo('2026-11-06T09:00:00Z', NOW), '3h ago'); assert.equal(timeAgo('2026-11-05T09:00:00Z', NOW), 'yesterday'); assert.equal(timeAgo('2026-11-01T09:00:00Z', NOW), '5d ago');
  assert.equal(timeAgo(null, NOW), '');
  const calls = [call({ id: 'a', status: 'no_answer', started_at: '2026-11-06T09:00:00Z', ended_at: '2026-11-06T09:00:30Z' }), call({ id: 'b', status: 'initiating', started_at: '2026-11-06T11:59:00Z' })];
  assert.equal(lastCallLine(calls, NOW), 'Last call: 2h ago, No answer'); // the in-progress one is ignored
  assert.equal(lastCallLine([call({ status: 'completed', answered_at: '2026-11-06T10:00:05Z', ended_at: '2026-11-06T10:05:00Z', outcome: 'interested' })], NOW), 'Last call: 1h ago, Interested');
  assert.equal(lastCallLine([], NOW), null); assert.equal(lastCallLine(undefined, NOW), null);
});
test('next-step suggestions follow the outcome and never act on their own', () => {
  assert.deepEqual(nextSteps('no_answer', false).map((s) => s.key), ['retry', 'whatsapp']);
  assert.deepEqual(nextSteps('busy', false).map((s) => s.key), ['retry', 'whatsapp']);
  assert.deepEqual(nextSteps('not_interested', true).map((s) => s.key), ['lost']);
  assert.deepEqual(nextSteps('connected', true).map((s) => s.key), ['demo', 'brochure']);
  assert.deepEqual(nextSteps('interested', true).map((s) => s.key), ['demo', 'brochure']);
  assert.deepEqual(nextSteps('wrong_number', false), []); assert.deepEqual(nextSteps('follow_up_required', true), []);
  assert.equal(nextSteps('not_interested', true)[0].label, 'Mark as Lost?');
});
