// options: strings, or { value, label } when two entries can share a label (e.g. organizations with the same name).
const SelectFilter = ({ value, onChange, options, allLabel, className = '' }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className={`px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 ${className}`}
  >
    {allLabel && <option value={allLabel}>{allLabel}</option>}
    {options.map(o => {
      const optionValue = typeof o === 'string' ? o : o.value;
      const label = typeof o === 'string' ? o : o.label;
      return <option key={optionValue} value={optionValue}>{label}</option>;
    })}
  </select>
);

export default SelectFilter;
