import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Wallet, TrendingUp, Users, Megaphone, ShieldCheck, AlertTriangle } from 'lucide-react';
import { cohortAPI } from '../services/api';
import { formatMoney } from '../utils/locale';
import StatCard from '../components/ui/StatCard';
import ErrorState from '../components/ui/ErrorState';
import {
  ACTION_LABEL, ACTION_TONE, suggestionSummary, currenciesIn, chartRows, totalFor, toMap, funnelSteps, attributionShares, campaignRows, ratioText, dashboardState, reasonLabel,
} from '../utils/revenueDashboard';

const PERIODS = [
  ['this_month', 'This month'], ['last_month', 'Last month'], ['last_30_days', 'Last 30 days'], ['last_90_days', 'Last 90 days'], ['this_year', 'This year'], ['lifetime', 'All time'],
];

const Ratio = ({ r, kind, currency }) => {
  const { text, reason } = ratioText(r, kind, currency, (v, c) => formatMoney(v, c));
  return <span title={reason || undefined} className={reason ? 'text-gray-400' : ''}>{text}</span>;
};

const Section = ({ title, hint, children }) => (
  <section className="bg-white border rounded-2xl p-4 sm:p-5">
    <h2 className="text-base font-semibold">{title}</h2>
    {hint && <p className="text-xs text-gray-500 mt-0.5 mb-3">{hint}</p>}
    {!hint && <div className="mb-3" />}
    {children}
  </section>
);

