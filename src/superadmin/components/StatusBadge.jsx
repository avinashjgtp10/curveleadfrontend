const STATUS_STYLES = {
  New: 'bg-blue-50 text-blue-600',
  Contacted: 'bg-amber-50 text-amber-600',
  Interested: 'bg-emerald-50 text-emerald-600',
  Confirmed: 'bg-emerald-50 text-emerald-600',
  Pending: 'bg-amber-50 text-amber-600',
  Completed: 'bg-blue-50 text-blue-600',
  Canceled: 'bg-red-50 text-red-600',
  Active: 'bg-emerald-50 text-emerald-600',
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
    {status}
  </span>
);

export default StatusBadge;
