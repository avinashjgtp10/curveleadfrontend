import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMoney, formatNumber, formatMoneyByCurrency, setWorkspaceLocale, currencySymbol, countryProfile, bankLabel, COUNTRIES } from '../src/utils/locale.js';
import { formatDateTime, setWorkspaceTimezone } from '../src/utils/dateTime.js';

// Batch 1 (E): no hardcoded ₹ / en-IN — the workspace's country and currency decide.
const plain = (s) => s.replace(/ /g, ' ');

test('India workspace: rupees with lakh grouping, compact in L / Cr', () => {
  setWorkspaceLocale({ country: 'IN', currency: 'INR' });
  assert.equal(formatMoney(125000), '₹1,25,000');
  assert.equal(formatMoney(150000, undefined, { compact: true }), '₹1.5L');
  assert.equal(formatMoney(25000000, undefined, { compact: true }), '₹2.5Cr');
  assert.equal(formatNumber(1234567), '12,34,567');
});

test('UAE workspace: dirhams with thousand grouping; an amount keeps its own currency', () => {
  setWorkspaceLocale({ country: 'AE', currency: 'AED' });
  assert.equal(plain(formatMoney(125000)), 'AED 125,000');
  assert.equal(formatMoney(30, 'USD'), '$30', 'ad account in USD is shown in USD, not converted');
  assert.equal(formatNumber(1234567), '1,234,567');
  assert.equal(currencySymbol(), 'AED');
  setWorkspaceLocale({ country: 'IN', currency: 'INR' });
});

test('missing amounts are a dash, not ₹0', () => {
  assert.equal(formatMoney(null), '—');
  assert.equal(formatMoney(undefined), '—');
  assert.equal(formatMoney(0), '₹0');
});

test('mixed currencies are listed side by side, never summed', () => {
  setWorkspaceLocale({ country: 'IN', currency: 'INR' });
  assert.equal(formatMoneyByCurrency({ INR: 1200, USD: 30 }), '₹1,200 + $30');
  assert.equal(formatMoneyByCurrency(null), '—');
});

test('a public quote uses the quote’s country, not the viewer’s workspace', () => {
  setWorkspaceLocale({ country: 'IN', currency: 'INR' });
  assert.equal(plain(formatMoney(125000, 'AED', { country: 'AE', decimals: 2 })), 'AED 125,000.00');
});

test('tax and bank fields follow the country', () => {
  assert.deepEqual(countryProfile('IN').tax.map(f => f.label), ['GSTIN', 'PAN']);
  assert.equal(countryProfile('AE').tax[0].label, 'TRN (VAT registration)');
  assert.ok(countryProfile('GB').bank.some(f => f.key === 'sort_code'));
  assert.equal(countryProfile('XX').tax[0].label, 'Tax ID');
  assert.equal(bankLabel('AE', 'ifsc'), 'IFSC');
  for (const c of COUNTRIES) assert.ok(Intl.NumberFormat('en', { style: 'currency', currency: c.currency }) && new Intl.DateTimeFormat('en', { timeZone: c.timezone }), c.code);
});

test('dates use the workspace timezone and country date order', () => {
  setWorkspaceTimezone('America/New_York');
  setWorkspaceLocale({ country: 'US', currency: 'USD' });
  assert.match(formatDateTime('2026-10-04T13:00:00Z'), /^Oct 4, 2026/);
  setWorkspaceTimezone('Asia/Kolkata');
  setWorkspaceLocale({ country: 'IN', currency: 'INR' });
  assert.match(formatDateTime('2026-10-04T13:00:00Z'), /^4 Oct 2026, 6:30\s?pm$/i);
});
