import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES, WEEKDAY_LABELS, buildMonthMatrix, isSameDay } from './dateUtils';

// The calendar grid shared by DatePicker and DateTimePicker: month/year dropdowns
// (jump straight there instead of clicking prev/next repeatedly) plus a day grid.
const MonthCalendar = ({ viewYear, viewMonth, onViewChange, selected, onSelectDay, minDay, maxDay }) => {
  const days = buildMonthMatrix(viewYear, viewMonth);
  const years = Array.from({ length: 13 }, (_, i) => new Date().getFullYear() - 6 + i);

  const goMonth = (delta) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    onViewChange(d.getFullYear(), d.getMonth());
  };

  const isDisabled = (day) => (minDay && day < minDay) || (maxDay && day > maxDay);

  return (
    <div className="w-64">
      <div className="flex items-center gap-1 mb-2">
        <button type="button" onClick={() => goMonth(-1)} className="p-1 hover:bg-gray-100 rounded shrink-0"><ChevronLeft size={15} /></button>
        <select value={viewMonth} onChange={e => onViewChange(viewYear, parseInt(e.target.value, 10))}
          className="flex-1 min-w-0 text-xs font-semibold border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-300 rounded px-1 py-1">
          {MONTH_NAMES.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>
        <select value={viewYear} onChange={e => onViewChange(parseInt(e.target.value, 10), viewMonth)}
          className="text-xs font-semibold border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-300 rounded px-1 py-1">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button type="button" onClick={() => goMonth(1)} className="p-1 hover:bg-gray-100 rounded shrink-0"><ChevronRight size={15} /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAY_LABELS.map((w, i) => (
          <div key={i} className="text-[10px] font-semibold text-gray-400 py-1">{w}</div>
        ))}
        {days.map((day, i) => {
          const inMonth = day.getMonth() === viewMonth;
          const isSelected = isSameDay(day, selected);
          const isToday = isSameDay(day, new Date());
          const disabled = isDisabled(day);
          return (
            <button key={i} type="button" disabled={disabled} onClick={() => onSelectDay(day)}
              className={`text-xs rounded-lg py-1.5 ${!inMonth ? 'text-gray-300' : 'text-gray-700'}
                ${isSelected ? 'bg-brand-600 text-white font-semibold' : isToday ? 'border border-brand-300 font-semibold' : 'hover:bg-gray-100'}
                ${disabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : ''}`}>
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MonthCalendar;
