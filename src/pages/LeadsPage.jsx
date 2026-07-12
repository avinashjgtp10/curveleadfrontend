import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { leadAPI, aiAPI, stageAPI, staffAPI, leadImportAPI, statusAPI, followupAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LeadDetailPage from './LeadDetailPage';
import { Plus, Search, Phone, MessageCircle, Trash2, Edit2, Zap, X, ChevronLeft, ChevronRight, Clock, SlidersHorizontal, ChevronDown, ChevronUp, ChevronsUpDown, User, CheckSquare, Square, GitBranch, UserCheck, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Flame, Sun, Snowflake } from 'lucide-react';
import { computeFollowupHealth, FOLLOWUP_HEALTH_STYLES } from '../utils/followupHealth';

const scoreColors = {
  hot: 'bg-red-100 text-red-700',
  warm: 'bg-amber-100 text-amber-700',
  cold: 'bg-gray-100 text-gray-600',
};

const scoreIcons = { hot: Flame, warm: Sun, cold: Snowflake };

const EMPTY_FILTERS = { search: '', stage: '', lead_status: '', source: '', score: '', followup_health: '', sla_status: '', assigned_to: '', date_field: '', date_from: '', date_to: '' };
const SLA_STATUS_LABELS = {
  uncontacted: 'Uncontacted',
  new: 'New',
  sla_risk: 'SLA Risk',
  sla_breached: 'SLA Breached',
  missed_lead: 'Missed Lead',
  responded_5min: 'Responded ≤5 min',
};
const EMPTY_FU_FILTERS = { search: '', type: '', date_from: '', date_to: '', scope: '', category: '' };

const getQueryConfig = (search, state = {}) => {
  const routeState = state || {};
  const params = new URLSearchParams(search);
  const view = params.get('view') || routeState.view || 'list';
  const filters = { ...EMPTY_FILTERS };
  const fuFilters = { ...EMPTY_FU_FILTERS };
  const sortState = { sort: params.get('sort') || '', dir: params.get('dir') || '' };

  Object.keys(filters).forEach(key => {
    const value = params.get(key);
    if (value !== null) filters[key] = value;
  });
  if ((filters.date_from || filters.date_to) && !params.get('date_field')) filters.date_field = 'created_at';

  Object.keys(fuFilters).forEach(key => {
    const value = params.get(key);
    if (value !== null) fuFilters[key] = value;
  });

  return { view, filters, fuFilters, sortState };
};

const isSameLocalDay = (value, day) => {
  if (!value || !day) return true;
  const d = new Date(value);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  return local === day;
};

const filterFollowupsForScope = (items, filters) => {
  const today = filters.date_from || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  return items.filter(f => {
    if (filters.scope === 'today' && !isSameLocalDay(f.next_followup_at, today)) return false;
    if (filters.scope === 'overdue' && new Date(f.next_followup_at) >= new Date()) return false;
    if (filters.category === 'followup' && f.followup_type === 'demo') return false;
    return true;
  });
};

const getFollowupApiFilters = ({ scope, category, ...apiFilters }) => apiFilters;

const compactParams = (params) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
);

const withoutLeadDateFilters = ({ date_field, date_from, date_to, ...rest }) => rest;

const getLeadDateValue = (lead, dateField) => {
  if (dateField === 'created_at') return lead.created_at;
  return lead.lead_date || lead.created_at;
};

const filterLeadsByDate = (items, activeFilters) => {
  if (!activeFilters.date_from && !activeFilters.date_to) return items;

  const from = activeFilters.date_from ? new Date(activeFilters.date_from) : null;
  const to = activeFilters.date_to ? new Date(activeFilters.date_to) : null;
  if (to) to.setDate(to.getDate() + 1);

  return items.filter(lead => {
    const value = getLeadDateValue(lead, activeFilters.date_field);
    if (!value) return false;
    const leadDate = new Date(value);
    if (from && leadDate < from) return false;
    if (to && leadDate >= to) return false;
    return true;
  });
};

