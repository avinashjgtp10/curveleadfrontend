import { useEffect, useState } from 'react';
import { Edit2, Ban, CheckCircle2, Check, X as XIcon } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import { superAdminAPI } from '../../services/api';

const Feature = ({ label, value }) => (
  <div className="flex items-center justify-between py-1.5 border-b last:border-0">
    <span className="text-xs text-gray-500">{label}</span>
    {typeof value === 'boolean' ? (
      value ? <Check size={14} className="text-emerald-500" /> : <XIcon size={14} className="text-gray-300" />
    ) : (
      <span className="text-xs font-semibold text-gray-800">{value}</span>
    )}
  </div>
);

const emptyForm = {
  price: 0, yearlyPrice: 0, max_users: 1, max_leads: 0,
  whatsappLimit: '', automationAccess: false, aiFeatures: false, reportsAccess: 'Basic', bookingAccess: true,
};

const SuperAdminPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    superAdminAPI.getPlans().then(({ data }) => setPlans(data.plans || [])).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleStatus = async (p) => { await superAdminAPI.updatePlan(p.id, { is_active: !p.is_active }); load(); };

  const openEdit = (p) => {
    setEditModal(p);
    setForm({
      price: p.price, max_users: p.max_users, max_leads: p.max_leads,
      yearlyPrice: p.features?.yearlyPrice || 0,
      whatsappLimit: p.features?.whatsappLimit || '',
      automationAccess: !!p.features?.automationAccess,
      aiFeatures: !!p.features?.aiFeatures,
      reportsAccess: p.features?.reportsAccess || 'Basic',
      bookingAccess: p.features?.bookingAccess ?? true,
    });
  };

  const saveEdit = async () => {
    await superAdminAPI.updatePlan(editModal.id, {
      price: form.price, max_users: form.max_users, max_leads: form.max_leads,
      features: {
        yearlyPrice: form.yearlyPrice, whatsappLimit: form.whatsappLimit,
        automationAccess: form.automationAccess, aiFeatures: form.aiFeatures,
        reportsAccess: form.reportsAccess, bookingAccess: form.bookingAccess,
      },
    });
    setEditModal(null);
    load();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <PageHeader title="Plans" subtitle="Manage the pricing plans available to workspaces." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(p => (
          <div key={p.id} className={`bg-white rounded-2xl border p-5 flex flex-col ${!p.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                {p.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">
              {Number(p.price) === 0 ? 'Free' : `₹${Number(p.price).toLocaleString('en-IN')}`}
              {Number(p.price) > 0 && <span className="text-sm font-medium text-gray-400">/mo</span>}
            </p>
            {Number(p.price) > 0 && p.features?.yearlyPrice > 0 && (
              <p className="text-xs text-gray-400 mb-2">or ₹{Number(p.features.yearlyPrice).toLocaleString('en-IN')}/yr</p>
            )}

            <div className="mt-3 flex-1">
              <Feature label="Max Team Members" value={p.max_users < 0 ? 'Unlimited' : p.max_users} />
              <Feature label="Max Leads" value={p.max_leads < 0 ? 'Unlimited' : p.max_leads} />
              <Feature label="WhatsApp Limit" value={p.features?.whatsappLimit || '—'} />
              <Feature label="Automation Access" value={!!p.features?.automationAccess} />
              <Feature label="AI Features" value={!!p.features?.aiFeatures} />
              <Feature label="Reports Access" value={p.features?.reportsAccess || '—'} />
              <Feature label="Booking Access" value={p.features?.bookingAccess ?? true} />
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => openEdit(p)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium text-gray-600 hover:bg-gray-50">
                <Edit2 size={14} /> Edit
              </button>
              <button onClick={() => toggleStatus(p)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium text-gray-600 hover:bg-gray-50">
                {p.is_active ? <><Ban size={14} /> Deactivate</> : <><CheckCircle2 size={14} /> Activate</>}
              </button>
            </div>
          </div>
        ))}
      </div>

      {editModal && (
        <Modal title={`Edit ${editModal.name} plan`} onClose={() => setEditModal(null)} maxWidth="max-w-lg"
          footer={<>
            <button onClick={() => setEditModal(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={saveEdit} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">Save</button>
          </>}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Monthly Price</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Yearly Price</label>
              <input type="number" value={form.yearlyPrice} onChange={e => setForm({ ...form, yearlyPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Max Team Members</label>
              <input type="number" value={form.max_users} onChange={e => setForm({ ...form, max_users: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Max Leads (-1 = unlimited)</label>
              <input type="number" value={form.max_leads} onChange={e => setForm({ ...form, max_leads: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">WhatsApp Limit</label>
              <input value={form.whatsappLimit} onChange={e => setForm({ ...form, whatsappLimit: e.target.value })}
                placeholder="e.g. 1,000/mo" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Reports Access</label>
              <select value={form.reportsAccess} onChange={e => setForm({ ...form, reportsAccess: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                <option>Basic</option><option>Standard</option><option>Advanced</option>
              </select>
            </div>
            {[
              ['automationAccess', 'Automation Access'],
              ['aiFeatures', 'AI Features'],
              ['bookingAccess', 'Booking Access'],
            ].map(([key, label]) => (
              <label key={key} className="col-span-2 flex items-center justify-between p-2.5 bg-gray-50 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-700">{label}</span>
                <input type="checkbox" checked={form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })} className="w-4 h-4" />
              </label>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SuperAdminPlansPage;
