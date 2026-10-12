import test from 'node:test';
import assert from 'node:assert/strict';
import { toMap, currenciesIn, chartRows, funnelSteps, attributionShares, ratioText, campaignRows, dashboardState, reasonLabel } from '../src/utils/revenueDashboard.js';

test('currencies are ordered by the money in them and never summed together', () => {
  const data = { cohort: { totals: { booked: [{ currency: 'USD', amount: 100 }, { currency: 'INR', amount: 50000 }], collected: { net: [{ currency: 'INR', amount: 2000 }] } } },
    timeline: { series: [{ bucket: '2026-10-05', booked: { EUR: 10 }, collected: {} }] } };
  assert.deepEqual(currenciesIn(data), ['INR', 'USD', 'EUR']);
  assert.deepEqual(currenciesIn({}), []);
  assert.deepEqual(toMap([{ currency: 'INR', amount: '1200.50' }]), { INR: 1200.5 });
  assert.deepEqual(toMap(undefined), {});
});

test('chart rows show 0 for a week with no money in the chosen currency, not a gap', () => {
  const series = [{ bucket: '2026-10-05', booked: { INR: 100, USD: 5 }, collected: { INR: 40 } }, { bucket: '2026-10-12', booked: {}, collected: { USD: 9 } }];
  assert.deepEqual(chartRows(series, 'INR'), [{ bucket: '2026-10-05', booked: 100, collected: 40 }, { bucket: '2026-10-12', booked: 0, collected: 0 }]);
  assert.deepEqual(chartRows(undefined, 'INR'), []);
});

test('funnel: each step as a share of the previous step and of all leads, no division by zero', () => {
  assert.deepEqual(funnelSteps({ leads: 200, qualified: 50, acquired: 10 }), [
    { label: 'Leads', count: 200, of_previous: null, of_leads: 100 },
    { label: 'Qualified', count: 50, of_previous: 25, of_leads: 25 },
    { label: 'Customers', count: 10, of_previous: 20, of_leads: 5 }]);
  const empty = funnelSteps({ leads: 0, qualified: 0, acquired: 0 });
  assert.ok(empty.every((s) => s.of_leads === null && (s.of_previous === null)));
});

test('attribution shares say how much of the data can be trusted', () => {
  const rows = attributionShares({ attribution: { verified: 1001, inferred_or_manual: 0, unattributed: 872 } }, 1873);
  assert.deepEqual(rows.map((r) => [r.key, r.count, r.pct]), [['verified', 1001, 53.4], ['inferred', 0, 0], ['unattributed', 872, 46.6]]);
  assert.equal(attributionShares({}, 0)[0].pct, null);
});

test('a ratio without a value shows the reason, never a number', () => {
  assert.deepEqual(ratioText({ value: null, reason: 'not_measured' }, 'money', 'INR'), { text: '—', reason: 'No ad spend data yet' });
  assert.deepEqual(ratioText({ value: 2.5 }, 'x'), { text: '2.5×', reason: '' });
  assert.deepEqual(ratioText({ value: -20 }, 'pct'), { text: '-20%', reason: '' });
  assert.equal(ratioText({ value: 123 }, 'money', 'INR', (v, c) => `${c}${v}`).text, 'INR123');
  assert.equal(ratioText(undefined, 'x').text, '—');
  assert.equal(reasonLabel('something_new'), 'something new');
});

test('campaign rows use only the chosen currency and explain missing spend', () => {
  const camps = [
    { campaign_id: 'a', campaign_name: 'Diwali', leads: 10, qualified: 4, acquired: 2, booked: [{ currency: 'INR', amount: 20000 }], collected: { net: [{ currency: 'INR', amount: 8000 }] },
      spend: { amount: 4000, currency: 'INR', reason: null }, ratios: { collected_roas: { value: 2 }, advertising_roi_pct: { value: 100 }, cac: { value: 2000 }, cpl: { value: 400 } } },
    { campaign_id: 'b', campaign_name: null, leads: 30, qualified: 0, acquired: 0, booked: [], collected: { net: [] }, spend: { amount: 10, currency: 'USD', reason: null }, ratios: {} },
    { campaign_id: 'c', campaign_name: 'Quiet', leads: 1, qualified: 0, acquired: 0, booked: [], collected: { net: [] }, spend: { amount: null, currency: null, reason: 'not_measured' }, ratios: {} },
  ];
  const rows = campaignRows(camps, 'INR');
  assert.deepEqual(rows.map((r) => r.id), ['a', 'b', 'c'], 'most collected first, then most leads');
  assert.equal(rows[0].spend, 4000); assert.equal(rows[0].collected, 8000);
  assert.equal(rows[1].spend, null); assert.equal(rows[1].spendReason, 'currency_mismatch'); assert.equal(rows[1].name, 'Unnamed campaign');
  assert.equal(rows[2].spendReason, 'not_measured');
});

test('the page can tell "not turned on" from "preview" from "not set up" from a real error', () => {
  const e = (status, data) => ({ response: { status, data } });
  assert.equal(dashboardState(e(404, { error: 'feature_off' })).state, 'off');
  assert.equal(dashboardState(e(403, { error: 'Cohort reporting is in preview for administrators only.' })).state, 'preview');
  assert.equal(dashboardState(e(503, { code: 'cohort_unavailable' })).state, 'setup');
  assert.equal(dashboardState(e(500, {})).state, 'error');
  assert.equal(dashboardState(new Error('network')).state, 'error');
});

import fs from 'node:fs';
test('the Revenue & ROI sidebar item is hidden until the workspace has the feature on, and the probe is not the metrics call', () => {
  const side = fs.readFileSync(new URL('../src/components/layout/Sidebar.jsx', import.meta.url), 'utf8');
  assert.match(side, /item\.path !== '\/revenue' \|\| revenueOn/);
  assert.match(side, /cohortAPI\.health\(\)/);
  assert.doesNotMatch(side, /cohortAPI\.metrics/);
});

import { actionable, suggestionSummary, ACTION_LABEL } from '../src/utils/revenueDashboard.js';
test('budget suggestions are summarised honestly, including "no change"', () => {
  const rec = (...actions) => ({ recommendations: actions.map((action, i) => ({ campaign_id: String(i), action })) });
  assert.equal(suggestionSummary(rec('scale', 'scale', 'reduce', 'hold')), '2 campaigns to spend more on, 1 to spend less on');
  assert.equal(suggestionSummary(rec('scale')), '1 campaign to spend more on');
  assert.equal(suggestionSummary(rec('hold', 'insufficient_data')), 'No change suggested: the evidence does not support moving budget yet.');
  assert.equal(suggestionSummary({ recommendations: [] }), 'No campaigns to review in this period.');
  assert.equal(suggestionSummary(undefined), 'No campaigns to review in this period.');
  assert.deepEqual(actionable(rec('scale', 'hold', 'reduce')).map((r) => r.action), ['scale', 'reduce']);
  assert.equal(ACTION_LABEL.insufficient_data, 'Not enough data');
});
