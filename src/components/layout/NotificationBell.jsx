import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Calendar, Zap, Info, Video, AlertTriangle, UserCog } from 'lucide-react';
import { notificationsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const typeIcon = (type) => {
  if (type === 'demo_due')    return <Video    size={14} className="text-violet-500" />;
  if (type === 'followup_due') return <Calendar size={14} className="text-amber-500" />;
  if (type === 'ai_score')    return <Zap      size={14} className="text-purple-500" />;
  if (type === 'sla_risk')      return <AlertTriangle size={14} className="text-amber-500" />;
  if (type === 'sla_escalated') return <AlertTriangle size={14} className="text-red-500" />;
  if (type === 'sla_missed')    return <AlertTriangle size={14} className="text-red-700" />;
  if (type === 'sla_reassigned' || type === 'sla_reassigned_away') return <UserCog size={14} className="text-cyan-500" />;
  return <Info size={14} className="text-blue-500" />;
};

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef();
  const navigate = useNavigate();

  const fetchCount = async () => {
    try {
      const { data } = await notificationsAPI.getCount();
      setUnread(data.count || 0);
    } catch { }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data } = await notificationsAPI.getAll();
      setNotifications(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch { }
    finally { setLoading(false); }
  };

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open) fetchAll();
  };

  const handleMarkRead = async (n) => {
    if (!n.is_read) {
      await notificationsAPI.markRead(n.id).catch(() => {});
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      setUnread(c => Math.max(0, c - 1));
    }
    if (n.reference_type === 'lead' && n.reference_id) {
      setOpen(false);
      navigate(`/leads/${n.reference_id}`);
    }
  };

  const handleMarkAll = async () => {
    await notificationsAPI.markAllRead().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen} className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
        <Bell size={20} className="text-gray-600" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unread > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-center text-sm text-gray-400 py-8">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">No notifications yet</p>
            ) : (
              notifications.map(n => (
                <button key={n.id} onClick={() => handleMarkRead(n)}
                  className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors border-b last:border-0 ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                  <div className="mt-0.5 shrink-0">{typeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>{n.title}</p>
                    {n.message && <p className="text-xs text-gray-500 truncate">{n.message}</p>}
                    <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
