import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quotationsAPI } from '../services/api';
import { ArrowLeft, Send, CheckCircle, XCircle, Printer } from 'lucide-react';

const QuotationViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      const { data } = await quotationsAPI.getOne(id);
      setData(data.quotation);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSend = async () => {
    try {
      const { data: res } = await quotationsAPI.send(id);
      window.open(res.whatsapp_url, '_blank');
      load();
    } catch (e) { alert('Failed'); }
  };

  const handleAccept = async () => {
    if (!window.confirm('Mark this quotation as accepted? This will move the lead to Won.')) return;
    try { await quotationsAPI.accept(id); load(); } catch (e) { alert('Failed'); }
  };

  const handleReject = async () => {
    const reason = prompt('Reason for rejection (optional):');
    try { await quotationsAPI.reject(id, reason); load(); } catch (e) { alert('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  if (!data) return <p>Not found</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2 print:hidden">
        <button onClick={() => navigate('/quotations')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="px-3 py-2 border rounded-lg text-sm flex items-center gap-1">
            <Printer size={14} /> Print
          </button>
          {data.status === 'draft' && (
            <button onClick={handleSend} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2">
              <Send size={14} /> Send on WhatsApp
            </button>
          )}
          {data.status === 'sent' && (
            <>
              <button onClick={handleAccept} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2">
                <CheckCircle size={14} /> Accept
              </button>
              <button onClick={handleReject} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2">
                <XCircle size={14} /> Reject
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-8 shadow-sm print:shadow-none print:border-0">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b">
          <div>
            <h1 className="text-2xl font-bold text-brand-600">{data.business_name}</h1>
            <p className="text-xs text-gray-500 mt-1">{data.business_address}</p>
            <p className="text-xs text-gray-500">{data.business_phone}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold">QUOTATION</h2>
            <p className="text-sm text-gray-600 mt-1">#{data.quote_number}</p>
            <p className="text-xs text-gray-500">Date: {new Date(data.created_at).toLocaleDateString('en-IN')}</p>
            {data.valid_until && <p className="text-xs text-gray-500">Valid Until: {new Date(data.valid_until).toLocaleDateString('en-IN')}</p>}
          </div>
        </div>

        {/* To */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Bill To:</p>
          <p className="font-semibold">{data.lead_name}</p>
          <p className="text-sm text-gray-600">{data.lead_phone}</p>
          {data.lead_email && <p className="text-sm text-gray-600">{data.lead_email}</p>}
        </div>

        {data.title && <h3 className="text-lg font-semibold mb-4">{data.title}</h3>}

        {/* Items Table */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2">#</th>
              <th className="text-left py-2">Description</th>
              <th className="text-right py-2">Qty</th>
              <th className="text-right py-2">Rate</th>
              <th className="text-right py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items?.map((item, i) => (
              <tr key={i} className="border-b">
                <td className="py-3">{i + 1}</td>
                <td className="py-3">
                  <p className="font-medium">{item.name}</p>
                  {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                </td>
                <td className="text-right py-3">{item.quantity}</td>
                <td className="text-right py-3">₹{parseFloat(item.price).toFixed(2)}</td>
                <td className="text-right py-3 font-medium">₹{parseFloat(item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal:</span><span>₹{parseFloat(data.subtotal).toFixed(2)}</span></div>
            {data.discount_percent > 0 && <div className="flex justify-between text-green-600"><span>Discount ({data.discount_percent}%):</span><span>-₹{parseFloat(data.discount_amount).toFixed(2)}</span></div>}
            <div className="flex justify-between"><span>Tax ({data.tax_percent}%):</span><span>₹{parseFloat(data.tax_amount).toFixed(2)}</span></div>
            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2"><span>Total:</span><span className="text-brand-600">₹{parseFloat(data.total).toLocaleString('en-IN')}</span></div>
          </div>
        </div>

        {/* Terms & Notes */}
        {data.terms && (
          <div className="mb-4 pb-4 border-t pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Terms & Conditions:</p>
            <p className="text-xs text-gray-600 whitespace-pre-wrap">{data.terms}</p>
          </div>
        )}
        {data.notes && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Notes:</p>
            <p className="text-xs text-gray-600 whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t text-center text-xs text-gray-400">
          Thank you for your business!
        </div>
      </div>
    </div>
  );
};

export default QuotationViewPage;
