// Owner name with a small initials avatar.
const OwnerCell = ({ name }) => {
  if (!name) return <span className="text-gray-400">—</span>;
  const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold flex items-center justify-center shrink-0">{initials}</span>
      <span className="text-gray-600">{name}</span>
    </span>
  );
};

export default OwnerCell;
