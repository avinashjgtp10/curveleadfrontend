import test from 'node:test';
import assert from 'node:assert/strict';
import { sequenceStatus, sequenceSummary, toggleAction, stepPayload, copyName, duplicatePayload } from '../src/utils/sequenceStatus.js';

test('status: errors win, then active, then paused (had leads), else draft', () => {
  assert.equal(sequenceStatus({ is_active: true, with_errors: 2 }).key, 'errors');
  assert.equal(sequenceStatus({ is_active: false, with_errors: 1, enrolled_total: 5 }).key, 'errors');
  assert.equal(sequenceStatus({ is_active: true, enrolled_total: 3 }).key, 'active');
  assert.equal(sequenceStatus({ is_active: false, enrolled_total: 3 }).key, 'paused');
  assert.equal(sequenceStatus({ is_active: false, enrolled_total: 0 }).key, 'draft');
  assert.equal(sequenceStatus({ is_active: false }).key, 'draft'); // an older server without counts
  assert.equal(sequenceStatus(undefined).key, 'draft');
  assert.deepEqual([sequenceStatus({ with_errors: 1 }).label, sequenceStatus({ with_errors: 1 }).tone], ['Has errors', 'bad']);
  assert.match(sequenceStatus({ with_errors: 3 }).detail, /3 leads blocked or failed/); assert.match(sequenceStatus({ with_errors: 1 }).detail, /1 lead blocked/);
  assert.equal(sequenceStatus({ is_active: false, enrolled_total: 4 }).tone, 'warn');
});
test('summary reads naturally and leaves out counts the server did not send', () => {
  assert.equal(sequenceSummary({ steps: [1, 2, 3], enrolled_total: 12, enrolled_active: 7, in_review: 1 }), '3 steps · 12 leads enrolled (7 in progress) · 1 needs review');
  assert.equal(sequenceSummary({ steps: [1], enrolled_total: 1, enrolled_active: 0, in_review: 2 }), '1 step · 1 lead enrolled · 2 need review');
  assert.equal(sequenceSummary({ steps: [], enrolled_total: 0 }), '0 steps · 0 leads enrolled');
  assert.equal(sequenceSummary({ steps: [1, 2] }), '2 steps');
  assert.equal(sequenceSummary(undefined), '0 steps');
});
test('the one button: pause a live sequence, resume a paused one, turn on a draft', () => {
  assert.deepEqual(toggleAction({ is_active: true }), { key: 'pause', label: 'Pause', next: false });
  assert.deepEqual(toggleAction({ is_active: false, enrolled_total: 2 }), { key: 'resume', label: 'Resume', next: true });
  assert.deepEqual(toggleAction({ is_active: false, enrolled_total: 0 }), { key: 'turn_on', label: 'Turn on', next: true });
  assert.equal(toggleAction({ is_active: false, with_errors: 1, enrolled_total: 4 }).key, 'resume'); // errored but had leads
  assert.equal(toggleAction({ is_active: false }).key, 'turn_on');
});
test('a step is saved without client-only preview URLs and with trimmed answer aliases', () => {
  const p = stepPayload({ message: 'hi', media: [{ id: 'm', preview_url: 'blob:x', name: 'a.pdf' }], reply_routes: [{ answer: 'Yes', aliases: [' yes ', '', 'y'], sequence_id: 's' }] });
  assert.deepEqual(p.media, [{ id: 'm', name: 'a.pdf' }]); assert.deepEqual(p.reply_routes[0].aliases, ['yes', 'y']);
  assert.deepEqual(stepPayload({ message: 'x' }).media, []); assert.deepEqual(stepPayload({ message: 'x' }).reply_routes, []);
});
test('copy names never collide', () => {
  assert.equal(copyName('Nurture', []), 'Copy of Nurture');
  assert.equal(copyName('Nurture', ['Copy of Nurture']), 'Copy of Nurture (2)');
  assert.equal(copyName('Nurture', ['copy of nurture', 'Copy of Nurture (2)']), 'Copy of Nurture (3)');
});
test('a duplicate is switched off, keeps steps and stop rules, and carries no server ids', () => {
  const seq = { id: 's1', name: 'Nurture', description: 'd', is_active: true, enrolled_total: 9, stop_conditions: { on_reply: true, demo_booked: false },
    steps: [{ id: 'st1', sequence_id: 's1', tenant_id: 't', step_order: 0, delay_minutes: 1440, message: 'Hi', media: [{ preview_url: 'blob:x', id: 'm' }], reply_routes: [] }] };
  const d = duplicatePayload(seq, ['Nurture']);
  assert.deepEqual([d.name, d.is_active, d.description], ['Copy of Nurture', false, 'd']);
  assert.deepEqual(d.stop_conditions, { on_reply: true, demo_booked: false });
  assert.equal(d.steps.length, 1); assert.equal(d.steps[0].delay_minutes, 1440); assert.equal(d.steps[0].message, 'Hi');
  for (const gone of ['id', 'sequence_id', 'tenant_id']) assert.equal(gone in d.steps[0], false, gone);
  assert.deepEqual(d.steps[0].media, [{ id: 'm' }]);
  assert.equal(duplicatePayload({ name: 'X' }).steps.length, 0);
});
