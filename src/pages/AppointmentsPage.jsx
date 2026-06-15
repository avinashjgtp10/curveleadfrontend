import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { followupAPI } from '../services/api';
import { Video, Phone, ArrowRight, CheckCircle, Trash2, Calendar, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

const formatTime = (dt) =>
  new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const formatTimeOnly = (dt) =>
  new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const getDateGroup = (dt) => {
  const now = new Date();
  const d = new Date(dt);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);

  if (d < today) return 'Overdue';
  if (d < tomorrow) return 'Today';
  if (d < new Date(tomorrow.getTime() + 86400000)) return 'Tomorrow';
  if (d < weekEnd) return 'This Week';
  return 'Later';
};

const GROUP_ORDER = ['Overdue', 'Today', 'Tomorrow', 'This Week', 'Later'];

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [completing, setCompleting] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => { load(); }, [showCompleted, page]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { type: 'demo', page, limit: 20 };
      if (showCompleted) params.status = 'all';
      const { data } = await followupAPI.getAll(params);
      setAppointments(data.followups || []);
      setPagination(data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleComplete = async (id) => {
    setCompleting(id);
    try {
      await followupAPI.complete(id, { outcome: 'Demo completed' });
      load();
    } catch (e) { alert('Failed to mark done'); }
    finally { setCompleting(null); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Cancel this demo appointment?')) return;
    setDeleting(id);
    try {
      await followupAPI.delete(id);
      load();
    } catch (e) { alert('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const grouped = appointments.reduce((acc, a) => {
    const group = showCompleted && a.is_completed ? 'Completed' : getDateGroup(a.next_followup_at);
    if (!acc[group]) acc[group] = [];
    acc[group].push(a);
    return acc;
  }, {});

  const orderedGroups = [...GROUP_ORDER, 'Completed'].filter(g => grouped[g]);

  const upcomingCount = appointments.filter(a => !a.is_completed).length;
  const overdueCount = appointments.filter(a => !a.is_completed && new Date(a.next_followup_at) < new Date()).length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Video size={20} className="text-violet-600" /> Appointments
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">All scheduled demo sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => { setShowCompleted(v => !v); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${showCompleted ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            {showCompleted ? 'Hide Completed' : 'Show All'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
          <p className="text-xs text-violet-500 font-medium uppercase tracking-wide">Upcoming</p>
          <p className="text-2xl font-bold text-violet-700 mt-1">{upcomingCount}</p>
        </div>
        <div className={`rounded-xl p-4 border ${overdueCount > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
          <p className={`text-xs font-medium uppercase tracking-wide ${overdueCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>Overdue</p>
          <p className={`text-2xl font-bold mt-1 ${overdueCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{overdueCount}</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video size={28} className="text-violet-400" />
          </div>
          <p className="text-gray-500 font-medium">No demo appointments yet</p>
          <p className="text-sm text-gray-400 mt-1">Schedule a follow-up with type "Demo" from any lead</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orderedGroups.map(group => (
            <div key={group}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  group === 'Overdue'   ? 'bg-red-100 text-red-600' :
                  group === 'Today'     ? 'bg-violet-100 text-violet-700' :
                  group === 'Tomorrow'  ? 'bg-blue-100 text-blue-700' :
                  group === 'Completed' ? 'bg-gray-100 text-gray-500' :
                  'bg-gray-100 text-gray-600'
                }`}>{group}</span>
                <span className="text-xs text-gray-400">{grouped[group].length} demo{grouped[group].length !== 1 ? 's' : ''}</span>
              </div>

              <div className="space-y-2">
                {grouped[group].map(apt => (
                  <div key={apt.id}
                    className={`bg-white border rounded-xl p-4 flex gap-3 items-start transition-opacity ${apt.is_completed ? 'opacity-60' : ''} ${group === 'Overdue' ? 'border-red-200' : group === 'Today' ? 'border-violet-200' : 'border-gray-200'}`}>

                    {/* Time column */}
                    <div className={`shrink-0 w-14 text-center rounded-lg py-2 px-1 ${group === 'Overdue' ? 'bg-red-50' : group === 'Today' ? 'bg-violet-50' : 'bg-gray-50'}`}>
                      <Calendar size={12} className={`mx-auto mb-0.5 ${group === 'Overdue' ? 'text-red-400' : group === 'Today' ? 'text-violet-400' : 'text-gray-400'}`} />
                      <p className={`text-[10px] font-bold leading-tight ${group === 'Overdue' ? 'text-red-600' : group === 'Today' ? 'text-violet-700' : 'text-gray-600'}`}>
                        {formatTimeOnly(apt.next_followup_at)}
                      </p>
                      {group !== 'Today' && group !== 'Overdue' && (
                        <p className="text-[9px] text-gray-400 leading-tight mt-0.5">
                          {new Date(apt.next_followup_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{apt.lead_name}</p>
                          <a href={`tel:${apt.lead_phone}`}
                            className="text-xs text-gray-500 hover:text-brand-600 flex items-center gap-1 mt-0.5"
                            onClick={e => e.stopPropagation()}>
                            <Phone size={11} /> {apt.lead_phone}
                          </a>
                        </div>
                        {apt.lead_stage && (
                          <span className="shrink-0 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">
                            {apt.lead_stage}
                          </span>
                        )}
                      </div>

                      {apt.notes && (
                        <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded-lg px-2 py-1.5 italic">"{apt.notes}"</p>
                      )}

                      {apt.assigned_to_name && (
                        <p className="text-[11px] text-gray-400 mt-1">Assigned to: {apt.assigned_to_name}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex flex-col gap-1.5">
                      <button onClick={() => navigate(`/leads/${apt.lead_id}`)}
                        className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-medium flex items-center gap-1 border">
                        View <ArrowRight size={11} />
                      </button>
                      {!apt.is_completed && (
                        <>
                          <button onClick={() => handleComplete(apt.id)} disabled={completing === apt.id}
                            className="px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-medium flex items-center gap-1 border border-green-200 disabled:opacity-60">
                            <CheckCircle size={11} /> Done
                          </button>
                          <button onClick={() => handleDelete(apt.id)} disabled={deleting === apt.id}
                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium flex items-center gap-1 border border-red-200 disabled:opacity-60">
                            <Trash2 size={11} /> Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
            className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
