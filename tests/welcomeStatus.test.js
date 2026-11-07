import test from 'node:test';
import assert from 'node:assert/strict';
import { welcomeStatus } from '../src/utils/welcomeStatus.js';

const on = { enabled: true, template: 'welcome_msg', message: '' };
const rule = (over = {}) => ({ trigger_type: 'new_lead', is_active: true, sequence_name: 'Nurture', ...over });

test('nothing set up', () => {
  for (const input of [undefined, {}, { responder: { enabled: false, template: 'x' }, rules: [] }]) {
    const s = welcomeStatus(input); assert.equal(s.state, 'none'); assert.equal(s.tone, 'muted');
  }
});
test('a welcome template alone is fine', () => {
  const s = welcomeStatus({ responder: on, rules: [] });
  assert.deepEqual([s.state, s.tone], ['welcome', 'ok']); assert.match(s.detail, /welcome_msg/); assert.equal(s.welcome.textOnly, false);
});
test('a plain-text welcome warns that it only reaches people who already messaged', () => {
  const s = welcomeStatus({ responder: { enabled: true, template: '', message: 'Hi {{name}}' }, rules: [] });
  assert.deepEqual([s.state, s.tone, s.welcome.textOnly], ['welcome', 'warn', true]); assert.match(s.detail, /24 hours/); assert.match(s.detail, /Choose a template/);
});
test('switched on with nothing to send is called out', () => {
  const s = welcomeStatus({ responder: { enabled: true, template: ' ', message: '' }, rules: [] });
  assert.deepEqual([s.state, s.tone], ['incomplete', 'warn']);
  assert.match(welcomeStatus({ responder: { enabled: true }, rules: [rule()] }).detail, /still start .Nurture./);
});
test('only active new-lead rules count, by their sequence name', () => {
  const rules = [rule({ is_active: false, sequence_name: 'Old' }), rule({ trigger_type: 'stage_change', sequence_name: 'Stage' }), rule({ sequence_name: 'Nurture' }), rule({ sequence_name: null, name: 'Welcome new leads' })];
  const s = welcomeStatus({ responder: { enabled: false }, rules });
  assert.equal(s.state, 'sequence'); assert.deepEqual(s.sequences, ['Nurture', 'Welcome new leads']); assert.equal(s.tone, 'ok');
  assert.equal(welcomeStatus({ responder: {}, rules: [rule({ is_active: false })] }).state, 'none');
  assert.equal(welcomeStatus({ responder: {}, rules: [rule({ is_active: undefined })] }).state, 'sequence'); // missing flag counts as active, like the server default
});
test('welcome message plus a new-lead sequence is a duplicate-message warning', () => {
  const s = welcomeStatus({ responder: on, rules: [rule()] });
  assert.deepEqual([s.state, s.tone], ['both', 'warn']); assert.match(s.headline, /Two things/); assert.match(s.detail, /Keep one/);
  assert.match(s.detail, /“Nurture”/);
});
test('garbage input does not throw', () => {
  assert.equal(welcomeStatus({ responder: null, rules: 'nope' }).state, 'none');
  assert.equal(welcomeStatus({ responder: on, rules: [null, 5] }).state, 'welcome');
});
