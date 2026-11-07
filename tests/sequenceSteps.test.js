import test from 'node:test';
import assert from 'node:assert/strict';
import { stepWhat, stepSentence, slotExample, previewTemplateBody, usesAdvanced } from '../src/utils/sequenceSteps.js';
import { unitFor, delayValue } from '../src/utils/delay.js';

test('what a step sends, in a few words', () => {
  assert.equal(stepWhat({ channel: 'whatsapp' }), 'a WhatsApp message');
  assert.equal(stepWhat({ channel: 'email' }), 'an email');
  assert.equal(stepWhat({ channel: 'whatsapp', ai_generated: true }), 'an AI-written message');
  assert.equal(stepWhat({ channel: 'whatsapp', always_template: true, approved_template_name: 'welcome' }), 'the template “welcome”');
  assert.equal(stepWhat({ channel: 'whatsapp', always_template: true }), 'a WhatsApp message'); // no template picked yet
  assert.equal(stepWhat({ channel: 'email', ai_generated: true }), 'an email');
});
test('the sentence for a step', () => {
  const s = (over, idx, opts) => stepSentence({ channel: 'whatsapp', ...over }, idx, opts);
  assert.equal(s({ delay_minutes: 0 }, 0), 'Send a WhatsApp message straight away');
  assert.equal(s({ delay_minutes: 0 }, 2), 'Send a WhatsApp message right after the previous step');
  assert.equal(s({ delay_minutes: 1440 }, 0), 'Wait 1 day, then send a WhatsApp message');
  assert.equal(s({ delay_minutes: 180 }, 1), 'Wait 3 hours, then send a WhatsApp message');
  assert.equal(s({ delay_minutes: 1440 }, 1, { stopOnReply: true }), 'If no reply after 1 day, send a WhatsApp message');
  assert.equal(s({ delay_minutes: 1440 }, 0, { stopOnReply: true }), 'Wait 1 day, then send a WhatsApp message'); // the first step has nothing to reply to
  assert.equal(s({ delay_minutes: 90, channel: 'email' }, 3, { stopOnReply: true }), 'If no reply after 1 hour 30 minutes, send an email');
  assert.equal(stepSentence({}, 0), 'Send a WhatsApp message straight away');
});
test('template gaps are previewed with an example of the detail chosen for each', () => {
  assert.equal(slotExample({ field: 'name' }), 'Priya'); assert.equal(slotExample({ field: 'location' }), 'Baramati');
  assert.equal(slotExample({ field: 'literal', value: 'Diwali' }), 'Diwali'); assert.equal(slotExample({ field: 'literal' }), '…');
  assert.equal(slotExample({ field: 'product' }), 'Haircut'); assert.equal(slotExample(undefined), 'Priya');
  assert.equal(previewTemplateBody('Hi {{1}} from {{2}}, {{3}}!', [{ field: 'name' }, { field: 'location' }, { field: 'literal', value: 'welcome' }]), 'Hi Priya from Baramati, welcome!');
  assert.equal(previewTemplateBody('Hi {{1}} {{2}}', []), 'Hi Priya Priya'); assert.equal(previewTemplateBody(null), '');
});
test('advanced options stay open when a step already uses one', () => {
  assert.equal(usesAdvanced({}), false);
  for (const step of [{ always_template: true }, { approved_template_name: 'x' }, { ai_generated: true }, { template_parameters: [{ field: 'name' }] }, { reply_routes: [{}] }]) assert.equal(usesAdvanced(step), true);
  assert.equal(usesAdvanced({ template_parameters: [], reply_routes: [] }), false);
});
test('the delay helpers match what the editor shows', () => {
  assert.equal(unitFor({ delay_minutes: 1440 }), 'days'); assert.equal(unitFor({ delay_minutes: 1440, delay_unit: 'hours' }), 'hours'); assert.equal(unitFor({}), 'hours');
  assert.equal(delayValue({ delay_minutes: 2880 }), 2); assert.equal(delayValue({ delay_minutes: 1440, delay_unit: 'hours' }), 24); assert.equal(delayValue({ delay_minutes: 0 }), '');
});
