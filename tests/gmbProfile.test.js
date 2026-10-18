import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bandOf, checklist, googleProblem, addressText, googleReviewLink, pctText, numberText, DAY_OPTIONS } from '../src/utils/gmbProfile.js';

test('score bands are labelled, and an unknown score is not shown as a failure', () => {
  assert.equal(bandOf({ band: 'strong' }).label, 'Strong');
  assert.equal(bandOf({ band: 'weak' }).label, 'Needs work');
  assert.equal(bandOf(undefined).label, 'Not enough information');
  assert.equal(bandOf({ band: 'invented' }).label, 'Not enough information');
});

test('checklist: done items say why they matter, missing ones say what to do, unknown ones say Google did not tell us', () => {
  const rows = checklist({ checks: [
    { id: 'phone', label: 'Phone number', ok: true, why: 'Customers call.', fix: null },
    { id: 'website', label: 'Website', ok: false, why: 'Sends visitors.', fix: 'Add your website address.' },
    { id: 'verified', label: 'Verified listing', ok: null, why: 'x', fix: 'y' }] });
  assert.deepEqual(rows.map((r) => [r.id, r.status, r.text]), [
    ['phone', 'ok', 'Customers call.'], ['website', 'todo', 'Add your website address.'], ['verified', 'unknown', 'Google did not tell us this.']]);
  assert.deepEqual(checklist(undefined), []);
});

test('Google problems are turned into customer-safe messages, and an expired connection asks to reconnect', () => {
  assert.deepEqual(googleProblem({ ok: false, code: 'rate_limited', message: 'Google is busy' }), { code: 'rate_limited', message: 'Google is busy', reconnect: false });
  assert.equal(googleProblem({ ok: false, code: 'reconnect', message: 'expired' }).reconnect, true);
  assert.equal(googleProblem(null, { response: { status: 401, data: {} } }).reconnect, true);
  assert.equal(googleProblem(null, { response: { status: 400 } }).code, 'not_connected');
  assert.equal(googleProblem(null, new Error('network')).code, 'error');
  assert.equal(googleProblem({ ok: true, locations: [] }), null, 'no problem when the call worked');
});

test('address text, review link choice and number formats', () => {
  assert.equal(addressText({ lines: ['12 MG Road'], locality: 'Pune', region: 'MH', postal_code: '411001' }), '12 MG Road, Pune, MH, 411001');
  assert.equal(addressText(undefined), '');
  const locs = [{ id: 'locations/1', details: { review_url: 'https://r/1' } }, { id: 'locations/2', details: { review_url: null } }];
  assert.equal(googleReviewLink(locs, 'locations/1'), 'https://r/1');
  assert.equal(googleReviewLink(locs, 'locations/2'), null, 'a selected location without a link gives none, not another location\'s link');
  assert.equal(googleReviewLink(locs), 'https://r/1', 'default is the first location');
  assert.equal(googleReviewLink([], 'x'), null);
  assert.equal(pctText(null), '—'); assert.equal(pctText(5.6), '5.6%');
  assert.equal(numberText(1234567), '12,34,567'); assert.equal(numberText(undefined), '0');
  assert.deepEqual(DAY_OPTIONS.map(([d]) => d), [7, 30, 90, 365]);
});

test('the page wires the new tabs, only for a connected workspace, and never overwrites the saved review link on its own', () => {
  const page = fs.readFileSync(new URL('../src/pages/GmbPage.jsx', import.meta.url), 'utf8');
  assert.match(page, /id: 'profile', label: 'Profile'/);
  assert.match(page, /tab\.id === 'profile' \? \(gmb\.gmb_connected \? <GmbProfileTab \/>/);
  assert.match(page, /tab\.id === 'insights' \? \(gmb\.gmb_connected \? <GmbInsightsTab \/>/);
  assert.match(page, /onClick=\{fillFromGoogle\}/);
  const effect = page.slice(page.indexOf('const ReviewRequestsTab'), page.indexOf('const fillFromGoogle'));
  assert.doesNotMatch(effect, /gmbAPI\.profiles/, 'the profile is fetched only when the person clicks, not on load');
});
