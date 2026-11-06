// Pure helpers for the calling UI (no React, no SDK) so they can be unit-tested.

// Telnyx SDK call states -> what the UI shows. Unknown states are treated as "connecting" (never "active").
export const mapSdkState = (state) => {
  switch (String(state || '').toLowerCase()) {
    case 'ringing': case 'early': return 'ringing';
    case 'active': return 'active';
    case 'held': return 'held';
    case 'hangup': case 'destroy': case 'purge': return 'ended';
    default: return 'connecting';
  }
};

export const formatDuration = (seconds) => {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const mm = String(m).padStart(2, '0'), ss = String(sec).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
};

// Minor units (paise/fils/cents, string or number) -> display. Display only; never used for arithmetic.
export const formatMinor = (minor, currency = 'INR') => {
  if (minor === null || minor === undefined) return '—';
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(minor) / 100); }
  catch { return `${currency} ${(Number(minor) / 100).toFixed(2)}`; }
};

export const OUTCOMES = [
  { value: 'connected', label: 'Connected' },
  { value: 'interested', label: 'Interested' },
  { value: 'not_interested', label: 'Not interested' },
  { value: 'follow_up_required', label: 'Follow-up required' },
  { value: 'no_answer', label: 'No answer' },
  { value: 'busy', label: 'Busy' },
  { value: 'wrong_number', label: 'Wrong number' },
];

// Server denial codes -> actionable copy. The server message is the fallback.
const DENIALS = {
  FORBIDDEN: 'You do not have permission to place calls. Ask an admin.',
  LEAD_NOT_OWNED: 'This lead is assigned to someone else.',
  ACCOUNT_INACTIVE: 'Calling is not enabled for your workspace yet.',
  ROUTE_DISABLED: 'Calls to this country are not enabled yet.',
  DESTINATION_NOT_ALLOWED: 'This country is not approved for your workspace.',
  INVALID_NUMBER: 'This lead\'s phone number is not valid for calling.',
  NO_VERIFIED_CALLER_ID: 'No verified caller ID is available. Ask an admin to add one.',
  NO_CONSENT: 'No contact consent is recorded for this lead.',
  OUTSIDE_CALLING_HOURS: 'It is outside permitted calling hours for this destination.',
  INSUFFICIENT_BALANCE: 'Your calling wallet balance is too low. Recharge to continue.',
  NO_WALLET: 'Your workspace has no calling wallet yet.',
  NO_RATE: 'No calling rate is configured for this destination.',
  DAILY_LIMIT: 'Daily calling limit reached.',
  AGENT_BUSY: 'You already have a call in progress (possibly on another device).',
};
export const denialMessage = (err) => {
  const d = err?.response?.data;
  return DENIALS[d?.code] || d?.error || (err?.response ? 'Could not start the call.' : 'Cannot reach the server. Check your connection.');
};

// "123.45" -> "12345" (decimals=2) without floats. null for anything that is not a plain non-negative decimal.
export const decimalToUnits = (input, decimals) => {
  const m = /^(\d{1,12})(?:\.(\d*))?$/.exec(String(input ?? '').trim());
  if (!m) return null;
  const frac = m[2] || '';
  if (frac.length > decimals) return null;
  return (m[1] + frac.padEnd(decimals, '0')).replace(/^0+(?=\d)/, '');
};
export const toMinor = (major) => decimalToUnits(major, 2);                // wallet amounts (paise/fils/cents)
export const toMicro = (major) => decimalToUnits(major, 6);                // per-minute rates (millionths)
export const percentToBps = (pct) => decimalToUnits(pct, 2);               // 15 -> "1500"
export const microToDisplay = (micro) => (micro == null ? '—' : (Number(micro) / 1e6).toFixed(4));

