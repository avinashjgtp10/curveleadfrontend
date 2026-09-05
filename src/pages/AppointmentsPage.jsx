import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { followupAPI, leadAPI, staffAPI } from '../services/api';
import { Video, Phone, MessageCircle, Users2, Calendar, Clock, AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Plus, ChevronDown, Search, SlidersHorizontal, MoreVertical, Eye, CalendarClock, CheckCircle, XCircle, X } from 'lucide-react';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import { AVATAR_COLORS, EMPTY_APPT_FILTERS, EMPTY_NEW_APPOINTMENT_FORM } from '../utils/constants';

const TYPE_META = {
  call:     { label: 'Follow-up',    Icon: Phone,         color: 'text-amber-500' },
  whatsapp: { label: 'WhatsApp',     Icon: MessageCircle, color: 'text-green-500' },
  visit:    { label: 'Consultation', Icon: Users2,        color: 'text-emerald-500' },
  demo:     { label: 'Product Demo', Icon: Video,         color: 'text-violet-500' },
};

const STATUS_META = {
  upcoming: { label: 'Upcoming',  cls: 'bg-green-50 text-green-700' },
  overdue:  { label: 'Overdue',   cls: 'bg-red-50 text-red-600' },
  completed:{ label: 'Completed', cls: 'bg-blue-50 text-blue-600' },
};

const TABS = [
  { id: 'all', label: 'All Appointments' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'today', label: 'Today' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'completed', label: 'Completed' },
];

