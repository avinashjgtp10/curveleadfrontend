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
