const SelectFilter = ({ value, onChange, options, allLabel, className = '' }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className={`px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 ${className}`}
  >
    {allLabel && <option value={allLabel}>{allLabel}</option>}
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

export default SelectFilter;