const avatarColor = (name) => AVATAR_COLORS[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
const initials = (name) => (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';

const localDay = (dt) => { const d = new Date(dt); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const todayISO = () => localDay(new Date());

const getStatus = (a) => {
  if (a.is_completed) return 'completed';
  if (new Date(a.next_followup_at) < new Date()) return 'overdue';
  return 'upcoming';
};

const PAGE_LIMIT = 5;

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirmDialog();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [tab, setTab] = useState(new URLSearchParams(location.search).get('scope') === 'today' ? 'today' : 'all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [rescheduleId, setRescheduleId] = useState(null);
  const [rescheduleAt, setRescheduleAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [showAllMenuOpen, setShowAllMenuOpen] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [apptFilters, setApptFilters] = useState(EMPTY_APPT_FILTERS);
  const [filterStaff, setFilterStaff] = useState([]);

  const [newModal, setNewModal] = useState(false);
  const [leadOptions, setLeadOptions] = useState([]);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadSearchLoading, setLeadSearchLoading] = useState(false);
  const [newForm, setNewForm] = useState(EMPTY_NEW_APPOINTMENT_FORM);
  const [newErrors, setNewErrors] = useState({});

  useEffect(() => { load(); }, []);

  useEffect(() => {
    staffAPI.getAll().then(({ data }) => setFilterStaff(data.staff || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const closeMenu = () => { setOpenMenuId(null); setShowAllMenuOpen(false); };
    const handler = (e) => {
      if (!e.target.closest('[data-actions-menu]')) setOpenMenuId(null);
      if (!e.target.closest('[data-show-all-menu]')) setShowAllMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('resize', closeMenu);
    };
  }, []);

  useEffect(() => {
    if (!newModal) return;
    const t = setTimeout(async () => {
      setLeadSearchLoading(true);
      try {
        const { data } = await leadAPI.getAll({ search: leadSearch, limit: 8 });
        setLeadOptions(data.leads || []);
      } catch (e) { console.error(e); }
      finally { setLeadSearchLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [leadSearch, newModal]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await followupAPI.getAll({ status: 'all', page: 1, limit: 500 });
      setAppointments(data.followups || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openNewModal = () => {
    setNewForm(EMPTY_NEW_APPOINTMENT_FORM);
    setLeadSearch('');
    setLeadOptions([]);
    setNewErrors({});
    setNewModal(true);
  };

  const handleCreateAppointment = async () => {
    const errors = {};
    if (!newForm.lead_id) errors.lead_id = 'Select a lead';
    if (!newForm.next_followup_at) errors.next_followup_at = 'Pick a date and time';
    setNewErrors(errors);
    if (Object.keys(errors).length) return;
    setSaving(true);
    try {
      await leadAPI.addFollowup(newForm.lead_id, {
        next_followup_at: new Date(newForm.next_followup_at).toISOString(),
        followup_type: newForm.followup_type,
        reminder_minutes: newForm.reminder_minutes === 'none' ? null : Number(newForm.reminder_minutes),
        notes: newForm.notes.trim() || null,
      });
      setNewModal(false);
      load();
    } catch (e) { alert(e.response?.data?.error || 'Failed to create appointment'); }
    finally { setSaving(false); }
  };

  const handleComplete = async (id) => {
    setBusyId(id);
    try { await followupAPI.complete(id, { outcome: 'Completed' }); load(); }
    catch (e) { alert('Failed to mark done'); }
    finally { setBusyId(null); setOpenMenuId(null); }
  };

  const handleCancel = async (id) => {
    if (!await confirm({ title: 'Cancel this appointment?', confirmText: 'Cancel Appointment' })) return;
    setBusyId(id);
    try { await followupAPI.delete(id); load(); }
    catch (e) { alert('Failed to cancel'); }
    finally { setBusyId(null); setOpenMenuId(null); }
  };

  const openReschedule = (a) => {
    setOpenMenuId(null);
    const d = new Date(a.next_followup_at);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setRescheduleAt(d.toISOString().slice(0, 16));
    setRescheduleId(a.id);
  };

  const handleReschedule = async () => {
    if (!rescheduleAt) return;
    setSaving(true);
    try {
      await followupAPI.update(rescheduleId, { next_followup_at: new Date(rescheduleAt).toISOString() });
      setRescheduleId(null);
      load();
    } catch (e) { alert('Failed to reschedule'); }
    finally { setSaving(false); }
  };

  const toggleMenu = (id, e) => {
    if (openMenuId === id) { setOpenMenuId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 190, menuHeight = 160;
    const openUpward = rect.bottom + menuHeight > window.innerHeight;
    setMenuPos({
      top: openUpward ? rect.top - menuHeight - 4 : rect.bottom + 4,
      left: Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
    });
    setOpenMenuId(id);
  };

  const upcomingCount = appointments.filter(a => getStatus(a) === 'upcoming').length;
  const todayCount = appointments.filter(a => !a.is_completed && localDay(a.next_followup_at) === todayISO()).length;
  const overdueCount = appointments.filter(a => getStatus(a) === 'overdue').length;

  const searchLower = search.trim().toLowerCase();
  const filtered = appointments
    .filter(a => {
      if (tab === 'upcoming') return getStatus(a) === 'upcoming';
      if (tab === 'today') return !a.is_completed && localDay(a.next_followup_at) === todayISO();
      if (tab === 'overdue') return getStatus(a) === 'overdue';
      if (tab === 'completed') return a.is_completed;
      return true;
    })
    .filter(a => (hideCompleted ? !a.is_completed : true))
    .filter(a => (apptFilters.type ? a.followup_type === apptFilters.type : true))
    .filter(a => (apptFilters.assigned_to ? a.assigned_to_name === apptFilters.assigned_to : true))
    .filter(a => (apptFilters.date_from ? localDay(a.next_followup_at) >= apptFilters.date_from : true))
    .filter(a => (apptFilters.date_to ? localDay(a.next_followup_at) <= apptFilters.date_to : true))
    .filter(a => {
      if (!searchLower) return true;
      const hay = `${a.lead_name || ''} ${TYPE_META[a.followup_type]?.label || ''} ${a.assigned_to_name || ''}`.toLowerCase();
      return hay.includes(searchLower);
    })
    .sort((a, b) => new Date(b.next_followup_at) - new Date(a.next_followup_at));

  const activeFilterCount = Object.values(apptFilters).filter(Boolean).length;

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_LIMIT));
  const pageRows = filtered.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500 mt-0.5">All scheduled sales appointments</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2.5 border rounded-lg hover:bg-gray-50 text-gray-500" title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button onClick={openNewModal}
            className="px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 flex items-center gap-1.5">
            <Plus size={16} /> New Appointment
          </button>
          <div className="relative" data-show-all-menu>
            <button onClick={() => setShowAllMenuOpen(v => !v)}
              className="px-3 py-2.5 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
              {hideCompleted ? 'Hide Completed' : 'Show All'} <ChevronDown size={14} />
            </button>
            {showAllMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border rounded-lg shadow-lg z-30 py-1 text-left">
                <button onClick={() => { setHideCompleted(false); setTab('all'); setSearch(''); setPage(1); setShowAllMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${!hideCompleted ? 'text-brand-600 font-medium' : 'text-gray-700'}`}>
                  Show All
                </button>
                <button onClick={() => { setHideCompleted(true); setPage(1); setShowAllMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${hideCompleted ? 'text-brand-600 font-medium' : 'text-gray-700'}`}>
                  Hide Completed
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
            <Calendar size={18} className="text-violet-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-violet-500 uppercase tracking-wide">Upcoming</p>
            <p className="text-2xl font-bold text-violet-700 leading-tight">{upcomingCount}</p>
            <p className="text-xs text-gray-500">appointments</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Clock size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-wide">Today</p>
            <p className="text-2xl font-bold text-amber-700 leading-tight">{todayCount}</p>
            <p className="text-xs text-gray-500">scheduled</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertCircle size={18} className="text-red-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-red-500 uppercase tracking-wide">Overdue</p>
            <p className="text-2xl font-bold text-red-700 leading-tight">{overdueCount}</p>
            <p className="text-xs text-gray-500">need follow-up</p>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-3 px-4 pt-4">
          <div className="flex gap-1 flex-wrap">
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setPage(1); }}
                className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by lead, type or sales person..."
                className="pl-8 pr-3 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            <button onClick={() => setShowFilters(v => !v)}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                showFilters || activeFilterCount > 0 ? 'bg-brand-600 text-white border border-brand-600' : 'border text-gray-600 hover:bg-gray-50'
              }`}>
              <SlidersHorizontal size={14} /> Filters
              {activeFilterCount > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${showFilters ? 'bg-white text-brand-600' : 'bg-brand-600 text-white'}`}>
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown size={13} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            {activeFilterCount > 0 && (
              <button onClick={() => { setApptFilters(EMPTY_APPT_FILTERS); setPage(1); }}
                className="px-2.5 py-2 flex items-center gap-1 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg border border-red-200">
                <X size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="px-4 pt-3 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-gray-50 rounded-xl p-4 border">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">Type</label>
                <select value={apptFilters.type} onChange={e => { setApptFilters(f => ({ ...f, type: e.target.value })); setPage(1); }}
                  className="w-full px-2.5 py-2 border rounded-lg text-sm bg-white">
                  <option value="">All types</option>
                  {Object.entries(TYPE_META).map(([key, m]) => <option key={key} value={key}>{m.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">Sales Person</label>
                <select value={apptFilters.assigned_to} onChange={e => { setApptFilters(f => ({ ...f, assigned_to: e.target.value })); setPage(1); }}
                  className="w-full px-2.5 py-2 border rounded-lg text-sm bg-white">
                  <option value="">All sales people</option>
                  {filterStaff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">From Date</label>
                <input type="date" value={apptFilters.date_from}
                  onChange={e => { setApptFilters(f => ({ ...f, date_from: e.target.value })); setPage(1); }}
                  className="w-full px-2.5 py-2 border rounded-lg text-sm bg-white" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-gray-400 tracking-wide">To Date</label>
                <input type="date" value={apptFilters.date_to}
                  onChange={e => { setApptFilters(f => ({ ...f, date_to: e.target.value })); setPage(1); }}
                  className="w-full px-2.5 py-2 border rounded-lg text-sm bg-white" />
              </div>
            </div>
          </div>
        )}

        <div className="border-b mt-3" />

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
        ) : pageRows.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No appointments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3">Lead / Customer</th>
                  <th className="px-4 py-3">Appointment</th>
                  <th className="px-4 py-3">Sales Person</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pageRows.map(a => {
                  const type = TYPE_META[a.followup_type] || TYPE_META.call;
                  const status = STATUS_META[getStatus(a)];
                  return (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(a.lead_name)}`}>
                            {initials(a.lead_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{a.lead_name || 'Unknown'}</p>
                            {a.lead_phone && <p className="text-xs text-gray-400 truncate">{a.lead_phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <type.Icon size={16} className={type.color} />
                          <span className="font-medium text-gray-700">{type.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {a.assigned_to_name ? (
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${avatarColor(a.assigned_to_name)}`}>
                              {initials(a.assigned_to_name)}
                            </div>
                            <span className="text-gray-700">{a.assigned_to_name}</span>
                          </div>
                        ) : <span className="text-gray-300">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Calendar size={12} className="text-gray-400" />
                          {new Date(a.next_followup_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                          <Clock size={11} />
                          {new Date(a.next_followup_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.cls}`}>{status.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right" data-actions-menu>
                        <button onClick={(e) => toggleMenu(a.id, e)} disabled={busyId === a.id}
                          className="p-2 border rounded-lg hover:bg-gray-50 text-gray-500 disabled:opacity-50">
                          <MoreVertical size={15} />
                        </button>
                        {openMenuId === a.id && createPortal(
                          <div data-actions-menu style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, width: 190 }}
                            className="bg-white border rounded-lg shadow-lg z-50 py-1 text-left">
                            <button onClick={() => { setOpenMenuId(null); navigate(`/leads/${a.lead_id}`); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 text-gray-700">
                              <Eye size={13} /> View Details
                            </button>
                            {!a.is_completed && (
                              <button onClick={() => openReschedule(a)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 text-gray-700">
                                <CalendarClock size={13} /> Reschedule
                              </button>
                            )}
                            {!a.is_completed && (
                              <button onClick={() => handleComplete(a.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 text-green-600">
                                <CheckCircle size={13} /> Mark Completed
                              </button>
                            )}
                            {!a.is_completed && (
                              <button onClick={() => handleCancel(a.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-50 text-red-500">
                                <XCircle size={13} /> Cancel Appointment
                              </button>
                            )}
                          </div>,
                          document.body
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span>Showing {(page - 1) * PAGE_LIMIT + 1} to {Math.min(page * PAGE_LIMIT, filtered.length)} of {filtered.length} appointments</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg border text-sm font-medium ${p === page ? 'border-brand-600 text-brand-600' : 'hover:bg-gray-50 text-gray-600'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {rescheduleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setRescheduleId(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5">
            <h3 className="font-bold text-base mb-3">Reschedule Appointment</h3>
            <label className="block text-xs text-gray-500 mb-1">New Date & Time</label>
            <input type="datetime-local" value={rescheduleAt} onChange={e => setRescheduleAt(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm" />
            <div className="flex gap-2 pt-4">
              <button onClick={() => setRescheduleId(null)} className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={handleReschedule} disabled={saving}
                className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {newModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setNewModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 max-h-[85vh] overflow-y-auto">
            <h3 className="font-bold text-base mb-4">New Appointment</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Lead <span className="text-red-500">*</span></label>
                {newForm.lead_id ? (
                  <div className="flex items-center justify-between px-3 py-2.5 border rounded-lg text-sm bg-gray-50">
                    <span className="font-medium">{newForm.lead_name}</span>
                    <button onClick={() => setNewForm(f => ({ ...f, lead_id: '', lead_name: '' }))} className="text-xs text-gray-400 hover:text-gray-600">Change</button>
                  </div>
                ) : (
                  <div className="relative">
                    <input value={leadSearch}
                      onChange={e => { setLeadSearch(e.target.value); if (newErrors.lead_id) setNewErrors(er => ({ ...er, lead_id: undefined })); }}
                      placeholder="Search leads by name or phone..."
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm ${newErrors.lead_id ? 'border-red-500' : ''}`} />
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {leadSearchLoading ? (
                        <p className="px-3 py-2 text-xs text-gray-400">Searching...</p>
                      ) : leadOptions.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-gray-400">No leads found</p>
                      ) : leadOptions.map(l => (
                        <button key={l.id} type="button"
                          onClick={() => { setNewForm(f => ({ ...f, lead_id: l.id, lead_name: l.name })); setLeadSearch(''); setNewErrors(er => ({ ...er, lead_id: undefined })); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{l.name}</span>
                          <span className="text-xs text-gray-400 shrink-0">{l.phone}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {newErrors.lead_id && <p className="text-xs text-red-500 mt-1">{newErrors.lead_id}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date & Time <span className="text-red-500">*</span></label>
                <input type="datetime-local" value={newForm.next_followup_at}
                  onChange={e => { setNewForm(f => ({ ...f, next_followup_at: e.target.value })); if (newErrors.next_followup_at) setNewErrors(er => ({ ...er, next_followup_at: undefined })); }}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm ${newErrors.next_followup_at ? 'border-red-500' : ''}`} />
                {newErrors.next_followup_at && <p className="text-xs text-red-500 mt-1">{newErrors.next_followup_at}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                <div className="flex gap-2">
                  {['call', 'whatsapp', 'visit', 'demo'].map(t => (
                    <button key={t} type="button" onClick={() => setNewForm(f => ({ ...f, followup_type: t }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${newForm.followup_type === t ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                      {TYPE_META[t].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Reminder</label>
                <select value={newForm.reminder_minutes} onChange={e => setNewForm(f => ({ ...f, reminder_minutes: e.target.value }))}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                  <option value="none">No reminder</option>
                  <option value="5">5 minutes before</option>
                  <option value="15">15 minutes before</option>
                  <option value="30">30 minutes before</option>
                  <option value="60">1 hour before</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes (optional)</label>
                <input value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Discuss pricing"
                  className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button onClick={() => setNewModal(false)} className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={handleCreateAppointment} disabled={saving}
                className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60">
                {saving ? 'Saving...' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