export const CAPACITY_MESSAGE = 'All call lines are busy right now. Please try again in a moment.';
// Why did the provider end a call that never connected? Telnyx documents a SIP 403 "User channel limit exceeded"
// when the account's concurrent-call limit is reached. Returns 'capacity' or null; fields are the SDK call's
// sipCode / sipReason / cause. Anything else is treated as a normal end of call.
export const hangupReason = (call) => {
  if (!call) return null;
  const text = `${call.sipReason || ''} ${call.cause || ''}`;
  return Number(call.sipCode) === 403 && /channel limit|limit exceeded/i.test(text) ? 'capacity' : null;
};

// "First call" = no earlier call to this lead that actually reached the phone network. The authorization created for the
// current attempt is excluded. If the history cannot be read, the caller should treat it as a first call (show the reminder).
const REACHED_NETWORK = ['ringing', 'answered', 'completed', 'no_answer', 'busy'];
export const isFirstCall = (calls, currentAuthorizationId) =>
  !(Array.isArray(calls) && calls.some((c) => c.id !== currentAuthorizationId && REACHED_NETWORK.includes(c.status)));

// Shapes the stored sales playbook (best_practices, common_objections, phrases_that_work, phrases_to_avoid; any of them may be
// missing or malformed) into a short list for the call dialog. Returns null when there is nothing worth showing.
const texts = (v, max) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()).slice(0, max) : []);
export const playbookTips = (playbook, max = 3) => {
  if (!playbook || typeof playbook !== 'object') return null;
  const objections = (Array.isArray(playbook.common_objections) ? playbook.common_objections : [])
    .filter((o) => o && typeof o.objection === 'string' && o.objection.trim())
    .map((o) => ({ objection: o.objection.trim(), response: typeof o.recommended_response === 'string' ? o.recommended_response.trim() : '' }))
    .slice(0, max);
  const tips = { practices: texts(playbook.best_practices, max), phrases: texts(playbook.phrases_that_work, max), avoid: texts(playbook.phrases_to_avoid, max), objections };
  return Object.values(tips).some((a) => a.length) ? tips : null;
};

// ---------------------------------------------------------------------------------------------------------------------
// Call UX helpers (status vs outcome, scripts, relative time, next steps). Pure and unit-tested.
// ---------------------------------------------------------------------------------------------------------------------

// UI outcome choices -> the values the API accepts. "Call back later" is stored as follow_up_required.
export const OUTCOME_OPTIONS = [
  { value: 'connected', label: 'Connected' },
  { value: 'no_answer', label: 'No answer' },
  { value: 'busy', label: 'Busy' },
  { value: 'wrong_number', label: 'Wrong number' },
  { value: 'not_interested', label: 'Not interested' },
  { value: 'follow_up_required', label: 'Call back later' },
];
const OUTCOME_LABEL = { ...Object.fromEntries(OUTCOME_OPTIONS.map((o) => [o.value, o.label])), interested: 'Interested' };
export const outcomeLabel = (v) => OUTCOME_LABEL[v] || (v ? String(v).replace(/_/g, ' ') : '');

// A call that never connected cannot have a conversational outcome. "Connected" / "Not interested" / "Call back later"
// need someone to have picked up, so they are not offered (and never shown) for a call that did not connect.
const NOT_CONNECTED_OUTCOMES = ['no_answer', 'busy', 'wrong_number'];
export const allowedOutcomes = (connected) => (connected ? OUTCOME_OPTIONS : OUTCOME_OPTIONS.filter((o) => NOT_CONNECTED_OUTCOMES.includes(o.value)));
export const defaultOutcome = (connected) => (connected ? 'connected' : 'no_answer');

// Telnyx hangup causes -> plain words. Unknown causes fall back to a generic reason. (The list endpoint does not return
// hangup_cause yet; this is used as soon as it does.)
const CAUSE_REASON = {
  unallocated_number: 'Invalid number', invalid_number: 'Invalid number', number_changed: 'Invalid number',
  user_busy: 'Busy', no_answer: 'No answer', timeout: 'No answer', originator_cancel: 'Cancelled',
  call_rejected: 'Rejected', destination_out_of_order: 'Unreachable', network_out_of_order: 'Unreachable', unreachable: 'Unreachable',
};
const STUCK_AFTER_MS = 60 * 1000;
const time = (v) => { const t = v ? new Date(v).getTime() : NaN; return Number.isNaN(t) ? null : t; };

