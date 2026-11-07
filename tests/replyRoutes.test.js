import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PATH_TEXT, templateButtons, routesFromButtons, unroutedButtons, routeIssue } from '../src/utils/replyRoutes.js';
import { reviewSequence } from '../src/utils/sequenceReview.js';

const tpl = (category = 'UTILITY', buttons = [{ type: 'QUICK_REPLY', text: 'Yes' }, { type: 'QUICK_REPLY', text: 'No' }, { type: 'URL', text: 'Open' }]) =>
  ({ name: 'demo_confirm', language: 'en', status: 'APPROVED', category, components: [{ type: 'BODY', text: 'Hi {{1}}' }, { type: 'BUTTONS', buttons }] });
const j = (v) => JSON.parse(JSON.stringify(v));

test('only quick-reply buttons become routes, in order, and nothing existing is changed', () => {
  assert.deepEqual(j(templateButtons(tpl())), ['Yes', 'No']);
  const existing = [{ answer: 'yes!', classification: 'Keen', aliases: ['sure'], sequence_id: 's1' }];
  const routes = routesFromButtons(tpl(), existing);
  assert.deepEqual(j(routes[0]), existing[0]);
  assert.deepEqual(j(routes.slice(1)), [{ answer: 'No', classification: 'No', aliases: [], sequence_id: '' }]);
  assert.deepEqual(j(unroutedButtons(tpl(), routes)), []);
  assert.equal(routesFromButtons(tpl('UTILITY', []), []).length, 0);
});
test('a route needs an answer and a sequence; the default path wording is explicit', () => {
  assert.match(routeIssue({ answer: '', sequence_id: 's' }), /answer/);
  assert.match(routeIssue({ answer: 'Yes', sequence_id: '' }), /sequence/);
  assert.equal(routeIssue({ answer: 'Yes', sequence_id: 's' }), null);
  assert.equal(DEFAULT_PATH_TEXT, 'Any other reply goes to a team member to review.');
});

const step = (o = {}) => ({ channel: 'whatsapp', delay_minutes: 0, message: 'Hi', approved_template_name: 'demo_confirm', template_language: 'en', reply_routes: [], ...o });
const review = (form, extra = {}) => reviewSequence({ form: { stop_conditions: { on_reply: true }, ...form }, templates: [tpl()], triggers: [{ label: 'a new lead arrives' }], ...extra });
const tone = (r, key) => r.checks.find((c) => c.key === key)?.tone;

test('review: approved template, matching category and stop conditions all pass', () => {
  const r = review({ steps: [step()] });
  assert.deepEqual(['templates', 'category', 'optin', 'stops'].map((k) => tone(r, k)), ['ok', 'ok', 'ok', 'ok']);
  assert.equal(r.blocking, false);
  assert.match(r.summary[0], /Starts when a new lead arrives/);
});
test('review: a missing/unapproved template blocks, and a step with none warns about the 24-hour window', () => {
  const bad = review({ steps: [step({ approved_template_name: 'gone' })] });
  assert.equal(tone(bad, 'templates'), 'bad'); assert.equal(bad.blocking, true);
  const none = review({ steps: [step({ approved_template_name: '', template_language: '' })] });
  assert.equal(tone(none, 'templates'), 'warn'); assert.match(none.checks[0].text, /24 hours/);
});
test('review: Marketing used for a confirmation warns and reports opt-in coverage', () => {
  const r = review({ steps: [step()] }, { templates: [tpl('MARKETING')], optIn: { total: 10, opted_in: 4 } });
  assert.equal(tone(r, 'category'), 'warn');
  assert.equal(tone(r, 'optin'), 'warn');
  assert.match(r.checks.find((c) => c.key === 'optin').text, /4 of 10 leads \(40%\)/);
});
test('review: nothing stopping it warns; button routes, the default path and business hours are stated', () => {
  const none = review({ stop_conditions: {}, steps: [step()] });
  assert.equal(tone(none, 'stops'), 'warn');
  const r = review({ stop_conditions: {}, steps: [step({ reply_routes: [{ answer: 'Yes', sequence_id: 's' }], business_hours_only: true })] });
  assert.equal(tone(r, 'stops'), 'ok');
  assert.match(r.checks.find((c) => c.key === 'default').text, /team member to review/);
  assert.match(r.checks.find((c) => c.key === 'hours').text, /time zone/);
});
