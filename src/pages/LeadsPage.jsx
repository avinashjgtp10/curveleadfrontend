import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { leadAPI, aiAPI, stageAPI } from '../services/api';
import { Plus, Search, Phone, MessageCircle, Trash2, Edit2, Zap, X, Users, SlidersHorizontal, ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';

const scoreColors = {
  hot: 'bg-red-100 text-red-700',
  warm: 'bg-amber-100 text-amber-700',
  cold: 'bg-gray-100 text-gray-600',
};

const LeadsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [leads, setLeads] = useState([]);
  const [stages, setStages] = useState([]);
  const [filters, setFilters] = useState({ search: '', stage: '', source: '', score: '', date_from: '', date_to: '' });
  const [view, setView] = useState(location.state?.view || 'list');
  const [followups, setFollowups] = useState([]);
  const [fuFilters, setFuFilters] = useState({ search: '', type: '', date_from: '', date_to: '' });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [editingStageId, setEditingStageId] = useState(null);
  const PAGE_SIZE = 25;
  const getDefaultDate = () => { const d = new Date(); d.setSeconds(0, 0); return d.toISOString().slice(0, 16); };
  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', location: '', source: 'manual', notes: '', lead_date: getDefaultDate() });

  useEffect(() => { loadData(); }, [filters, view, page, fuFilters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const stagesRes = await stageAPI.getAll().catch(() => ({ data: { stages: [] } }));
      setStages(stagesRes.data.stages || []);

      if (view === 'followups') {
        const res = await leadAPI.getFollowupsToday(fuFilters);
        setFollowups(res.data.followups || []);
      } else {
        const leadsRes = await leadAPI.getAll({ ...filters, page, limit: view === 'pipeline' ? 500 : PAGE_SIZE });
        setLeads(leadsRes.data.leads || []);
        setPagination({ total: leadsRes.data.total || 0, pages: leadsRes.data.pages || 1 });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleFilterChange = (updater) => { setPage(1); setFilters(updater); };

  const pageNumbers = () => {
    const t = pagination.pages;
    if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '…', t];
    if (page >= t - 3) return [1, '…', t - 4, t - 3, t - 2, t - 1, t];
    return [1, '…', page - 1, page, page + 1, '…', t];
  };

  const handleAdd = async () => {
    if (!newLead.name || !newLead.phone) return alert('Name and phone required');
    try {
      await leadAPI.create(newLead);
      setShowAddModal(false);
      setNewLead({ name: '', phone: '', email: '', location: '', source: 'manual', notes: '', lead_date: getDefaultDate() });
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

  const handleStageChange = async (leadId, newStage) => {
    setEditingStageId(null);
    try {
      await leadAPI.update(leadId, { stage: newStage });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l));
    } catch (e) { alert('Failed to update stage'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-cyan-600">Global lead workspace</p>
          <h1 className="mt-1 text-3xl font-extrabold text-gray-900">Leads</h1>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-cyan-600 px-5 py-3 text-sm font-extrabold uppercase text-white shadow-sm hover:bg-cyan-700">
          <Plus size={18} /> Add New Lead
        </button>
      </div>

      <div className="bg-white shadow-sm">
        <div className="flex flex-wrap border-b border-gray-200 px-5">
          {[
            { id: 'list', label: 'All Leads' },
            { id: 'pipeline', label: 'Pipeline' },
            { id: 'followups', label: 'Follow Ups' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setView(tab.id); setPage(1); }}
              className={`mr-7 border-b-2 py-4 text-sm font-extrabold ${view === tab.id ? 'border-gray-900 text-gray-950' : 'border-transparent text-gray-900 hover:text-cyan-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {view === 'followups' && (
        <div className="flex flex-wrap items-center gap-3 p-5">
          <div className="relative min-w-[220px] flex-1">
            <Search size={19} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="Search by name or phone..."
              value={fuFilters.search} onChange={e => setFuFilters(f => ({ ...f, search: e.target.value }))}
              className="h-11 w-full bg-gray-200/70 pl-11 pr-3 text-sm font-medium text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
          </div>
          <div className="relative min-w-[170px]">
            <SlidersHorizontal size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <select value={fuFilters.type} onChange={e => setFuFilters(f => ({ ...f, type: e.target.value }))}
              className="h-11 w-full appearance-none bg-gray-200/70 pl-10 pr-8 text-sm font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500">
              <option value="">All types</option>
              <option value="call">Call</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="visit">Visit</option>
              <option value="email">Email</option>
              <option value="demo">Demo</option>
            </select>
          </div>
          <div className="relative">
            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input type="date" value={fuFilters.date_from}
              onChange={e => setFuFilters(f => ({ ...f, date_from: e.target.value }))}
              className="h-11 bg-gray-200/70 pl-10 pr-3 text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              title="From date" />
          </div>
          <span className="text-gray-400 text-sm self-center">–</span>
          <div className="relative">
            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input type="date" value={fuFilters.date_to}
              onChange={e => setFuFilters(f => ({ ...f, date_to: e.target.value }))}
              className="h-11 bg-gray-200/70 pl-10 pr-3 text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              title="To date" />
          </div>
          {(fuFilters.search || fuFilters.type || fuFilters.date_from || fuFilters.date_to) && (
            <button onClick={() => setFuFilters({ search: '', type: '', date_from: '', date_to: '' })}
              className="p-2 hover:bg-gray-100 rounded text-gray-500" title="Clear filters">
              <X size={15} />
            </button>
          )}
        </div>
        )}

        {view !== 'followups' && (
        <div className="flex flex-wrap items-center gap-3 p-5">
          <div className="relative min-w-[240px] flex-1">
            <Search size={19} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="Search leads..."
              value={filters.search} onChange={e => handleFilterChange(f => ({ ...f, search: e.target.value }))}
              className="h-11 w-full bg-gray-200/70 pl-11 pr-3 text-sm font-medium text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
          </div>
          <div className="relative min-w-[190px]">
            <Users size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <select value={filters.score} onChange={e => handleFilterChange(f => ({ ...f, score: e.target.value }))}
              className="h-11 w-full appearance-none bg-gray-200/70 pl-10 pr-8 text-sm font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500">
              <option value="">All scores</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </select>
          </div>
          <div className="relative min-w-[190px]">
            <SlidersHorizontal size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <select value={filters.source} onChange={e => handleFilterChange(f => ({ ...f, source: e.target.value }))}
              className="h-11 w-full appearance-none bg-gray-200/70 pl-10 pr-8 text-sm font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500">
              <option value="">All sources</option>
              <option value="meta_ads">Meta Ads</option>
              <option value="google_ads">Google Ads</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="referral">Referral</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div className="relative">
            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input type="date" value={filters.date_from}
              onChange={e => handleFilterChange(f => ({ ...f, date_from: e.target.value }))}
              className="h-11 bg-gray-200/70 pl-10 pr-3 text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              title="From date" />
          </div>
          <span className="text-gray-400 text-sm self-center">–</span>
          <div className="relative">
            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input type="date" value={filters.date_to}
              onChange={e => handleFilterChange(f => ({ ...f, date_to: e.target.value }))}
              className="h-11 bg-gray-200/70 pl-10 pr-3 text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              title="To date" />
          </div>
          {(filters.date_from || filters.date_to) && (
            <button onClick={() => handleFilterChange(f => ({ ...f, date_from: '', date_to: '' }))}
              className="p-2 hover:bg-gray-100 rounded text-gray-500" title="Clear dates">
              <X size={15} />
            </button>
          )}
        </div>
        )}

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
      ) : view === 'list' ? (
        <div className="overflow-hidden px-5 pb-5">
          {leads.length === 0 ? (
            <div className="border-t border-gray-200 p-12 text-center text-gray-400">
              <p>No leads yet. Add your first lead to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-y border-gray-200 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="text-left px-3 py-3">Name</th>
                    <th className="text-left px-3 py-3">Phone Number</th>
                    <th className="text-left px-3 py-3">Source</th>
                    <th className="text-left px-3 py-3">Score</th>
                    <th className="text-left px-3 py-3">Stage</th>
                    <th className="text-right px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(l => (
                    <tr key={l.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-3 py-3 font-extrabold cursor-pointer" onClick={() => navigate(`/leads/${l.id}`)}>{l.name}</td>
                      <td className="px-3 py-3 text-gray-700">{l.phone}</td>
                      <td className="px-3 py-3 text-gray-600 capitalize">{l.source?.replace(/_/g, ' ')}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${scoreColors[l.lead_score] || 'bg-gray-100 text-gray-600'}`}>
                          {l.lead_score?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {editingStageId === l.id ? (
                          <select
                            autoFocus
                            defaultValue={(l.stage || '').toLowerCase()}
                            onBlur={() => setEditingStageId(null)}
                            onChange={e => handleStageChange(l.id, e.target.value)}
                            className="border border-cyan-400 rounded px-2 py-1 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          >
                            {stages.map(s => (
                              <option key={s.id} value={s.name.toLowerCase()}>{s.name}</option>
                            ))}
                          </select>
                        ) : (
                          <button
                            onClick={() => setEditingStageId(l.id)}
                            className="text-xs text-gray-600 capitalize hover:text-cyan-700 hover:underline cursor-pointer"
                            title="Click to change stage"
                          >
                            {l.stage || '—'}
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
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

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 flex-wrap gap-3">
              <p className="text-xs text-gray-500">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, pagination.total)}–{Math.min(page * PAGE_SIZE, pagination.total)} of <span className="font-semibold text-gray-700">{pagination.total}</span> leads
              </p>
              {pagination.pages > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronLeft size={16} />
                  </button>
                  {pageNumbers().map((n, i) =>
                    n === '…' ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm select-none">…</span>
                    ) : (
                      <button key={n} onClick={() => setPage(n)}
                        className={`w-8 h-8 rounded text-xs font-semibold transition-colors ${page === n ? 'bg-cyan-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
                        {n}
                      </button>
                    )
                  )}
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : view === 'followups' ? (
        <div className="overflow-hidden px-5 pb-5">
          {followups.length === 0 ? (
            <div className="border-t border-gray-200 p-12 text-center text-gray-400">
              <Clock size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No pending follow-ups</p>
              <p className="text-sm mt-1">All caught up! Schedule follow-ups from lead detail pages.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <p className="text-xs text-gray-500 mb-3 pt-1">{followups.length} pending follow-up{followups.length !== 1 ? 's' : ''} due today or overdue</p>
              <table className="w-full text-sm">
                <thead className="border-y border-gray-200 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="text-left px-3 py-3">Lead</th>
                    <th className="text-left px-3 py-3">Phone</th>
                    <th className="text-left px-3 py-3">Stage</th>
                    <th className="text-left px-3 py-3">Type</th>
                    <th className="text-left px-3 py-3">Due</th>
                    <th className="text-left px-3 py-3">Notes</th>
                    <th className="text-right px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {followups.map(f => {
                    const isOverdue = new Date(f.next_followup_at) < new Date();
                    return (
                      <tr key={f.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-3 py-3 font-extrabold cursor-pointer" onClick={() => navigate(`/leads/${f.lead_id}`, { state: { returnView: 'followups' } })}>{f.lead_name}</td>
                        <td className="px-3 py-3 text-gray-700">{f.lead_phone}</td>
                        <td className="px-3 py-3 text-gray-600 capitalize">{f.lead_stage}</td>
                        <td className="px-3 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 capitalize">
                            {(f.followup_type || 'call').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-xs font-semibold ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                            {isOverdue ? '⚠ ' : ''}{new Date(f.next_followup_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-gray-500 text-xs max-w-[200px] truncate">{f.notes || '—'}</td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <a href={`tel:${f.lead_phone}`} className="p-1.5 hover:bg-blue-50 rounded text-blue-500" title="Call"><Phone size={14} /></a>
                            <a href={`https://wa.me/${(f.lead_phone || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-green-50 rounded text-green-500" title="WhatsApp"><MessageCircle size={14} /></a>
                            <button onClick={() => navigate(`/leads/${f.lead_id}`, { state: { returnView: 'followups' } })} className="p-1.5 hover:bg-gray-100 rounded" title="Open lead"><Edit2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto px-5 pb-5">
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
      </div>

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
              <div>
                <label className="block text-xs text-gray-500 mb-1">Lead Date & Time</label>
                <input type="datetime-local" value={newLead.lead_date}
                  onChange={e => setNewLead({ ...newLead, lead_date: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              </div>
              <input type="text" placeholder="Name *" value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <input type="tel" placeholder="Phone *" value={newLead.phone} onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <input type="email" placeholder="Email" value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <input type="text" placeholder="City" value={newLead.location} onChange={e => setNewLead({ ...newLead, location: e.target.value })}
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
