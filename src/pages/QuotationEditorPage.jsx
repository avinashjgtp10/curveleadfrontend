import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { quotationsAPI, leadAPI } from '../services/api';
import { Plus, Trash2, Save, Send, ArrowLeft } from 'lucide-react';

const QuotationEditorPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isNew = !id || id === 'new';

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(null);
  const [form, setForm] = useState({
    lead_id: isNew ? (searchParams.get('lead_id') || '') : '',
    title: '',
    items: [{ name: '', description: '', quantity: 1, price: 0 }],
    discount_percent: 0,
    tax_percent: 18,
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    terms: '50% advance, balance on delivery.',
    notes: '',
  });

  useEffect(() => {
    leadAPI.getAll({ limit: 100 }).then(({ data }) => setLeads(data.leads || []));
    if (!isNew) {
      quotationsAPI.getOne(id).then(({ data }) => {
        setForm({ ...data.quotation, items: data.quotation.items || [] });
        setSaved(data.quotation);
      });
    }
  }, [id]);

  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { name: '', description: '', quantity: 1, price: 0 }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const subtotal = form.items.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)), 0);
  const discountAmount = (subtotal * (parseFloat(form.discount_percent) || 0)) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * (parseFloat(form.tax_percent) || 0)) / 100;
  const total = taxableAmount + taxAmount;

  const handleSave = async (send = false) => {
    if (!form.lead_id) return alert('Please select a lead');
    if (form.items.length === 0 || !form.items[0].name) return alert('Add at least one item');

    setLoading(true);
    try {
      let quote;
      if (isNew) {
        const { data } = await quotationsAPI.create(form);
        quote = data.quotation;
      } else {
        const { data } = await quotationsAPI.update(id, form);
        quote = data.quotation;
      }
      setSaved(quote);

      if (send) {
        const { data } = await quotationsAPI.send(quote.id);
        window.open(data.whatsapp_url, '_blank');
      }
      navigate('/quotations');
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <button onClick={() => navigate('/quotations')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back to Quotations
      </button>

      <div className="bg-white rounded-2xl border p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Lead *</label>
            <select value={form.lead_id} onChange={e => setForm({ ...form, lead_id: e.target.value })}
              className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white" disabled={!isNew}>
              <option value="">Select lead...</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name} • {l.phone}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
            <input type="text" placeholder="e.g. Website Development Quote" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-2xl border p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Line Items</h3>
          <button onClick={addItem} className="text-xs px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg font-medium hover:bg-brand-100 flex items-center gap-1">
            <Plus size={14} /> Add Item
          </button>
        </div>

        <div className="space-y-2">
          {form.items.map((item, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-xl grid grid-cols-12 gap-2 items-start">
              <input type="text" placeholder="Item name *" value={item.name}
                onChange={e => updateItem(i, 'name', e.target.value)}
                className="col-span-12 sm:col-span-4 px-2 py-1.5 border rounded text-sm" />
              <input type="text" placeholder="Description" value={item.description}
                onChange={e => updateItem(i, 'description', e.target.value)}
                className="col-span-12 sm:col-span-3 px-2 py-1.5 border rounded text-sm" />
              <input type="number" min="0" placeholder="Qty" value={item.quantity}
                onChange={e => updateItem(i, 'quantity', e.target.value)}
                className="col-span-4 sm:col-span-2 px-2 py-1.5 border rounded text-sm text-right" />
              <input type="number" min="0" placeholder="Price" value={item.price}
                onChange={e => updateItem(i, 'price', e.target.value)}
                className="col-span-5 sm:col-span-2 px-2 py-1.5 border rounded text-sm text-right" />
              <button onClick={() => removeItem(i)} className="col-span-3 sm:col-span-1 p-2 hover:bg-red-50 rounded text-red-500 flex items-center justify-center">
                <Trash2 size={14} />
              </button>
              <div className="col-span-12 text-right text-xs text-gray-500 -mt-1">
                Subtotal: ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-white rounded-2xl border p-5">
        <h3 className="font-semibold mb-3">Totals & Terms</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Discount %</label>
              <input type="number" min="0" max="100" value={form.discount_percent}
                onChange={e => setForm({ ...form, discount_percent: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tax % (GST)</label>
              <input type="number" min="0" max="100" value={form.tax_percent}
                onChange={e => setForm({ ...form, tax_percent: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Valid Until</label>
              <input type="date" value={form.valid_until}
                onChange={e => setForm({ ...form, valid_until: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
            </div>
          </div>

          <div className="space-y-2 text-sm bg-gray-50 rounded-xl p-4 h-fit">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Discount ({form.discount_percent}%)</span><span>-₹{discountAmount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tax ({form.tax_percent}%)</span><span>+₹{taxAmount.toFixed(2)}</span></div>
            <div className="flex justify-between border-t pt-2 mt-2 text-base font-bold">
              <span>Total</span><span className="text-brand-600">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Terms & Conditions</label>
            <textarea value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })}
              rows={2} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes (visible to client)</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button onClick={() => navigate('/quotations')} className="px-5 py-2.5 border rounded-lg text-sm font-medium">Cancel</button>
        <button onClick={() => handleSave(false)} disabled={loading}
          className="px-5 py-2.5 bg-gray-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
          <Save size={16} /> Save Draft
        </button>
        <button onClick={() => handleSave(true)} disabled={loading}
          className="px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 flex items-center gap-2 disabled:opacity-50">
          <Send size={16} /> {loading ? 'Saving...' : 'Save & Send on WhatsApp'}
        </button>
      </div>
    </div>
  );
};

export default QuotationEditorPage;
