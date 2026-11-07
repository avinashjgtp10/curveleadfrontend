import { Edit2, Trash2, Copy, Pause, Play, BarChart3 } from 'lucide-react';
import { sequenceStatus, sequenceSummary, toggleAction } from '../../utils/sequenceStatus';

const TONE = { ok: 'bg-green-50 text-green-700', warn: 'bg-amber-50 text-amber-800', bad: 'bg-red-50 text-red-700', muted: 'bg-gray-100 text-gray-600' };

// The sequence list: status (Active / Paused / Draft / Has errors), how many leads are in it, what starts it, and the actions.
export default function SequenceList({ sequences, rules, isAdmin, triggerLabel, onEdit, onToggle, onDuplicate, onDelete, onResults }) {
  return (
    <div className="space-y-2">
      {sequences.map((s) => {
        const status = sequenceStatus(s);
        const action = toggleAction(s);
        const triggers = (rules || []).filter((r) => r.sequence_id === s.id);
        return (
          <div key={s.id} className="border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm">{s.name}</span>
                  <span title={status.detail} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${TONE[status.tone]}`}>{status.label}</span>
                </div>
                <p className="text-xs text-gray-500">{sequenceSummary(s)}</p>
                {s.description && <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{s.description}</p>}
                <p className="text-xs mt-1.5">
                  {triggers.length === 0
                    ? <span className="text-amber-700">No trigger starts this sequence yet, so no lead will be added to it automatically.</span>
                    : <span className="text-gray-600">Starts when: {triggers.map((r) => `${triggerLabel(r)}${r.is_active ? '' : ' (off)'}`).join(' · ')}</span>}
                </p>
                {status.key === 'errors' && <p className="text-xs text-red-700 mt-1">{status.detail}</p>}
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                  <button type="button" onClick={() => onToggle(s)} aria-label={`${action.label} sequence ${s.name}`}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border hover:bg-gray-50 flex items-center gap-1">
                    {action.next ? <Play size={12} /> : <Pause size={12} />} {action.label}
                  </button>
                  {onResults && <button type="button" aria-label={`See results for sequence ${s.name}`} title="Results" onClick={() => onResults(s)} className="p-1.5 hover:bg-gray-100 rounded-lg"><BarChart3 size={13} /></button>}
                  <button type="button" aria-label={`Edit sequence ${s.name}`} title="Edit" onClick={() => onEdit(s)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 size={13} /></button>
                  <button type="button" aria-label={`Duplicate sequence ${s.name}`} title="Duplicate" onClick={() => onDuplicate(s)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Copy size={13} /></button>
                  <button type="button" aria-label={`Delete sequence ${s.name}`} title="Delete" onClick={() => onDelete(s)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={13} /></button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
