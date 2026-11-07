import { LEAD_VARIABLES } from '../../utils/leadVariables';

// What each {{variable}} fills in, in plain words. Same list on every screen that writes a message.
export default function VariableHelp({ className = '' }) {
  return (
    <div className={`text-[11px] text-gray-500 ${className}`}>
      <p className="font-medium text-gray-600">Details you can put in the message</p>
      <ul className="mt-1 grid sm:grid-cols-2 gap-x-4 gap-y-0.5">
        {LEAD_VARIABLES.map((v) => (
          <li key={v.key}><code className="bg-gray-100 px-1 rounded">{v.token}</code> {v.help}</li>
        ))}
      </ul>
    </div>
  );
}

// Shown under a message box when it contains a {{variable}} we won't fill.
export function UnknownVariables({ items }) {
  if (!items?.length) return null;
  return (
    <p role="alert" className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mt-1">
      {items.map((u) => (u.suggestion ? `${u.token} won’t be filled in — did you mean ${u.suggestion}?` : `${u.token} isn’t a detail we can fill in.`)).join(' ')}
    </p>
  );
}
