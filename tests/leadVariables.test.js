import test from 'node:test';
import assert from 'node:assert/strict';
import { LEAD_VARIABLES, TEMPLATE_FIELD_OPTIONS, unknownVariables, fillExamples } from '../src/utils/leadVariables.js';

test('the five message variables map onto the stored lead fields; {{city}} is the lead\'s location', () => {
  assert.deepEqual(LEAD_VARIABLES.map((v) => v.token), ['{{name}}', '{{phone}}', '{{email}}', '{{city}}', '{{source}}']);
  assert.equal(LEAD_VARIABLES.find((v) => v.key === 'city').field, 'location');
});
test('template slot options keep the stored values the server validates', () => {
  assert.deepEqual(TEMPLATE_FIELD_OPTIONS.map((o) => o.value), ['name', 'phone', 'email', 'location', 'source', 'product', 'literal']);
  assert.equal(TEMPLATE_FIELD_OPTIONS.find((o) => o.value === 'location').label, 'City or location');
  assert.equal(TEMPLATE_FIELD_OPTIONS.find((o) => o.value === 'literal').label, 'Fixed text');
});
test('variables the system will not fill are found, once each, with a suggestion when there is an obvious one', () => {
  assert.deepEqual(unknownVariables('Hi {{name}}, from {{city}} via {{source}}. Call {{phone}} or {{email}}'), []);
  assert.deepEqual(unknownVariables('Hi {{first_name}} in {{location}}, {{ Location }} again, {{coupon}}'),
    [{ token: '{{first_name}}', suggestion: '{{name}}' }, { token: '{{location}}', suggestion: '{{city}}' }, { token: '{{coupon}}', suggestion: null }]);
  assert.deepEqual(unknownVariables('Slots {{1}} and {{2}} are template numbers'), []);
  assert.deepEqual(unknownVariables('Hi {{NAME}}'), []); // case does not matter, the server ignores it too
  assert.deepEqual(unknownVariables(null), []);
});
test('previews fill in example values', () => {
  assert.equal(fillExamples('Hi {{name}} from {{CITY}}, via {{source}}'), 'Hi Priya from Baramati, via meta ads');
  assert.equal(fillExamples(null), '');
});
