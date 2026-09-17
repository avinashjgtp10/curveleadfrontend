import { Search } from 'lucide-react';

const SearchInput = ({ value, onChange, placeholder = 'Search...', className = '' }) => (
  <div className={`relative ${className}`}>
    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
    />
  </div>
);

export default SearchInput;
