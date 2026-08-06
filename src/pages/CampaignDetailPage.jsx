import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campaignAPI, stageAPI } from '../services/api';
import { ArrowLeft, IndianRupee, Users, TrendingUp, Target, Eye, MousePointerClick, X } from 'lucide-react';

const CampaignDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState([]);
  const [filters, setFilters] = useState({ stage: '', lead_score: '', search: '' });
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => { stageAPI.getAll().then(({ data }) => setStages(data.stages || [])).catch(() => {}); }, []);

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
    { label: 'CPL', value: `₹${parseFloat(data.cpl || 0).toFixed(0)}`, icon: Target, color: 'bg-purple-100 text-purple-600' },
    ...(data.meta_campaign_id ? [
      { label: 'Impressions', value: Number(data.impressions || 0).toLocaleString('en-IN'), icon: Eye, color: 'bg-cyan-100 text-cyan-600' },
      { label: 'Clicks', value: Number(data.clicks || 0).toLocaleString('en-IN'), icon: MousePointerClick, color: 'bg-indigo-100 text-indigo-600' },
    ] : []),
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-white rounded-2xl border p-5">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl font-bold">{data.name}</h2>
          {data.meta_campaign_id && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-600">Meta Synced</span>
          )}
        </div>
        <p className="text-sm text-gray-500 capitalize">{data.source?.replace(/_/g, ' ')}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon size={20} />
            </div>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-bold mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-semibold">Leads from this campaign ({leads.length}{hasActiveFilters ? ` of ${data.total_leads || 0}` : ''})</h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-4">
          <input type="text" placeholder="Search name or phone…" value={searchInput} onChange={e => setSearchInput(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-xs w-48" />
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
          <div className="space-y-2">
            {leads.map(l => (
              <button key={l.id} onClick={() => navigate(`/leads/${l.id}`)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg text-left">
                <div>
                  <p className="font-medium text-sm">{l.name}</p>
                  <p className="text-xs text-gray-500">{l.phone} • {l.stage}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  l.lead_score === 'hot' ? 'bg-red-100 text-red-700' :
                  l.lead_score === 'warm' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                }`}>{l.lead_score?.toUpperCase()}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetailPage;
