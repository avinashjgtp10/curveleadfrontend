import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { countryCodes } from '../../data/countryCodes';

// Reusable searchable country-dial-code picker.
// value: the iso code (e.g. 'IN'); onChange receives the selected country object { name, iso, dial }.
const CountryCodeSelect = ({ value = 'IN', onChange, className = '' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);

  const selected = countryCodes.find(c => c.iso === value) || countryCodes.find(c => c.iso === 'IN');

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = countryCodes.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) || c.dial.includes(query)
  );

  const handleSelect = (country) => {
    onChange?.(country);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-l-lg border-r border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-100">
        <span>{selected.iso} {selected.dial}</span> <ChevronDown size={13} className="shrink-0 text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-72 rounded-lg border border-gray-200 bg-white shadow-xl">
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search country or code"
            className="w-full border-b border-gray-100 px-3 py-2.5 text-sm focus:outline-none"
          />
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-400">No matches.</p>
            ) : (
              filtered.map(c => (
                <button key={c.iso} type="button" onClick={() => handleSelect(c)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 ${c.iso === selected.iso ? 'bg-brand-50' : ''}`}>
                  <span className="truncate text-gray-800">{c.name}</span>
                  <span className="shrink-0 text-gray-400">{c.dial}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryCodeSelect;
