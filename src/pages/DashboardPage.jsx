import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import { AreaChart, Area, LineChart as RLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import NotificationBell from '../components/layout/NotificationBell';
import {
  Users, IndianRupee, Target, Coins,
  ArrowUpRight, ArrowDownRight, Minus,
  Calendar, Video, AlertTriangle, ChevronRight, ChevronDown, Flame, Clock,
  Zap, Sparkles, CheckCircle2, Megaphone, Send, UserX,
  GitBranch, UserCheck, PieChart, LineChart as LineChartIcon,
  Menu, Infinity as InfinityIcon, PenLine, MessageCircle,
} from 'lucide-react';

const GoogleGIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.6 5.5 29.6 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.3-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.6 6.5 29.6 4.5 24 4.5c-7.6 0-14.1 4.3-17.7 10.6z"/>
    <path fill="#4CAF50" d="M24 44.5c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 35.6 26.9 36.5 24 36.5c-5.3 0-9.7-3.4-11.3-8.2l-6.6 5.1C9.8 40.1 16.4 44.5 24 44.5z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2.1-2.1 3.9-3.8 5.1l6.6 5.4C41.6 35.6 44.5 30.2 44.5 24c0-1.2-.1-2.4-.9-3.5z"/>
  </svg>
);

const WhatsAppIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#25D366" />
    <path fill="#fff" d="M22.7 9.3a8.9 8.9 0 0 0-14.1 10.7L7.3 24l4.1-1.3a8.9 8.9 0 0 0 12.6-11.8 8.9 8.9 0 0 0-1.3-1.6zm-6.6 13.5a7.4 7.4 0 0 1-3.8-1l-.3-.2-2.8.9.9-2.7-.2-.3a7.4 7.4 0 1 1 6.2 3.3zm4.1-5.5c-.2-.1-1.3-.7-1.5-.7-.2-.1-.4-.1-.5.1s-.6.7-.7.9c-.1.1-.3.2-.5.1a6 6 0 0 1-1.8-1.1 6.7 6.7 0 0 1-1.2-1.5c-.1-.2 0-.3.1-.4l.4-.4.2-.3c.1-.1 0-.3 0-.4l-.6-1.5c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.1 1.6 2.5 3.9 3.5.5.2.9.4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.3-.5 1.5-1 .2-.5.2-.9.1-1z"/>
  </svg>
);

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

const SOURCE_ICON = {
  meta_ads: { icon: InfinityIcon, cls: 'text-blue-500' },
  google_ads: { icon: GoogleGIcon, cls: '' },
  manual: { icon: PenLine, cls: 'text-gray-500' },
  whatsapp: { icon: WhatsAppIcon, cls: '' },
};

const Trend = ({ change }) => {
  if (change > 0) return (
    <span className="flex items-center gap-0.5 text-emerald-600 text-xs font-semibold">
      <ArrowUpRight size={13} />{change}%
    </span>
  );
  if (change < 0) return (
    <span className="flex items-center gap-0.5 text-red-500 text-xs font-semibold">
      <ArrowDownRight size={13} />{Math.abs(change)}%
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-gray-400 text-xs">
      <Minus size={13} />0%
    </span>
  );
};

const PERIOD_OPTIONS = [
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'custom', label: 'Custom' },
];

const STATUS_STYLE = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-teal-100 text-teal-700',
  qualified: 'bg-purple-100 text-purple-700',
  demo: 'bg-orange-100 text-orange-700',
  proposal: 'bg-amber-100 text-amber-700',
  negotiation: 'bg-pink-100 text-pink-700',
  won: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-gray-200 text-gray-600',
  follow: 'bg-indigo-100 text-indigo-700',
  unqualified: 'bg-red-100 text-red-600',
};

const statusStyleFor = (stageKey) => {
  const found = Object.keys(STATUS_STYLE).find(k => stageKey.startsWith(k));
  return found ? STATUS_STYLE[found] : 'bg-gray-100 text-gray-600';
};

const TEMP_STYLE = {
  hot: 'bg-red-100 text-red-600',
  warm: 'bg-amber-100 text-amber-600',
  cold: 'bg-gray-100 text-gray-500',
};

