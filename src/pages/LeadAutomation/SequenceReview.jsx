import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { reviewSequence } from '../../utils/sequenceReview';

const ICON = { ok: <CheckCircle2 size={14} className="text-green-600 shrink-0 mt-0.5" />, warn: <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />, bad: <XCircle size={14} className="text-red-600 shrink-0 mt-0.5" /> };

// "What this will do" in plain English, then the checks it passes or needs attention on, before the sequence is switched on.
export default function SequenceReview({ form, templates, optIn, triggers }) {
  const { summary, checks } = reviewSequence({ form, templates, optIn, triggers });
  return (
    <section aria-label="Review before you turn it on" className="border rounded-xl p-3 bg-gray-50 space-y-2">
      <h4 className="text-sm font-semibold">Review before you turn it on</h4>
      <ol className="text-xs text-gray-700 space-y-0.5 list-none">{summary.map((line, i) => <li key={i}>{line}</li>)}</ol>
      <ul className="space-y-1.5 pt-1 border-t">{checks.map((c) => <li key={c.key} data-tone={c.tone} className="flex gap-2 text-xs text-gray-700">{ICON[c.tone]}<span>{c.text}</span></li>)}</ul>
    </section>
  );
}
