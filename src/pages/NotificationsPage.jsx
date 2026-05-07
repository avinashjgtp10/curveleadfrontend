import { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import { Bell, CheckCircle, Users, IndianRupee, Clock, AlertCircle, Check } from 'lucide-react';

const typeIcons = {
  info: { icon: Bell, color: 'text-blue-500 bg-blue-50' },
  lead_new: { icon: Users, color: 'text-green-500 bg-green-50' },
  payment: { icon: IndianRupee, color: 'text-emerald-500 bg-emerald-50' },
  reminder: { icon: Clock, color: 'text-amber-500 bg-amber-50' },
  alert: { icon: AlertCircle, color: 'text-red-500 bg-red-50' },
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    try { const { data } = await notificationAPI.getAll(); setNotifications(data.notifications); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleMarkRead = async (id) => {
    try { await notificationAPI.markAsRead(id); loadNotifications(); }
    catch (e) { console.error(e); }
  };

  const handleMarkAllRead = async () => {
    try { await notificationAPI.markAllAsRead(); loadNotifications(); }
    catch (e) { console.error(e); }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{unreadCount} unread</p>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="text-sm text-brand-600 font-medium hover:text-brand-700">
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const typeInfo = typeIcons[n.type] || typeIcons.info;
            const Icon = typeInfo.icon;
            return (
              <div key={n.id}
                className={`bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3 transition ${!n.is_read ? 'border-l-4 border-l-brand-500' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${typeInfo.color}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                  {n.message && <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                {!n.is_read && (
                  <button onClick={() => handleMarkRead(n.id)} className="p-1.5 hover:bg-green-50 rounded text-gray-400 hover:text-green-500 shrink-0" title="Mark as read">
                    <Check size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
