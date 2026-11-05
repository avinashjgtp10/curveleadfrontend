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
