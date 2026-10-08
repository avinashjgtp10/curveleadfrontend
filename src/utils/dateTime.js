import { intlLocale } from './locale.js';
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';
let workspaceTimezone = DEFAULT_TIMEZONE;
export function setWorkspaceTimezone(tz) {
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); workspaceTimezone = tz || DEFAULT_TIMEZONE; }
  catch { workspaceTimezone = DEFAULT_TIMEZONE; }
}
export function parseTimestamp(value) {
  if (value == null || value === '' || value === 0 || value === '0') return null;
  // PostgreSQL legacy timestamp strings represent UTC, even without an offset.
  if (typeof value === 'string' && /^\d{4}-\d\d-\d\d[T ]\d\d:\d\d(?::\d\d(?:\.\d+)?)?$/.test(value)) value = value.replace(' ', 'T') + 'Z';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.getTime() !== 0 ? date : null;
}
// One house style everywhere ("4 Oct 2026", "7:29 pm"): callers choose which parts to show,
// but two-digit years and zero-padded hours are normalised away.
export function formatDateTime(value, tz = workspaceTimezone, options = {}) {
  const date = parseTimestamp(value);
  if (!date) return 'No date';
  const opts = { dateStyle: 'medium', timeStyle: 'short', ...options, timeZone: tz };
  if (opts.year === '2-digit') opts.year = 'numeric';
  if (opts.hour === '2-digit') opts.hour = 'numeric';
  if (opts.day === '2-digit') opts.day = 'numeric';
  if (opts.month === 'numeric' || opts.month === '2-digit') opts.month = 'short';
  return new Intl.DateTimeFormat(intlLocale(), opts).format(date);
}
export function toDateTimeInput(value, tz = workspaceTimezone) {
  const date = parseTimestamp(value);
  if (!date) return '';
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
export function dateTimeInputToUTC(value, tz = workspaceTimezone) {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value)) throw new Error('Pick a valid date and time');
  const target = Date.parse(value + ':00Z');
  let instant = target;
  for (let i = 0; i < 4; i++) {
    const displayed = Date.parse(toDateTimeInput(new Date(instant), tz) + ':00Z');
    instant += target - displayed;
  }
  if (toDateTimeInput(new Date(instant), tz) !== value) throw new Error('This time does not exist in the workspace timezone');
  return new Date(instant).toISOString();
}
export function appointmentStatus(appointment, now = Date.now()) {
  if (appointment.dismissed_at || appointment.actionable === false && !appointment.is_completed) return 'dismissed';
  if (appointment.is_completed) return 'completed';
  const date = parseTimestamp(appointment.next_followup_at);
  return date && date.getTime() < now ? 'overdue' : 'upcoming';
}
