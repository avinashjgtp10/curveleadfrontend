import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignAPI, integrationsAPI } from '../services/api';
import { Plus, Megaphone, IndianRupee, Users, TrendingUp, X, Edit2, Trash2, RotateCcw, Eye, MousePointerClick, Target } from 'lucide-react';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';

const statusColors = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-gray-100 text-gray-600',
  draft: 'bg-blue-100 text-blue-700',
};

const verdictColors = {
  high_quality: 'bg-emerald-100 text-emerald-700',
  high_volume_low_quality: 'bg-amber-100 text-amber-700',
  underperforming: 'bg-gray-100 text-gray-500',
  average: 'bg-gray-100 text-gray-600',
  too_early: 'bg-blue-50 text-blue-600',
  no_leads: 'bg-gray-50 text-gray-400',
};

const CampaignsPage = () => {
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', source: 'meta_ads', budget: '', start_date: '', end_date: '', status: 'active',
  });
  const [errors, setErrors] = useState({});
  const [syncingInsights, setSyncingInsights] = useState(false);
  const [tab, setTab] = useState('active');

  useEffect(() => { loadData(); }, []);

  const handleSyncInsights = async () => {
    setSyncingInsights(true);
    try {
      const { data } = await integrationsAPI.syncAdInsights();
      alert(data.message);
      loadData();
    } catch (e) { alert(e.response?.data?.error || 'Sync failed. Connect an ad account in Integrations first.'); }
    finally { setSyncingInsights(false); }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await campaignAPI.getAll();
      setCampaigns(data.campaigns || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Campaign name is required';
    if (form.start_date && form.end_date && form.end_date < form.start_date) newErrors.end_date = 'End date must be after start date';
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;
    try {
      if (editing) {
        await campaignAPI.update(editing, form);
      } else {
        await campaignAPI.create(form);
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', source: 'meta_ads', budget: '', start_date: '', end_date: '', status: 'active' });
      setErrors({});
      loadData();
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const handleEdit = (c) => {
    setEditing(c.id);
    setForm({
      name: c.name,
      source: c.source,
      budget: c.budget || '',
      start_date: c.start_date?.split('T')[0] || '',
      end_date: c.end_date?.split('T')[0] || '',
      status: c.status,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!await confirm({ title: 'Delete this campaign?' })) return;
    try { await campaignAPI.delete(id); loadData(); } catch (e) { alert('Failed'); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Track ad spend and ROI for your marketing campaigns</p>
        <div className="flex items-center gap-2">
          <button onClick={handleSyncInsights} disabled={syncingInsights}
            className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50">
            <RotateCcw size={14} className={syncingInsights ? 'animate-spin' : ''} /> {syncingInsights ? 'Syncing…' : 'Sync Ad Insights'}
          </button>
          <button onClick={() => { setEditing(null); setForm({ name: '', source: 'meta_ads', budget: '', start_date: '', end_date: '', status: 'active' }); setErrors({}); setShowModal(true); }}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 flex items-center gap-2">
            <Plus size={16} /> New Campaign
          </button>
        </div>
      </div>

      {!loading && campaigns.length > 0 && (() => {
        const focus = campaigns.filter(c => c.verdict === 'high_quality');
        const watch = campaigns.filter(c => c.verdict === 'high_volume_low_quality');
        if (!focus.length && !watch.length) return null;
        return (
          <div className="bg-white rounded-2xl border p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-2"><Target size={16} /> Where to focus</h2>
            {focus.map(c => (
              <div key={c.id} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-emerald-50 cursor-pointer" onClick={() => navigate(`/campaigns/${c.id}`)}>
                <span className="text-sm mt-0.5">🎯</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-emerald-800 truncate">{c.name}</p>
                  <p className="text-xs text-emerald-700">{c.verdict_reason}</p>
                </div>
              </div>
            ))}
            {watch.map(c => (
              <div key={c.id} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-amber-50 cursor-pointer" onClick={() => navigate(`/campaigns/${c.id}`)}>
                <span className="text-sm mt-0.5">⚠️</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-amber-800 truncate">{c.name}</p>
                  <p className="text-xs text-amber-700">{c.verdict_reason}</p>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {!loading && campaigns.length > 0 && (() => {
        const activeCount = campaigns.filter(c => c.status === 'active').length;
        const inactiveCount = campaigns.length - activeCount;
        return (
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            <button onClick={() => setTab('active')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${tab === 'active' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              Active ({activeCount})
            </button>
            <button onClick={() => setTab('inactive')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${tab === 'inactive' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              Inactive ({inactiveCount})
            </button>
          </div>
        );
      })()}

      {(() => {
        const visible = campaigns.filter(c => tab === 'active' ? c.status === 'active' : c.status !== 'active');
        return loading ? (
          <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <Megaphone size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No campaigns yet. Create your first campaign to track ROI.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <Megaphone size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No {tab} campaigns.</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map(c => {
            return (
              <div key={c.id} className="bg-white rounded-2xl border p-5 hover:shadow-lg transition cursor-pointer" onClick={() => navigate(`/campaigns/${c.id}`)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-semibold">{c.name}</h3>
                      {c.meta_campaign_id && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-600">Meta Synced</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 capitalize">{c.source?.replace(/_/g, ' ')}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[c.status]}`}>{c.status?.toUpperCase()}</span>
                </div>
                {c.verdict_label && (
                  <div className={`mb-3 px-2.5 py-1.5 rounded-lg text-[11px] font-medium ${verdictColors[c.verdict] || 'bg-gray-100 text-gray-600'}`} title={c.verdict_reason}>
                    {c.verdict_label}
                  </div>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Budget</span><span className="font-medium">₹{parseFloat(c.budget || 0).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Spent</span><span className="font-medium">₹{parseFloat(c.actual_spend || 0).toLocaleString('en-IN')}</span></div>
                  {c.meta_campaign_id && (c.impressions != null || c.clicks != null) && (
                    <>
                      <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-1"><Eye size={11} /> Impressions</span><span className="font-medium">{Number(c.impressions || 0).toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-1"><MousePointerClick size={11} /> Clicks</span><span className="font-medium">{Number(c.clicks || 0).toLocaleString('en-IN')}</span></div>
                    </>
                  )}
                  <div className="flex justify-between"><span className="text-gray-500">Leads</span><span className="font-medium">{c.total_leads || 0}</span></div>
                  {c.total_leads > 0 && (
                    <div className="flex justify-between"><span className="text-gray-500">Won / Disqualified</span><span className="font-medium">{c.won_leads || 0} / {c.lost_leads || 0}</span></div>
                  )}
                  <div className="flex justify-between border-t pt-2"><span className="text-gray-500">CPL</span><span className="font-bold text-brand-600">₹{Math.round(parseFloat(c.cpl) || 0)}</span></div>
                </div>
                <div className="flex gap-1 mt-3 pt-3 border-t">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(c); }} className="flex-1 py-1.5 hover:bg-gray-50 rounded text-xs flex items-center justify-center gap-1"><Edit2 size={12} /> Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="flex-1 py-1.5 hover:bg-red-50 rounded text-xs text-red-500 flex items-center justify-center gap-1"><Trash2 size={12} /> Delete</button>
                </div>
              </div>
            );
          })}
        </div>
        );
      })()}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">{editing ? 'Edit Campaign' : 'New Campaign'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Campaign Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.name}
                  onChange={e => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors(er => ({ ...er, name: undefined })); }}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm ${errors.name ? 'border-red-500' : ''}`} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Source</label>
                <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                  <option value="meta_ads">Meta Ads</option>
                  <option value="google_ads">Google Ads</option>
                  <option value="instagram">Instagram</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="organic">Organic</option>
                  <option value="referral">Referral</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Budget (₹)</label>
                <input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                  <input type="date" value={form.end_date}
                    onChange={e => { setForm({ ...form, end_date: e.target.value }); if (errors.end_date) setErrors(er => ({ ...er, end_date: undefined })); }}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm ${errors.end_date ? 'border-red-500' : ''}`} />
                  {errors.end_date && <p className="text-xs text-red-500 mt-1">{errors.end_date}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={handleSave} className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsPage;
