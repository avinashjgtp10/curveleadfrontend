import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationsAPI } from '../services/api';
import { Plus, FileText, Send, Eye, Trash2, MessageCircle } from 'lucide-react';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-amber-100 text-amber-700',
};

const QuotationsPage = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { load(); }, [statusFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await quotationsAPI.getAll(statusFilter ? { status: statusFilter } : {});
      setQuotations(data.quotations || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSend = async (id) => {
    try {
      const { data } = await quotationsAPI.send(id);
      window.open(data.whatsapp_url, '_blank');
      load();
    } catch (e) { alert('Failed'); }
  };

  const handleShareWA = (q) => {
    const phone = (q.lead_phone || '').replace(/\D/g, '');
    const amount = parseFloat(q.total).toLocaleString('en-IN');
    const text = `Hi ${q.lead_name}! 👋\n\nPlease find your quotation details below:\n*Quote No:* ${q.quote_number}\n*Title:* ${q.title || 'Quotation'}\n*Total Amount:* ₹${amount}\n\nKindly review and let us know if you'd like to proceed.`;
    const url = phone
      ? `https://wa.me/${phone.length === 10 ? '91' + phone : phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this draft quotation?')) return;
    try { await quotationsAPI.delete(id); load(); } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-gray-500">Create quotations and share with leads</p>
        <button onClick={() => navigate('/quotations/new')}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 flex items-center gap-2">
          <Plus size={16} /> New Quotation
        </button>
      </div>

      <div className="flex gap-1 flex-wrap">
        {['', 'draft', 'sent', 'accepted', 'rejected'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${statusFilter === s ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
      ) : quotations.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <FileText size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No quotations yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Quote #</th>
                  <th className="text-left px-4 py-3">Lead</th>
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map(q => (
                  <tr key={q.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{q.quote_number}</td>
                    <td className="px-4 py-3 font-medium">{q.lead_name}</td>
                    <td className="px-4 py-3 text-gray-600">{q.title || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold">₹{parseFloat(q.total).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[q.status]}`}>
                        {q.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => navigate(`/quotations/${q.id}`)} className="p-1.5 hover:bg-blue-50 rounded text-blue-500" title="View"><Eye size={14} /></button>
                        <button onClick={() => handleShareWA(q)} className="p-1.5 hover:bg-green-50 rounded text-green-600" title="Share via WhatsApp"><MessageCircle size={14} /></button>
                        {q.status === 'draft' && (
                          <>
                            <button onClick={() => handleSend(q.id)} className="p-1.5 hover:bg-brand-50 rounded text-brand-600" title="Mark as Sent"><Send size={14} /></button>
                            <button onClick={() => handleDelete(q.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Delete"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationsPage;
