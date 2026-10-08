const Pagination = ({ page, totalPages, onChange, totalItems, pageSize }) => {
  if (totalPages <= 1) return (
    <div className="flex items-center justify-end px-4 py-3 border-t text-xs text-gray-400">
      <span>{totalItems} result{totalItems === 1 ? '' : 's'}</span>
    </div>
  );

  const pages = totalPages <= 7
    ? Array.from({ length: totalPages }, (_, i) => i + 1)
    : page <= 4
      ? [1, 2, 3, 4, 5, '…', totalPages]
      : page >= totalPages - 3
        ? [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
        : [1, '…', page - 1, page, page + 1, '…', totalPages];

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-gray-400 flex-wrap gap-2">
      <div className="flex gap-1">
        {pages.map((n, i) => n === '…' ? (
          <span key={`e${i}`} className="w-7 h-7 flex items-center justify-center">…</span>
        ) : (
          <button key={n} onClick={() => onChange(n)}
            className={`w-7 h-7 rounded-lg ${n === page ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
            {n}
          </button>
        ))}
      </div>
      <span>Showing {start}-{end} of {totalItems}</span>
    </div>
  );
};

export default Pagination;
