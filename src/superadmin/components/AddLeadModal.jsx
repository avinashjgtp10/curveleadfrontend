import { useState } from 'react';
import { X } from 'lucide-react';
import { SERVICE_OPTIONS } from '../mockData';

const AddLeadModal = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({ name: '', phone: '', email: '', service: SERVICE_OPTIONS[0], autoFollowUp: true });

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    onAdd({
      id: Date.now(),
      name: form.name,
      phone: form.phone,
      email: form.email,
      service: form.service,
      status: 'New',
      createdAt: 'Just now',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Add New Lead</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Phone *</label>
            <input required value={form.phone} onChange={e => set('phone', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Service Interested</label>
            <select value={form.service} onChange={e => set('service', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {SERVICE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
            <span>
              <span className="block text-sm font-medium text-gray-800">Enable Auto Follow-up</span>
              <span className="block text-[11px] text-gray-400">(WhatsApp + Reminders + Conversion)</span>
            </span>
            <button type="button" onClick={() => set('autoFollowUp', !form.autoFollowUp)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${form.autoFollowUp ? 'bg-indigo-600' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.autoFollowUp ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
            </button>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
              Add Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLeadModal;
