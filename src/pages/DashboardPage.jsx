import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Users, IndianRupee, Target, TrendingUp,
  ArrowUpRight, ArrowDownRight, Minus,
  Calendar, Video, AlertTriangle, ChevronRight, Flame, Clock,
  Zap, Sparkles, CheckCircle2, Megaphone,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const fmtDuration = (seconds) => {
  if (seconds === null || seconds === undefined) return '—';
  const s = Number(seconds);
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return `${(s / 3600).toFixed(1)}h`;
};

const fmtMoney = (n) => {
  const v = Number(n || 0);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${fmt(v)}`;
};

const STAGE_COLOR = {
  blue: '#3b82f6', green: '#22c55e', yellow: '#eab308', orange: '#f97316',
  red: '#ef4444', purple: '#a855f7', pink: '#ec4899', indigo: '#6366f1',
  teal: '#14b8a6', violet: '#8b5cf6', emerald: '#10b981', gray: '#9ca3af',
};

const Trend = ({ change }) => {
  if (change > 0) return (
    <span className="flex items-center gap-0.5 text-emerald-600 text-xs font-semibold">
      <ArrowUpRight size={13} />{change}% vs previous period
    </span>
  );
  if (change < 0) return (
    <span className="flex items-center gap-0.5 text-red-500 text-xs font-semibold">
      <ArrowDownRight size={13} />{Math.abs(change)}% vs previous period
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-gray-400 text-xs">
      <Minus size={13} />Same as previous period
    </span>
  );
};

const PERIOD_OPTIONS = [
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'custom', label: 'Custom' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('this_month');
  const [customFrom, setCustomFrom] = useState(todayISO());
  const [customTo, setCustomTo] = useState(todayISO());

  useEffect(() => {
    if (period === 'custom' && (!customFrom || !customTo)) return;
    setLoading(true);
    const params = period === 'custom' ? { period, date_from: customFrom, date_to: customTo } : { period };
    reportsAPI.dashboard(params)
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period, customFrom, customTo]);

  if (loading && !data) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
    </div>
  );

  const periodLabel = period === 'this_month'
    ? new Date().toLocaleString('en-IN', { month: 'long' })
    : period === 'last_month'
    ? new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleString('en-IN', { month: 'long' })
    : `${customFrom} to ${customTo}`;
  const today = todayISO();
  const pipelineTotal = (data?.pipeline || []).reduce((s, p) => s + p.count, 0) || 1;

  const trendData = (data?.trend || []).map(t => ({
    day: new Date(t.day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    Leads: parseInt(t.count),
  }));

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* ── Period Selector ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {PERIOD_OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => setPeriod(opt.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                period === opt.id ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="px-2.5 py-1.5 border rounded-lg text-xs" />
            <span className="text-xs text-gray-400">to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="px-2.5 py-1.5 border rounded-lg text-xs" />
          </div>
        )}
        {loading && <div className="animate-spin w-3.5 h-3.5 border-2 border-brand-600 border-t-transparent rounded-full" />}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: `Leads in ${periodLabel}`,
            value: fmt(data?.leads_in_period),
            sub: `${fmt(data?.total_leads)} total`,
            trend: data?.leads_change,
            icon: Users,
            iconCls: 'bg-blue-100 text-blue-600',
          },
          {
            label: `Revenue in ${periodLabel}`,
            value: fmtMoney(data?.revenue_in_period),
            sub: `${fmtMoney(data?.total_revenue)} total`,
            trend: data?.revenue_change,
            icon: IndianRupee,
            iconCls: 'bg-emerald-100 text-emerald-600',
          },
          {
            label: 'Conversion Rate',
            value: `${data?.conversion_rate || '0.0'}%`,
            sub: `${fmt(data?.won_in_period)} won in period`,
            icon: Target,
            iconCls: 'bg-violet-100 text-violet-600',
          },
          {
            label: 'Avg Deal Value',
            value: fmtMoney(data?.avg_deal_value),
            sub: `${fmt(data?.won_in_period)} deals closed`,
            icon: TrendingUp,
            iconCls: 'bg-amber-100 text-amber-600',
          },
          {
            label: 'Advance Collected',
            value: fmtMoney(data?.advance_collected_in_period),
            sub: 'From won deals in period',
            icon: IndianRupee,
            iconCls: 'bg-cyan-100 text-cyan-600',
          },
          {
            label: 'Balance Due',
            value: fmtMoney(data?.balance_due_in_period),
            sub: 'Pending from won deals in period',
            icon: AlertTriangle,
            iconCls: 'bg-orange-100 text-orange-600',
          },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border">
            <div className="flex items-start justify-between gap-2">
              <div className={`w-10 h-10 ${s.iconCls} rounded-xl flex items-center justify-center shrink-0`}>
                <s.icon size={18} />
              </div>
              {s.trend !== undefined && <Trend change={s.trend} />}
            </div>
            <p className="text-2xl font-bold mt-3 text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            <p className="text-[11px] text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Today's Action Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'New Today',
            value: data?.leads_today || 0,
            icon: Users,
            cls: 'text-blue-600 bg-blue-50 border-blue-100',
            to: `/leads?date_field=created_at&date_from=${today}&date_to=${today}`,
          },
          {
            label: 'Follow-ups Today',
            value: data?.followups_today || 0,
            icon: Calendar,
            cls: 'text-amber-600 bg-amber-50 border-amber-100',
            to: `/leads?view=followups&scope=today&category=followup&date_from=${today}&date_to=${today}`,
          },
          {
            label: 'Demos Today',
            value: data?.demos_today || 0,
            icon: Video,
            cls: 'text-violet-600 bg-violet-50 border-violet-100',
            to: '/appointments?scope=today',
          },
          {
            label: 'Overdue',
            value: data?.overdue_followups || 0,
            icon: AlertTriangle,
            cls: data?.overdue_followups > 0
              ? 'text-red-600 bg-red-50 border-red-200'
              : 'text-gray-400 bg-gray-50 border-gray-100',
            to: '/leads?view=followups&scope=overdue',
          },
          {
            label: 'Hot Leads',
            value: data?.hot_leads || 0,
            icon: Flame,
            cls: 'text-red-600 bg-red-50 border-red-100',
            to: '/leads?score=hot',
          },
          {
            label: 'Missed Follow-ups',
            value: data?.missed_followups || 0,
            icon: Clock,
            cls: data?.missed_followups > 0
              ? 'text-amber-700 bg-amber-50 border-amber-200'
              : 'text-gray-400 bg-gray-50 border-gray-100',
            to: '/leads?followup_health=missed',
          },
          {
            label: 'Critical Follow-ups',
            value: data?.critical_followups || 0,
            icon: AlertTriangle,
            cls: data?.critical_followups > 0
              ? 'text-red-700 bg-red-100 border-red-300'
              : 'text-gray-400 bg-gray-50 border-gray-100',
            to: '/leads?followup_health=critical',
          },
        ].map(s => (
          <button key={s.label} onClick={() => navigate(s.to)}
            className={`flex items-center gap-3 p-4 rounded-xl border ${s.cls} hover:opacity-80 transition-opacity text-left w-full`}>
            <s.icon size={18} className="shrink-0" />
            <div>
              <p className="text-xl font-bold leading-none">{s.value}</p>
              <p className="text-[11px] mt-0.5 opacity-70 font-medium">{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Automation & AI Activity ── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Automation & AI</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Active in Sequence',
              value: data?.active_enrollments || 0,
              icon: Zap,
              cls: 'text-cyan-600 bg-cyan-50 border-cyan-100',
              to: '/settings',
            },
            {
              label: 'Completed This Month',
              value: data?.completed_this_month || 0,
              icon: CheckCircle2,
              cls: 'text-emerald-600 bg-emerald-50 border-emerald-100',
              to: '/settings',
            },
            {
              label: 'AI Replies This Week',
              value: data?.ai_replies_this_week || 0,
              icon: Sparkles,
              cls: 'text-violet-600 bg-violet-50 border-violet-100',
              to: '/whatsapp',
            },
            {
              label: 'Meta Leads Today',
              value: data?.meta_leads_today || 0,
              icon: Megaphone,
              cls: 'text-blue-600 bg-blue-50 border-blue-100',
              to: `/leads?source=meta_ads&date_field=created_at&date_from=${today}&date_to=${today}`,
            },
          ].map(s => (
            <button key={s.label} onClick={() => navigate(s.to)}
              className={`flex items-center gap-3 p-4 rounded-xl border ${s.cls} hover:opacity-80 transition-opacity text-left w-full`}>
              <s.icon size={18} className="shrink-0" />
              <div>
                <p className="text-xl font-bold leading-none">{s.value}</p>
                <p className="text-[11px] mt-0.5 opacity-70 font-medium">{s.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Unassigned Leads Alert ── */}
      {(data?.unassigned_leads || 0) > 0 && (
        <button onClick={() => navigate('/leads?assigned_to=unassigned')}
          className="w-full flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors text-left">
          <AlertTriangle size={18} className="text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              {data.unassigned_leads} unassigned lead{data.unassigned_leads !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-amber-600">Assign these leads to your team to avoid missing opportunities.</p>
          </div>
          <ChevronRight size={16} className="text-amber-400 shrink-0" />
        </button>
      )}

      {/* ── Critical Follow-ups Alert ── */}
      {(data?.critical_followups || 0) > 0 && (
        <button onClick={() => navigate('/leads?followup_health=critical')}
          className="w-full flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors text-left">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">
              {data.critical_followups} lead{data.critical_followups !== 1 ? 's have' : ' has'} critical missed follow-ups — review now
            </p>
            <p className="text-xs text-red-600">Overdue more than 5 days. These need manager attention.</p>
          </div>
          <ChevronRight size={16} className="text-red-400 shrink-0" />
        </button>
      )}

      {/* ── Pipeline + Recent Leads ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Pipeline funnel */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900">Pipeline</h3>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
              {fmt(pipelineTotal)} total leads
            </span>
          </div>
          <div className="space-y-4">
            {(data?.pipeline || []).map(stage => {
              const pct = Math.round((stage.count / pipelineTotal) * 100);
              const bar = STAGE_COLOR[stage.color] || STAGE_COLOR.gray;
              return (
                <div key={stage.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: bar }} />
                      {stage.name}
                      {stage.is_won && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-bold">WON</span>
                      )}
                      {stage.is_lost && (
                        <span className="text-[9px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded font-bold">LOST</span>
                      )}
                    </span>
                    <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
                      {stage.pipeline_value > 0 && (
                        <span className="text-gray-400">{fmtMoney(stage.pipeline_value)}</span>
                      )}
                      <span className="font-bold text-gray-800 w-5 text-right">{stage.count}</span>
                      <span className="text-gray-400 w-7 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: bar }} />
                  </div>
                </div>
              );
            })}
            {!data?.pipeline?.length && (
              <p className="text-sm text-gray-400 text-center py-6">No stages configured yet</p>
            )}
          </div>
        </div>

        {/* Recent leads */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Leads</h3>
            <button onClick={() => navigate('/leads')}
              className="text-xs text-brand-600 flex items-center gap-0.5 hover:underline">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-1">
            {(data?.recentLeads || []).map(l => (
              <button key={l.id} onClick={() => navigate('/leads', { state: { openLeadId: l.id } })}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 text-left group transition-colors">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 shrink-0 group-hover:bg-brand-50 group-hover:text-brand-700 transition-colors">
                  {l.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{l.name}</p>
                  <p className="text-xs text-gray-400 truncate capitalize">{l.stage}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  l.lead_score === 'hot'  ? 'bg-red-100 text-red-600' :
                  l.lead_score === 'warm' ? 'bg-amber-100 text-amber-600' :
                                            'bg-gray-100 text-gray-500'
                }`}>{(l.lead_score || 'new').toUpperCase()}</span>
              </button>
            ))}
            {!data?.recentLeads?.length && (
              <p className="text-sm text-gray-400 text-center py-8">No leads yet</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Sources + Team ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Lead sources */}
        <div className="bg-white rounded-2xl p-5 border">
          <h3 className="font-semibold text-gray-900 mb-4">Lead Sources</h3>
          {(data?.sources || []).length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-gray-400 uppercase tracking-wide border-b">
                  <th className="text-left pb-2 font-semibold">Source</th>
                  <th className="text-right pb-2 font-semibold">Leads</th>
                  <th className="text-right pb-2 font-semibold">Won</th>
                  <th className="text-right pb-2 font-semibold">Conv%</th>
                </tr>
              </thead>
              <tbody>
                {data.sources.map(s => (
                  <tr key={s.source} className="border-b last:border-0">
                    <td className="py-2.5 font-medium text-gray-700 capitalize">{s.source}</td>
                    <td className="py-2.5 text-right text-gray-500">{s.total}</td>
                    <td className="py-2.5 text-right font-semibold text-emerald-600">{s.won}</td>
                    <td className="py-2.5 text-right">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        parseFloat(s.conversion_rate) >= 20 ? 'bg-emerald-100 text-emerald-700' :
                        parseFloat(s.conversion_rate) >= 10 ? 'bg-amber-100 text-amber-700' :
                                                              'bg-gray-100 text-gray-500'
                      }`}>{s.conversion_rate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No source data yet</p>
          )}
        </div>

        {/* Team performance */}
        <div className="bg-white rounded-2xl p-5 border">
          <h3 className="font-semibold text-gray-900 mb-4">Team Performance</h3>
          {(data?.team || []).length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-gray-400 uppercase tracking-wide border-b">
                  <th className="text-left pb-2 font-semibold">Member</th>
                  <th className="text-right pb-2 font-semibold">Leads</th>
                  <th className="text-right pb-2 font-semibold">Won</th>
                  <th className="text-right pb-2 font-semibold">Revenue</th>
                  <th className="text-right pb-2 font-semibold">Avg Response</th>
                  <th className="text-right pb-2 font-semibold">Follow-ups Done</th>
                </tr>
              </thead>
              <tbody>
                {data.team.map((t, i) => (
                  <tr key={t.name} className="border-b last:border-0">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''}</span>
                        <span className="font-medium text-gray-700">{t.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-gray-500">{t.total_leads}</td>
                    <td className="py-2.5 text-right font-semibold text-emerald-600">{t.won}</td>
                    <td className="py-2.5 text-right font-semibold text-gray-700">{fmtMoney(t.revenue)}</td>
                    <td className="py-2.5 text-right text-gray-500">{fmtDuration(t.avg_response_seconds)}</td>
                    <td className="py-2.5 text-right text-gray-500">{t.completed_followups}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No team data yet</p>
          )}
        </div>
      </div>

      {/* ── Lead Trend ── */}
      {trendData.length > 1 && (
        <div className="bg-white rounded-2xl p-5 border">
          <h3 className="font-semibold text-gray-900 mb-4">Lead Trend — {periodLabel}</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 2' }}
              />
              <Area type="monotone" dataKey="Leads" stroke="#6366f1" strokeWidth={2}
                fill="url(#leadGrad)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
};

export default DashboardPage;
