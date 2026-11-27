import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeOptions } from '../src/components/ui/dateUtils.js';

const hm = (d) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;

test('a time between 15-minute slots is inserted in order so it can be highlighted', () => {
  const sel = new Date(2026, 10, 24, 12, 43);
  const list = buildTimeOptions(sel, sel).map(hm);
  assert.equal(list.length, 97);
  assert.deepEqual(list.slice(list.indexOf('12:43') - 1, list.indexOf('12:43') + 2), ['12:30', '12:43', '12:45']);
});
test('times on the 15-minute grid, or with nothing selected, add no extra row', () => {
  const on = new Date(2026, 10, 24, 12, 45);
  assert.equal(buildTimeOptions(on, on).length, 96);
  assert.equal(buildTimeOptions(new Date(2026, 10, 24, 12, 43), null).length, 96);
});
test('a time after the last slot is appended', () => {
  const sel = new Date(2026, 10, 24, 23, 50);
  const list = buildTimeOptions(sel, sel).map(hm);
  assert.equal(list.at(-1), '23:50');
});
