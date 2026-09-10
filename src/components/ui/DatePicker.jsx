import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const toISO = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const fromISO = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const fmtDisplay = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
};

const buildDays = (viewYear, viewMonth) => {
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(viewYear, viewMonth, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
};

// A reusable calendar-style date picker — swaps out the browser's native
// <input type="date"> popup (which renders inconsistently across browsers/OSes)
// for one styled consistently with the rest of the app.
const DatePicker = ({ value, onChange, placeholder = 'dd-mm-yyyy', className = '' }) => {
  const [open, setOpen] = useState(false);
  const selected = fromISO(value);
  const [viewDate, setViewDate] = useState(selected || new Date());
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  useEffect(() => { if (open) setViewDate(selected || new Date()); }, [open]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const days = buildDays(viewYear, viewMonth);
  const todayISO = toISO(new Date());

  const pick = (d) => { onChange(toISO(d)); setOpen(false); };
  const shiftMonth = (delta) => setViewDate(new Date(viewYear, viewMonth + delta, 1));

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button type="button" onClick={() => setOpen(v => !v)}
        className="h-10 w-full flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 text-sm text-left focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
        <Calendar size={14} className="shrink-0 text-gray-400" />
        <span className={value ? 'text-gray-700' : 'text-gray-400'}>{value ? fmtDisplay(value) : placeholder}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-64">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">{MONTHS[viewMonth]} {viewYear}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => shiftMonth(-1)} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={14} /></button>
              <button type="button" onClick={() => shiftMonth(1)} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={14} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-gray-400 mb-1">
            {WEEKDAYS.map(w => <span key={w}>{w}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              const iso = toISO(d);
              const inMonth = d.getMonth() === viewMonth;
              const isSelected = value === iso;
              const isToday = iso === todayISO;
              return (
                <button key={i} type="button" onClick={() => pick(d)}
                  className={`h-7 w-7 text-xs rounded-full flex items-center justify-center transition-colors
                    ${isSelected ? 'bg-cyan-600 text-white font-semibold' :
                      isToday ? 'bg-cyan-50 text-cyan-700 font-semibold' :
                      inMonth ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 hover:bg-gray-50'}`}>
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t">
            <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="text-xs font-semibold text-cyan-600 hover:text-cyan-700">Clear</button>
            <button type="button" onClick={() => pick(new Date())} className="text-xs font-semibold text-cyan-600 hover:text-cyan-700">Today</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
