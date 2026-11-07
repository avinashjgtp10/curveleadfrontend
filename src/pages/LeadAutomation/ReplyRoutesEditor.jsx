import { MousePointerClick } from 'lucide-react';
import { DEFAULT_PATH_TEXT, templateButtons, routesFromButtons, unroutedButtons, routeIssue } from '../../utils/replyRoutes';

// Reply branching for one step. "Branch on button reply" fills one route per quick-reply button of the step's template.
export default function ReplyRoutesEditor({ n, step, template, otherSequences, updateStep, idx }) {
  const routes = step.reply_routes || [];
  const buttons = templateButtons(template);
  const left = unroutedButtons(template, routes);
  const set = (next) => updateStep(idx, { reply_routes: next });
  const patch = (ri, fields) => set(routes.map((r, j) => (j === ri ? { ...r, ...fields } : r)));
  return (
    <fieldset className="border rounded-lg p-3 space-y-2 bg-white">
      <legend className="text-xs font-semibold">Branch on reply</legend>
      <p className="text-xs text-gray-600">Send leads down a different path depending on their answer. Routes apply only after this step is sent. Answers match exactly, ignoring capital letters and punctuation.</p>
      {buttons.length > 0 && left.length > 0 && (
        <button type="button" onClick={() => set(routesFromButtons(template, routes))} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 border border-brand-200 rounded-lg px-2.5 py-1.5 hover:bg-brand-50">
          <MousePointerClick size={13} /> Branch on button reply ({left.map((b) => `“${b}”`).join(', ')})
        </button>
      )}
      {step.approved_template_name && buttons.length === 0 && <p className="text-[11px] text-gray-500">The template “{step.approved_template_name}” has no reply buttons. Add routes by typing the answers you expect.</p>}
      {routes.map((route, ri) => {
        const issue = routeIssue(route);
        return (
          <div key={ri} className="border rounded p-2 space-y-2">
            <label className="block text-xs">When the lead answers<input aria-label={`Step ${n} route ${ri + 1} answer`} className="w-full border rounded p-2" value={route.answer} onChange={(e) => patch(ri, { answer: e.target.value })} placeholder="e.g. Yes" /></label>
            <label className="block text-xs">Start sequence<select aria-label={`Step ${n} route ${ri + 1} sequence`} className="w-full border rounded p-2" value={route.sequence_id} onChange={(e) => patch(ri, { sequence_id: e.target.value })}><option value="">Choose sequence</option>{otherSequences.map((seq) => <option key={seq.id} value={seq.id}>{seq.name}{!seq.is_active ? ' (draft)' : ''}</option>)}</select></label>
            {issue && <p className="text-[11px] text-amber-700">{issue}</p>}
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500">Label and other ways to say it</summary>
              <label className="block mt-2">Label (shown on the lead)<input className="w-full border rounded p-2" value={route.classification} onChange={(e) => patch(ri, { classification: e.target.value })} /></label>
              <label className="block mt-2">Other wordings, one per line<textarea className="w-full border rounded p-2" value={(route.aliases || []).join('\n')} onChange={(e) => patch(ri, { aliases: e.target.value.split('\n') })} /></label>
            </details>
            <button type="button" className="text-xs text-red-600" onClick={() => set(routes.filter((_, j) => j !== ri))}>Remove route</button>
          </div>
        );
      })}
      <button type="button" className="text-xs text-brand-600" onClick={() => set([...routes, { answer: '', classification: '', aliases: [], sequence_id: '' }])}>Add a route by hand</button>
      {routes.length > 0 && <p className="text-xs font-medium text-gray-700 bg-gray-50 border rounded-lg px-2.5 py-2" data-testid="default-path">Otherwise: {DEFAULT_PATH_TEXT}</p>}
    </fieldset>
  );
}