// A call still "initiating" after 60 seconds never got off the ground.
export const isStuck = (call, nowMs = Date.now()) => {
  const t = time(call?.started_at) ?? time(call?.created_at);
  return call?.status === 'initiating' && t !== null && nowMs - t > STUCK_AFTER_MS;
};

/**
 * One truthful description of a call, whatever the agent typed as outcome.
 *   connected  : the other side answered
 *   label      : headline ("Connected", "Not connected", "In progress", "Timed out")
 *   reason     : why it did not connect (only when connected is false and the call is over)
 *   outcome    : the agent's outcome, but ONLY when it is consistent with what happened
 *   tone       : 'ok' | 'bad' | 'warn' | 'live' | 'muted' for colouring
 *   retryable  : the call did not connect and can be tried again
 */
export const callResult = (call, nowMs = Date.now()) => {
  const status = call?.status;
  const connected = !!call?.answered_at && status === 'completed';
  if (connected) return { connected: true, label: 'Connected', reason: null, outcome: call.outcome || null, tone: 'ok', retryable: false };
  if (status === 'answered') return { connected: true, label: 'In progress', reason: null, outcome: null, tone: 'live', retryable: false };
  if (status === 'ringing') return { connected: false, label: 'Ringing', reason: null, outcome: null, tone: 'live', retryable: false };
  if (status === 'initiating') {
    return isStuck(call, nowMs)
      ? { connected: false, label: 'Timed out', reason: 'The call never started', outcome: null, tone: 'warn', retryable: true }
      : { connected: false, label: 'Starting', reason: null, outcome: null, tone: 'live', retryable: false };
  }
  if (status === 'authorized') return { connected: false, label: 'Not started', reason: null, outcome: null, tone: 'muted', retryable: false };
  const byStatus = { no_answer: 'No answer', busy: 'Busy', canceled: 'Cancelled', failed: 'Couldn’t connect' };
  const fromCause = CAUSE_REASON[String(call?.hangup_cause || '').toLowerCase()];
  const reason = (status === 'failed' ? fromCause : null) || byStatus[status] || 'Couldn’t connect';
  const keep = NOT_CONNECTED_OUTCOMES.includes(call?.outcome) ? call.outcome : null; // never show "Connected" on a failed call
  return { connected: false, label: 'Not connected', reason, outcome: keep, tone: status === 'failed' ? 'bad' : 'muted', retryable: status === 'failed' || status === 'no_answer' || status === 'busy' };
};

// Duration and charge only mean something once the call connected; otherwise show a dash, never "0:00" or "0.00".
export const durationText = (call) => (callResult(call).connected && call?.duration_seconds != null ? formatDuration(call.duration_seconds) : '—');
export const chargeText = (call) => (callResult(call).connected && call?.customer_cost != null ? formatMinor(call.customer_cost, call.currency) : '—');

// "[Name]" and "[Your name]" placeholders in the organization's call script (case-insensitive, whitespace tolerant).
export const fillScript = (script, { name, agent } = {}) => String(script || '')
  .replace(/\[\s*your\s+name\s*\]/gi, agent || 'your name')
  .replace(/\[\s*name\s*\]/gi, name || 'there');

