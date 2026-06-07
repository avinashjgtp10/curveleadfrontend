import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadAPI, aiAPI } from '../services/api';
import { Plus, Search, Filter, Phone, MessageCircle, Trash2, Edit2, Zap, X } from 'lucide-react';

const scoreColors = {
  hot: 'bg-red-100 text-red-700',
  warm: 'bg-amber-100 text-amber-700',
  cold: 'bg-gray-100 text-gray-600',
};

const LeadsPage = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [stages, setStages] = useState([]);
  const [filters, setFilters] = useState({ search: '', stage: '', source: '', score: '' });
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', source: 'manual', notes: '' });

  useEffect(() => { loadData(); }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [leadsRes, stagesRes] = await Promise.all([
        leadAPI.getAll({ ...filters, limit: view === 'pipeline' ? 200 : 50 }),
        leadAPI.getStages().catch(() => ({ data: { stages: [] } })),
      ]);
      setLeads(leadsRes.data.leads || []);
      setStages(stagesRes.data.stages || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!newLead.name || !newLead.phone) return alert('Name and phone required');
    try {
      await leadAPI.create(newLead);
      setShowAddModal(false);
      setNewLead({ name: '', phone: '', email: '', source: 'manual', notes: '' });
      loadData();
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try { await leadAPI.delete(id); loadData(); } catch (e) { alert('Failed'); }
  };

  const handleAIScore = async (id) => {
    try {
      await aiAPI.scoreLead(id);
      loadData();
    } catch (e) { alert(e.response?.data?.error || 'AI scoring failed'); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-2xl border p-3 flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or phone..."
            value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <select value={filters.score} onChange={e => setFilters(f => ({ ...f, score: e.target.value }))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">All scores</option>
          <option value="hot">🔥 Hot</option>
          <option value="warm">⭐ Warm</option>
          <option value="cold">❄️ Cold</option>
        </select>
        <select value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">All sources</option>
          <option value="meta_ads">Meta Ads</option>
          <option value="google_ads">Google Ads</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="referral">Referral</option>
          <option value="manual">Manual</option>
        </select>
        <button onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 flex items-center gap-2">
          <Plus size={16} /> Add Lead
        </button>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-md text-xs font-medium ${view === 'list' ? 'bg-white shadow' : 'text-gray-500'}`}>List</button>
        <button onClick={() => setView('pipeline')} className={`px-3 py-1.5 rounded-md text-xs font-medium ${view === 'pipeline' ? 'bg-white shadow' : 'text-gray-500'}`}>Pipeline</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
      ) : view === 'list' ? (
        <div className="bg-white rounded-2xl border overflow-hidden">
          {leads.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p>No leads yet. Add your first lead to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Phone</th>
                    <th className="text-left px-4 py-3">Source</th>
                    <th className="text-left px-4 py-3">Score</th>
                    <th className="text-left px-4 py-3">Stage</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(l => (
                    <tr key={l.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium cursor-pointer" onClick={() => navigate(`/leads/${l.id}`)}>{l.name}</td>
                      <td className="px-4 py-3 text-gray-600">{l.phone}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{l.source?.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${scoreColors[l.lead_score] || 'bg-gray-100 text-gray-600'}`}>
                          {l.lead_score?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{l.stage}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <a href={`tel:${l.phone}`} className="p-1.5 hover:bg-blue-50 rounded text-blue-500" title="Call"><Phone size={14} /></a>
                          <a href={`https://wa.me/${l.phone}`} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-green-50 rounded text-green-500" title="WhatsApp"><MessageCircle size={14} /></a>
                          <button onClick={() => handleAIScore(l.id)} className="p-1.5 hover:bg-purple-50 rounded text-purple-500" title="AI Score"><Zap size={14} /></button>
                          <button onClick={() => navigate(`/leads/${l.id}`)} className="p-1.5 hover:bg-gray-100 rounded" title="Edit"><Edit2 size={14} /></button>
                          <button onClick={() => handleDelete(l.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {stages.map(stage => {
              const stageLeads = leads.filter(l => l.stage?.toLowerCase() === stage.name?.toLowerCase());
              return (
                <div key={stage.id} className="w-72 shrink-0 bg-gray-50 rounded-xl border">
                  <div className="px-3 py-2.5 bg-white border-b rounded-t-xl flex items-center justify-between">
                    <p className="text-sm font-semibold">{stage.name}</p>
                    <span className="text-xs font-bold bg-gray-200 rounded-full px-2 py-0.5">{stageLeads.length}</span>
                  </div>
                  <div className="p-2 space-y-1.5 max-h-[600px] overflow-y-auto">
                    {stageLeads.map(lead => (
                      <button key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}
                        className="w-full p-2.5 bg-white rounded-lg hover:shadow-md transition border text-left">
                        <p className="text-sm font-medium truncate">{lead.name}</p>
                        <p className="text-xs text-gray-400">{lead.phone}</p>
                        <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${scoreColors[lead.lead_score]}`}>{lead.lead_score?.toUpperCase()}</span>
                      </button>
                    ))}
                    {stageLeads.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No leads</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">Add New Lead</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <input type="text" placeholder="Name *" value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <input type="tel" placeholder="Phone *" value={newLead.phone} onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <input type="email" placeholder="Email" value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <select value={newLead.source} onChange={e => setNewLead({ ...newLead, source: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                <option value="manual">Manual</option>
                <option value="meta_ads">Meta Ads</option>
                <option value="google_ads">Google Ads</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="referral">Referral</option>
                <option value="website">Website</option>
                <option value="walkin">Walk-in</option>
              </select>
              <textarea placeholder="Notes" value={newLead.notes} onChange={e => setNewLead({ ...newLead, notes: e.target.value })}
                rows={3} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={handleAdd} className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">Add Lead</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;
