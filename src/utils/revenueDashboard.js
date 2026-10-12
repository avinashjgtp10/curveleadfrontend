// Pure helpers for the Revenue & ROI dashboard (Phase 2). No React, no network. Money is never added across currencies:
// every figure is a { CURRENCY: amount } map or a list of { currency, amount }, and the page shows one currency at a time.

export const REASON_LABEL = {
  not_measured: 'No ad spend data yet',
  no_spend: 'No spend in this period',
  mixed_spend_currencies: 'Ad accounts use different currencies',
  currency_mismatch: 'Revenue and spend are in different currencies',
  no_leads: 'No leads',
  no_qualified: 'No qualified leads yet',
  no_customers: 'No customers yet',
  not_applicable_unattributed: 'Not applicable: no campaign',
};
export const reasonLabel = (r) => REASON_LABEL[r] || (r ? String(r).replace(/_/g, ' ') : '');

// [{ currency, amount }] -> { INR: 1200 }
export const toMap = (list) => Object.fromEntries((list || []).map((x) => [x.currency, Number(x.amount) || 0]));

// Every currency that appears anywhere in the data, most money first, so the default selection is the one that matters.
export const currenciesIn = (data) => {
  const weight = {};
  const add = (m) => { for (const [c, v] of Object.entries(m || {})) weight[c] = (weight[c] || 0) + Math.abs(Number(v) || 0); };
  const t = (data && data.cohort && data.cohort.totals) || {};
  add(toMap(t.booked)); add(toMap(t.collected && t.collected.net));
  for (const s of (data && data.timeline && data.timeline.series) || []) { add(s.booked); add(s.collected); }
  return Object.keys(weight).sort((a, b) => weight[b] - weight[a]);
};

// Timeline rows for the chart in one currency. A bucket with no money in that currency is 0, not missing.
export const chartRows = (series, currency) => (series || []).map((s) => ({
  bucket: s.bucket, booked: (s.booked && s.booked[currency]) || 0, collected: (s.collected && s.collected[currency]) || 0,
}));

export const totalFor = (map, currency) => (map && map[currency]) || 0;

// Funnel: leads -> qualified -> customers, with each step as a % of the step before and of all leads.
export const funnelSteps = (t) => {
  const steps = [['Leads', t.leads], ['Qualified', t.qualified], ['Customers', t.acquired]].map(([label, n]) => ({ label, count: Number(n) || 0 }));
  const top = steps[0].count;
  return steps.map((s, i) => ({
    ...s,
    of_previous: i === 0 ? null : (steps[i - 1].count ? Math.round((s.count / steps[i - 1].count) * 1000) / 10 : null),
    of_leads: top ? Math.round((s.count / top) * 1000) / 10 : null,
  }));
};

// How much of the picture can be trusted: shares of leads whose campaign is verified / inferred / unknown.
export const attributionShares = (quality, leads) => {
  const a = (quality && quality.attribution) || {};
  const n = Number(leads) || 0;
  const pct = (v) => (n ? Math.round(((Number(v) || 0) / n) * 1000) / 10 : null);
  return [
    { key: 'verified', label: 'Verified', count: a.verified || 0, pct: pct(a.verified) },
    { key: 'inferred', label: 'Inferred or manual', count: a.inferred_or_manual || 0, pct: pct(a.inferred_or_manual) },
    { key: 'unattributed', label: 'No campaign', count: a.unattributed || 0, pct: pct(a.unattributed) },
  ];
};

// A ratio from the API ({ value, reason }) as text; the reason is shown instead of a misleading 0 or dash.
export const ratioText = (r, kind, currency, fmtMoney = (v, c) => `${c} ${v}`) => {
  if (!r || r.value == null) return { text: '—', reason: reasonLabel(r && r.reason) };
  if (kind === 'x') return { text: `${r.value}×`, reason: '' };
  if (kind === 'pct') return { text: `${r.value}%`, reason: '' };
  return { text: fmtMoney(r.value, currency), reason: '' };
};

// Campaigns table rows, best collected revenue first, in the chosen currency.
export const campaignRows = (campaigns, currency) => (campaigns || []).map((c) => ({
  id: c.campaign_id, name: c.campaign_name || 'Unnamed campaign', leads: c.leads, qualified: c.qualified, customers: c.acquired,
  spend: c.spend && c.spend.currency === currency ? c.spend.amount : null,
  spendReason: c.spend && c.spend.currency !== currency && c.spend.amount != null ? 'currency_mismatch' : (c.spend && c.spend.reason) || null,
  booked: totalFor(toMap(c.booked), currency), collected: totalFor(toMap(c.collected && c.collected.net), currency),
  roas: c.ratios && c.ratios.collected_roas, roi: c.ratios && c.ratios.advertising_roi_pct, cac: c.ratios && c.ratios.cac, cpl: c.ratios && c.ratios.cpl,
})).sort((a, b) => b.collected - a.collected || b.leads - a.leads);

// The API says where the feature stands: off for this workspace, preview for admins only, or not set up in the database.
export const dashboardState = (err) => {
  const s = err && err.response && err.response.status;
  const code = err && err.response && err.response.data && (err.response.data.error || err.response.data.code);
  if (s === 404 && code === 'feature_off') return { state: 'off', message: 'Revenue reporting is not turned on for this workspace yet.' };
  if (s === 403) return { state: 'preview', message: (err.response.data && err.response.data.error) || 'Revenue reporting is in preview for administrators.' };
  if (s === 503) return { state: 'setup', message: 'Revenue reporting is still being set up. Please try again later.' };
  return { state: 'error', message: 'Could not load revenue reporting. Please try again.' };
};

// Budget suggestions: wording and ordering for the page. The advisor only ever suggests; nothing is applied.
export const ACTION_LABEL = { scale: 'Spend more', reduce: 'Spend less', hold: 'Keep as is', insufficient_data: 'Not enough data' };
export const ACTION_TONE = { scale: 'bg-emerald-50 text-emerald-700', reduce: 'bg-red-50 text-red-700', hold: 'bg-gray-100 text-gray-700', insufficient_data: 'bg-gray-50 text-gray-500' };
export const actionable = (rec) => ((rec && rec.recommendations) || []).filter((r) => r.action === 'scale' || r.action === 'reduce');
export const suggestionSummary = (rec) => {
  const a = actionable(rec);
  if (!rec || !rec.recommendations || !rec.recommendations.length) return 'No campaigns to review in this period.';
  if (!a.length) return 'No change suggested: the evidence does not support moving budget yet.';
  const up = a.filter((r) => r.action === 'scale').length; const down = a.length - up;
  return [up ? `${up} campaign${up === 1 ? '' : 's'} to spend more on` : null, down ? `${down} to spend less on` : null].filter(Boolean).join(', ');
};
