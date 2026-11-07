import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFailure } from '../src/utils/failureReason.js';

test('nothing stored is reported as such, never invented', () => {
  for (const v of [null, undefined, '', '   ']) {
    const r = parseFailure(v); assert.equal(r.recorded, false); assert.equal(r.code, null); assert.equal(r.text, 'Reason not recorded');
  }
});
test('a stored "[code] reason" splits into a code and plain text', () => {
  const r = parseFailure('[131026] This number can’t receive WhatsApp messages.');
  assert.deepEqual([r.recorded, r.code], [true, '131026']); assert.equal(r.text, 'This number can’t receive WhatsApp messages.');
  assert.equal(parseFailure('[131049]  Meta chose not to deliver this.').text, 'Meta chose not to deliver this.');
});
test('text without a code is kept as written', () => {
  const r = parseFailure('Recipient phone number not a valid WhatsApp user'); assert.equal(r.code, null); assert.equal(r.text, 'Recipient phone number not a valid WhatsApp user');
});
test('technical wording is replaced by plain language for known codes, and a generic line for unknown ones', () => {
  assert.match(parseFailure('[131047] (#131047) Re-engagement message OAuthException').text, /24 hours/);
  assert.match(parseFailure('[190] OAuthException: Error validating access token').text, /login has expired/);
  assert.equal(parseFailure('[999999] OAuthException unknown').text, 'WhatsApp couldn’t deliver this message (technical error).');
  assert.equal(parseFailure('Request failed with status code 500').text, 'WhatsApp couldn’t deliver this message (technical error).');
  assert.equal(parseFailure('[131026]').text, 'This number can’t receive WhatsApp messages.'); // code only: use the known explanation
  assert.equal(parseFailure('[777777]').text, 'WhatsApp couldn’t deliver this message.');
});
test('the raw text is always kept so it can be shown on hover', () => {
  assert.equal(parseFailure('[190] OAuthException x').raw, '[190] OAuthException x');
});
