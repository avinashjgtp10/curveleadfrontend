import test from 'node:test';
import assert from 'node:assert/strict';
import { retryDelayMs, retryAfterSeconds, MAX_RETRIES, MAX_AUTO_WAIT_SECONDS } from '../src/utils/rateLimitRetry.js';

const err429 = ({ method = 'get', retryHeader, retryBody, retries = 0, aborted = false, status = 429 } = {}) => ({
  config: { method, __rateLimitRetries: retries, signal: { aborted } },
  response: { status, headers: retryHeader === undefined ? {} : { 'retry-after': String(retryHeader) }, data: retryBody === undefined ? {} : { retryAfterSeconds: retryBody } },
});
const zero = () => 0;

test('a short 429 on a read is retried after Retry-After', () => {
  assert.equal(retryDelayMs(err429({ retryHeader: 3 }), zero), 3000);
  assert.equal(retryDelayMs(err429({ retryBody: 2 }), zero), 2000); // falls back to the body when the header is not exposed
  assert.equal(retryDelayMs(err429({ retryHeader: 3 }), () => 1), 3500); // jitter is at most 500ms
});
test('writes are never retried, and neither are other errors', () => {
  for (const m of ['post', 'put', 'delete', 'patch']) assert.equal(retryDelayMs(err429({ method: m, retryHeader: 1 }), zero), null);
  assert.equal(retryDelayMs(err429({ status: 500, retryHeader: 1 }), zero), null);
  assert.equal(retryDelayMs({ config: { method: 'get' } }, zero), null); // network error, no response
});
test('long waits are shown to the user rather than hammered', () => {
  assert.equal(retryDelayMs(err429({ retryHeader: MAX_AUTO_WAIT_SECONDS }), zero), MAX_AUTO_WAIT_SECONDS * 1000);
  assert.equal(retryDelayMs(err429({ retryHeader: MAX_AUTO_WAIT_SECONDS + 1 }), zero), null);
  assert.equal(retryDelayMs(err429({}), zero), null); // no hint at all
});
test('retries are bounded and cancelled requests are not revived', () => {
  assert.equal(retryDelayMs(err429({ retryHeader: 1, retries: MAX_RETRIES }), zero), null);
  assert.equal(retryDelayMs(err429({ retryHeader: 1, retries: MAX_RETRIES - 1 }), zero), 1000);
  assert.equal(retryDelayMs(err429({ retryHeader: 1, aborted: true }), zero), null);
});
test('garbage hints are ignored', () => {
  assert.equal(retryAfterSeconds(err429({ retryHeader: 'abc' })), null);
  assert.equal(retryAfterSeconds(err429({ retryHeader: -5 })), null);
});
