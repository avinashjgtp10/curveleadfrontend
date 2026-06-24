import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Printer } from 'lucide-react';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api' });

const QuotationPublicPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get(`/quotations/public/${id}`)
      .then(res => setData(res.data.quotation))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
  if (error || !data) return (
    <div className="flex items-center justify-center h-screen text-gray-500">
      <p>Quotation not found or link has expired.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-end mb-4 print:hidden">
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 shadow-sm">
            <Printer size={15} /> Download / Print PDF
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b">
            <div>
              {data.business_logo && <img src={data.business_logo} alt="logo" className="h-12 mb-2 object-contain" />}
              <h1 className="text-2xl font-bold text-blue-600">{data.business_name}</h1>
              {data.business_address && <p className="text-xs text-gray-500 mt-0.5">{data.business_address}</p>}
              {data.business_phone && <p className="text-xs text-gray-500">{data.business_phone}</p>}
              {data.business_email && <p className="text-xs text-gray-500">{data.business_email}</p>}
              {data.business_website && <p className="text-xs text-gray-500">{data.business_website}</p>}
              {data.business_gst && <p className="text-xs text-gray-500 mt-1">GSTIN: <span className="font-mono font-semibold">{data.business_gst}</span></p>}
              {data.business_pan && <p className="text-xs text-gray-500">PAN: <span className="font-mono font-semibold">{data.business_pan}</span></p>}
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold tracking-wide">QUOTATION</h2>
              <p className="text-sm text-gray-500 mt-1">#{data.quote_number}</p>
              <p className="text-xs text-gray-400">Date: {new Date(data.created_at).toLocaleDateString('en-IN')}</p>
              {data.valid_until && (
                <p className="text-xs text-gray-400">Valid Until: {new Date(data.valid_until).toLocaleDateString('en-IN')}</p>
              )}
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-6">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Bill To</p>
            <p className="font-semibold text-gray-900">{data.lead_name}</p>
            {data.lead_phone && <p className="text-sm text-gray-600">{data.lead_phone}</p>}
            {data.lead_email && <p className="text-sm text-gray-600">{data.lead_email}</p>}
          </div>

          {data.title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{data.title}</h3>}

          {/* Items */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-200 text-gray-500 text-xs uppercase">
                <th className="text-left py-2 pr-3">#</th>
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2 px-3">Qty</th>
                <th className="text-right py-2 px-3">Rate</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(data.items || []).map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3 pr-3 text-gray-400">{i + 1}</td>
                  <td className="py-3">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                  </td>
                  <td className="text-right py-3 px-3 text-gray-600">{item.quantity}</td>
                  <td className="text-right py-3 px-3 text-gray-600">₹{parseFloat(item.price).toLocaleString('en-IN')}</td>
                  <td className="text-right py-3 font-medium">₹{parseFloat(item.total).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{parseFloat(data.subtotal).toLocaleString('en-IN')}</span>
              </div>
              {parseFloat(data.discount_percent) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({data.discount_percent}%)</span>
                  <span>−₹{parseFloat(data.discount_amount).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Tax ({data.tax_percent}%)</span>
                <span>₹{parseFloat(data.tax_amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t-2 border-gray-200 pt-2 mt-2">
                <span>Total</span>
                <span className="text-blue-600">₹{parseFloat(data.total).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Terms & Notes */}
          {data.terms && (
            <div className="border-t pt-4 mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Terms & Conditions</p>
              <p className="text-xs text-gray-600 whitespace-pre-wrap">{data.terms}</p>
            </div>
          )}
          {data.notes && (
            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Notes</p>
              <p className="text-xs text-gray-600 whitespace-pre-wrap">{data.notes}</p>
            </div>
          )}

          {/* Bank / Payment Details */}
          {(() => {
            const bd = typeof data.business_bank_details === 'string'
              ? JSON.parse(data.business_bank_details || '{}')
              : (data.business_bank_details || {});
            const hasBankInfo = bd.bank_name || bd.account_number || bd.upi;
            if (!hasBankInfo) return null;
            return (
              <div className="border-t pt-4 mt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Payment Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs text-gray-600">
                  {bd.account_holder && <p><span className="text-gray-400">Account Name:</span> {bd.account_holder}</p>}
                  {bd.bank_name      && <p><span className="text-gray-400">Bank:</span> {bd.bank_name}</p>}
                  {bd.account_number && <p><span className="text-gray-400">Account No:</span> <span className="font-mono">{bd.account_number}</span></p>}
                  {bd.ifsc           && <p><span className="text-gray-400">IFSC:</span> <span className="font-mono">{bd.ifsc}</span></p>}
                  {bd.upi            && <p><span className="text-gray-400">UPI:</span> <span className="font-mono">{bd.upi}</span></p>}
                </div>
              </div>
            );
          })()}

          <div className="mt-8 pt-6 border-t text-center text-xs text-gray-400">
            Thank you for choosing {data.business_name}!
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationPublicPage;
