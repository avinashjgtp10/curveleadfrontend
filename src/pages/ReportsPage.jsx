import { useEffect, useRef, useState } from 'react';
import { reportsAPI, leadAPI, stageAPI, brochuresAPI } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area, LineChart, Line,
} from 'recharts';
import {
  TrendingUp, Users, Target, Megaphone, ChevronLeft, ChevronRight, AlertTriangle,
  Search, SlidersHorizontal, ChevronDown, X, FileText, Eye, Share2, Trash2, Square, CheckSquare, Calendar,
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import { BROCHURE_PAGE_SIZE_OPTIONS, BROCHURE_REPORT_CATEGORIES } from './brochureFilter.constants';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const GRID_PAGE_SIZE_OPTIONS = [5, 10, 15, 20];

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'funnel', label: 'Funnel' },
  { id: 'team', label: 'Team' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'leads', label: 'Lead Detail' },
  { id: 'brochures', label: 'Brochure Detail' },
];

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
];

const fmtDuration = (seconds) => {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
};

const fmtSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const Spinner = () => (
  <div className="flex items-center justify-center h-40">
    <div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
  </div>
);

// A button-triggered dropdown, anchored and positioned entirely with CSS,
// so it always opens directly below its trigger instead of relying on the
// browser's native <select> popup placement (which can render detached from
// the field and overlap unrelated page content).
const FilterDropdown = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const current = options.find(o => o.value === value) || options[0];

  return (
    <div className="space-y-1" ref={ref}>
      <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">{label}</label>
      <div className="relative">
        <button type="button" onClick={() => setOpen(v => !v)}
          className="h-10 w-full flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-lg px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
          <span className="truncate">{current?.label}</span>
          <ChevronDown size={14} className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto py-1">
            {options.map(o => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-cyan-50 ${o.value === value ? 'bg-cyan-50 text-cyan-700 font-semibold' : 'text-gray-700'}`}>
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// The calendar-period selector at the top of the page — styled as a compact
// pill dropdown instead of a native <select>, to match FilterDropdown's look.
const PeriodDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const current = PERIOD_OPTIONS.find(o => o.value === value) || PERIOD_OPTIONS[0];

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`inline-flex items-center gap-2 h-10 pl-3.5 pr-3 rounded-full border text-sm font-semibold transition-colors ${
          open ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-700 border-gray-200 hover:border-brand-400 hover:text-brand-600'
        }`}>
        <Calendar size={14} />
        {current.label}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-40">
          {PERIOD_OPTIONS.map(o => (
            <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-3.5 py-2 text-sm ${o.value === value ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ReportsPage = () => {
  const confirm = useConfirmDialog();
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('this_month');

  // Overview / Team / Campaigns — all driven by the calendar period selector
  const [conversion, setConversion] = useState(null);
  const [bySource, setBySource] = useState([]);
  const [byStaff, setByStaff] = useState([]);
  const [byCampaign, setByCampaign] = useState([]);
  const [loading, setLoading] = useState(true);

  // Funnel tab
  const [funnel, setFunnel] = useState({ stages: [], leaks: [] });
  const [timeInStage, setTimeInStage] = useState([]);
  const [stalledCount, setStalledCount] = useState(0);
  const [funnelLoading, setFunnelLoading] = useState(true);

  // Team tab — trend charts have their own rolling-days window, independent of `period`
  const [trendDays, setTrendDays] = useState(30);
  const [responseTrend, setResponseTrend] = useState([]);
  const [followupTrend, setFollowupTrend] = useState([]);
  const [trendLoading, setTrendLoading] = useState(true);

  // Lead Detail tab
  const [stages, setStages] = useState([]);
  const [gridSearchInput, setGridSearchInput] = useState('');
  const [gridSearch, setGridSearch] = useState('');
  const [showGridFilters, setShowGridFilters] = useState(false);
  const [gridStage, setGridStage] = useState('');
  const [gridScore, setGridScore] = useState('');
  const [gridStalled, setGridStalled] = useState(false);
  const [gridPage, setGridPage] = useState(1);
  const [gridPageSize, setGridPageSize] = useState(20);
  const [gridLeads, setGridLeads] = useState([]);
  const [gridPagination, setGridPagination] = useState({ total: 0, pages: 1 });
  const [gridLoading, setGridLoading] = useState(false);
  const [selectedGridIds, setSelectedGridIds] = useState(new Set());
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Brochure Detail tab
  const [brochureSearchInput, setBrochureSearchInput] = useState('');
  const [brochureSearch, setBrochureSearch] = useState('');
  const [showBrochureFilters, setShowBrochureFilters] = useState(false);
  const [brochureCategory, setBrochureCategory] = useState('');
  const [brochureSharedOnly, setBrochureSharedOnly] = useState(false);
  const [brochureViewedOnly, setBrochureViewedOnly] = useState(false);
  const [brochurePage, setBrochurePage] = useState(1);
  const [brochurePageSize, setBrochurePageSize] = useState(20);
  const [brochures, setBrochures] = useState([]);
  const [brochuresLoading, setBrochuresLoading] = useState(false);
  const overviewRequestRef = useRef(0);
  const funnelRequestRef = useRef(0);
  const trendsRequestRef = useRef(0);
  const gridRequestRef = useRef(0);
  const brochuresRequestRef = useRef(0);

  useEffect(() => {
    stageAPI.getAll().then(res => setStages(res.data.stages || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (['overview', 'team', 'campaigns'].includes(activeTab)) loadOverview();
  }, [activeTab, period]);

  useEffect(() => {
    if (activeTab === 'funnel') loadFunnel();
  }, [activeTab, period]);

  useEffect(() => {
    if (activeTab === 'team') loadTrends();
  }, [activeTab, trendDays]);

  useEffect(() => {
    if (activeTab === 'leads') loadGrid();
  }, [activeTab, gridSearch, gridStage, gridScore, gridStalled, gridPage, gridPageSize]);

  useEffect(() => {
    if (activeTab === 'brochures') loadBrochures();
  }, [activeTab]);

  useEffect(() => {
    const t = setTimeout(() => { setGridPage(1); setGridSearch(gridSearchInput); }, 400);
    return () => clearTimeout(t);
  }, [gridSearchInput]);

  useEffect(() => {
    const t = setTimeout(() => { setBrochurePage(1); setBrochureSearch(brochureSearchInput); }, 400);
    return () => clearTimeout(t);
  }, [brochureSearchInput]);

  const loadOverview = async () => {
    const requestId = ++overviewRequestRef.current;
    setLoading(true);
    try {
      const [convRes, srcRes, staffRes, campRes] = await Promise.all([
        reportsAPI.conversion({ period }).catch(() => ({ data: {} })),
        reportsAPI.bySource({ period }).catch(() => ({ data: { sources: [] } })),
        reportsAPI.byStaff({ period }).catch(() => ({ data: { staff: [] } })),
        reportsAPI.byCampaign({ period }).catch(() => ({ data: { campaigns: [] } })),
      ]);
      if (requestId !== overviewRequestRef.current) return;
      setConversion(convRes.data);
      setBySource(srcRes.data.sources || []);
      setByStaff(staffRes.data.staff || []);
      setByCampaign(campRes.data.campaigns || []);
    } catch (e) { console.error(e); }
    finally { if (requestId === overviewRequestRef.current) setLoading(false); }
  };

  const loadFunnel = async () => {
    const requestId = ++funnelRequestRef.current;
    setFunnelLoading(true);
    try {
      const [funnelRes, tisRes, stalledRes] = await Promise.all([
        reportsAPI.funnel({ period }).catch(() => ({ data: { stages: [], leaks: [] } })),
        reportsAPI.timeInStage({ period }).catch(() => ({ data: { stages: [] } })),
        leadAPI.getAll({ stalled: true, limit: 1 }).catch(() => ({ data: { pagination: { total: 0 } } })),
      ]);
      if (requestId !== funnelRequestRef.current) return;
      setFunnel(funnelRes.data);
      setTimeInStage(tisRes.data.stages || []);
      setStalledCount(stalledRes.data.pagination?.total || 0);
    } catch (e) { console.error(e); }
    finally { if (requestId === funnelRequestRef.current) setFunnelLoading(false); }
  };

  const loadTrends = async () => {
    const requestId = ++trendsRequestRef.current;
    setTrendLoading(true);
    try {
      const [tlRes, ftRes] = await Promise.all([
        reportsAPI.timeline({ period: 'daily', days: trendDays }).catch(() => ({ data: { timeline: [] } })),
        reportsAPI.followupTrend({ period: 'daily', days: trendDays }).catch(() => ({ data: { trend: [] } })),
      ]);
      if (requestId !== trendsRequestRef.current) return;
      setResponseTrend(tlRes.data.timeline || []);
      setFollowupTrend(ftRes.data.trend || []);
    } catch (e) { console.error(e); }
    finally { if (requestId === trendsRequestRef.current) setTrendLoading(false); }
  };

  const loadGrid = async () => {
    const requestId = ++gridRequestRef.current;
    setGridLoading(true);
    try {
      const params = { page: gridPage, limit: gridPageSize };
      if (gridSearch) params.search = gridSearch;
      if (gridStage) params.stage = gridStage;
      if (gridScore) params.score = gridScore;
      if (gridStalled) params.stalled = true;
      const res = await leadAPI.getAll(params);
      if (requestId !== gridRequestRef.current) return;
      setGridLeads(res.data.leads || []);
      setSelectedGridIds(new Set());
      setGridPagination({ total: res.data.pagination?.total || 0, pages: res.data.pagination?.pages || 1 });
    } catch (e) { console.error(e); }
    finally { if (requestId === gridRequestRef.current) setGridLoading(false); }
  };

  const loadBrochures = async () => {
    const requestId = ++brochuresRequestRef.current;
    setBrochuresLoading(true);
    try {
      const res = await brochuresAPI.getAll();
      if (requestId !== brochuresRequestRef.current) return;
      setBrochures(res.data.brochures || []);
    } catch (e) { console.error(e); }
    finally { if (requestId === brochuresRequestRef.current) setBrochuresLoading(false); }
  };

  const toggleGridSelect = (id) => setSelectedGridIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleGridSelectAll = () => {
    if (selectedGridIds.size === gridLeads.length) setSelectedGridIds(new Set());
    else setSelectedGridIds(new Set(gridLeads.map(l => l.id)));
  };

  const clearGridSelection = () => setSelectedGridIds(new Set());

  const handleGridBulkDelete = async () => {
    const ok = await confirm({ title: `Delete ${selectedGridIds.size} lead${selectedGridIds.size > 1 ? 's' : ''}?` });
    if (!ok) return;
    setBulkDeleteLoading(true);
    try {
      await leadAPI.bulkDelete([...selectedGridIds]);
      clearGridSelection();
      loadGrid();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to delete selected leads.');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const gridPageNumbers = () => {
    const t = gridPagination.pages;
    if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
    if (gridPage <= 4) return [1, 2, 3, 4, 5, '…', t];
    if (gridPage >= t - 3) return [1, '…', t - 4, t - 3, t - 2, t - 1, t];
    return [1, '…', gridPage - 1, gridPage, gridPage + 1, '…', t];
  };

  const filteredBrochures = brochures
    .filter(b =>
      (!brochureCategory || b.category === brochureCategory) &&
      (!brochureSearch || b.name?.toLowerCase().includes(brochureSearch.toLowerCase())) &&
      (!brochureSharedOnly || (b.times_shared || 0) > 0) &&
      (!brochureViewedOnly || (b.views || 0) > 0)
    )
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const brochureTotalPages = Math.max(1, Math.ceil(filteredBrochures.length / brochurePageSize));
  const brochureRows = filteredBrochures.slice((brochurePage - 1) * brochurePageSize, brochurePage * brochurePageSize);
  const brochureStats = {
    total: brochures.length,
    shared: brochures.filter(b => (b.times_shared || 0) > 0).length,
    views: brochures.reduce((sum, b) => sum + (b.views || 0), 0),
    size: brochures.reduce((sum, b) => sum + (b.file_size || 0), 0),
  };

  const brochurePageNumbers = () => {
    const t = brochureTotalPages;
    if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
    if (brochurePage <= 4) return [1, 2, 3, 4, 5, '…', t];
    if (brochurePage >= t - 3) return [1, '…', t - 4, t - 3, t - 2, t - 1, t];
    return [1, '…', brochurePage - 1, brochurePage, brochurePage + 1, '…', t];
  };


  const conversionRate = conversion?.total_leads > 0
    ? ((conversion.won / conversion.total_leads) * 100).toFixed(1)
    : 0;

  const stats = [
    { label: 'Total Leads', value: conversion?.total_leads || 0, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Won', value: conversion?.won || 0, icon: Target, color: 'bg-green-100 text-green-600' },
    { label: 'Conversion Rate', value: `${conversionRate}%`, icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
    { label: 'Active Campaigns', value: byCampaign.length, icon: Megaphone, color: 'bg-amber-100 text-amber-600' },
  ];

  const responseTrendChartData = responseTrend.map(t => ({
    day: new Date(t.period).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    'Avg Response (min)': t.avg_response_seconds ? Math.round(t.avg_response_seconds / 60) : 0,
  }));

  const followupTrendChartData = followupTrend.map(t => ({
    day: new Date(t.period).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    Scheduled: t.scheduled,
    Completed: t.completed,
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-gray-500">Track conversion, sources, and campaign performance</p>
        {!['leads', 'brochures'].includes(activeTab) && (
          <PeriodDropdown value={period} onChange={setPeriod} />
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === t.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        loading ? <Spinner /> : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map(s => <StatCard key={s.label} {...s} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border p-5">
                <h3 className="font-semibold mb-4">Leads by Source</h3>
                {bySource.length === 0 ? <EmptyState /> : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={bySource} dataKey="total_leads" nameKey="source" cx="50%" cy="50%" outerRadius={80} label>
                        {bySource.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-white rounded-2xl border p-5">
                <h3 className="font-semibold mb-4">Conversion Funnel</h3>
                {conversion?.stages?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={conversion.stages}>
                      <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyState />}
              </div>
            </div>
          </>
        )
      )}

      {activeTab === 'funnel' && (
        funnelLoading ? <Spinner /> : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Stalled Leads" value={stalledCount} icon={AlertTriangle}
                color="bg-red-100 text-red-600" sub="Open, untouched, no follow-up due" />
            </div>

            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-semibold mb-4">Sales Funnel Drop-off</h3>
              {funnel.stages.length === 0 ? <EmptyState /> : (
                <>
                  <ResponsiveContainer width="100%" height={Math.max(180, funnel.stages.length * 40)}>
                    <BarChart data={funnel.stages} layout="vertical" margin={{ left: 24 }}>
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip />
                      <Bar dataKey="reached_count" name="Reached" fill="#6366f1" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="text-left py-2">Stage</th>
                          <th className="text-right py-2">Reached</th>
                          <th className="text-right py-2">Drop-off</th>
                        </tr>
                      </thead>
                      <tbody>
                        {funnel.stages.map((s, i) => (
                          <tr key={s.id} className="border-t">
                            <td className="py-2 font-medium">{s.name}</td>
                            <td className="text-right">{s.reached_count}</td>
                            <td className="text-right text-red-500">{i > 0 ? `${s.drop_off_count} (${s.drop_off_pct}%)` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-semibold mb-4">Where Leads Leak</h3>
              {funnel.leaks.length === 0 ? <EmptyState message="No lost leads in this period" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="text-left py-2">Lost From Stage</th>
                        <th className="text-right py-2">Lost Leads</th>
                        <th className="text-right py-2">Lost Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {funnel.leaks.map((l, i) => (
                        <tr key={i} className="border-t">
                          <td className="py-2.5 font-medium capitalize">{l.from_stage || 'Unknown'}</td>
                          <td className="text-right text-red-500 font-semibold">{l.lost_count}</td>
                          <td className="text-right">₹{l.lost_value.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-semibold mb-4">Time in Stage</h3>
              {timeInStage.length === 0 ? <EmptyState /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="text-left py-2">Stage</th>
                        <th className="text-right py-2">Avg Time</th>
                        <th className="text-right py-2">Currently Stuck</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeInStage.map((s, i) => (
                        <tr key={i} className="border-t">
                          <td className="py-2.5 font-medium">{s.stage}</td>
                          <td className="text-right">{fmtDuration(s.avg_seconds_in_stage)}</td>
                          <td className="text-right font-semibold text-amber-600">{s.currently_in_stage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )
      )}

      {activeTab === 'team' && (
        <>
          {loading ? <Spinner /> : (
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-semibold mb-4">Staff Performance</h3>
              {byStaff.length === 0 ? <EmptyState /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="text-left py-2">Name</th>
                        <th className="text-right py-2">Leads</th>
                        <th className="text-right py-2">Won</th>
                        <th className="text-right py-2">Lost</th>
                        <th className="text-right py-2">Conv. Rate</th>
                        <th className="text-right py-2">AI Replies</th>
                        <th className="text-right py-2">Manual Replies</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byStaff.map((s, i) => (
                        <tr key={i} className="border-t">
                          <td className="py-2.5 font-medium">{s.name}</td>
                          <td className="text-right">{s.total_leads}</td>
                          <td className="text-right text-green-600 font-semibold">{s.won}</td>
                          <td className="text-right text-red-500">{s.lost}</td>
                          <td className="text-right font-semibold">{s.total_leads > 0 ? ((s.won / s.total_leads) * 100).toFixed(1) : 0}%</td>
                          <td className="text-right text-brand-600">{s.ai_sent}</td>
                          <td className="text-right text-gray-500">{s.manual_sent}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-semibold text-gray-900">Trends</h3>
            <select value={trendDays} onChange={e => setTrendDays(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-semibold mb-4">Response Time Trend</h3>
              {trendLoading ? <Spinner /> : responseTrendChartData.length === 0 ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={responseTrendChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="respGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                      cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 2' }}
                    />
                    <Area type="monotone" dataKey="Avg Response (min)" stroke="#6366f1" strokeWidth={2}
                      fill="url(#respGrad)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-semibold mb-4">Follow-up Completion Trend</h3>
              {trendLoading ? <Spinner /> : followupTrendChartData.length === 0 ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={followupTrendChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="Scheduled" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'campaigns' && (
        loading ? <Spinner /> : (
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-4">Campaign ROI</h3>
            {byCampaign.length === 0 ? (
              <EmptyState message="No campaigns yet" className="py-6" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="text-left py-2">Campaign</th>
                      <th className="text-left py-2">Source</th>
                      <th className="text-right py-2">Spent</th>
                      <th className="text-right py-2">Leads</th>
                      <th className="text-right py-2">CPL</th>
                      <th className="text-right py-2">Won</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byCampaign.map((c, i) => (
                      <tr key={i} className="border-t">
                        <td className="py-2.5 font-medium">{c.name}</td>
                        <td className="capitalize text-gray-600">{c.source?.replace(/_/g, ' ')}</td>
                        <td className="text-right">₹{parseFloat(c.actual_spend || 0).toLocaleString('en-IN')}</td>
                        <td className="text-right">{c.total_leads}</td>
                        <td className="text-right font-semibold text-brand-600">₹{c.cpl}</td>
                        <td className="text-right text-green-600">{c.won || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      )}

      {activeTab === 'leads' && (
        <div className="bg-white rounded-2xl border p-5">
          {(() => {
            const gridActiveFilterCount = [gridSearchInput, gridStage, gridScore, gridStalled].filter(Boolean).length;
            const clearGridFilters = () => {
              setGridPage(1);
              setGridSearchInput(''); setGridSearch('');
              setGridStage(''); setGridScore(''); setGridStalled(false);
            };
            return (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <h3 className="font-semibold">Lead Detail Report</h3>
                </div>

                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search by name or phone..."
                      value={gridSearchInput} onChange={e => setGridSearchInput(e.target.value)}
                      className="h-10 w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent" />
                  </div>
                  <button
                    onClick={() => setShowGridFilters(v => !v)}
                    className={`inline-flex items-center gap-2 h-10 px-4 rounded-lg border text-sm font-semibold transition-colors ${showGridFilters || gridActiveFilterCount > 0 ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-400 hover:text-cyan-600'}`}
                  >
                    <SlidersHorizontal size={15} />
                    Filters
                    {gridActiveFilterCount > 0 && (
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${showGridFilters ? 'bg-white text-cyan-600' : 'bg-cyan-600 text-white'}`}>
                        {gridActiveFilterCount}
                      </span>
                    )}
                    <ChevronDown size={14} className={`transition-transform ${showGridFilters ? 'rotate-180' : ''}`} />
                  </button>
                  {gridActiveFilterCount > 0 && (
                    <button onClick={clearGridFilters}
                      className="h-10 px-3 flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg border border-red-200">
                      <X size={13} /> Clear filters
                    </button>
                  )}
                </div>

                {showGridFilters && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 rounded-xl p-4 border border-gray-200 mb-4">
                    <FilterDropdown
                      label="Stage"
                      value={gridStage}
                      onChange={v => { setGridPage(1); setGridStage(v); }}
                      options={[{ value: '', label: 'All Stages' }, ...stages.map(s => ({ value: s.name, label: s.name }))]}
                    />
                    <FilterDropdown
                      label="Score"
                      value={gridScore}
                      onChange={v => { setGridPage(1); setGridScore(v); }}
                      options={[
                        { value: '', label: 'All Scores' },
                        { value: 'hot', label: '🔥 Hot' },
                        { value: 'warm', label: '🌤 Warm' },
                        { value: 'cold', label: '❄️ Cold' },
                      ]}
                    />
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">Stalled</label>
                      <label className="h-10 flex items-center gap-1.5 px-3 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer">
                        <input type="checkbox" checked={gridStalled}
                          onChange={e => { setGridPage(1); setGridStalled(e.target.checked); }} />
                        Stalled only
                      </label>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
          {gridLoading ? (
            <div className="flex items-center justify-center py-10"><div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
          ) : gridLeads.length === 0 ? (
            <EmptyState message="No leads match these filters" className="py-6" />
          ) : (
            <div className="overflow-x-auto">
              {selectedGridIds.size > 0 && (
                <div className="flex items-center gap-3 px-3 py-2.5 mb-2 bg-cyan-50 border border-cyan-200 rounded-xl flex-wrap">
                  <span className="text-sm font-bold text-cyan-700">{selectedGridIds.size} selected</span>
                  <button
                    onClick={handleGridBulkDelete}
                    disabled={bulkDeleteLoading}
                    className="flex items-center gap-1.5 h-8 px-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50">
                    <Trash2 size={13} /> Delete
                  </button>
                  <button onClick={clearGridSelection} className="ml-auto text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                    <X size={13} /> Clear
                  </button>
                </div>
              )}

              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="text-left py-2 w-8">
                      <button onClick={toggleGridSelectAll} className="text-gray-400 hover:text-cyan-600">
                        {selectedGridIds.size === gridLeads.length && gridLeads.length > 0
                          ? <CheckSquare size={16} className="text-cyan-600" />
                          : <Square size={16} />}
                      </button>
                    </th>
                    <th className="text-left py-2">Lead #</th>
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Phone</th>
                    <th className="text-left py-2">Stage</th>
                    <th className="text-left py-2">Assigned To</th>
                    <th className="text-right py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {gridLeads.map(l => (
                    <tr key={l.id} className={`border-t hover:bg-gray-50 ${selectedGridIds.has(l.id) ? 'bg-cyan-50/50' : ''}`}>
                      <td className="py-2.5">
                        <button onClick={() => toggleGridSelect(l.id)} className="text-gray-400 hover:text-cyan-600">
                          {selectedGridIds.has(l.id)
                            ? <CheckSquare size={16} className="text-cyan-600" />
                            : <Square size={16} />}
                        </button>
                      </td>
                      <td className="py-2.5 text-gray-500">{l.lead_number}</td>
                      <td className="font-medium">{l.name}</td>
                      <td>{l.phone}</td>
                      <td className="capitalize">{l.stage}</td>
                      <td>{l.assigned_to_name || '—'}</td>
                      <td className="text-right text-gray-500">{new Date(l.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {gridPagination.total > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-500">
                  Showing {Math.min((gridPage - 1) * gridPageSize + 1, gridPagination.total)}–{Math.min(gridPage * gridPageSize, gridPagination.total)} of <span className="font-semibold text-gray-700">{gridPagination.total}</span> leads
                </p>
                <select value={gridPageSize} onChange={e => { setGridPage(1); setGridPageSize(Number(e.target.value)); }}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white">
                  {GRID_PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} / page</option>)}
                </select>
              </div>
              {gridPagination.pages > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setGridPage(p => Math.max(1, p - 1))} disabled={gridPage === 1}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronLeft size={16} />
                  </button>
                  {gridPageNumbers().map((n, i) =>
                    n === '…' ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm select-none">…</span>
                    ) : (
                      <button key={n} onClick={() => setGridPage(n)}
                        className={`w-8 h-8 rounded text-xs font-semibold transition-colors ${gridPage === n ? 'bg-brand-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
                        {n}
                      </button>
                    )
                  )}
                  <button onClick={() => setGridPage(p => Math.min(gridPagination.pages, p + 1))} disabled={gridPage === gridPagination.pages}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'brochures' && (
        <div className="bg-white rounded-2xl border p-5">
          {(() => {
            const activeFilterCount = [brochureSearchInput, brochureCategory, brochureSharedOnly, brochureViewedOnly].filter(Boolean).length;
            const clearFilters = () => {
              setBrochurePage(1);
              setBrochureSearchInput(''); setBrochureSearch('');
              setBrochureCategory(''); setBrochureSharedOnly(false); setBrochureViewedOnly(false);
            };
            return (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <h3 className="font-semibold">Brochure Detail Report</h3>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <StatCard label="Total Brochures" value={brochureStats.total} icon={FileText} color="bg-indigo-100 text-indigo-600" />
                  <StatCard label="Shared Brochures" value={brochureStats.shared} icon={Share2} color="bg-emerald-100 text-emerald-600" />
                  <StatCard label="Total Views" value={brochureStats.views} icon={Eye} color="bg-orange-100 text-orange-600" />
                  <StatCard label="Total Size" value={fmtSize(brochureStats.size)} icon={FileText} color="bg-blue-100 text-blue-600" />
                </div>

                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search brochures..."
                      value={brochureSearchInput} onChange={e => setBrochureSearchInput(e.target.value)}
                      className="h-10 w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent" />
                  </div>
                  <button
                    onClick={() => setShowBrochureFilters(v => !v)}
                    className={`inline-flex items-center gap-2 h-10 px-4 rounded-lg border text-sm font-semibold transition-colors ${showBrochureFilters || activeFilterCount > 0 ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-400 hover:text-cyan-600'}`}
                  >
                    <SlidersHorizontal size={15} />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${showBrochureFilters ? 'bg-white text-cyan-600' : 'bg-cyan-600 text-white'}`}>
                        {activeFilterCount}
                      </span>
                    )}
                    <ChevronDown size={14} className={`transition-transform ${showBrochureFilters ? 'rotate-180' : ''}`} />
                  </button>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters}
                      className="h-10 px-3 flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg border border-red-200">
                      <X size={13} /> Clear filters
                    </button>
                  )}
                </div>

                {showBrochureFilters && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 rounded-xl p-4 border border-gray-200 mb-4">
                    <FilterDropdown
                      label="Category"
                      value={brochureCategory}
                      onChange={v => { setBrochurePage(1); setBrochureCategory(v); }}
                      options={BROCHURE_REPORT_CATEGORIES}
                    />
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">Shared</label>
                      <label className="h-10 flex items-center gap-1.5 px-3 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer">
                        <input type="checkbox" checked={brochureSharedOnly}
                          onChange={e => { setBrochurePage(1); setBrochureSharedOnly(e.target.checked); }} />
                        Shared only
                      </label>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">Viewed</label>
                      <label className="h-10 flex items-center gap-1.5 px-3 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer">
                        <input type="checkbox" checked={brochureViewedOnly}
                          onChange={e => { setBrochurePage(1); setBrochureViewedOnly(e.target.checked); }} />
                        Viewed only
                      </label>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {brochuresLoading ? (
            <div className="flex items-center justify-center py-10"><div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
          ) : brochureRows.length === 0 ? (
            <EmptyState message="No brochures match these filters" className="py-6" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="text-left py-2">Brochure</th>
                    <th className="text-left py-2">Category</th>
                    <th className="text-right py-2">Views</th>
                    <th className="text-right py-2">Shares</th>
                    <th className="text-right py-2">Size</th>
                    <th className="text-right py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {brochureRows.map(b => (
                    <tr key={b.id} className="border-t">
                      <td className="py-2.5 font-medium">
                        {b.file_url ? (
                          <a href={b.file_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{b.name}</a>
                        ) : b.name}
                      </td>
                      <td className="capitalize text-gray-600">{b.category || 'general'}</td>
                      <td className="text-right">{b.views || 0}</td>
                      <td className="text-right">{b.times_shared || 0}</td>
                      <td className="text-right text-gray-500">{fmtSize(b.file_size)}</td>
                      <td className="text-right text-gray-500">{b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredBrochures.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-500">
                  Showing {Math.min((brochurePage - 1) * brochurePageSize + 1, filteredBrochures.length)}-{Math.min(brochurePage * brochurePageSize, filteredBrochures.length)} of <span className="font-semibold text-gray-700">{filteredBrochures.length}</span> brochures
                </p>
                <select value={brochurePageSize} onChange={e => { setBrochurePage(1); setBrochurePageSize(Number(e.target.value)); }}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white">
                  {BROCHURE_PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} / page</option>)}
                </select>
              </div>
              {brochureTotalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setBrochurePage(p => Math.max(1, p - 1))} disabled={brochurePage === 1}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronLeft size={16} />
                  </button>
                  {brochurePageNumbers().map((n, i) =>
                    n === '…' ? (
                      <span key={`brochure-ellipsis-${i}`} className="px-1 text-gray-400 text-sm select-none">…</span>
                    ) : (
                      <button key={n} onClick={() => setBrochurePage(n)}
                        className={`w-8 h-8 rounded text-xs font-semibold transition-colors ${brochurePage === n ? 'bg-brand-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
                        {n}
                      </button>
                    )
                  )}
                  <button onClick={() => setBrochurePage(p => Math.min(brochureTotalPages, p + 1))} disabled={brochurePage === brochureTotalPages}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
