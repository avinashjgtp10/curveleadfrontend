// Shared date/time helpers for DatePicker and DateTimePicker — no external
// date library, just plain Date math, matching the string formats native
// <input type="date"> ('YYYY-MM-DD') and <input type="datetime-local">
// ('YYYY-MM-DDTHH:mm') already produce, so swapping components is a drop-in.

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; // Monday-first, matches buildMonthMatrix

const pad2 = (n) => String(n).padStart(2, '0');

// 'YYYY-MM-DD' -> Date (local midnight), or null
export const parseDateOnly = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

// Date -> 'YYYY-MM-DD'
export const formatDateOnly = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

// 'YYYY-MM-DDTHH:mm' -> Date (local), or null
export const parseDateTimeLocal = (str) => {
  if (!str) return null;
  const [datePart, timePart] = str.split('T');
  const d = parseDateOnly(datePart);
  if (!d) return null;
  const [h, m] = (timePart || '00:00').split(':').map(Number);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

// Date -> 'YYYY-MM-DDTHH:mm'
export const formatDateTimeLocal = (date) => `${formatDateOnly(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

export const formatDisplayDate = (date) => date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const formatDisplayTime = (date) => date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
export const formatDisplayDateTime = (date) => `${formatDisplayDate(date)}, ${formatDisplayTime(date)}`;

export const isSameDay = (a, b) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Mon-start 6x7 grid of Dates spanning the given month, including the
// leading/trailing days of the adjacent months needed to fill whole weeks.
export const buildMonthMatrix = (year, month) => {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday = 0
  const gridStart = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
};

// All 15-minute-increment times in a day, as Date objects on the given day.
export const buildTimeOptions = (onDay) => {
  const base = new Date(onDay.getFullYear(), onDay.getMonth(), onDay.getDate());
  return Array.from({ length: 96 }, (_, i) => new Date(base.getTime() + i * 15 * 60000));
};
