import { formatDateTime } from '../utils/dateTime.js';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campaignAPI, stageAPI } from '../services/api';
import { sourceLabel } from '../utils/leadData.js';
import { ArrowLeft, IndianRupee, Users, TrendingUp, Target, Eye, MousePointerClick, X, Megaphone, CalendarDays, Star, Search, ChevronRight } from 'lucide-react';

const statusColors = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-gray-100 text-gray-600',
  draft: 'bg-blue-100 text-blue-700',
};
const scoreColors = { hot: 'bg-red-100 text-red-700', warm: 'bg-amber-100 text-amber-700', cold: 'bg-gray-100 text-gray-600' };
// Campaign start/end are plain dates; format them without a timezone shift.
const shortDate = v => {
  const [y, m, d] = String(v || '').split('T')[0].split('-').map(Number);
  return y ? new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
};

const CampaignDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [leads, setLeads] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState([]);
  const [filters, setFilters] = useState({ stage: '', lead_score: '', search: '' });
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => { stageAPI.getAll().then(({ data }) => setStages(data.stages || [])).catch(() => {}); }, []);

  useEffect(() => {
    campaignAPI.getAds(id).then(({ data }) => setAds(data.ads || [])).catch(() => {});
  }, [id]);

  // Debounce the search box so it doesn't refetch on every keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(f => f.search === searchInput ? f : { ...f, search: searchInput });
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { loadData(); }, [id, filters]);

  const loadData = async () => {
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const { data } = await campaignAPI.getOne(id, params);
      setData(data.campaign);
      setLeads(data.recentLeads || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const hasActiveFilters = filters.stage || filters.lead_score || filters.search;
  const clearFilters = () => { setFilters({ stage: '', lead_score: '', search: '' }); setSearchInput(''); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  if (!data) return <p>Campaign not found</p>;

  const stats = [
    { label: 'Budget', value: `₹${parseFloat(data.budget || 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'bg-blue-100 text-blue-600' },
    { label: 'Spent', value: `₹${parseFloat(data.actual_spend || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'bg-amber-100 text-amber-600' },
    { label: 'Leads', value: data.total_leads || 0, icon: Users, color: 'bg-green-100 text-green-600' },
    { label: 'CPL', value: parseFloat(data.cpl) > 0 ? `₹${parseFloat(data.cpl).toFixed(0)}` : '—', icon: Target, color: 'bg-purple-100 text-purple-600' },
    ...(data.meta_campaign_id ? [
      { label: 'Impressions', value: Number(data.impressions || 0).toLocaleString('en-IN'), icon: Eye, color: 'bg-cyan-100 text-cyan-600' },
      { label: 'Clicks', value: Number(data.clicks || 0).toLocaleString('en-IN'), icon: MousePointerClick, color: 'bg-indigo-100 text-indigo-600' },
    ] : []),
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <button onClick={() => navigate('/ads?tab=campaigns')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> All campaigns
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 break-words">{data.name}</h2>
            <div className="flex items-center gap-2 flex-wrap mt-1.5 text-sm text-gray-500">
              <span>{sourceLabel(data.source)}</span>
              {data.meta_campaign_id && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600">Meta synced</span>}
              {data.is_priority && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-50 text-violet-600 flex items-center gap-0.5"><Star size={9} /> Priority</span>}
              {(data.start_date || data.end_date) && (
                <span className="flex items-center gap-1 text-xs"><CalendarDays size={12} /> {shortDate(data.start_date) || '…'} – {shortDate(data.end_date) || 'ongoing'}</span>
              )}
            </div>
          </div>
          {data.status && <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[data.status] || 'bg-gray-100 text-gray-600'}`}>{data.status}</span>}
        </div>
      </div>

      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${stats.length > 4 ? 'lg:grid-cols-6' : 'lg:grid-cols-4'}`}>
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-9 h-9 ${s.color} rounded-full flex items-center justify-center mb-3`}>
              <s.icon size={18} />
            </div>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {ads.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Megaphone size={16} /> Ads in this Campaign</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-gray-400 uppercase tracking-wide border-b">
                  <th className="text-left pb-2 font-semibold">Ad</th>
                  <th className="text-right pb-2 font-semibold">Spend</th>
                  <th className="text-right pb-2 font-semibold">Impressions</th>
                  <th className="text-right pb-2 font-semibold">Clicks</th>
                  <th className="text-right pb-2 font-semibold">Leads</th>
                  <th className="text-right pb-2 font-semibold">CPL</th>
                </tr>
              </thead>
              <tbody>
                {ads.map(a => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-2.5 font-medium text-gray-700 max-w-[220px] truncate" title={a.name}>{a.name || a.meta_ad_id}</td>
                    <td className="py-2.5 text-right">₹{parseFloat(a.spend || 0).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 text-right text-gray-500">{Number(a.impressions || 0).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 text-right text-gray-500">{Number(a.clicks || 0).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 text-right font-semibold text-emerald-600">{a.total_leads}</td>
                    <td className="py-2.5 text-right font-bold text-brand-600">₹{a.cpl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-semibold">Leads from this campaign ({leads.length}{hasActiveFilters ? ` of ${data.total_leads || 0}` : ''})</h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-4">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search name or phone…" value={searchInput} onChange={e => setSearchInput(e.target.value)}
              className="pl-8 pr-3 py-1.5 border rounded-lg text-xs w-52" />
          </div>
          <select value={filters.stage} onChange={e => setFilters(f => ({ ...f, stage: e.target.value }))}
            className="px-3 py-1.5 border rounded-lg text-xs bg-white">
            <option value="">All stages</option>
            {stages.map(s => <option key={s.id || s.name} value={s.name}>{s.name}</option>)}
          </select>
          <select value={filters.lead_score} onChange={e => setFilters(f => ({ ...f, lead_score: e.target.value }))}
            className="px-3 py-1.5 border rounded-lg text-xs bg-white">
            <option value="">All scores</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </select>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {leads.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">{hasActiveFilters ? 'No leads match these filters' : 'No leads from this campaign yet'}</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {leads.map(l => (
              <button key={l.id} onClick={() => navigate('/leads', { state: { openLeadId: l.id, leadSequence: leads.map(x => x.id) } })}
                className="group w-full flex items-center justify-between gap-3 px-2 py-3 hover:bg-gray-50 rounded-lg text-left">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{l.name}</p>
                  <p className="text-xs text-gray-500 truncate">{l.phone}{l.stage && <> · <span className="text-gray-600">{l.stage}</span></>}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-400">
                    {l.created_at ? formatDateTime(l.created_at, undefined, { dateStyle: undefined, timeStyle: undefined,  day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </span>
                  {l.lead_score && <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${scoreColors[l.lead_score] || scoreColors.cold}`}>{l.lead_score}</span>}
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetailPage;
