// Delays are stored as whole minutes. Show them the way people say them: "1 day", "2 hours", "45 minutes".
export const DELAY_UNIT_MINUTES = { minutes: 1, hours: 60, days: 1440 };

// The largest unit that divides the delay exactly (1440 -> days, 120 -> hours, 45 -> minutes). Nothing set yet: hours.
export const bestUnit = (minutes) => {
  const m = Number(minutes);
  if (!Number.isFinite(m) || m <= 0) return 'hours';
  if (m % 1440 === 0) return 'days';
  if (m % 60 === 0) return 'hours';
  return 'minutes';
};

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// "Immediately", "1 day", "2 hours", "1 hour 30 minutes", "45 minutes".
export const describeDelay = (minutes) => {
  const m = Math.round(Number(minutes));
  if (!Number.isFinite(m) || m <= 0) return 'Immediately';
  if (m % 1440 === 0) return plural(m / 1440, 'day');
  if (m < 60) return plural(m, 'minute');
  const h = Math.floor(m / 60); const r = m % 60;
  if (h >= 24) { const d = Math.floor(h / 24); const hh = h % 24; return `${plural(d, 'day')}${hh ? ` ${plural(hh, 'hour')}` : ''}${r ? ` ${plural(r, 'minute')}` : ''}`; }
  return r ? `${plural(h, 'hour')} ${plural(r, 'minute')}` : plural(h, 'hour');
};
