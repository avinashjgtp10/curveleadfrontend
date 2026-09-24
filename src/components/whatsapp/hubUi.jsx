import { useEffect, useState } from 'react';

export const Stat = ({ label, value, sub, tone = 'text-gray-900' }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
    <p className="text-xs text-gray-500">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${tone}`}>{value}</p>
    {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

export const Card = ({ title, action, children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        {action}
      </div>
    )}
    {children}
  </div>
);

export const Toggle = ({ checked, onChange, label, hint }) => (
  <label className="flex items-start justify-between gap-4 cursor-pointer">
    <span>
      <span className="block text-sm font-medium text-gray-800">{label}</span>
      {hint && <span className="block text-xs text-gray-500 mt-0.5">{hint}</span>}
    </span>
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative shrink-0 w-10 h-6 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  </label>
);

export const DaysSelect = ({ value, onChange }) => (
  <select value={value} onChange={e => onChange(Number(e.target.value))}
    className="px-2 py-1.5 border rounded-lg text-sm bg-white">
    <option value={7}>Last 7 days</option>
    <option value={30}>Last 30 days</option>
    <option value={90}>Last 90 days</option>
  </select>
);

export const Empty = ({ children }) => <p className="text-sm text-gray-400 text-center py-8">{children}</p>;
export const Loading = () => <div className="text-center py-12 text-gray-400 text-sm">Loading…</div>;
export const ErrorBox = ({ children }) => (
  <div className="text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-lg">{children}</div>
);

// Loads data from an API call, re-running when `deps` change.
export const useLoad = (fn, deps = []) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const reload = () => {
    setLoading(true); setError('');
    return fn().then(r => setData(r.data)).catch(e => setError(e.response?.data?.error || 'Failed to load.')).finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, deps);
  return { data, error, loading, reload, setData };
};

export const fmtDateTime = (v) => (v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
export const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const fmtDuration = (s) => (s == null ? '—' : s < 60 ? `${s}s` : s < 3600 ? `${Math.round(s / 60)}m` : `${(s / 3600).toFixed(1)}h`);
export const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');