const RevenuePage = () => {
  const [period, setPeriod] = useState('this_month');
  const [currency, setCurrency] = useState(null);
  const [data, setData] = useState(null);
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [advice, setAdvice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setProblem(null);
    try {
      const [m, t] = await Promise.all([cohortAPI.metrics({ period }), cohortAPI.timeline({ period })]);
      setData({ cohort: m.data, timeline: t.data, mode: m.data.mode });
      // Suggestions are optional: if they fail, the rest of the page still works.
      cohortAPI.recommendations({ period }).then((r) => setAdvice(r.data)).catch(() => setAdvice(null));
    } catch (e) { setData(null); setProblem(dashboardState(e)); }
    finally { setLoading(false); }
  }, [period]);
  useEffect(() => { load(); }, [load]);

  const currencies = useMemo(() => (data ? currenciesIn(data) : []), [data]);
  const cur = currency && currencies.includes(currency) ? currency : currencies[0] || null;

  const c = data && data.cohort;
  const t = c && c.totals;
  const rows = useMemo(() => (c && cur ? chartRows(data.timeline.series, cur) : []), [data, c, cur]);
  const campaigns = useMemo(() => (c && cur ? campaignRows(c.campaigns, cur) : []), [c, cur]);
  const funnel = t ? funnelSteps(t) : [];
  const shares = c ? attributionShares(c.quality, t.leads) : [];
  const booked = t && cur ? totalFor(toMap(t.booked), cur) : 0;
  const collected = t && cur ? totalFor(toMap(t.collected && t.collected.net), cur) : 0;
  const undated = data && cur ? (data.timeline.undated || []).find((u) => u.currency === cur) : null;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold">Revenue &amp; ROI</h1>
          <p className="text-xs text-gray-500">What your ad spend brought in: leads, customers, booked value and money collected.</p>
        </div>
        <div className="flex items-center gap-2">
          {currencies.length > 1 && (
            <select aria-label="Currency" className="input w-auto" value={cur || ''} onChange={(e) => setCurrency(e.target.value)}>
              {currencies.map((x) => <option key={x}>{x}</option>)}
            </select>
          )}
          <select aria-label="Period" className="input w-auto" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {loading && !data && <p className="text-sm text-gray-500 py-10 text-center">Loading…</p>}
      {problem && problem.state !== 'error' && (
        <div className="bg-white border rounded-2xl p-6 text-center text-sm text-gray-600">{problem.message}</div>
      )}
      {problem && problem.state === 'error' && <ErrorState message={problem.message} onRetry={load} retrying={loading} />}

      {data && (
        <>
          {data.mode === 'shadow' && (
            <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl px-4 py-3 text-sm">
              <ShieldCheck size={16} className="mt-0.5 shrink-0" />
              <span>Preview for administrators. These figures are being checked against your existing reports before they replace them.</span>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Leads" value={t.leads} icon={Users} sub={`${t.qualified} qualified`} />
            <StatCard label="Customers" value={t.acquired} icon={Megaphone} color="bg-emerald-100 text-emerald-600" sub={t.cancelled ? `${t.cancelled} since cancelled` : 'first time won'} />
            <StatCard label="Booked value" value={cur ? formatMoney(booked, cur) : '—'} icon={TrendingUp} color="bg-amber-100 text-amber-600" sub="agreed deal value" />
            <StatCard label="Collected" value={cur ? formatMoney(collected, cur) : '—'} icon={Wallet} color="bg-violet-100 text-violet-600" sub="after refunds" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            {[['Ad spend', null], ['Cost per lead', c.totals.ratios.cpl, 'money'], ['Cost per customer', c.totals.ratios.cac, 'money'], ['Return on ad spend', c.totals.ratios.collected_roas, 'x']].map(([label, r, kind]) => (
              <div key={label} className="bg-white border rounded-2xl p-4">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold mt-0.5">
                  {label === 'Ad spend'
                    ? (c.totals.spend.amount != null ? formatMoney(c.totals.spend.amount, c.totals.spend.currency) : '—')
                    : <Ratio r={r} kind={kind} currency={c.totals.spend.currency} />}
                </p>
                {label === 'Ad spend' && c.totals.spend.amount == null && <p className="text-[11px] text-gray-400">{reasonLabel(c.totals.spend.reason)}</p>}
                {label !== 'Ad spend' && r && r.value == null && <p className="text-[11px] text-gray-400">{reasonLabel(r.reason)}</p>}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 -mt-2">Spend-based figures cover only campaigns with ad spend data ({c.totals.ratios_cover.leads} leads, {c.totals.ratios_cover.acquired} customers).</p>

          <Section title="Money over time" hint={data.timeline.notes.collected}>
            {rows.length === 0 ? <p className="text-sm text-gray-500 py-6 text-center">No bookings or payments in this period.</p> : (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatMoney(v, cur, { compact: true })} width={64} />
                    <Tooltip formatter={(v) => formatMoney(v, cur)} />
                    <Legend />
                    <Bar dataKey="booked" name="Booked" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Line dataKey="collected" name="Collected" stroke="#7c3aed" strokeWidth={2} dot />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
            {undated && undated.entries > 0 && (
              <p className="text-xs text-amber-700 mt-2 flex items-start gap-1.5"><AlertTriangle size={14} className="mt-0.5 shrink-0" />
                {formatMoney(undated.amount, cur)} across {undated.entries} payment{undated.entries === 1 ? '' : 's'} has no payment date, so it is not in any week above.</p>
            )}
          </Section>

          <div className="grid lg:grid-cols-2 gap-4">
            <Section title="Funnel" hint="Leads created in this period and how far they have got so far.">
              <ul className="space-y-2">
                {funnel.map((s) => (
                  <li key={s.label}>
                    <div className="flex justify-between text-sm"><span>{s.label}</span><span className="font-semibold">{s.count}{s.of_previous != null && <span className="text-xs text-gray-400 font-normal"> · {s.of_previous}% of previous</span>}</span></div>
                    <div className="h-2 bg-gray-100 rounded-full mt-1"><div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.max(2, s.of_leads || 0)}%` }} /></div>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-gray-400 mt-3">{c.quality.maturity.note}</p>
            </Section>

            <Section title="Can you trust these numbers?" hint="Share of leads by how sure we are which campaign brought them.">
              <ul className="space-y-2 text-sm">
                {shares.map((s) => (
                  <li key={s.key} className="flex justify-between"><span>{s.label}</span><span className="font-semibold">{s.count}{s.pct != null && <span className="text-xs text-gray-400 font-normal"> · {s.pct}%</span>}</span></li>
                ))}
              </ul>
              {c.quality.booked.inferred_from_deal_value > 0 && <p className="text-xs text-gray-500 mt-3">{c.quality.booked.inferred_from_deal_value} booked value(s) were worked out from the current deal value, not recorded at the time.</p>}
              {c.quality.milestones.won_stage_without_event > 0 && <p className="text-xs text-amber-700 mt-1">{c.quality.milestones.won_stage_without_event} won lead(s) are missing their Won record; an administrator should run the milestone backfill.</p>}
            </Section>
          </div>

          {advice && advice.currency && (
            <Section title="Budget suggestions" hint={advice.disclaimer}>
              <p className="text-sm font-medium mb-2">{suggestionSummary(advice)}</p>
              {(advice.warnings || []).map((w) => <p key={w} className="text-xs text-amber-700 flex items-start gap-1.5 mb-1"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{w}</p>)}
              <ul className="divide-y">
                {advice.recommendations.map((r) => (
                  <li key={r.campaign_id} className="py-2.5 flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{r.campaign_name || 'Unnamed campaign'}</p>
                      <p className="text-xs text-gray-500">{r.reason}</p>
                      {r.suggested_change && <p className="text-xs mt-0.5">{r.suggested_change.direction === 'increase' ? 'Add about' : 'Take about'} <b>{formatMoney(r.suggested_change.amount, advice.currency)}</b>{r.suggested_change.pct_of_spend ? ` (${r.suggested_change.pct_of_spend}% of its spend)` : ''}</p>}
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${ACTION_TONE[r.action]}`}>{ACTION_LABEL[r.action]}{r.confidence ? ` · ${r.confidence} confidence` : ''}</span>
                  </li>
                ))}
              </ul>
              {advice.shift && <p className="text-[11px] text-gray-400 mt-2">{advice.shift.note}</p>}
            </Section>
          )}

          <Section title="Campaign ROI" hint="Only money in the chosen currency is shown. Return needs ad spend in the same currency.">
            {campaigns.length === 0 ? <p className="text-sm text-gray-500 py-4 text-center">No campaign leads in this period.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-gray-500 border-b">
                    <th className="py-2 pr-3">Campaign</th><th className="pr-3 text-right">Leads</th><th className="pr-3 text-right">Customers</th><th className="pr-3 text-right">Spend</th>
                    <th className="pr-3 text-right">Booked</th><th className="pr-3 text-right">Collected</th><th className="pr-3 text-right">Return</th><th className="text-right">Cost / customer</th></tr></thead>
                  <tbody>{campaigns.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium"><Link to={`/campaigns/${r.id}`} className="hover:underline">{r.name}</Link></td>
                      <td className="pr-3 text-right">{r.leads}</td><td className="pr-3 text-right">{r.customers}</td>
                      <td className="pr-3 text-right" title={r.spend == null ? reasonLabel(r.spendReason) : undefined}>{r.spend == null ? '—' : formatMoney(r.spend, cur)}</td>
                      <td className="pr-3 text-right">{formatMoney(r.booked, cur)}</td><td className="pr-3 text-right">{formatMoney(r.collected, cur)}</td>
                      <td className="pr-3 text-right"><Ratio r={r.roas} kind="x" currency={cur} /></td>
                      <td className="text-right"><Ratio r={r.cac} kind="money" currency={cur} /></td>
                    </tr>))}
                  </tbody>
                </table>
              </div>
            )}
            {c.unattributed_row && c.unattributed_row.leads > 0 && (
              <p className="text-xs text-gray-500 mt-3">{c.unattributed_row.leads} lead(s) have no campaign (walk-ins, referrals, manual entries). They are in the totals above but not in a campaign row.</p>
            )}
          </Section>
        </>
      )}
    </div>
  );
};

export default RevenuePage;
