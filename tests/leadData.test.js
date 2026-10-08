import test from 'node:test';
import assert from 'node:assert/strict';
import { initials, sourceLabel, normalizePhone } from '../src/utils/leadData.js';
test('Unicode initials preserve graphemes and normalize mathematical letters', () => {
  assert.equal(initials('𝐒𝐮𝐧𝐢𝐭𝐚 Sharma'), 'SS');
  assert.equal(initials('👩🏽‍💻 Developer'), '👩🏽‍💻D');
  assert.equal(initials(''), '?');
});
test('source labels use one canonical display map', () => {
  assert.equal(sourceLabel('Manual'), sourceLabel('manual'));
  assert.equal(sourceLabel('Google_ads'), 'Google Ads');
  assert.equal(sourceLabel('meta_ads'), 'Meta Ads');
});
test('Indian phone variants become E.164; invalid numbers are rejected', () => {
  for (const p of ['8980235151','918980235151','+91 89802 35151']) assert.equal(normalizePhone(p), '+918980235151');
  assert.equal(normalizePhone('+1 213 373 4253'), '+12133734253');
  for (const p of ['+99917935110','abc8980235151','', '123']) assert.throws(() => normalizePhone(p));
});
