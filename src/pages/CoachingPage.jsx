import { useEffect, useState } from 'react';
import { playbookAPI } from '../services/api';
import { Lightbulb, CheckCircle, MessageSquareWarning, ThumbsUp, ThumbsDown, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const InsightCard = ({ icon: Icon, color, title, children }) => (
  <div className="bg-white rounded-2xl border p-5">
    <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
      <Icon size={16} className={color} /> {title}
    </h3>
    {children}
  </div>
);

const CoachingPage = () => {
  const [playbook, setPlaybook] = useState(null);
  const [coaching, setCoaching] = useState({ staff: [], team_avg_score: null });
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [pbRes, coachRes] = await Promise.all([
        playbookAPI.get().catch(() => ({ data: { playbook: null } })),
        playbookAPI.getCoaching().catch(() => ({ data: { staff: [], team_avg_score: null } })),
      ]);
      setPlaybook(pbRes.data.playbook);
      setCoaching(coachRes.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError('');
    try {
      await playbookAPI.regenerate();
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to regenerate playbook.');
    } finally { setRegenerating(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-gray-500">AI-synthesized sales playbook, learned from your team's call outcomes, plus per-rep coaching insights.</p>
        <button onClick={handleRegenerate} disabled={regenerating}
          className="flex items-center gap-1.5 text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-60">
          <RefreshCw size={13} className={regenerating ? 'animate-spin' : ''} />
          {regenerating ? 'Regenerating…' : 'Regenerate Now'}
        </button>
      </div>

      {error && <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-2.5">{error}</div>}

      {!playbook ? (
        <div className="bg-white rounded-2xl border p-8 text-center">
          <Lightbulb size={28} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No playbook yet.</p>
          <p className="text-xs text-gray-400 mt-1">Once you have a few leads marked won or lost with analyzed calls attached, click "Regenerate Now" to build one.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400">
            Generated {fmtDate(playbook.generated_at)} from {playbook.source_call_count} calls
            ({playbook.source_won_count} won / {playbook.source_lost_count} lost) · v{playbook.version}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InsightCard icon={CheckCircle} color="text-green-500" title="Best Practices">
              {playbook.best_practices?.length > 0 ? (
                <ul className="space-y-1.5">
                  {playbook.best_practices.map((p, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-sm text-gray-600">
                      <CheckCircle size={13} className="text-green-500 mt-0.5 shrink-0" />{p}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-gray-400">None yet.</p>}
            </InsightCard>

            <InsightCard icon={MessageSquareWarning} color="text-amber-500" title="Common Objections & Responses">
              {playbook.common_objections?.length > 0 ? (
                <div className="space-y-3">
                  {playbook.common_objections.map((o, i) => (
                    <div key={i} className="text-sm">
                      <p className="text-gray-700 font-medium">"{o.objection}"</p>
                      <p className="text-gray-500 text-xs mt-0.5">→ {o.recommended_response}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-400">None yet.</p>}
            </InsightCard>

            <InsightCard icon={ThumbsUp} color="text-brand-500" title="Phrases That Work">
              {playbook.phrases_that_work?.length > 0 ? (
                <ul className="space-y-1 text-sm text-gray-600">
                  {playbook.phrases_that_work.map((p, i) => <li key={i}>• {p}</li>)}
                </ul>
              ) : <p className="text-xs text-gray-400">None yet.</p>}
            </InsightCard>

            <InsightCard icon={ThumbsDown} color="text-red-400" title="Phrases to Avoid">
              {playbook.phrases_to_avoid?.length > 0 ? (
                <ul className="space-y-1 text-sm text-gray-600">
                  {playbook.phrases_to_avoid.map((p, i) => <li key={i}>• {p}</li>)}
                </ul>
              ) : <p className="text-xs text-gray-400">None yet.</p>}
            </InsightCard>
          </div>
        </>
      )}

      {/* Staff coaching table */}
      <div className="bg-white rounded-2xl border p-5">
        <h3 className="font-semibold mb-4">Staff Coaching</h3>
        {coaching.staff.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No staff data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left py-2">Name</th>
                  <th className="text-right py-2">Calls</th>
                  <th className="text-right py-2">Avg Score</th>
                  <th className="text-right py-2">vs Team</th>
                  <th className="text-right py-2">Conv. Rate</th>
                  <th className="text-left py-2 pl-4">Top Missed Points</th>
                </tr>
              </thead>
              <tbody>
                {coaching.staff.map(s => (
                  <tr key={s.id} className="border-t">
                    <td className="py-2.5 font-medium">{s.name}</td>
                    <td className="text-right">{s.call_count}</td>
                    <td className="text-right font-semibold">{s.avg_score ?? '—'}</td>
                    <td className="text-right">
                      {s.score_vs_team !== null ? (
                        <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${s.score_vs_team >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {s.score_vs_team >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {s.score_vs_team >= 0 ? '+' : ''}{s.score_vs_team}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="text-right font-semibold">{s.conversion_rate}%</td>
                    <td className="py-2.5 pl-4 text-xs text-gray-500">{s.top_missed.join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachingPage;
