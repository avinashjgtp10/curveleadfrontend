import { AlertCircle, RotateCcw } from 'lucide-react';

// Shared "couldn't load" state: the reason from the server plus a Retry button.
// A pending database update (API code MIGRATION_PENDING) gets its own title.
const ErrorState = ({ message, onRetry, title, retrying = false, className = '' }) => {
  const pending = /temporarily unavailable/i.test(message || '');
  return (
    <div role="alert" className={`flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 ${className}`}>
      <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title || (pending ? 'Temporarily unavailable' : "Couldn't load this")}</p>
        <p className="text-sm text-amber-800 mt-0.5 break-words">{message || 'Something went wrong. Please try again.'}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} disabled={retrying}
          className="shrink-0 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold hover:bg-amber-100 disabled:opacity-50 inline-flex items-center gap-1.5">
          <RotateCcw size={12} className={retrying ? 'animate-spin' : ''} /> {retrying ? 'Retrying…' : 'Retry'}
        </button>
      )}
    </div>
  );
};

// Pulls the server's reason out of an axios error.
export const errorMessage = (e, fallback = 'Something went wrong. Please try again.') =>
  e?.response?.data?.error || (e?.code === 'ERR_NETWORK' ? "Can't reach the server. Check your connection." : fallback);

export default ErrorState;