const SortTh = ({ sortKey, label, sortState, onSort, align = 'left' }) => {
  const active = sortState.sort === sortKey;
  const Icon = active ? (sortState.dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <th className={`px-3 py-3 text-${align}`}>
      <button onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 hover:text-gray-900 ${active ? 'text-gray-900 font-semibold' : ''}`}>
        {label}
        <Icon size={12} className={active ? 'text-gray-700' : 'text-gray-300'} />
      </button>
    </th>
  );
};

const LeadsPage = () => {
  const location = useLocation();
  const queryConfig = getQueryConfig(location.search, location.state);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const [leads, setLeads] = useState([]);
  const [stages, setStages] = useState([]);
  const [stageStatuses, setStageStatuses] = useState({}); // { stageName: [status, ...] }
  const [allStatuses, setAllStatuses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [editingStatusId, setEditingStatusId] = useState(null);
  const [filters, setFilters] = useState(queryConfig.filters);
  const [showFilters, setShowFilters] = useState(Object.values(queryConfig.filters).some(Boolean));
  const [view, setView] = useState(queryConfig.view);
  const [followups, setFollowups] = useState([]);
  const [fuFilters, setFuFilters] = useState(queryConfig.fuFilters);
  const [sortState, setSortState] = useState(queryConfig.sortState);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [editingStageId, setEditingStageId] = useState(null);
  const [editingAssignId, setEditingAssignId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStage, setBulkStage] = useState('');
  const [bulkAssign, setBulkAssign] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const PAGE_SIZE = 25;
  const getDefaultDate = () => { const d = new Date(); d.setSeconds(0, 0); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', location: '', business_name: '', address: '', source: 'manual', notes: '', lead_date: getDefaultDate() });

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null); // { headers, rows }
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importDragOver, setImportDragOver] = useState(false);

  // Lost reason modal state
  const [lostReasonModal, setLostReasonModal] = useState({ open: false, leadId: null, newStage: null, reason: '', customReason: '' });
  const closeLostModal = () => setLostReasonModal({ open: false, leadId: null, newStage: null, reason: '', customReason: '' });

  // Lead detail modal state — opened in place so filters/pagination are never lost
  const [openLeadId, setOpenLeadId] = useState(null);
  const [renderedLeadId, setRenderedLeadId] = useState(null); // stays set during the exit fade
  const [modalEntered, setModalEntered] = useState(false);     // drives enter/exit transition classes
  const closeTimerRef = useRef(null);
  const closeLeadModal = () => { setOpenLeadId(null); fetchLeads(); };

  useEffect(() => {
    if (openLeadId) {
      clearTimeout(closeTimerRef.current);
      setRenderedLeadId(openLeadId);
      const raf = requestAnimationFrame(() => setModalEntered(true));
      const onKeyDown = (e) => { if (e.key === 'Escape') closeLeadModal(); };
      window.addEventListener('keydown', onKeyDown);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('keydown', onKeyDown);
        document.body.style.overflow = prevOverflow;
      };
    } else if (renderedLeadId) {
      setModalEntered(false);
      closeTimerRef.current = setTimeout(() => setRenderedLeadId(null), 200);
      return () => clearTimeout(closeTimerRef.current);
    }
  }, [openLeadId]);

  const openLeadIndex = renderedLeadId != null ? leads.findIndex(l => l.id === renderedLeadId) : -1;
  const prevLeadId = openLeadIndex > 0 ? leads[openLeadIndex - 1].id : null;
  const nextLeadId = (openLeadIndex >= 0 && openLeadIndex < leads.length - 1) ? leads[openLeadIndex + 1].id : null;
  const hasPrev = prevLeadId != null;
  const hasNext = nextLeadId != null;
  const goPrevLead = () => { if (prevLeadId) setOpenLeadId(prevLeadId); };
  const goNextLead = () => { if (nextLeadId) setOpenLeadId(nextLeadId); };

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => !['search', 'date_field'].includes(k) && v).length;

  useEffect(() => {
    const next = getQueryConfig(location.search, location.state);
    setView(next.view);
    setFilters(next.filters);
    setFuFilters(next.fuFilters);
    setSortState(next.sortState);
    setShowFilters(Object.values(next.filters).some(Boolean));
    setPage(1);
  }, [location.search, location.state]);

  // Load stages, statuses & staff once on mount
  useEffect(() => {
    Promise.all([
      stageAPI.getAll().catch(() => ({ data: { stages: [] } })),
      staffAPI.getAll().catch(() => ({ data: { staff: [] } })),
      statusAPI.byStage().catch(() => ({ data: { stages: [] } })),
    ]).then(([stagesRes, staffRes, statusRes]) => {
      setStages(stagesRes.data.stages || []);
      setStaff(staffRes.data.staff || []);
      const byStage = {};
      const all = [];
      for (const s of (statusRes.data.stages || [])) {
        byStage[s.name?.toLowerCase()] = s.statuses || [];
        all.push(...(s.statuses || []));
      }
      setStageStatuses(byStage);
      setAllStatuses(all);
    });
  }, []);

  // Reload leads whenever filters, view, page, fuFilters, or sortState change
  useEffect(() => { fetchLeads(); }, [filters, view, page, fuFilters, sortState]);

  const fetchLeads = async () => {
    setSelectedIds(new Set());
    setLoading(true);
    try {
      if (view === 'followups') {
        const res = await leadAPI.getFollowupsToday(compactParams(getFollowupApiFilters(fuFilters)));
        setFollowups(filterFollowupsForScope(res.data.followups || [], fuFilters));
      } else {
        const limit = view === 'pipeline' ? 500 : PAGE_SIZE;
        const params = compactParams({ ...filters, ...sortState, page, limit });
        try {
          const leadsRes = await leadAPI.getAll(params);
          setLeads(leadsRes.data.leads || []);
          setPagination({ total: leadsRes.data.pagination?.total || 0, pages: leadsRes.data.pagination?.pages || 1 });
        } catch (dateError) {
          if ((!filters.date_from && !filters.date_to) || dateError.response?.status !== 500) throw dateError;

          const fallbackLimit = view === 'pipeline' ? 500 : 1000;
          const fallbackParams = compactParams({ ...withoutLeadDateFilters(filters), page: 1, limit: fallbackLimit });
          const fallbackRes = await leadAPI.getAll(fallbackParams);
          const filteredLeads = filterLeadsByDate(fallbackRes.data.leads || [], filters);
          const start = view === 'pipeline' ? 0 : (page - 1) * PAGE_SIZE;
          const visibleLeads = view === 'pipeline' ? filteredLeads : filteredLeads.slice(start, start + PAGE_SIZE);

          setLeads(visibleLeads);
          setPagination({
            total: filteredLeads.length,
            page,
            limit,
            pages: Math.max(1, Math.ceil(filteredLeads.length / limit)),
          });
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadData = fetchLeads;

  const handleCompleteFollowup = async (id) => {
    try { await followupAPI.complete(id, { outcome: 'Completed' }); fetchLeads(); }
    catch (e) { alert('Failed to mark follow-up as done'); }
  };

  const handleFilterChange = (updater) => { setPage(1); setFilters(updater); };
  const handleSort = (key) => {
    setPage(1);
    setSortState(prev => prev.sort === key
      ? { sort: key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { sort: key, dir: 'asc' });
  };
  const clearFilters = () => handleFilterChange(f => ({ ...EMPTY_FILTERS, search: f.search }));

  const pageNumbers = () => {
    const t = pagination.pages;
    if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '…', t];
    if (page >= t - 3) return [1, '…', t - 4, t - 3, t - 2, t - 1, t];
    return [1, '…', page - 1, page, page + 1, '…', t];
  };

  const followupSummary = fuFilters.scope === 'today'
    ? "pending follow-up due today"
    : fuFilters.scope === 'overdue'
      ? "overdue pending follow-up"
      : "pending follow-up due today or overdue";

  const downloadTemplate = async () => {
    try {
      const { data } = await leadImportAPI.downloadTemplate();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      a.download = 'curvelead_import_template.xlsx';
      a.click();
    } catch {
      alert('Failed to download template.');
    }
  };

  const handleImportFile = (file) => {
    if (!file) return;
    const allowed = /\.(csv|xlsx|xls)$/i.test(file.name);
    if (!allowed) return alert('Only CSV (.csv) and Excel (.xlsx, .xls) files allowed.');
    setImportFile(file);
    setImportResult(null);
    // Preview: CSV only
    if (file.name.toLowerCase().endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const lines = e.target.result.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const rows = lines.slice(1, 4).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
        setImportPreview({ headers, rows });
      };
      reader.readAsText(file);
    } else {
      setImportPreview(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      const { data } = await leadImportAPI.import(importFile);
      setImportResult(data);
      setImportFile(null);
      setImportPreview(null);
      fetchLeads();
    } catch (e) {
      setImportResult({ error: e.response?.data?.error || 'Import failed. Please check your file.' });
    } finally {
      setImporting(false);
    }
  };

  const closeImport = () => {
    setShowImport(false);
    setImportFile(null);
    setImportPreview(null);
    setImportResult(null);
  };

  const handleAdd = async () => {
    if (!newLead.name || !newLead.phone) return alert('Name and phone required');
    try {
      await leadAPI.create(newLead);
      setShowAddModal(false);
      setNewLead({ name: '', phone: '', email: '', location: '', business_name: '', address: '', source: 'manual', notes: '', lead_date: getDefaultDate() });
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
    const stageObj = stages.find(s => s.name.toLowerCase() === newStage.toLowerCase());
    if (stageObj?.is_lost) {
      setLostReasonModal({ open: true, leadId, newStage, reason: '', customReason: '' });
      return;
    }
    try {
      await leadAPI.update(leadId, { stage: newStage, lead_status: '' });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage, lead_status: '' } : l));
    } catch (e) { alert('Failed to update stage'); }
  };

  const confirmLostStage = async () => {
    const finalReason = lostReasonModal.reason === 'Other'
      ? (lostReasonModal.customReason || 'Other')
      : lostReasonModal.reason;
    if (!finalReason) return;
    try {
      await leadAPI.update(lostReasonModal.leadId, {
        stage: lostReasonModal.newStage, lead_status: '', lost_reason: finalReason,
      });
      setLeads(prev => prev.map(l => l.id === lostReasonModal.leadId
        ? { ...l, stage: lostReasonModal.newStage, lead_status: '' }
        : l
      ));
      closeLostModal();
    } catch (e) { alert(e.response?.data?.error || 'Failed to update stage'); }
  };

  const handleExport = async () => {
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v)
      );
      const response = await leadAPI.export(params);
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      // If server returned an error as blob, read it as text to surface the real message
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text().catch(() => '');
        try { const parsed = JSON.parse(text); alert('Export failed: ' + (parsed.error || text)); return; } catch {}
        alert('Export failed: ' + (text || err.message));
      } else {
        alert('Export failed: ' + (err.response?.data?.error || err.message || 'Unknown error'));
      }
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    setEditingStatusId(null);
    try {
      await leadAPI.update(leadId, { lead_status: newStatus });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, lead_status: newStatus } : l));
    } catch (e) { alert('Failed to update status'); }
  };

  const handleAssignChange = async (leadId, staffId) => {
    setEditingAssignId(null);
    try {
      await leadAPI.update(leadId, { assigned_to: staffId || null });
      const member = staff.find(s => s.id === staffId);
      setLeads(prev => prev.map(l => l.id === leadId
        ? { ...l, assigned_to: staffId || null, assigned_to_name: member?.name || null }
        : l
      ));
    } catch (e) { alert('Failed to update assignment'); }
  };

  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map(l => l.id)));
    }
  };

  const clearSelection = () => { setSelectedIds(new Set()); setBulkStage(''); setBulkAssign(''); };

  const handleBulkStage = async (stage) => {
    if (!stage || !selectedIds.size) return;
    setBulkLoading(true);
    try {
      await leadAPI.bulkUpdate({ ids: [...selectedIds], stage });
      clearSelection();
      loadData();
    } catch (e) { alert('Failed'); }
    finally { setBulkLoading(false); }
  };

  const handleBulkAssign = async (staffId) => {
    setBulkLoading(true);
    try {
      await leadAPI.bulkUpdate({ ids: [...selectedIds], assigned_to: staffId || null });
      clearSelection();
      loadData();
    } catch (e) { alert('Failed'); }
    finally { setBulkLoading(false); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} lead${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`)) return;
    setBulkLoading(true);
    try {
      await leadAPI.bulkDelete([...selectedIds]);
      clearSelection();
      loadData();
    } catch (e) { alert('Failed'); }
    finally { setBulkLoading(false); }
  };

  const selectClass = "h-10 w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent";
  const inputClass = "h-10 w-full bg-white border border-gray-200 rounded-lg px-3 text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-cyan-600">Global lead workspace</p>
          <h1 className="mt-1 text-3xl font-extrabold text-gray-900">Leads</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport}
            className="inline-flex items-center gap-2 border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg">
            <Download size={16} /> Export
          </button>
          {isAdmin && (
            <button onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg">
              <Upload size={16} /> Import CSV
            </button>
          )}
          <button onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-cyan-600 px-5 py-3 text-sm font-extrabold uppercase text-white shadow-sm hover:bg-cyan-700">
            <Plus size={18} /> Add New Lead
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm">
        {/* Tabs */}
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

        {/* Follow-ups filter bar */}
        {view === 'followups' && (
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
            <div className="relative min-w-[220px] flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search by name or phone..."
                value={fuFilters.search} onChange={e => setFuFilters(f => ({ ...f, search: e.target.value }))}
                className={`${inputClass} pl-9`} />
            </div>
            <select value={fuFilters.type} onChange={e => setFuFilters(f => ({ ...f, type: e.target.value }))}
              className="h-10 appearance-none bg-white border border-gray-200 rounded-lg px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-w-[150px]">
              <option value="">All types</option>
              <option value="call">Call</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="visit">Visit</option>
              <option value="email">Email</option>
              <option value="demo">Demo</option>
            </select>
            <input type="date" value={fuFilters.date_from}
              onChange={e => setFuFilters(f => ({ ...f, date_from: e.target.value }))}
              className="h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            <span className="text-gray-400 text-sm">–</span>
            <input type="date" value={fuFilters.date_to}
              onChange={e => setFuFilters(f => ({ ...f, date_to: e.target.value }))}
              className="h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            {(fuFilters.search || fuFilters.type || fuFilters.date_from || fuFilters.date_to || fuFilters.scope || fuFilters.category) && (
              <button onClick={() => setFuFilters(EMPTY_FU_FILTERS)}
                className="h-10 px-3 flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg border border-red-200">
                <X size={13} /> Clear
              </button>
            )}
          </div>
        )}

        {/* Main filter bar */}
        {view !== 'followups' && (
          <div className="border-b border-gray-100">
            {/* Search row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="relative flex-1 max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search by name or phone..."
                  value={filters.search} onChange={e => handleFilterChange(f => ({ ...f, search: e.target.value }))}
                  className={`${inputClass} pl-9`} />
              </div>
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`inline-flex items-center gap-2 h-10 px-4 rounded-lg border text-sm font-semibold transition-colors ${showFilters || activeFilterCount > 0 ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-400 hover:text-cyan-600'}`}
              >
                <SlidersHorizontal size={15} />
                Filters
                {activeFilterCount > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${showFilters ? 'bg-white text-cyan-600' : 'bg-cyan-600 text-white'}`}>
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters}
                  className="h-10 px-3 flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg border border-red-200">
                  <X size={13} /> Clear filters
                </button>
              )}
            </div>

            {/* Expanded filter panel */}
            {showFilters && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 bg-gray-50 rounded-xl p-4 border border-gray-200">

                  {/* Stage */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">Stage</label>
                    <select value={filters.stage} onChange={e => handleFilterChange(f => ({ ...f, stage: e.target.value, lead_status: '' }))} className={selectClass}>
                      <option value="">All stages</option>
                      {stages.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">Status</label>
                    <select value={filters.lead_status} onChange={e => handleFilterChange(f => ({ ...f, lead_status: e.target.value }))} className={selectClass}>
                      <option value="">All statuses</option>
                      {(filters.stage
                        ? (stageStatuses[filters.stage?.toLowerCase()] || [])
                        : allStatuses
                      ).map(st => <option key={st.id} value={st.name}>{st.name}</option>)}
                    </select>
                  </div>

                  {/* Score */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">Score</label>
                    <select value={filters.score} onChange={e => handleFilterChange(f => ({ ...f, score: e.target.value }))} className={selectClass}>
                      <option value="">All scores</option>
                      <option value="hot">🔥 Hot</option>
                      <option value="warm">🌤 Warm</option>
                      <option value="cold">❄️ Cold</option>
                    </select>
                  </div>

                  {/* Follow-up Health */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">Follow-up Health</label>
                    <select value={filters.followup_health} onChange={e => handleFilterChange(f => ({ ...f, followup_health: e.target.value }))} className={selectClass}>
                      <option value="">All</option>
                      <option value="good">🟢 Good</option>
                      <option value="delayed">🟡 Delayed</option>
                      <option value="missed">🔴 Missed</option>
                      <option value="critical">🚨 Critical</option>
                    </select>
                  </div>

                  {/* Response SLA */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">Response SLA</label>
                    <select value={filters.sla_status} onChange={e => handleFilterChange(f => ({ ...f, sla_status: e.target.value }))} className={selectClass}>
                      <option value="">All</option>
                      <option value="uncontacted">Uncontacted</option>
                      <option value="new">🟢 New</option>
                      <option value="sla_risk">🟡 SLA Risk</option>
                      <option value="sla_breached">🔴 SLA Breached</option>
                      <option value="missed_lead">🚨 Missed Lead</option>
                      <option value="responded_5min">✅ Responded ≤5 min</option>
                    </select>
                  </div>

                  {/* Source */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">Source</label>
                    <select value={filters.source} onChange={e => handleFilterChange(f => ({ ...f, source: e.target.value }))} className={selectClass}>
                      <option value="">All sources</option>
                      <option value="meta_ads">Meta Ads</option>
                      <option value="google_ads">Google Ads</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="referral">Referral</option>
                      <option value="manual">Manual</option>
                      <option value="website">Website</option>
                      <option value="walkin">Walk-in</option>
                    </select>
                  </div>

                  {/* Assigned To */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">Assigned To</label>
                    <select value={filters.assigned_to} onChange={e => handleFilterChange(f => ({ ...f, assigned_to: e.target.value }))} className={selectClass}>
                      <option value="">All staff</option>
                      <option value="unassigned">Unassigned</option>
                      {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  {/* Lead Date Range */}
                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">Date</label>
                    <select value={filters.date_field || 'lead_date'} onChange={e => handleFilterChange(f => ({ ...f, date_field: e.target.value }))}
                      className="mb-1 h-9 w-full appearance-none bg-white border border-gray-200 rounded-lg px-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                      <option value="lead_date">Lead date</option>
                      <option value="created_at">Created date</option>
                    </select>
                    <div className="flex items-center gap-1.5">
                      <input type="date" value={filters.date_from}
                        onChange={e => handleFilterChange(f => ({ ...f, date_from: e.target.value }))}
                        className="h-10 flex-1 bg-white border border-gray-200 rounded-lg px-2 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-w-0" />
                      <span className="text-gray-400 text-xs shrink-0">–</span>
                      <input type="date" value={filters.date_to}
                        onChange={e => handleFilterChange(f => ({ ...f, date_to: e.target.value }))}
                        className="h-10 flex-1 bg-white border border-gray-200 rounded-lg px-2 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-w-0" />
                    </div>
                  </div>

                </div>

                {/* Active filter chips */}
                {activeFilterCount > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {filters.stage && (
                      <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                        Stage: {filters.stage}
                        <button onClick={() => handleFilterChange(f => ({ ...f, stage: '' }))}><X size={11} /></button>
                      </span>
                    )}
                    {filters.score && (
                      <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                        Score: {filters.score}
                        <button onClick={() => handleFilterChange(f => ({ ...f, score: '' }))}><X size={11} /></button>
                      </span>
                    )}
                    {filters.followup_health && (
                      <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                        Follow-up: {FOLLOWUP_HEALTH_STYLES[filters.followup_health]?.label || filters.followup_health}
                        <button onClick={() => handleFilterChange(f => ({ ...f, followup_health: '' }))}><X size={11} /></button>
                      </span>
                    )}
                    {filters.sla_status && (
                      <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                        Response SLA: {SLA_STATUS_LABELS[filters.sla_status] || filters.sla_status}
                        <button onClick={() => handleFilterChange(f => ({ ...f, sla_status: '' }))}><X size={11} /></button>
                      </span>
                    )}
                    {filters.source && (
                      <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                        Source: {filters.source.replace(/_/g, ' ')}
                        <button onClick={() => handleFilterChange(f => ({ ...f, source: '' }))}><X size={11} /></button>
                      </span>
                    )}
                    {filters.assigned_to && (
                      <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                        Assigned: {filters.assigned_to === 'unassigned' ? 'Unassigned' : (staff.find(s => s.id === filters.assigned_to)?.name || filters.assigned_to)}
                        <button onClick={() => handleFilterChange(f => ({ ...f, assigned_to: '' }))}><X size={11} /></button>
                      </span>
                    )}
                    {(filters.date_from || filters.date_to) && (
                      <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {filters.date_field === 'created_at' ? 'Created' : 'Lead'} date: {filters.date_from || '…'} – {filters.date_to || '…'}
                        <button onClick={() => handleFilterChange(f => ({ ...f, date_field: '', date_from: '', date_to: '' }))}><X size={11} /></button>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {view === 'list' ? (
          <div className="overflow-hidden px-5 pb-5 relative">
            {loading && leads.length > 0 && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-start justify-center pt-10 transition-opacity">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-cyan-500 rounded-full animate-spin" />
              </div>
            )}
            {loading && leads.length === 0 ? (
              <div className="flex items-center justify-center h-48 gap-3 text-gray-400">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-cyan-500 rounded-full animate-spin" />
                <span className="text-sm font-medium">Loading leads…</span>
              </div>
            ) : leads.length === 0 ? (
              <div className="border-t border-gray-200 p-12 text-center text-gray-400">
                <p>No leads found. {activeFilterCount > 0 ? 'Try adjusting your filters.' : 'Add your first lead to get started!'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Bulk action toolbar */}
                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-3 px-3 py-2.5 mb-2 bg-cyan-50 border border-cyan-200 rounded-xl flex-wrap">
                    <span className="text-sm font-bold text-cyan-700">{selectedIds.size} selected</span>
                    <div className="flex items-center gap-1.5">
                      <GitBranch size={14} className="text-gray-500" />
                      <select
                        value={bulkStage}
                        onChange={e => { setBulkStage(e.target.value); handleBulkStage(e.target.value); }}
                        disabled={bulkLoading}
                        className="h-8 border border-gray-200 rounded-lg px-2 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50">
                        <option value="">Change Stage…</option>
                        {stages.map(s => <option key={s.id} value={s.name.toLowerCase()}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserCheck size={14} className="text-gray-500" />
                      <select
                        value={bulkAssign}
                        onChange={e => { setBulkAssign(e.target.value); handleBulkAssign(e.target.value); }}
                        disabled={bulkLoading}
                        className="h-8 border border-gray-200 rounded-lg px-2 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50">
                        <option value="">Assign To…</option>
                        <option value="">Unassign</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={handleBulkDelete}
                      disabled={bulkLoading}
                      className="flex items-center gap-1.5 h-8 px-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50">
                      <Trash2 size={13} /> Delete
                    </button>
                    <button onClick={clearSelection} className="ml-auto text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                      <X size={13} /> Clear
                    </button>
                  </div>
                )}

                <table className="w-full text-sm">
                  <thead className="border-y border-gray-200 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-3 w-8">
                        <button onClick={toggleSelectAll} className="text-gray-400 hover:text-cyan-600">
                          {selectedIds.size === leads.length && leads.length > 0
                            ? <CheckSquare size={16} className="text-cyan-600" />
                            : <Square size={16} />}
                        </button>
                      </th>
                      <SortTh sortKey="name" label="Name" sortState={sortState} onSort={handleSort} />
                      <SortTh sortKey="date" label="Date" sortState={sortState} onSort={handleSort} />
                      <SortTh sortKey="phone" label="Phone Number" sortState={sortState} onSort={handleSort} />
                      <SortTh sortKey="source" label="Source" sortState={sortState} onSort={handleSort} />
                      <SortTh sortKey="score" label="Score" sortState={sortState} onSort={handleSort} />
                      <SortTh sortKey="stage" label="Stage" sortState={sortState} onSort={handleSort} />
                      <SortTh sortKey="status" label="Status" sortState={sortState} onSort={handleSort} />
                      <SortTh sortKey="assigned_to" label="Assigned To" sortState={sortState} onSort={handleSort} />
                      <th className="text-right px-3 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(l => (
                      <tr key={l.id} className={`border-b border-gray-200 hover:bg-gray-50 ${selectedIds.has(l.id) ? 'bg-cyan-50/50' : ''}`}>
                        <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                          <button onClick={() => toggleSelect(l.id)} className="text-gray-400 hover:text-cyan-600">
                            {selectedIds.has(l.id)
                              ? <CheckSquare size={16} className="text-cyan-600" />
                              : <Square size={16} />}
                          </button>
                        </td>
                        <td className="px-3 py-3 font-extrabold cursor-pointer" onClick={() => setOpenLeadId(l.id)}>{l.name}</td>
                        <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {l.created_at ? new Date(l.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                        </td>
                        <td className="px-3 py-3 text-gray-700">{l.phone}</td>
                        <td className="px-3 py-3 text-gray-600 capitalize">{l.source?.replace(/_/g, ' ')}</td>
                        <td className="px-3 py-3">
                          {l.lead_score ? (
                            <span
                              title={l.score_reason || ''}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${scoreColors[l.lead_score] || 'bg-gray-100 text-gray-600'}`}>
                              {(() => { const Icon = scoreIcons[l.lead_score]; return Icon ? <Icon size={10} /> : null; })()}
                              {l.lead_score.toUpperCase()}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">N/A</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {editingStageId === l.id ? (
                            <select
                              autoFocus
                              defaultValue={(l.stage || '').toLowerCase()}
                              onBlur={() => setEditingStageId(null)}
                              onChange={e => handleStageChange(l.id, e.target.value)}
                              className="border border-cyan-400 rounded px-2 py-1 text-xs font-medium bg-white text-left focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                        <td className="px-3 py-3">
                          {editingStatusId === l.id ? (
                            <select
                              autoFocus
                              defaultValue={l.lead_status || ''}
                              onBlur={() => setEditingStatusId(null)}
                              onChange={e => handleStatusChange(l.id, e.target.value)}
                              className="border border-indigo-400 rounded px-2 py-1 text-xs bg-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">— No status —</option>
                              {(stageStatuses[l.stage?.toLowerCase()] || allStatuses).map(st => (
                                <option key={st.id} value={st.name}>{st.name}</option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => setEditingStatusId(l.id)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                              title="Click to change status"
                            >
                              {l.lead_status || <span className="text-gray-300">—</span>}
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs">
                          {editingAssignId === l.id ? (
                            <select
                              autoFocus
                              defaultValue={l.assigned_to || ''}
                              onBlur={() => setEditingAssignId(null)}
                              onChange={e => handleAssignChange(l.id, e.target.value)}
                              className="border border-cyan-400 rounded px-2 py-1 text-xs bg-white text-left focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                              <option value="">Unassigned</option>
                              {staff.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => setEditingAssignId(l.id)}
                              className="inline-flex items-center gap-1 text-gray-500 hover:text-cyan-700 hover:underline cursor-pointer"
                              title="Click to reassign"
                            >
                              <User size={12} className="text-gray-400" />
                              {l.assigned_to_name || <span className="text-gray-300">—</span>}
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <a href={`tel:${l.phone}`} onClick={() => leadAPI.logCall(l.id).catch(() => {})} className="p-1.5 hover:bg-blue-50 rounded text-blue-500" title="Call"><Phone size={14} /></a>
                            <a href={`https://wa.me/${l.phone}`} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-green-50 rounded text-green-500" title="WhatsApp"><MessageCircle size={14} /></a>
                            <button onClick={() => handleAIScore(l.id)} className="p-1.5 hover:bg-purple-50 rounded text-purple-500" title="Recalculate Intent"><Zap size={14} /></button>
                            <button onClick={() => setOpenLeadId(l.id)} className="p-1.5 hover:bg-gray-100 rounded" title="Edit"><Edit2 size={14} /></button>
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
          <div className="overflow-hidden px-5 pb-5 relative">
            {loading && followups.length > 0 && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-start justify-center pt-10 transition-opacity">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-cyan-500 rounded-full animate-spin" />
              </div>
            )}
            {loading && followups.length === 0 ? (
              <div className="flex items-center justify-center h-48 gap-3 text-gray-400">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-cyan-500 rounded-full animate-spin" />
                <span className="text-sm font-medium">Loading follow-ups…</span>
              </div>
            ) : followups.length === 0 ? (
              <div className="border-t border-gray-200 p-12 text-center text-gray-400">
                <Clock size={32} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No pending follow-ups</p>
                <p className="text-sm mt-1">All caught up! Schedule follow-ups from lead detail pages.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <p className="text-xs text-gray-500 mb-3 pt-1">{followups.length} {followupSummary}{followups.length !== 1 ? 's' : ''}</p>
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
                      const health = computeFollowupHealth(f.next_followup_at, f.is_completed);
                      const healthStyle = FOLLOWUP_HEALTH_STYLES[health];
                      return (
                        <tr key={f.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-3 py-3 font-extrabold cursor-pointer" onClick={() => setOpenLeadId(f.lead_id)}>{f.lead_name}</td>
                          <td className="px-3 py-3 text-gray-700">{f.lead_phone}</td>
                          <td className="px-3 py-3 text-gray-600 capitalize">{f.lead_stage}</td>
                          <td className="px-3 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 capitalize">
                              {(f.followup_type || 'call').replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-semibold ${health === 'good' ? 'text-amber-600' : 'text-red-600'}`}>
                                {health !== 'good' ? '⚠ ' : ''}{new Date(f.next_followup_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${healthStyle.cls}`}>
                                {healthStyle.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-gray-500 text-xs max-w-[200px] truncate">{f.notes || '—'}</td>
                          <td className="px-3 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <a href={`tel:${f.lead_phone}`} onClick={() => leadAPI.logCall(f.lead_id).catch(() => {})} className="p-1.5 hover:bg-blue-50 rounded text-blue-500" title="Call"><Phone size={14} /></a>
                              <a href={`https://wa.me/${(f.lead_phone || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-green-50 rounded text-green-500" title="WhatsApp"><MessageCircle size={14} /></a>
                              <button onClick={() => handleCompleteFollowup(f.id)} className="p-1.5 hover:bg-emerald-50 rounded text-emerald-600" title="Mark as done"><CheckCircle size={14} /></button>
                              <button onClick={() => setOpenLeadId(f.lead_id)} className="p-1.5 hover:bg-gray-100 rounded" title="Open lead"><Edit2 size={14} /></button>
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
                        <button key={lead.id} onClick={() => setOpenLeadId(lead.id)}
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
              <input type="text" placeholder="Business Name" value={newLead.business_name} onChange={e => setNewLead({ ...newLead, business_name: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <input type="text" placeholder="City" value={newLead.location} onChange={e => setNewLead({ ...newLead, location: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <textarea placeholder="Address" value={newLead.address} onChange={e => setNewLead({ ...newLead, address: e.target.value })}
                rows={2} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
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

      {/* ── Import CSV/Excel Modal ── */}
      {/* ── Lost Reason Modal ── */}
      {lostReasonModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={closeLostModal} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-gray-900">Why is this lead lost?</h2>
              <button onClick={closeLostModal} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-gray-500">A reason is required to track why deals aren't converting.</p>
              <select value={lostReasonModal.reason}
                onChange={e => setLostReasonModal(m => ({ ...m, reason: e.target.value }))}
                className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300">
                <option value="">— Select a reason —</option>
                <option value="Not interested">Not interested</option>
                <option value="Budget constraint">Budget constraint</option>
                <option value="Chose competitor">Chose competitor</option>
                <option value="Bad timing">Bad timing</option>
                <option value="No response">No response</option>
                <option value="Requirement mismatch">Requirement mismatch</option>
                <option value="Other">Other</option>
              </select>
              {lostReasonModal.reason === 'Other' && (
                <textarea placeholder="Describe the reason…"
                  value={lostReasonModal.customReason}
                  onChange={e => setLostReasonModal(m => ({ ...m, customReason: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={closeLostModal}
                  className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={confirmLostStage}
                  disabled={!lostReasonModal.reason || (lostReasonModal.reason === 'Other' && !lostReasonModal.customReason)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                  Mark as Lost
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {renderedLeadId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
          <div
            className={`fixed inset-0 bg-black/50 transition-opacity duration-200 ${modalEntered ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeLeadModal}
          />
          <div
            className={`relative bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl transition-all duration-200 ${
              modalEntered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <div className="sticky top-0 z-[60] h-0">
              <button
                onClick={closeLeadModal}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-white hover:bg-gray-100 rounded-full shadow border"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <LeadDetailPage
                leadId={renderedLeadId}
                onClose={closeLeadModal}
                onPrev={goPrevLead}
                onNext={goNextLead}
                hasPrev={hasPrev}
                hasNext={hasNext}
              />
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeImport}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-emerald-600" /> Import Leads
              </h2>
              <button onClick={closeImport} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>

            <div className="p-6 space-y-4">
              {/* Result state */}
              {importResult ? (
                <div className="space-y-4">
                  {importResult.error ? (
                    <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{importResult.error}</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-emerald-800">{importResult.message}</p>
                          <div className="flex gap-4 mt-1 text-sm text-emerald-700">
                            <span>✅ {importResult.inserted} added</span>
                            <span>⏭️ {importResult.skipped} skipped</span>
                          </div>
                        </div>
                      </div>
                      {importResult.errors?.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <p className="text-xs font-semibold text-amber-700 mb-2">Row errors (first 20):</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {importResult.errors.map((e, i) => (
                              <p key={i} className="text-xs text-amber-700">Row {e.row}: {e.name} — {e.error}</p>
                            ))}
                          </div>
                        </div>
                      )}
                      {importResult.skip_reasons?.length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Skipped rows (first 20):</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {importResult.skip_reasons.map((s, i) => (
                              <p key={i} className="text-xs text-gray-600">Row {s.row}: {s.name || 'Untitled'} — {s.reason}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => { setImportResult(null); setImportFile(null); setImportPreview(null); }}
                      className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50">Import Another</button>
                    <button onClick={closeImport}
                      className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700">Done</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Template download */}
                  <button onClick={downloadTemplate}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                    <Download size={14} /> Download CSV Template
                  </button>

                  {/* Drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setImportDragOver(true); }}
                    onDragLeave={() => setImportDragOver(false)}
                    onDrop={e => { e.preventDefault(); setImportDragOver(false); handleImportFile(e.dataTransfer.files[0]); }}
                    onClick={() => document.getElementById('csv-file-input').click()}
                    className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${importDragOver ? 'border-brand-400 bg-brand-50' : importFile ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input id="csv-file-input" type="file" accept=".csv,.xlsx,.xls" className="hidden"
                      onChange={e => handleImportFile(e.target.files[0])} />
                    {importFile ? (
                      <>
                        <FileSpreadsheet size={28} className="mx-auto text-emerald-500 mb-2" />
                        <p className="font-semibold text-emerald-700 text-sm">{importFile.name}</p>
                        <p className="text-xs text-emerald-600 mt-0.5">{(importFile.size / 1024).toFixed(1)} KB · Click to change</p>
                      </>
                    ) : (
                      <>
                        <Upload size={28} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm font-medium text-gray-500">Drop your CSV or Excel file here</p>
                        <p className="text-xs text-gray-400 mt-1">or click to browse · Max 5 MB · 2000 rows</p>
                      </>
                    )}
                  </div>

                  {/* CSV Preview */}
                  {importPreview && (
                    <div className="rounded-xl border overflow-hidden">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-3 py-2 bg-gray-50 border-b">
                        Preview (first 3 rows)
                      </p>
                      <div className="overflow-x-auto">
                        <table className="text-xs w-full">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              {importPreview.headers.map((h, i) => (
                                <th key={i} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {importPreview.rows.map((row, i) => (
                              <tr key={i} className="border-b last:border-0">
                                {row.map((cell, j) => (
                                  <td key={j} className="px-3 py-2 text-gray-600 whitespace-nowrap max-w-[120px] truncate">{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-gray-400">
                    Columns detected automatically. Required: <strong>Name</strong>. Also supports: Phone, Email, Source, Stage, Notes, Quoted Price, City.
                  </p>

                  <div className="flex gap-2">
                    <button onClick={closeImport} className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                    <button onClick={handleImport} disabled={!importFile || importing}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                      {importing
                        ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Importing...</>
                        : <><Upload size={15} /> Import Leads</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;
