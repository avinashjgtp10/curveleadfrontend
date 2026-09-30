import { useEffect, useState } from 'react';
import { X, BellRing, BellOff } from 'lucide-react';
import { authAPI, notificationsAPI } from '../../services/api';
import { useToast } from '../ui/Toast';

// Static fallback in case /notifications/groups can't be reached — keeps the
// modal usable offline-ish rather than blank. Labels/keys must match
// backend/utils/notificationTypes.js.
const FALLBACK_GROUPS = [
  { key: 'new_leads', label: 'New leads', description: 'A new lead came in from any source.' },
  { key: 'new_messages', label: 'New WhatsApp messages', description: 'A lead sends you a new WhatsApp message.' },
  { key: 'assigned_to_me', label: 'Leads assigned to me', description: 'A lead is assigned or reassigned to you.' },
  { key: 'sla_alerts', label: 'Uncontacted lead alerts', description: 'A lead has gone too long without a first response.' },
  { key: 'followups', label: 'Follow-up & demo reminders', description: 'A follow-up or demo is due soon, overdue, or was never scheduled.' },
  { key: 'ai_handoff', label: 'AI handoff needed', description: 'The AI auto-reply needs a human to take over a conversation.' },
  { key: 'hot_leads', label: 'Hot lead escalation', description: 'A hot lead or priority-campaign lead needs personal attention.' },
];

const NotificationSettingsModal = ({ onClose, onSaved }) => {
  const toast = useToast();
  const [groups, setGroups] = useState(FALLBACK_GROUPS);
  const [prefs, setPrefs] = useState({});
  const [desktopEnabled, setDesktopEnabled] = useState(true);
  const [browserPermission, setBrowserPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [groupsRes, prefsRes] = await Promise.all([
          notificationsAPI.getGroups().catch(() => null),
          authAPI.getPreferences(),
        ]);
        if (groupsRes?.data?.groups?.length) setGroups(groupsRes.data.groups);
        setPrefs(prefsRes.data.preferences?.notification_prefs || {});
        setDesktopEnabled(prefsRes.data.preferences?.desktop_notifications !== false);
      } catch { /* modal still usable with defaults (everything on) */ }
      finally { setLoading(false); }
    })();
  }, []);

  const toggle = (key) => setPrefs(prev => ({ ...prev, [key]: prev[key] === false ? true : false }));

  const requestDesktopPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setBrowserPermission(result);
  };

  const save = async () => {
    setSaving(true);
    try {
      await authAPI.updatePreferences({ notification_prefs: prefs, desktop_notifications: desktopEnabled });
      toast.success('Notification settings saved.');
      onSaved?.({ notification_prefs: prefs, desktop_notifications: desktopEnabled });
      onClose();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BellRing size={18} className="text-brand-600" /> Notification Settings
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
          ) : (
            <>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Desktop notifications</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Show a popup on this device when a new notification arrives, even in another tab.
                    </p>
                    {browserPermission === 'denied' && (
                      <p className="text-xs text-red-500 mt-1">Blocked in your browser — enable it in the browser's site settings to use this.</p>
                    )}
                  </div>
                  <button type="button" role="switch" aria-checked={desktopEnabled}
                    onClick={() => setDesktopEnabled(v => !v)}
                    className={`relative shrink-0 w-10 h-6 rounded-full transition-colors ${desktopEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${desktopEnabled ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
                {desktopEnabled && browserPermission === 'default' && (
                  <button onClick={requestDesktopPermission}
                    className="mt-2 text-xs font-semibold text-brand-600 hover:underline">
                    Allow desktop notifications in this browser
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Notify me about</p>
                {groups.map(g => {
                  const enabled = prefs[g.key] !== false;
                  const skipLost = prefs.skip_lost_lead_followups !== false;
                  return (
                    <div key={g.key} className="border-b last:border-0">
                      <label className="flex items-start justify-between gap-4 py-2.5 cursor-pointer">
                        <span>
                          <span className="block text-sm font-medium text-gray-800">{g.label}</span>
                          <span className="block text-xs text-gray-500 mt-0.5">{g.description}</span>
                        </span>
                        <button type="button" role="switch" aria-checked={enabled} onClick={() => toggle(g.key)}
                          className={`relative shrink-0 w-10 h-6 rounded-full transition-colors mt-0.5 ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-4' : ''}`} />
                        </button>
                      </label>
                      {g.key === 'followups' && enabled && (
                        <label className="flex items-start justify-between gap-4 pb-2.5 pl-4 -mt-1 cursor-pointer">
                          <span>
                            <span className="block text-xs font-medium text-gray-700">Skip lost leads</span>
                            <span className="block text-[11px] text-gray-400 mt-0.5">Don't remind me about follow-ups for leads already marked Lost.</span>
                          </span>
                          <button type="button" role="switch" aria-checked={skipLost} onClick={() => toggle('skip_lost_lead_followups')}
                            className={`relative shrink-0 w-9 h-5 rounded-full transition-colors mt-0.5 ${skipLost ? 'bg-green-500' : 'bg-gray-300'}`}>
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${skipLost ? 'translate-x-4' : ''}`} />
                          </button>
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-gray-400 flex items-center gap-1.5 pt-1">
                <BellOff size={12} /> Turning something off only affects your own account — it won't stop your teammates' notifications.
              </p>
            </>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving || loading}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsModal;
