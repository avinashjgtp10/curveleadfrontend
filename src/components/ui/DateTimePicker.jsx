import { useEffect, useRef, useState } from 'react';
import { Calendar, X } from 'lucide-react';
import MonthCalendar from './MonthCalendar';
import { parseDateTimeLocal, formatDateTimeLocal, formatDisplayDateTime, buildTimeOptions, isSameDay } from './dateUtils';

const QUICK_PICKS = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 days', days: 3 },
  { label: 'Next week', days: 7 },
];
const DEFAULT_HOUR = 10; // used when a quick-pick sets a date but no time was chosen yet

// Drop-in replacement for <input type="datetime-local"> — same value
// ('YYYY-MM-DDTHH:mm') and onChange(newValue) contract. Fixes the two slow
// parts of the native picker: paging to a far month, and spinning through
// minutes one at a time to set a time — here it's a single click from a list.
const DateTimePicker = ({ value, onChange, placeholder = 'Select date & time', min, className = '', disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const timeListRef = useRef(null);
  const selected = parseDateTimeLocal(value);
  const minDate = parseDateTimeLocal(min);
  const [view, setView] = useState(() => {
    const d = selected || new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && timeListRef.current) {
      const active = timeListRef.current.querySelector('[data-active="true"]');
      if (active) active.scrollIntoView({ block: 'center' });
    }
  }, [open]);

  const openPicker = () => {
    if (disabled) return;
    const d = selected || new Date();
    setView({ year: d.getFullYear(), month: d.getMonth() });
    setOpen(o => !o);
  };

  const commit = (date) => {
    if (minDate && date < minDate) date = new Date(minDate);
    onChange(formatDateTimeLocal(date));
  };

  const pickDay = (day) => {
    const next = new Date(day);
    if (selected) next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    else next.setHours(DEFAULT_HOUR, 0, 0, 0);
    commit(next);
  };

  const pickTime = (time) => {
    const base = selected || new Date();
    const next = new Date(base);
    next.setHours(time.getHours(), time.getMinutes(), 0, 0);
    commit(next);
  };

  const pickQuick = (daysAhead) => {
    const day = new Date();
    day.setDate(day.getDate() + daysAhead);
    day.setHours(selected ? selected.getHours() : DEFAULT_HOUR, selected ? selected.getMinutes() : 0, 0, 0);
    commit(day);
    setOpen(false);
  };

  const timeOptions = buildTimeOptions(selected || new Date());
  const isTimeDisabled = (t) => minDate && selected && isSameDay(selected, minDate) && t < minDate;

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <button type="button" onClick={openPicker} disabled={disabled}
        className={`w-full flex items-center gap-2 px-3 py-2 border rounded-lg text-sm text-left bg-white disabled:opacity-50 disabled:cursor-not-allowed ${open ? 'ring-2 ring-brand-300 border-brand-300' : ''}`}>
        <Calendar size={14} className="text-gray-400 shrink-0" />
        <span className={`flex-1 truncate ${selected ? 'text-gray-800' : 'text-gray-400'}`}>
          {selected ? formatDisplayDateTime(selected) : placeholder}
        </span>
        {selected && (
          <span onClick={e => { e.stopPropagation(); onChange(''); }} className="text-gray-300 hover:text-gray-500"><X size={13} /></span>
        )}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 bg-white rounded-xl border shadow-lg p-3">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {QUICK_PICKS.map(q => (
              <button key={q.label} type="button" onClick={() => pickQuick(q.days)}
                className="px-2.5 py-1 text-[11px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-full">
                {q.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <MonthCalendar viewYear={view.year} viewMonth={view.month}
              onViewChange={(year, month) => setView({ year, month })}
              selected={selected} onSelectDay={pickDay}
              minDay={minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : null} />
            <div ref={timeListRef} className="w-24 h-64 overflow-y-auto border-l pl-2 shrink-0">
              {timeOptions.map((t, i) => {
                const active = selected && t.getHours() === selected.getHours() && t.getMinutes() === selected.getMinutes();
                const disabledTime = isTimeDisabled(t);
                return (
                  <button key={i} type="button" data-active={active} disabled={disabledTime} onClick={() => pickTime(t)}
                    className={`w-full text-left px-2 py-1 text-xs rounded-lg mb-0.5
                      ${active ? 'bg-brand-600 text-white font-semibold' : 'hover:bg-gray-100 text-gray-700'}
                      ${disabledTime ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : ''}`}>
                    {t.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </button>
                );
              })}
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)}
            className="w-full mt-2 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Done</button>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
