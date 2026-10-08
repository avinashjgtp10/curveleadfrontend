import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDateTime, parseTimestamp, dateTimeInputToUTC, toDateTimeInput, appointmentStatus, setWorkspaceTimezone } from '../src/utils/dateTime.js';
test('missing, invalid and epoch appointments never display 1970 or count as overdue', () => {
  for (const value of [null, undefined, '', 0, '0', 'bad', '1970-01-01T00:00:00Z']) {
    assert.equal(formatDateTime(value), 'No date');
    assert.equal(appointmentStatus({ next_followup_at: value }), 'upcoming');
  }
  assert.equal(appointmentStatus({ next_followup_at: '2020-01-01T00:00:00Z' }), 'overdue');
  assert.equal(appointmentStatus({ is_completed: true, next_followup_at: null }), 'completed');
});
test('LD-04501 timestamp is 7 pm in India in every browser timezone', () => {
  for (const tz of ['UTC', 'America/Los_Angeles', 'Asia/Kolkata']) {
    process.env.TZ = tz;
    assert.equal(toDateTimeInput('2026-10-07T13:30:00Z', 'Asia/Kolkata'), '2026-10-07T19:00');
    assert.equal(dateTimeInputToUTC('2026-10-07T19:00', 'Asia/Kolkata'), '2026-10-07T13:30:00.000Z');
    assert.match(formatDateTime('2026-10-07T13:30:00Z', 'Asia/Kolkata'), /7:00/);
  }
});
test('legacy UTC strings and explicit offsets represent the same instant', () => {
  assert.equal(parseTimestamp('2026-10-07 13:30:00').toISOString(), '2026-10-07T13:30:00.000Z');
  assert.equal(parseTimestamp('2026-10-07T19:00:00+05:30').toISOString(), '2026-10-07T13:30:00.000Z');
});
test('workspace override and DST gap validation', () => {
  setWorkspaceTimezone('America/New_York');
  assert.equal(toDateTimeInput('2026-10-07T13:30:00Z'), '2026-10-07T09:30');
  assert.throws(() => dateTimeInputToUTC('2026-03-08T02:30', 'America/New_York'));
  setWorkspaceTimezone('invalid');
  assert.equal(toDateTimeInput('2026-10-07T13:30:00Z'), '2026-10-07T19:00');
});