export const timeAgo = (value, nowMs = Date.now()) => {
  const t = time(value); if (t === null) return '';
  const s = Math.max(0, Math.floor((nowMs - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return d === 1 ? 'yesterday' : `${d}d ago`;
};

// "Last call: 2h ago, No answer" for the lead header, from the newest call that actually ended. Null when none.
export const lastCallLine = (calls, nowMs = Date.now()) => {
  const done = (Array.isArray(calls) ? calls : []).filter((c) => ['completed', 'no_answer', 'busy', 'failed', 'canceled'].includes(c.status));
  if (!done.length) return null;
  const c = done.reduce((a, b) => ((time(b.started_at) ?? 0) > (time(a.started_at) ?? 0) ? b : a));
  const r = callResult(c, nowMs);
  const what = r.connected ? (outcomeLabel(r.outcome) || 'Connected') : (r.reason || r.label);
  return `Last call: ${timeAgo(c.ended_at || c.started_at, nowMs)}, ${what}`;
};

// Suggestions shown after saving an outcome. These are only suggestions: nothing changes until the agent clicks.
const RETRY_STEPS = [{ key: 'retry', label: 'Retry in 2 hours' }, { key: 'whatsapp', label: 'Send WhatsApp' }];
export const nextSteps = (outcome, connected) => {
  if (outcome === 'wrong_number') return [];
  if (!connected || outcome === 'no_answer' || outcome === 'busy') return RETRY_STEPS;
  if (outcome === 'not_interested') return [{ key: 'lost', label: 'Mark as Lost?' }];
  if (outcome === 'connected' || outcome === 'interested') return [{ key: 'demo', label: 'Book demo' }, { key: 'brochure', label: 'Send brochure' }];
  return [];
};

// ---------------------------------------------------------------------------------------------------------------------
// Call history: filters and the retry queue
// ---------------------------------------------------------------------------------------------------------------------

// One key per status for filtering: connected | no_answer | busy | failed | canceled | timed_out | in_progress.
export const statusKey = (call, nowMs = Date.now()) => {
  const r = callResult(call, nowMs);
  if (r.connected && r.label === 'Connected') return 'connected';
  if (r.label === 'Timed out') return 'timed_out';
  if (r.tone === 'live' || r.label === 'Not started') return 'in_progress';
  return ['no_answer', 'busy', 'failed', 'canceled'].includes(call?.status) ? call.status : 'failed';
};
export const STATUS_FILTERS = [
  { value: 'connected', label: 'Connected' }, { value: 'no_answer', label: 'No answer' }, { value: 'busy', label: 'Busy' },
  { value: 'failed', label: 'Failed' }, { value: 'timed_out', label: 'Timed out' }, { value: 'canceled', label: 'Cancelled' }, { value: 'in_progress', label: 'In progress' },
];

// filters: { agent, outcome, status, from, to } (each optional; from/to are YYYY-MM-DD). `dayOf` turns a timestamp into that
// date in the workspace time zone. Outcome 'none' = calls with no (consistent) outcome.
export const filterCalls = (calls, filters = {}, { nowMs = Date.now(), dayOf = (v) => String(v || '').slice(0, 10) } = {}) =>
  (Array.isArray(calls) ? calls : []).filter((c) => {
    if (filters.agent && c.agent_id !== filters.agent) return false;
    if (filters.status && statusKey(c, nowMs) !== filters.status) return false;
    if (filters.outcome) {
      const o = callResult(c, nowMs).outcome;
      if (filters.outcome === 'none' ? !!o : o !== filters.outcome) return false;
    }
    if (filters.from || filters.to) {
      const day = c.started_at ? dayOf(c.started_at) : '';
      if (!day || (filters.from && day < filters.from) || (filters.to && day > filters.to)) return false;
    }
    return true;
  });

// The newest call per lead (the API returns calls newest first). Used so a lead who was reached afterwards isn't offered a retry.
export const latestCallByLead = (calls) => {
  const m = new Map();
  for (const c of Array.isArray(calls) ? calls : []) if (c.lead_id && !m.has(c.lead_id) && c.status !== 'authorized') m.set(c.lead_id, c);
  return m;
};

// Leads whose LATEST call never connected (failed, unanswered, busy, timed out). One entry per lead, newest-first order.
export const retryableLeadIds = (calls, nowMs = Date.now()) =>
  [...latestCallByLead(calls)].filter(([, c]) => callResult(c, nowMs).retryable).map(([id]) => id);

// The retry queue lives in sessionStorage as a JSON array of lead ids; anything else reads as an empty queue.
export const parseQueue = (raw) => {
  try { const a = JSON.parse(raw); return Array.isArray(a) ? a.filter((x) => typeof x === 'string' && x) : []; } catch { return []; }
};
