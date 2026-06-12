import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { followupAPI } from '../services/api';
import { Clock, CheckCircle, Calendar, Phone, MessageCircle, Navigation, ChevronLeft, ChevronRight } from 'lucide-react';

const typeIcon = { call: Phone, whatsapp: MessageCircle, visit: Navigation };
const typeColor = {
  call: 'bg-blue-100 text-blue-600',
  whatsapp: 'bg-green-100 text-green-600',
  visit: 'bg-purple-100 text-purple-600',
};

const LIMIT = 15;

const FollowupsPage = () => {
  const navigate = useNavigate();
  const [followups, setFollowups] = useState([]);
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => { setPage(1); }, [tab]);
  useEffect(() => { loadData(); }, [tab, page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await followupAPI.getAll({ status: tab, page, limit: LIMIT });
      setFollowups(data.followups || []);
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleComplete = async (id) => {
    try {
      await followupAPI.complete(id, { outcome: 'Completed' });
      loadData();
    } catch (e) { alert('Failed'); }
  };

  const isOverdue = (date) => new Date(date) < new Date();

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {['pending', 'overdue', 'completed'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize ${tab === t ? 'bg-white shadow' : 'text-gray-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
      ) : followups.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <Clock size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No {tab} follow-ups</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border divide-y">
            {followups.map(f => {
              const TypeIcon = typeIcon[f.followup_type] || Clock;
              const iconClass = typeColor[f.followup_type] || 'bg-amber-100 text-amber-600';
              const overdue = !f.is_completed && isOverdue(f.next_followup_at);
              return (
                <div key={f.id} className="p-4 flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    f.is_completed ? 'bg-green-100 text-green-600' :
                    overdue ? 'bg-red-100 text-red-600' : iconClass
                  }`}>
                    {f.is_completed ? <CheckCircle size={18} /> : <TypeIcon size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/leads/${f.lead_id}`)} className="font-medium text-sm hover:text-brand-600 text-left">
                        {f.lead_name}
                      </button>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                        overdue ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {overdue ? 'Overdue' : f.followup_type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{f.lead_phone}</p>
                    {f.notes && <p className="text-sm mt-1 text-gray-700">{f.notes}</p>}
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(f.next_followup_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!f.is_completed && (
                    <button onClick={() => handleComplete(f.id)}
                      className="shrink-0 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100">
                      Mark Done
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-gray-500">
                {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                  className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.pages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) => p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-xs text-gray-400">…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium border ${page === p ? 'bg-brand-600 text-white border-brand-600' : 'hover:bg-gray-50'}`}>
                      {p}
                    </button>
                  ))
                }
                <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages}
                  className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FollowupsPage;
