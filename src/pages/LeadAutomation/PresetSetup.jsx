import { X, CheckCircle2, Clock, AlertTriangle, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { stepSentence } from '../../utils/sequenceSteps';
import { templateNeeds, buildPreset, suggestStage, selectableStages, stopsText, SUGGESTED_TEMPLATES } from '../../utils/presetLibrary';

const STATUS = {
  approved: { icon: CheckCircle2, cls: 'text-green-700', text: 'Approved and ready' },
  pending: { icon: Clock, cls: 'text-amber-700', text: 'Waiting for WhatsApp to approve it. This usually takes minutes to a day.' },
  rejected: { icon: AlertTriangle, cls: 'text-red-700', text: 'WhatsApp did not approve it. Create a new version with different wording.' },
  missing: { icon: PlusCircle, cls: 'text-amber-700', text: 'You do not have this template yet.' },
};

// Step before the editor: what the preset does, what starts it, which WhatsApp templates it needs (and how to get them), when it stops.
export default function PresetSetup({ preset, stages, templates, templatesKnown, stageName, onStageChange, onContinue, onClose }) {
  const needs = templateNeeds(preset, templates);
  const built = buildPreset(preset, { templates, stageName });
  const stageTrigger = preset.trigger.type === 'stage';
  const options = selectableStages(stages);
  const needStage = stageTrigger && !stageName;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div role="dialog" aria-modal="true" aria-label={`Set up ${preset.label}`} className="bg-white rounded-2xl p-5 w-full max-w-2xl max-h-[88vh] overflow-y-auto shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div><h3 className="font-bold text-base">{preset.label}</h3><p className="text-xs text-gray-500 mt-0.5">{preset.description}</p></div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><X size={18} /></button>
        </div>
        {preset.note && <p className="text-xs bg-amber-50 border border-amber-100 text-amber-900 rounded-lg px-3 py-2">{preset.note}</p>}

        <section aria-label="What starts it">
          <h4 className="text-sm font-semibold mb-1">Starts when</h4>
          {stageTrigger ? (
            <div>
              <p className="text-xs text-gray-600 mb-1.5">Choose the stage where {preset.trigger.label}. Leads are added when they move into it.</p>
              <select aria-label="Trigger stage" value={stageName} onChange={(e) => onStageChange(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                <option value="">Choose a stage…</option>
                {options.map((s) => <option key={s.id || s.name} value={s.name}>{s.name}</option>)}
              </select>
              {needStage && <p className="text-[11px] text-amber-700 mt-1">Pick a stage to continue. {suggestStage(stages, preset.trigger) ? '' : 'None of your stages looked like a match, so the choice is yours.'}</p>}
            </div>
          ) : <p className="text-sm text-gray-800">A new lead arrives.</p>}
        </section>

        <section aria-label="What it does">
          <h4 className="text-sm font-semibold mb-1">What it does</h4>
          <ol className="text-xs text-gray-700 space-y-0.5">{built.sequence.steps.map((s, i) => <li key={i}>{i + 1}. {stepSentence(s, i, { stopOnReply: !!preset.stops.on_reply })}.</li>)}</ol>
          <p className="text-xs text-gray-600 mt-1.5">{stopsText(preset.stops)}</p>
        </section>

        <section aria-label="Templates it needs">
          <h4 className="text-sm font-semibold mb-1">WhatsApp templates it needs</h4>
          {!templatesKnown && <p className="text-xs text-amber-700 mb-1">Could not check your templates. Connect WhatsApp first, or continue and choose templates in the editor.</p>}
          <ul className="divide-y border rounded-lg">
            {needs.map((n) => { const st = STATUS[templatesKnown ? n.status : 'missing']; const Icon = st.icon; const s = SUGGESTED_TEMPLATES[n.key]; return (
              <li key={n.key} className="px-3 py-2 text-xs" data-status={templatesKnown ? n.status : 'unknown'}>
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-medium text-gray-800">{n.name} <span className="text-gray-400 font-normal">· {n.category === 'UTILITY' ? 'Utility' : 'Marketing'}</span></p>
                    <p className="text-gray-500 mt-0.5">“{s.body_text}”</p>
                    {templatesKnown && <p className={`mt-1 flex items-center gap-1 ${st.cls}`}><Icon size={12} /> {st.text}</p>}</div>
                  {templatesKnown && ['missing', 'rejected'].includes(n.status) && (
                    <Link to={`/whatsapp?tab=templates&suggest=${n.key}`} className="shrink-0 px-2.5 py-1.5 border border-brand-200 text-brand-700 font-semibold rounded-lg hover:bg-brand-50">Create and submit</Link>)}
                </div>
              </li>); })}
          </ul>
          <p className="text-[11px] text-gray-500 mt-1.5">Marketing templates only reach leads who opted in. You can continue now: a step without an approved template sends plain text inside WhatsApp’s 24-hour window, and the review before turning it on will say so. Already have your own template? Pick it in the editor.</p>
        </section>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="button" disabled={needStage} onClick={() => onContinue(built)} className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50">Review and edit</button>
        </div>
      </div>
    </div>
  );
}
