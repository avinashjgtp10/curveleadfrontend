const STATUS_STYLES = {
  New: 'bg-blue-50 text-blue-600',
  Contacted: 'bg-amber-50 text-amber-600',
  Interested: 'bg-emerald-50 text-emerald-600',
  Confirmed: 'bg-emerald-50 text-emerald-600',
  Pending: 'bg-amber-50 text-amber-600',
  Completed: 'bg-blue-50 text-blue-600',
  Canceled: 'bg-red-50 text-red-600',
  Active: 'bg-emerald-50 text-emerald-600',
  // Real tenant subscription statuses (lowercase, as stored in the DB)
  trial: 'bg-amber-50 text-amber-600',
  active: 'bg-emerald-50 text-emerald-600',
  cancelled: 'bg-gray-100 text-gray-600',
  expired: 'bg-red-50 text-red-600',
  halted: 'bg-red-50 text-red-600',
  // Platform-wide (Super Admin) statuses
  Trial: 'bg-amber-50 text-amber-600',
  Suspended: 'bg-red-50 text-red-600',
  Inactive: 'bg-gray-100 text-gray-600',
  Cancelled: 'bg-gray-100 text-gray-600',
  Converted: 'bg-emerald-50 text-emerald-600',
  Lost: 'bg-red-50 text-red-600',
  Success: 'bg-emerald-50 text-emerald-600',
  Paid: 'bg-emerald-50 text-emerald-600',
  Failed: 'bg-red-50 text-red-600',
  Refunded: 'bg-violet-50 text-violet-600',
  Warning: 'bg-amber-50 text-amber-600',
  Hot: 'bg-red-50 text-red-600',
  Warm: 'bg-amber-50 text-amber-600',
  Cold: 'bg-blue-50 text-blue-600',
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
    {status}
  </span>
);

export default StatusBadge;
