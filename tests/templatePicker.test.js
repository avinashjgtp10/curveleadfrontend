import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTemplate, categoryOf, isSystemTemplate, groupOf, groupTemplates, searchTemplates, fillSamples, marketingWarning } from '../src/utils/templatePicker.js';

test('both list shapes normalise to one', () => {
  const slim = normalizeTemplate({ name: 'welcome_msg', language: 'en', category: 'UTILITY', body_text: 'Hi {{1}}', variable_count: 1, header_format: 'IMAGE', unsupported: 'x' });
  assert.deepEqual([slim.key, slim.category, slim.body, slim.variableCount, slim.headerFormat, slim.status, slim.unsupported], ['welcome_msg::en', 'UTILITY', 'Hi {{1}}', 1, 'IMAGE', 'APPROVED', 'x']);
  const full = normalizeTemplate({ name: 'promo', language: 'en_US', category: 'marketing', status: 'PENDING', components: [{ type: 'HEADER', format: 'TEXT' }, { type: 'BODY', text: 'Hi {{1}}, {{2}} off, {{1}}' }] });
  assert.deepEqual([full.category, full.variableCount, full.headerFormat, full.status], ['MARKETING', 2, 'TEXT', 'PENDING']);
  assert.equal(normalizeTemplate({}).body, ''); assert.equal(normalizeTemplate(undefined).name, '');
});
test('unknown categories count as Marketing, like the server', () => {
  assert.equal(categoryOf({}), 'MARKETING'); assert.equal(categoryOf({ category: 'weird' }), 'MARKETING');
  assert.equal(categoryOf({ category: 'utility' }), 'UTILITY'); assert.equal(categoryOf({ category: 'AUTHENTICATION' }), 'AUTHENTICATION');
});
test('test, sample and id-stamped names are hidden; real names are not', () => {
  for (const n of ['hello_world', 'test_welcome', 'welcome_test', 'sample', 'my-test-template', 'promo_20251107', 'offer_a1b2c3d4', 'tmp_msg', 'welcome_123456']) assert.equal(isSystemTemplate(n), true, n);
  for (const n of ['welcome_message', 'demo_confirmation', 'visit_reminder_2', 'attestation', 'contest_winner', 'diwali_offer', 'followup_1', 'latest_offer', 'welcome', '', null]) assert.equal(isSystemTemplate(n), false, String(n));
});
test('templates group by purpose and the purpose\'s own group comes first', () => {
  assert.equal(groupOf('welcome_new_lead').id, 'welcome'); assert.equal(groupOf('demo_reminder').id, 'booking'); assert.equal(groupOf('quotation_followup').id, 'followup');
  assert.equal(groupOf('diwali_offer').id, 'offers'); assert.equal(groupOf('zzz').id, 'other');
  const items = ['zzz', 'diwali_offer', 'demo_confirmation', 'welcome_a', 'welcome_b'].map((name) => ({ name }));
  assert.deepEqual(groupTemplates(items, 'confirmation').map((g) => g.id), ['booking', 'welcome', 'offers', 'other']);
  assert.deepEqual(groupTemplates(items, 'welcome').map((g) => g.id), ['welcome', 'booking', 'offers', 'other']);
  assert.deepEqual(groupTemplates(items, 'any').map((g) => g.id), ['welcome', 'booking', 'offers', 'other']);
  assert.deepEqual(groupTemplates(items, 'welcome')[0].items.map((i) => i.name), ['welcome_a', 'welcome_b']);
  assert.deepEqual(groupTemplates([], 'welcome'), []);
});
test('search looks at the name and the text; sample values fill the variables', () => {
  const items = [{ name: 'a_msg', body: 'Your demo is booked' }, { name: 'b_msg', body: 'Thanks for visiting' }];
  assert.deepEqual(searchTemplates(items, 'DEMO').map((i) => i.name), ['a_msg']); assert.equal(searchTemplates(items, 'msg').length, 2); assert.equal(searchTemplates(items, '  ').length, 2);
  assert.equal(fillSamples('Hi {{1}}, see {{2}}. Bye {{1}} {{3}}', ['Priya', 'Fri 11 AM']), 'Hi Priya, see Fri 11 AM. Bye Priya {{3}}');
  assert.equal(fillSamples(null), '');
});
test('a Marketing template used for a welcome, confirmation or reminder gets a warning with the opted-in numbers', () => {
  const mk = { category: 'MARKETING' }; const ut = { category: 'UTILITY' };
  const w = marketingWarning({ template: mk, purpose: 'welcome', optIn: { total: 200, opted_in: 50 } });
  assert.equal(w.tone, 'warn'); assert.match(w.text, /Marketing template/); assert.match(w.text, /a welcome message/); assert.match(w.text, /50 of 200 leads \(25%\)/);
  assert.match(marketingWarning({ template: mk, purpose: 'confirmation' }).text, /a booking confirmation/);
  assert.doesNotMatch(marketingWarning({ template: mk, purpose: 'reminder', optIn: { total: 0, opted_in: 0 } }).text, /leads \(/); // no numbers when there are none to show
  assert.doesNotMatch(marketingWarning({ template: mk, purpose: 'reminder' }).text, /leads \(/);
  assert.equal(marketingWarning({ template: ut, purpose: 'welcome' }), null);          // Utility is the right category
  assert.equal(marketingWarning({ template: mk, purpose: 'broadcast' }), null);        // Marketing is fine for offers
  assert.equal(marketingWarning({ template: mk, purpose: 'any' }), null);
  assert.equal(marketingWarning({ template: null, purpose: 'welcome' }), null);
});
