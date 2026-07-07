import { useState } from 'react';
import { Gauge, Flame, Sun, Snowflake, ChevronDown } from 'lucide-react';
import { FOLLOWUP_HEALTH_STYLES, FOLLOWUP_HEALTH_ACTIONS } from '../../utils/followupHealth';

const scoreStyles = {
  hot:  { cls: 'bg-red-100 text-red-700', ring: 'text-red-500',   Icon: Flame },
  warm: { cls: 'bg-amber-100 text-amber-700', ring: 'text-amber-500', Icon: Sun },
  cold: { cls: 'bg-gray-100 text-gray-600', ring: 'text-gray-400', Icon: Snowflake },
};

const ScoreRing = ({ value, ringCls }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value ?? 0));
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg viewBox="0 0 48 48" className="w-12 h-12 -rotate-90">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-100" />
        {value != null && (
          <circle cx="24" cy="24" r={radius} fill="none" stroke="currentColor" strokeWidth="4"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={ringCls} />
        )}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">
        {value != null ? value : '—'}
      </span>
    </div>
  );
};

const LeadIntentCard = ({ lead, activities = [] }) => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const score = scoreStyles[lead.lead_score] || scoreStyles.cold;
  const health = lead.followup_health || 'good';
  const healthStyle = FOLLOWUP_HEALTH_STYLES[health];
  const suggestedAction = lead.suggested_action || FOLLOWUP_HEALTH_ACTIONS[health];

  const scoreHistory = activities.filter(a => a.activity_type === 'score_change');

  return (
    <div className="bg-white rounded-2xl border p-5">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
        <Gauge size={16} /> Lead Intent
      </h3>

      <div className="flex items-center gap-3">
        <ScoreRing value={lead.intent_score} ringCls={score.ring} />
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${score.cls}`}>
            <score.Icon size={12} /> {lead.lead_score ? lead.lead_score.toUpperCase() : 'N/A'}
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${healthStyle.cls}`}>
            Follow-up: {healthStyle.label}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">Suggested next action</p>
        <p className="text-sm font-medium text-gray-800 mt-0.5">{suggestedAction}</p>
      </div>

      {lead.score_reason && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">Why</p>
          <p className="text-xs text-gray-500 mt-0.5">{lead.score_reason}</p>
        </div>
      )}

      {scoreHistory.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <button onClick={() => setHistoryOpen(v => !v)} className="w-full flex items-center gap-2 text-xs font-semibold text-gray-600">
            Score history
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">{scoreHistory.length}</span>
            <ChevronDown size={13} className={`ml-auto text-gray-400 transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
          </button>
          {historyOpen && (
            <div className="mt-2 space-y-2">
              {scoreHistory.map(a => (
                <div key={a.id} className="text-xs border-l-2 border-yellow-200 pl-2.5">
                  <p className="font-medium text-gray-700">{a.title}</p>
                  {a.description && <p className="text-gray-400 mt-0.5">{a.description}</p>}
                  <p className="text-[10px] text-gray-300 mt-0.5">
                    {new Date(a.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeadIntentCard;
