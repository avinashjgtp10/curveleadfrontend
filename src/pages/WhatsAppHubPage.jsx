import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WhatsAppInboxPage from './WhatsAppInboxPage';
import TemplatesPage from './TemplatesPage';
import BroadcastsTab from '../components/whatsapp/BroadcastsTab';
import OptInsTab from '../components/whatsapp/OptInsTab';
import AiAutoReplyTab from '../components/whatsapp/AiAutoReplyTab';
import AutoMessagesTab from '../components/whatsapp/AutoMessagesTab';
import AnalyticsTab from '../components/whatsapp/AnalyticsTab';
import ClickToWhatsAppTab from '../components/whatsapp/ClickToWhatsAppTab';
import NumbersTab from '../components/whatsapp/NumbersTab';
import SavedRepliesTab from '../components/whatsapp/SavedRepliesTab';
import { BarChart3, Bot, Megaphone, MessageCircle, Phone } from 'lucide-react';

// One place for everything WhatsApp, in five sections. Chats are open to the
// whole team; everything else is admin-only, matching the API permissions.
const GROUPS = [
  { id: 'inbox', label: 'Inbox', icon: MessageCircle, tabs: [
    { id: 'chats', label: 'Chats', Component: WhatsAppInboxPage },
    { id: 'saved', label: 'Saved replies', Component: SavedRepliesTab, admin: true },
  ] },
  { id: 'messages', label: 'Messages', icon: Megaphone, admin: true, tabs: [
    { id: 'templates', label: 'Templates', Component: TemplatesPage },
    { id: 'broadcasts', label: 'Broadcasts', Component: BroadcastsTab },
    { id: 'optins', label: 'Opt-ins', Component: OptInsTab },
  ] },
  { id: 'automation', label: 'Automation', icon: Bot, admin: true, tabs: [
    { id: 'ai', label: 'AI Auto-reply', Component: AiAutoReplyTab },
    { id: 'auto', label: 'Auto messages', Component: AutoMessagesTab },
  ] },
  { id: 'insights', label: 'Insights', icon: BarChart3, admin: true, tabs: [
    { id: 'analytics', label: 'Analytics', Component: AnalyticsTab },
    { id: 'ctwa', label: 'Click-to-WhatsApp', Component: ClickToWhatsAppTab },
  ] },
  { id: 'setup', label: 'Numbers', icon: Phone, admin: true, tabs: [
    { id: 'numbers', label: 'Numbers', Component: NumbersTab },
  ] },
];

const WhatsAppHubPage = () => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const isAdmin = user?.role === 'admin';

  const groups = GROUPS.filter(g => !g.admin || isAdmin)
    .map(g => ({ ...g, tabs: g.tabs.filter(t => !t.admin || isAdmin) }));
  const requested = params.get('tab');
  const group = groups.find(g => g.tabs.some(t => t.id === requested)) || groups[0];
  const tab = group.tabs.find(t => t.id === requested) || group.tabs[0];
  const Active = tab.Component;

  const go = (t) => setParams(t.id === 'chats' ? {} : { tab: t.id });

  return (
    <div className="space-y-4">
      {groups.length > 1 && (
        <div className="space-y-2">
          <div className="inline-flex max-w-full overflow-x-auto bg-white rounded-xl border border-gray-200 p-1 gap-1 shadow-sm">
            {groups.map(g => (
              <button key={g.id} onClick={() => go(g.tabs[0])}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  group.id === g.id ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                <g.icon size={15} /> {g.label}
              </button>
            ))}
          </div>
          {group.tabs.length > 1 && (
            <div className="flex items-center gap-5 border-b border-gray-200 overflow-x-auto">
              {group.tabs.map(t => (
                <button key={t.id} onClick={() => go(t)}
                  className={`py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                    tab.id === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <Active />
    </div>
  );
};

export default WhatsAppHubPage;
