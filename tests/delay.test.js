import test from 'node:test';
import assert from 'node:assert/strict';
import { bestUnit, describeDelay, DELAY_UNIT_MINUTES } from '../src/utils/delay.js';

test('the friendliest exact unit is chosen', () => {
  assert.equal(bestUnit(1440), 'days'); assert.equal(bestUnit(2880), 'days'); assert.equal(bestUnit(120), 'hours'); assert.equal(bestUnit(60), 'hours');
  assert.equal(bestUnit(90), 'minutes'); assert.equal(bestUnit(45), 'minutes'); assert.equal(bestUnit(1500), 'hours');
  for (const empty of [0, null, undefined, '', -5, NaN, 'abc']) assert.equal(bestUnit(empty), 'hours'); // new steps default to hours
});
test('delays read the way people say them', () => {
  assert.equal(describeDelay(0), 'Immediately'); assert.equal(describeDelay(null), 'Immediately');
  assert.equal(describeDelay(1440), '1 day'); assert.equal(describeDelay(2880), '2 days'); assert.equal(describeDelay(10080), '7 days');
  assert.equal(describeDelay(60), '1 hour'); assert.equal(describeDelay(180), '3 hours'); assert.equal(describeDelay(1), '1 minute'); assert.equal(describeDelay(45), '45 minutes');
  assert.equal(describeDelay(90), '1 hour 30 minutes'); assert.equal(describeDelay(1500), '1 day 1 hour'); assert.equal(describeDelay(1530), '1 day 1 hour 30 minutes');
});
test('unit factors are minutes', () => { assert.deepEqual(DELAY_UNIT_MINUTES, { minutes: 1, hours: 60, days: 1440 }); });
