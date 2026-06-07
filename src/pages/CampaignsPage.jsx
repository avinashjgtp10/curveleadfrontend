import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignAPI } from '../services/api';
import { Plus, Megaphone, IndianRupee, Users, TrendingUp, X, Edit2, Trash2 } from 'lucide-react';

const statusColors = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-gray-100 text-gray-600',
  draft: 'bg-blue-100 text-blue-700',
};

const CampaignsPage = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', source: 'meta_ads', budget: '', start_date: '', end_date: '', status: 'active',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await campaignAPI.getAll();
      setCampaigns(data.campaigns || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.name) return alert('Campaign name required');
    try {
      if (editing) {
        await campaignAPI.update(editing, form);
      } else {
        await campaignAPI.create(form);
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', source: 'meta_ads', budget: '', start_date: '', end_date: '', status: 'active' });
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
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try { await campaignAPI.delete(id); loadData(); } catch (e) { alert('Failed'); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Track ad spend and ROI for your marketing campaigns</p>
        <button onClick={() => { setEditing(null); setForm({ name: '', source: 'meta_ads', budget: '', start_date: '', end_date: '', status: 'active' }); setShowModal(true); }}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 flex items-center gap-2">
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <Megaphone size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No campaigns yet. Create your first campaign to track ROI.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(c => {
            const cpl = c.leads_count > 0 ? (parseFloat(c.actual_spend) / c.leads_count).toFixed(0) : 0;
            return (
              <div key={c.id} className="bg-white rounded-2xl border p-5 hover:shadow-lg transition cursor-pointer" onClick={() => navigate(`/campaigns/${c.id}`)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{c.name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{c.source?.replace(/_/g, ' ')}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[c.status]}`}>{c.status?.toUpperCase()}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Budget</span><span className="font-medium">₹{parseFloat(c.budget || 0).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Spent</span><span className="font-medium">₹{parseFloat(c.actual_spend || 0).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Leads</span><span className="font-medium">{c.leads_count || 0}</span></div>
                  <div className="flex justify-between border-t pt-2"><span className="text-gray-500">CPL</span><span className="font-bold text-brand-600">₹{cpl}</span></div>
                </div>
                <div className="flex gap-1 mt-3 pt-3 border-t">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(c); }} className="flex-1 py-1.5 hover:bg-gray-50 rounded text-xs flex items-center justify-center gap-1"><Edit2 size={12} /> Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="flex-1 py-1.5 hover:bg-red-50 rounded text-xs text-red-500 flex items-center justify-center gap-1"><Trash2 size={12} /> Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">{editing ? 'Edit Campaign' : 'New Campaign'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <input type="text" placeholder="Campaign Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
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
              <input type="number" placeholder="Budget (₹)" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                  className="px-3 py-2.5 border rounded-lg text-sm" />
                <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                  className="px-3 py-2.5 border rounded-lg text-sm" />
              </div>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
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
