// One status vocabulary for every integration, automation and sequence:
// Not set up · Working · Warning (with reason) · Failing (with last error) · Off.
export const STATUS = {
  off: { label: 'Off', cls: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
  not_set_up: { label: 'Not set up', cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  working: { label: 'Working', cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  warning: { label: 'Warning', cls: 'bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  failing: { label: 'Failing', cls: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
};

const StatusBadge = ({ status = 'off', label, reason, className = '' }) => {
  const s = STATUS[status] || STATUS.off;
  return (
    <span title={reason || undefined}
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.cls} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {label || s.label}
    </span>
  );
};

export default StatusBadge;
