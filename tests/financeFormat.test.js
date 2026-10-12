import test from 'node:test';
import assert from 'node:assert/strict';
import { money, signedAmount, dateLabel, outstanding, rowActions, newIdempotencyKey, apiMessage } from '../src/utils/financeFormat.js';

test('only completed entries change the net: payments add, refunds and reversals subtract, adjustments go both ways', () => {
  const e = (kind, status, amount, dir) => ({ kind, status, amount, adjustment_direction: dir });
  assert.equal(signedAmount(e('payment', 'completed', '5000.00')), 5000);
  assert.equal(signedAmount(e('refund', 'completed', 2000)), -2000);
  assert.equal(signedAmount(e('reversal', 'completed', 700)), -700);
  assert.equal(signedAmount(e('adjustment', 'completed', 50, 'credit')), 50);
  assert.equal(signedAmount(e('adjustment', 'completed', 50, 'debit')), -50);
  for (const s of ['pending', 'failed', 'cancelled']) assert.equal(signedAmount(e('payment', s, 999)), 0, s);
  assert.equal(signedAmount(null), 0);
});

test('the worked example nets to 13,000', () => {
  const rows = [{ kind: 'payment', status: 'completed', amount: 5000 }, { kind: 'payment', status: 'completed', amount: 10000 }, { kind: 'refund', status: 'completed', amount: 2000 }];
  assert.equal(rows.reduce((a, r) => a + signedAmount(r), 0), 13000);
});

test('an estimated or unknown date is never shown as a confirmed payment date', () => {
  assert.equal(dateLabel({ paid_on: '2026-10-01', paid_on_basis: 'confirmed' }), '1 Oct 2026');
  assert.equal(dateLabel({ paid_on: '2026-10-01T00:00:00.000Z', paid_on_basis: 'confirmed' }), '1 Oct 2026');
  assert.equal(dateLabel({ paid_on: '2026-10-01', paid_on_basis: 'estimated' }), '≈ 1 Oct 2026 (estimated)');
  assert.equal(dateLabel({ paid_on: '2026-10-01', paid_on_basis: 'unknown' }), '1 Oct 2026 (unconfirmed)');
  assert.equal(dateLabel({ paid_on: null, estimated_paid_on: '2026-09-30', paid_on_basis: 'unknown' }), '≈ 30 Sep 2026 (estimated)');
  assert.equal(dateLabel({ paid_on: null, paid_on_basis: 'unknown' }), 'Date not recorded');
});

test('outstanding is quoted minus net collected, only for one currency that matches the workspace', () => {
  assert.deepEqual(outstanding(20000, [{ currency: 'INR', net_collected: 13000 }], 'INR'), { amount: 7000, currency: 'INR', reason: null });
  assert.deepEqual(outstanding(20000, [], 'INR'), { amount: 20000, currency: 'INR', reason: null });
  assert.equal(outstanding(20000, [{ currency: 'INR', net_collected: 25000 }], 'INR').amount, 0, 'never negative');
  assert.equal(outstanding(20000, [{ currency: 'USD', net_collected: 10 }], 'INR').reason, 'currency_mismatch');
  assert.equal(outstanding(20000, [{ currency: 'INR', net_collected: 1 }, { currency: 'USD', net_collected: 1 }], 'INR').reason, 'multiple_currencies');
  assert.equal(outstanding(0, [{ currency: 'INR', net_collected: 1 }], 'INR').reason, 'no_quote');
  assert.equal(outstanding(null, [], 'INR').amount, null);
});

test('actions: managers get refund/reverse/correct/edit on completed payments and complete/cancel on pending; nothing otherwise', () => {
  assert.deepEqual(rowActions({ kind: 'payment', status: 'completed' }, true), ['refund', 'reverse', 'correct', 'edit']);
  assert.deepEqual(rowActions({ kind: 'payment', status: 'pending' }, true), ['complete', 'cancel']);
  assert.deepEqual(rowActions({ kind: 'payment', status: 'completed' }, false), []);
  for (const e of [{ kind: 'refund', status: 'completed' }, { kind: 'reversal', status: 'completed' }, { kind: 'payment', status: 'cancelled' }, { kind: 'payment', status: 'failed' }]) assert.deepEqual(rowActions(e, true), [], JSON.stringify(e));
});

test('money formats with the entry\'s own currency and survives an unknown currency code', () => {
  assert.match(money(13000, 'INR', 'en-IN'), /13,000/);
  assert.match(money(5, 'USD', 'en-US'), /\$5\.00/);
  assert.equal(money(5, 'XXZ?'), 'XXZ? 5.00');
});

test('idempotency keys are unique and long enough for the server; errors show the server message', () => {
  const a = newIdempotencyKey(), b = newIdempotencyKey();
  assert.notEqual(a, b); assert.ok(a.length >= 8 && a.length <= 120);
  assert.equal(apiMessage({ response: { data: { error: 'Already recorded.' } } }), 'Already recorded.');
  assert.match(apiMessage(new Error('x')), /try again/);
});

import { bookedBasisLabel } from '../src/utils/financeFormat.js';
test('the booked value is labelled by how it came about, and an adjusted one says so', () => {
  assert.match(bookedBasisLabel({ basis: 'live_snapshot', adjusted: false }), /Frozen when the lead was marked Won/);
  assert.match(bookedBasisLabel({ basis: 'inferred_from_deal_value', adjusted: false }), /Estimated/);
  assert.match(bookedBasisLabel({ basis: 'live_snapshot', adjusted: true }), /Adjusted with a recorded reason/);
  assert.equal(bookedBasisLabel(null), '');
});
