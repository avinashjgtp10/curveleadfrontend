import { useEffect, useState } from 'react';
import { brochuresAPI } from '../../services/api';
import { X, Search, FileText, Send } from 'lucide-react';

const ShareBrochureModal = ({ leadId, onClose, onShared }) => {
  const [brochures, setBrochures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data } = await brochuresAPI.getAll();
      setBrochures(data.brochures || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleShare = async (brochureId) => {
    try {
      const { data } = await brochuresAPI.shareWithLead(brochureId, leadId);
      window.open(data.whatsapp_url, '_blank');
      onShared?.();
      onClose();
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const filtered = brochures.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">Share Brochure</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search brochures..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-6 text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No brochures found</p>
          ) : (
            <div className="space-y-2">
              {filtered.map(b => (
                <div key={b.id} className="p-3 hover:bg-gray-50 rounded-xl flex items-start gap-3 border">
                  <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{b.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{b.category}</p>
                  </div>
                  <button onClick={() => handleShare(b.id)}
                    className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 flex items-center gap-1">
                    <Send size={12} /> Share
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareBrochureModal;
