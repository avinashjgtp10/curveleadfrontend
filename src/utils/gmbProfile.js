// Pure helpers for the Google Business Profile tabs. No React, no network.

export const BAND = {
  strong: { label: 'Strong', tone: 'bg-emerald-50 text-emerald-700' },
  fair: { label: 'Fair', tone: 'bg-amber-50 text-amber-700' },
  weak: { label: 'Needs work', tone: 'bg-red-50 text-red-700' },
  unknown: { label: 'Not enough information', tone: 'bg-gray-100 text-gray-600' },
};
export const bandOf = (health) => BAND[(health && health.band) || 'unknown'] || BAND.unknown;

// Checklist rows as { label, status, text }: status ok | todo | unknown. "unknown" is not a failure.
export const checklist = (health) => ((health && health.checks) || []).map((c) => ({
  id: c.id, label: c.label, status: c.ok === true ? 'ok' : c.ok === false ? 'todo' : 'unknown',
  text: c.ok === false ? c.fix : c.ok === true ? c.why : 'Google did not tell us this.',
}));

// The API answers 200 { ok: false, code, message } for Google-side problems (so the page can explain), 401 for an expired connection.
export const googleProblem = (res, err) => {
  if (res && res.ok === false) return { code: res.code, message: res.message, reconnect: res.code === 'reconnect' };
  const status = err && err.response && err.response.status;
  if (status === 401) return { code: 'reconnect', message: (err.response.data && err.response.data.message) || 'The Google connection has expired. Disconnect and connect Google again.', reconnect: true };
  if (status === 400) return { code: 'not_connected', message: 'Connect Google first.', reconnect: false };
  if (err) return { code: 'error', message: "Couldn't load this from Google. Please try again.", reconnect: false };
  return null;
};

export const addressText = (a) => (a ? [...(a.lines || []), a.locality, a.region, a.postal_code].filter(Boolean).join(', ') : '');

// The review link Google gives for a location, if any. Used only to offer it, never to overwrite a saved one silently.
export const googleReviewLink = (locations, selectedId) => {
  const l = (locations || []).find((x) => x.id === selectedId) || (locations || [])[0];
  return (l && l.details && l.details.review_url) || null;
};

export const DAY_OPTIONS = [[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days'], [365, 'Last 12 months']];
export const pctText = (v) => (v == null ? '—' : `${v}%`);
export const numberText = (n) => (Number(n) || 0).toLocaleString('en-IN');
