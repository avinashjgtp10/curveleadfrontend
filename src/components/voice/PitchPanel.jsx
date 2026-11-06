import { useState } from 'react';

// The organization's call script plus playbook tips (when it has any). Collapsible so it never hides the call controls.
export default function PitchPanel({ pitch, defaultOpen, scriptText }) {
  const [open, setOpen] = useState(defaultOpen);
  const { tips } = pitch || {};
  const script = scriptText ?? pitch?.script;
  if (!script && !tips) return null;
  return (
    <div className="rounded-lg border border-brand-200 bg-brand-50/40 text-left">
      <button onClick={() => setOpen(o => !o)} aria-expanded={open} className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-brand-800">
        Pitch <span className="text-xs font-normal">{open ? 'Hide' : 'Show'}</span></button>
      {open && (
        <div className="px-3 pb-3 space-y-3 text-sm max-h-56 overflow-y-auto">
          {script && <p className="whitespace-pre-wrap text-gray-800">{script}</p>}
          {tips && (
            <div className="space-y-2 text-xs text-gray-700">
              {tips.practices.length > 0 && <div><p className="font-semibold">What works</p><ul className="list-disc ml-4">{tips.practices.map((t, i) => <li key={i}>{t}</li>)}</ul></div>}
              {tips.phrases.length > 0 && <div><p className="font-semibold">Phrases that work</p><ul className="list-disc ml-4">{tips.phrases.map((t, i) => <li key={i}>{t}</li>)}</ul></div>}
              {tips.objections.length > 0 && <div><p className="font-semibold">If they say…</p><ul className="ml-0 space-y-1">{tips.objections.map((o, i) => <li key={i}><span className="font-medium">“{o.objection}”</span>{o.response ? ` → ${o.response}` : ''}</li>)}</ul></div>}
              {tips.avoid.length > 0 && <div><p className="font-semibold">Avoid</p><ul className="list-disc ml-4">{tips.avoid.map((t, i) => <li key={i}>{t}</li>)}</ul></div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
