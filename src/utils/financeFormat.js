// Pure helpers for the Finance panel (money display, labels, the outstanding balance). No React, no network.

export const KIND_LABEL = { payment: 'Payment', refund: 'Refund', reversal: 'Reversal', adjustment: 'Adjustment' };
export const STATUS_LABEL = { pending: 'Pending', completed: 'Completed', failed: 'Failed', cancelled: 'Cancelled' };

export const money = (amount, currency, locale) => {
  const n = Number(amount) || 0;
  try { return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(n); }
  catch { return `${currency || ''} ${n.toFixed(2)}`.trim(); }
};

// The effect of one entry on net collected (only completed entries count): payment +, refund -, reversal -,
// adjustment +/- by direction. Entries that do not count are 0.
export const signedAmount = (e) => {
  if (!e || e.status !== 'completed') return 0;
  const a = Number(e.amount) || 0;
  if (e.kind === 'payment') return a;
  if (e.kind === 'refund' || e.kind === 'reversal') return -a;
  if (e.kind === 'adjustment') return e.adjustment_direction === 'credit' ? a : -a;
  return 0;
};

const dateOnly = (v) => (v ? String(v).slice(0, 10) : '');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Fixed month names (not Intl) so a payment date reads the same in every browser and ICU version.
const pretty = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d); return m && MONTHS[Number(m[2]) - 1] ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : ''; };

// Never present an estimated or unknown date as if it were a confirmed payment date.
export const dateLabel = (e) => {
  const d = dateOnly(e && e.paid_on);
  if (!d) {
    const est = dateOnly(e && e.estimated_paid_on);
    return est ? `≈ ${pretty(est)} (estimated)` : 'Date not recorded';
  }
  if (e.paid_on_basis === 'estimated') return `≈ ${pretty(d)} (estimated)`;
  if (e.paid_on_basis === 'unknown') return `${pretty(d)} (unconfirmed)`;
  return pretty(d);
};

// Outstanding = quoted price minus net collected, ONLY when the lead's money is in one currency and it is the
// workspace currency (different currencies are never added or subtracted without an exchange rate).
export const outstanding = (dealValue, totals, workspaceCurrency) => {
  const quote = Number(dealValue) || 0;
  if (!quote) return { amount: null, reason: 'no_quote' };
  const list = totals || [];
  if (list.length === 0) return { amount: quote, currency: workspaceCurrency || null, reason: null };
  if (list.length > 1) return { amount: null, reason: 'multiple_currencies' };
  if (workspaceCurrency && list[0].currency !== workspaceCurrency) return { amount: null, reason: 'currency_mismatch' };
  return { amount: Math.max(0, Math.round((quote - Number(list[0].net_collected)) * 100) / 100), currency: list[0].currency, reason: null };
};
export const OUTSTANDING_NOTE = {
  no_quote: 'No quoted price.', multiple_currencies: 'Payments are in more than one currency, so no single balance is shown.',
  currency_mismatch: 'Payments are in a different currency from the quoted price, so no balance is shown.',
};

export const newIdempotencyKey = () => (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
  ? globalThis.crypto.randomUUID() : `key-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`);

export const apiMessage = (err) => (err && err.response && err.response.data && err.response.data.error) || 'Something went wrong. Please try again.';

// What the row's actions may be, given the entry and whether the user can manage payments.
export const rowActions = (e, canManage) => {
  if (!canManage || !e) return [];
  if (e.kind === 'payment' && e.status === 'completed') return ['refund', 'reverse', 'correct', 'edit'];
  if (e.kind === 'payment' && e.status === 'pending') return ['complete', 'cancel'];
  return [];
};
