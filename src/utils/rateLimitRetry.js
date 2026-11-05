// When the API says "slow down" (429) for a READ and the wait is short, retry quietly instead of showing an
// error. Writes are never retried (not idempotent). Long waits (limit window nearly full) are surfaced to the
// user with the server's message, which says how long to wait.
export const MAX_RETRIES = 2;
export const MAX_AUTO_WAIT_SECONDS = 15;

export const retryAfterSeconds = (err) => {
  const header = Number(err?.response?.headers?.['retry-after']);
  const body = Number(err?.response?.data?.retryAfterSeconds);
  const s = Number.isFinite(header) && header > 0 ? header : (Number.isFinite(body) && body > 0 ? body : null);
  return s;
};

// ms to wait before retrying, or null to give up. `random` is injectable for tests.
export const retryDelayMs = (err, random = Math.random) => {
  const cfg = err?.config;
  if (!cfg || err?.response?.status !== 429) return null;
  if (String(cfg.method || 'get').toLowerCase() !== 'get') return null;
  if (cfg.signal?.aborted) return null;
  if ((cfg.__rateLimitRetries || 0) >= MAX_RETRIES) return null;
  const s = retryAfterSeconds(err);
  if (s === null || s > MAX_AUTO_WAIT_SECONDS) return null;
  return Math.round(s * 1000 + random() * 500); // small jitter so many tabs don't retry in lockstep
};
