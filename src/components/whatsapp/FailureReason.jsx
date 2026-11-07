import { parseFailure } from '../../utils/failureReason';

// Plain-language reason a message failed, with Meta's error code as a small chip. Hover shows the original text.
export default function FailureReason({ detail, className = '', chipClassName = 'bg-red-100 text-red-700' }) {
  const r = parseFailure(detail);
  return (
    <span className={className} title={r.raw || undefined}>
      {r.text}
      {r.code && <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${chipClassName}`} aria-label={`Meta error code ${r.code}`}>Meta {r.code}</span>}
    </span>
  );
}
