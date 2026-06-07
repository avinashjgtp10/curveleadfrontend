import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { whatsappAPI } from '../services/api';
import { MessageCircle, Search } from 'lucide-react';

const WhatsAppInboxPage = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadInbox(); }, []);

  const loadInbox = async () => {
    try {
      const { data } = await whatsappAPI.getInbox();
      setConversations(data.conversations || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = conversations.filter(c =>
    c.lead_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.lead_phone?.includes(search)
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border p-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <MessageCircle size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No WhatsApp conversations yet</p>
          <p className="text-xs text-gray-400 mt-2">Conversations will appear here when leads message you</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border divide-y">
          {filtered.map(c => (
            <button key={c.lead_id} onClick={() => navigate(`/leads/${c.lead_id}`)}
              className="w-full p-4 hover:bg-gray-50 text-left flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <MessageCircle size={18} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm truncate">{c.lead_name}</p>
                  <p className="text-xs text-gray-400 shrink-0">{new Date(c.last_message_at).toLocaleDateString('en-IN')}</p>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{c.last_message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.lead_phone}</p>
              </div>
              {c.unread_count > 0 && (
                <span className="bg-green-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">{c.unread_count}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default WhatsAppInboxPage;
