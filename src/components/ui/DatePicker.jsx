import { useEffect, useRef, useState } from 'react';
import { Calendar, X } from 'lucide-react';
import MonthCalendar from './MonthCalendar';
import { parseDateOnly, formatDateOnly, formatDisplayDate } from './dateUtils';

// Drop-in replacement for <input type="date"> — same value ('YYYY-MM-DD') and
// onChange(newValue) contract, but a faster popover calendar with jump-to
// month/year dropdowns instead of the native picker's arrow-by-arrow paging.
const DatePicker = ({ value, onChange, placeholder = 'Select date', min, max, className = '', disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = parseDateOnly(value);
  const minDay = parseDateOnly(min);
  const maxDay = parseDateOnly(max);
  const [view, setView] = useState(() => {
    const d = selected || new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openPicker = () => {
    if (disabled) return;
    const d = selected || new Date();
    setView({ year: d.getFullYear(), month: d.getMonth() });
    setOpen(o => !o);
  };

  const pick = (day) => { onChange(formatDateOnly(day)); setOpen(false); };

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <button type="button" onClick={openPicker} disabled={disabled}
        className={`w-full flex items-center gap-2 px-3 py-2 border rounded-lg text-sm text-left bg-white disabled:opacity-50 disabled:cursor-not-allowed ${open ? 'ring-2 ring-brand-300 border-brand-300' : ''}`}>
        <Calendar size={14} className="text-gray-400 shrink-0" />
        <span className={`flex-1 truncate ${selected ? 'text-gray-800' : 'text-gray-400'}`}>
          {selected ? formatDisplayDate(selected) : placeholder}
        </span>
        {selected && (
          <span onClick={e => { e.stopPropagation(); onChange(''); }} className="text-gray-300 hover:text-gray-500"><X size={13} /></span>
        )}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 bg-white rounded-xl border shadow-lg p-3">
          <MonthCalendar viewYear={view.year} viewMonth={view.month}
            onViewChange={(year, month) => setView({ year, month })}
            selected={selected} onSelectDay={pick} minDay={minDay} maxDay={maxDay} />
          <button type="button" onClick={() => pick(new Date())}
            className="w-full mt-2 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 rounded-lg">Today</button>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
