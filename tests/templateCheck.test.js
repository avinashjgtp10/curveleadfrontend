import test from 'node:test';
import assert from 'node:assert/strict';
import { findTemplate, templateStatus } from '../src/utils/templateCheck.js';

const t = (name, status = 'APPROVED', language = 'en_US') => ({ name, status, language });
const list = [t('demo_confirmation'), t('visit_confirmation', 'PENDING'), t('multi', 'REJECTED', 'en'), t('multi', 'APPROVED', 'hi')];

test('matching ignores case and spaces; any approved language variant makes it approved', () => {
  assert.equal(findTemplate(list, ' DEMO_Confirmation ').state, 'verified');
  assert.equal(findTemplate(list, 'multi').language, 'hi');
  assert.equal(findTemplate(list, 'visit_confirmation').state, 'not_approved');
  assert.equal(findTemplate(list, 'gone').state, 'not_found');
  assert.equal(findTemplate(list, '').state, 'none');
  assert.equal(findTemplate(undefined, 'x').state, 'not_found');
});
test('"not found" is only ever said after the list loaded successfully', () => {
  assert.equal(templateStatus({ value: 'demo_confirmation', listState: 'loading', templates: [] }).state, 'checking');
  const failed = templateStatus({ value: 'demo_confirmation', listState: 'error', templates: [] });
  assert.equal(failed.state, 'unverified'); assert.equal(failed.tone, 'warn'); assert.match(failed.text, /may still be fine/);
  assert.equal(templateStatus({ value: 'gone', listState: 'ready', templates: list }).state, 'not_found');
  assert.equal(templateStatus({ value: 'gone', listState: 'ready', templates: [] }).tone, 'bad');
});
test('a loaded list verifies the template and shows which state a non-approved one is in', () => {
  const ok = templateStatus({ value: 'demo_confirmation', listState: 'ready', templates: list });
  assert.deepEqual([ok.state, ok.tone], ['verified', 'ok']); assert.match(ok.text, /Verified/); assert.match(ok.text, /en_US/);
  const pending = templateStatus({ value: 'visit_confirmation', listState: 'ready', templates: list });
  assert.deepEqual([pending.state, pending.tone], ['not_approved', 'warn']); assert.match(pending.text, /is pending/);
});
test('the server\'s verdict wins when there is one', () => {
  const v = templateStatus({ value: 'x', check: { state: 'verified', language: 'en_US' }, listState: 'error', templates: [] });
  assert.equal(v.state, 'verified'); assert.equal(v.tone, 'ok');
  const bad = templateStatus({ value: 'x', check: { state: 'not_found', message: 'Template "x" wasn\'t found in your WhatsApp account.' }, listState: 'ready', templates: list });
  assert.deepEqual([bad.state, bad.tone], ['not_found', 'bad']); assert.match(bad.text, /wasn't found/);
  const unv = templateStatus({ value: 'x', check: { state: 'unverified', message: 'Reconnect WhatsApp' }, listState: 'ready', templates: list });
  assert.deepEqual([unv.state, unv.tone, unv.text], ['unverified', 'warn', 'Reconnect WhatsApp']);
});
test('no template chosen means nothing to check', () => {
  for (const v of ['', '  ', null, undefined]) assert.equal(templateStatus({ value: v, listState: 'ready', templates: list }).state, 'none');
});