// ─── Component ────────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const navigate = useNavigate();
  const { onMenuClick } = useOutletContext() || {};
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

  const today = todayISO();
  const pipelineTotal = (data?.pipeline || []).reduce((s, p) => s + p.count, 0) || 1;

  const trendData = (data?.trend || []).map(t => ({
    day: new Date(t.day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    Leads: parseInt(t.count),
  }));
  const sparkDataRaw = trendData.length ? trendData.slice(-10) : [{ Leads: 0 }, { Leads: 0 }];
  const sparkData = sparkDataRaw.length >= 2 ? sparkDataRaw : [{ Leads: 0 }, ...sparkDataRaw];

  const kpiCards = [
    {
      label: 'Total Leads',
      value: fmt(data?.leads_in_period),
      trend: data?.leads_change,
      icon: Users,
      iconBg: 'bg-blue-100 text-blue-500',
      stroke: '#3b82f6',
    },
    {
      label: 'Revenue',
      value: fmtMoney(data?.revenue_in_period),
      trend: data?.revenue_change,
      icon: IndianRupee,
      iconBg: 'bg-emerald-100 text-emerald-500',
      stroke: '#10b981',
    },
    {
      label: 'Conversion Rate',
      value: `${data?.conversion_rate || '0.0'}%`,
      sub: `${fmt(data?.won_in_period)} won in period`,
      icon: Target,
      iconBg: 'bg-violet-100 text-violet-500',
      stroke: '#a855f7',
    },
    {
      label: 'Avg Deal Value',
      value: fmtMoney(data?.avg_deal_value),
      sub: `${fmt(data?.won_in_period)} deals closed`,
      icon: Coins,
      iconBg: 'bg-amber-100 text-amber-500',
      stroke: '#f97316',
    },
  ];

  const activityItems = [
    { label: 'New Leads', value: data?.leads_today || 0, icon: Users, cls: 'text-blue-500 bg-blue-100', valueCls: 'text-gray-900', to: `/leads?date_field=created_at&date_from=${today}&date_to=${today}` },
    { label: 'Follow-ups', value: data?.followups_today || 0, icon: Calendar, cls: 'text-emerald-500 bg-emerald-100', valueCls: 'text-emerald-600', to: `/leads?view=followups&scope=today&category=followup&date_from=${today}&date_to=${today}` },
    { label: 'Demos', value: data?.demos_today || 0, icon: Video, cls: 'text-violet-500 bg-violet-100', valueCls: 'text-gray-900', to: '/appointments?scope=today' },
    { label: 'Overdue', value: data?.overdue_followups || 0, icon: AlertTriangle, cls: 'text-red-500 bg-red-100', valueCls: 'text-red-500', to: '/leads?view=followups&scope=overdue' },
    { label: 'Hot Leads', value: data?.hot_leads || 0, icon: Flame, cls: 'text-orange-500 bg-orange-100', valueCls: 'text-orange-500', to: '/leads?score=hot' },
    { label: 'Critical Follow-ups', value: data?.critical_followups || 0, icon: AlertTriangle, cls: 'text-red-500 bg-red-100', valueCls: 'text-red-500', to: '/leads?followup_health=critical' },
  ];

  const automationItems = [
    { label: 'Active in Sequence', value: data?.active_enrollments || 0, icon: Zap, cls: 'text-emerald-500 bg-emerald-100' },
    { label: 'Completed This Month', value: data?.completed_this_month || 0, icon: CheckCircle2, cls: 'text-emerald-500 bg-emerald-100' },
    { label: 'AI Replies This Week', value: data?.ai_replies_this_week || 0, icon: Sparkles, cls: 'text-violet-500 bg-violet-100' },
  ];

  const automatedItems = [
    { label: 'Meta Leads Today', value: data?.meta_leads_today || 0, icon: Megaphone, cls: 'text-blue-500 bg-blue-100' },
    { label: 'Completed This Month', value: data?.completed_this_month || 0, icon: CheckCircle2, cls: 'text-emerald-500 bg-emerald-100' },
    { label: 'AI Replies This Week', value: data?.ai_replies_this_week || 0, icon: MessageCircle, cls: 'text-violet-500 bg-violet-100' },
    { label: 'Automated Sends', value: data?.automated_sends_this_week || 0, icon: Send, cls: 'text-indigo-500 bg-indigo-100' },
    { label: 'Opt-outs', value: data?.opt_outs_this_week || 0, icon: UserX, cls: 'text-red-500 bg-red-100' },
    { label: 'Escalations', value: data?.escalations_this_week || 0, icon: AlertTriangle, cls: 'text-amber-500 bg-amber-100' },
  ];

  return (
    <div className="space-y-5 max-w-[1536px] mx-auto pb-4">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-2">
          <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 mt-0.5 hover:bg-gray-100 rounded-lg shrink-0"><Menu size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track your leads, team activity and business performance.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm divide-x divide-gray-200 overflow-hidden">
            {PERIOD_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => setPeriod(opt.id)}
                className={`flex items-center gap-1 px-3.5 py-2 text-sm font-medium transition-colors ${
                  period === opt.id ? 'text-gray-900 font-semibold bg-gray-50' : 'text-gray-500 hover:bg-gray-50'
                }`}>
                {opt.label}
                {opt.id === 'this_month' && <ChevronDown size={14} className="text-gray-400" />}
                {opt.id === 'custom' && <ChevronRight size={14} className="text-gray-400" />}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-200" />
              <span className="text-xs text-gray-400">to</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
          )}
          {loading && <div className="animate-spin w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full" />}
          <NotificationBell />
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className={`w-11 h-11 ${s.iconBg} rounded-full flex items-center justify-center shrink-0`}>
                <s.icon size={20} strokeWidth={2} className="w-5 h-5 shrink-0" />
              </div>
              <div className="w-20 h-10 opacity-90">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id={`spark-${s.label.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={s.stroke} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={s.stroke} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="natural" dataKey="Leads" stroke={s.stroke} strokeWidth={2.25}
                      strokeLinecap="round" strokeLinejoin="round"
                      fill={`url(#spark-${s.label.replace(/\s+/g, '-')})`} dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3">{s.label}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{s.value}</p>
            </div>
            {s.trend !== undefined ? (
              <div className="mt-1">
                <Trend change={s.trend} />
                <span className="text-[11px] text-gray-400 ml-1">vs previous period</span>
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 mt-1">{s.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Pipeline + Recent Leads ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Pipeline */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <GitBranch size={16} className="text-gray-400" />
              Lead Pipeline
            </h3>
            <button onClick={() => navigate('/leads?view=pipeline')} className="text-xs text-brand-600 flex items-center gap-0.5 hover:underline">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))' }}>
            {(data?.pipeline || []).map(stage => {
              const pct = Math.round((stage.count / pipelineTotal) * 100);
              const bar = STAGE_COLOR[stage.color] || STAGE_COLOR.gray;
              return (
                <button key={stage.name} onClick={() => navigate('/leads?view=pipeline')}
                  className="text-left group border border-gray-100 rounded-xl p-2.5 hover:shadow-sm hover:border-gray-200 transition-all min-w-0">
                  <p className="text-[11px] font-semibold leading-snug flex items-start gap-0.5" style={{ color: bar }}>
                    <span className="break-words">{stage.name}</span>
                    <ChevronRight size={11} className="text-gray-300 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-1.5">{stage.count}</p>
                  <p className="text-[10px] text-gray-400">{pct}%</p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1.5">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: bar }} />
                  </div>
                </button>
              );
            })}
            {!data?.pipeline?.length && (
              <p className="text-sm text-gray-400 text-center py-6">No stages configured yet</p>
            )}
          </div>
        </div>

        {/* Recent leads */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Recent Leads</h3>
            <button onClick={() => navigate('/leads')}
              className="text-xs text-brand-600 flex items-center gap-0.5 hover:underline">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="text-[11px] text-gray-400 uppercase tracking-wide border-b">
                  <th className="text-left pb-2 font-semibold truncate">Name</th>
                  <th className="text-left pb-2 pr-4 font-semibold whitespace-nowrap w-28">Status</th>
                  <th className="text-left pb-2 font-semibold whitespace-nowrap w-28">Temperature</th>
                  <th className="pb-2 w-6"></th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentLeads || []).map(l => {
                  const stageKey = (l.stage || 'new').toLowerCase();
                  const tempKey = (l.lead_score || 'new').toLowerCase();
                  return (
                    <tr key={l.id} onClick={() => navigate('/leads', { state: { openLeadId: l.id } })}
                      className="border-b last:border-0 hover:bg-gray-50/70 cursor-pointer transition-colors">
                      <td className="py-2.5 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-[11px] font-bold text-gray-600 shrink-0">
                            {l.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800 truncate">{l.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`inline-block max-w-full truncate align-bottom text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyleFor(stageKey)}`}>
                          {l.stage}
                        </span>
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${TEMP_STYLE[tempKey] || 'bg-gray-100 text-gray-500'}`}>
                          {l.lead_score || 'New'}
                        </span>
                      </td>
                      <td className="py-2.5 text-right"><ChevronRight size={14} className="text-gray-300" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!data?.recentLeads?.length && (
              <p className="text-sm text-gray-400 text-center py-8">No leads yet</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Today's Activity + Automation & AI ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-500 flex items-center justify-center">
                <Calendar size={13} />
              </span>
              Today's Activity
            </h3>
            <button onClick={() => navigate('/leads')} className="text-xs text-brand-600 flex items-center gap-0.5 hover:underline">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {activityItems.map(item => (
              <button key={item.label} onClick={() => navigate(item.to)}
                className="text-left border border-gray-100 rounded-xl p-3 hover:shadow-sm hover:border-gray-200 transition-all">
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${item.cls}`}>
                    <item.icon size={14} />
                  </span>
                  <span className="text-xs text-gray-500">{item.label}</span>
                </div>
                <p className={`text-xl font-bold mt-1.5 ${item.value > 0 ? item.valueCls : 'text-gray-900'}`}>{item.value}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles size={16} className="text-gray-400" />
              Automation & AI
            </h3>
            <button onClick={() => navigate('/lead-automation')} className="text-xs text-brand-600 flex items-center gap-0.5 hover:underline">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div>
            {automationItems.map((item, i) => (
              <button key={item.label} onClick={() => navigate('/lead-automation')}
                className={`w-full flex items-center gap-3 py-3 hover:bg-gray-50 px-1 -mx-1 transition-colors text-left ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${item.cls}`}>
                  <item.icon size={16} />
                </span>
                <div>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-lg font-bold text-gray-900 leading-tight">{item.value}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Automated This Month ── */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Zap size={16} className="text-gray-400" />
            Automated This Month
          </h3>
          <button onClick={() => navigate('/lead-automation')} className="text-xs text-brand-600 flex items-center gap-0.5 hover:underline">
            View all <ChevronRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {automatedItems.map(item => (
            <div key={item.label} className="border border-gray-100 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${item.cls}`}>
                  <item.icon size={14} />
                </span>
                <span className="text-xs text-gray-500 truncate">{item.label}</span>
              </div>
              <p className="text-xl font-bold mt-1.5 text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Unassigned Leads Alert ── */}
      {(data?.unassigned_leads || 0) > 0 && (
        <button onClick={() => navigate('/leads?assigned_to=unassigned')}
          className="w-full flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:shadow-md transition-all duration-200 text-left">
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

      {/* ── Lead Sources + Team Performance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <PieChart size={16} className="text-gray-400" />
              Lead Sources
            </h3>
            <button onClick={() => navigate('/leads')} className="text-xs text-brand-600 flex items-center gap-0.5 hover:underline">
              View all <ChevronRight size={12} />
            </button>
          </div>
          {(data?.sources || []).length > 0 ? (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm min-w-[420px] table-fixed">
                <colgroup>
                  <col />
                  <col style={{ width: '70px' }} />
                  <col style={{ width: '70px' }} />
                  <col style={{ width: '140px' }} />
                </colgroup>
                <thead>
                  <tr className="text-[11px] text-gray-400 uppercase tracking-wide border-b">
                    <th className="text-left pb-2 font-semibold whitespace-nowrap">Source</th>
                    <th className="text-right pb-2 font-semibold whitespace-nowrap">Leads</th>
                    <th className="text-right pb-2 font-semibold whitespace-nowrap">Won</th>
                    <th className="text-right pb-2 font-semibold whitespace-nowrap">Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sources.map(s => {
                    const meta = SOURCE_ICON[s.source?.toLowerCase()] || { icon: Megaphone, cls: 'text-gray-400' };
                    return (
                      <tr key={s.source} className="border-b last:border-0 hover:bg-gray-50/70 transition-colors">
                        <td className="py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <meta.icon size={15} className={meta.cls} />
                            <span className="font-medium text-gray-700 capitalize">{s.source}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right text-gray-500 whitespace-nowrap">{s.total}</td>
                        <td className="py-2.5 text-right font-semibold text-emerald-600 whitespace-nowrap">{s.won}</td>
                        <td className="py-2.5 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(100, parseFloat(s.conversion_rate) || 0)}%` }} />
                            </div>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              parseFloat(s.conversion_rate) >= 20 ? 'bg-emerald-100 text-emerald-700' :
                              parseFloat(s.conversion_rate) >= 10 ? 'bg-amber-100 text-amber-700' :
                                                                    'bg-gray-100 text-gray-500'
                            }`}>{s.conversion_rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No source data yet</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <UserCheck size={16} className="text-gray-400" />
              Team Performance
            </h3>
            <button onClick={() => navigate('/staff')} className="text-xs text-brand-600 flex items-center gap-0.5 hover:underline">
              View all <ChevronRight size={12} />
            </button>
          </div>
          {(data?.team || []).length > 0 ? (
            <div className="overflow-hidden">
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b">
                    <th className="text-left pb-2 font-semibold truncate">Member</th>
                    <th className="text-right pb-2 font-semibold truncate">Leads</th>
                    <th className="text-right pb-2 font-semibold truncate">Won</th>
                    <th className="text-right pb-2 font-semibold truncate">Revenue</th>
                    <th className="text-right pb-2 font-semibold truncate">Response</th>
                    <th className="text-right pb-2 font-semibold truncate">F/ups</th>
                  </tr>
                </thead>
                <tbody>
                  {data.team.map((t) => (
                    <tr key={t.name} className="border-b last:border-0 hover:bg-gray-50/70 transition-colors">
                      <td className="py-2.5 truncate">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0">
                            {t.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-700 truncate">{t.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-gray-500 truncate">{t.total_leads}</td>
                      <td className="py-2.5 text-right font-semibold text-emerald-600 truncate">{t.won}</td>
                      <td className="py-2.5 text-right font-semibold text-gray-700 truncate">{fmtMoney(t.revenue)}</td>
                      <td className="py-2.5 text-right text-gray-500 truncate">{fmtDuration(t.avg_response_seconds)}</td>
                      <td className="py-2.5 text-right text-gray-500 truncate">{t.completed_followups}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No team data yet</p>
          )}
        </div>
      </div>

      {/* ── Lead Trend ── */}
      {trendData.length > 1 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <LineChartIcon size={16} className="text-gray-400" />
                Lead Trend
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Lead activity over the selected period</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-gray-600">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Total Leads <span className="font-bold text-gray-900">{fmt(data?.leads_in_period)}</span>
              </span>
              {data?.leads_change !== undefined && (
                <span className="flex items-center gap-0.5 text-emerald-600 text-xs font-semibold bg-emerald-50 px-2 py-1 rounded-full">
                  <ArrowUpRight size={12} />{data.leads_change}%
                </span>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RLineChart data={trendData} margin={{ top: 16, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 2' }}
              />
              <Line type="monotone" dataKey="Leads" stroke="#4f46e5" strokeWidth={2.5}
                dot={{ r: 3, fill: '#4f46e5', stroke: '#fff', strokeWidth: 1 }}
                activeDot={{ r: 5, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} />
            </RLineChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
};

export default DashboardPage;
