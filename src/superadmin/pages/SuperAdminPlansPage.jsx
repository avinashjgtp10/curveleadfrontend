import { useEffect, useState } from 'react';
import { Ban, CheckCircle2, Check, X as XIcon, Star, Plus, ChevronRight } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { superAdminAPI } from '../../services/api';

const ICON_TILES = ['bg-slate-500', 'bg-indigo-500', 'bg-purple-500', 'bg-emerald-500', 'bg-pink-500'];
const fmtLimit = (n) => (n < 0 ? 'Unlimited' : Number(n).toLocaleString('en-IN'));

// Feature rows derived from the plan's real fields: [label, value]. A string is shown as text,
// a boolean means included / not included, null means the plan has no value for it.
const planFeatures = (p) => [
  ['Team Members', `${fmtLimit(p.max_users)} team members`],
  ['Leads', `${fmtLimit(p.max_leads)} leads`],
  ['WhatsApp Limit', p.features?.whatsappLimit ? `WhatsApp ${p.features.whatsappLimit}` : null],
  ['Automation Access', !!p.features?.automationAccess],
  ['AI Features', !!p.features?.aiFeatures],
  ['Reports Access', p.features?.reportsAccess ? `${p.features.reportsAccess} reports` : null],
  ['Booking Access', p.features?.bookingAccess ?? true],
];

const COMPARISON_ROWS = [
  ['Monthly Price', p => (Number(p.price) === 0 ? 'Free' : `₹${Number(p.price).toLocaleString('en-IN')}`)],
  ['Yearly Price', p => (p.features?.yearlyPrice > 0 ? `₹${Number(p.features.yearlyPrice).toLocaleString('en-IN')}` : '—')],
  ['Team Members', p => fmtLimit(p.max_users)],
  ['Leads', p => fmtLimit(p.max_leads)],
  ['WhatsApp Limit', p => p.features?.whatsappLimit || '—'],
  ['Automation Access', p => !!p.features?.automationAccess],
  ['AI Features', p => !!p.features?.aiFeatures],
  ['Reports Access', p => p.features?.reportsAccess || '—'],
  ['Booking Access', p => p.features?.bookingAccess ?? true],
];

const CellValue = ({ value }) => (typeof value === 'boolean'
  ? (value ? <Check size={15} className="text-emerald-500 mx-auto" /> : <XIcon size={15} className="text-gray-300 mx-auto" />)
  : <span className="text-gray-700">{value}</span>);

const emptyForm = {
  price: 0, yearlyPrice: 0, max_users: 1, max_leads: 0,
  whatsappLimit: '', automationAccess: false, aiFeatures: false, reportsAccess: 'Basic', bookingAccess: true,
};

const SuperAdminPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showComparison, setShowComparison] = useState(false);
  const [newName, setNewName] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    superAdminAPI.getPlans().then(({ data }) => setPlans(data.plans || [])).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleStatus = async (p) => { await superAdminAPI.updatePlan(p.id, { is_active: !p.is_active }); load(); };

  const openCreate = () => {
    setEditModal({ isNew: true, name: '' });
    setNewName('');
    setSaveError('');
    setForm({ ...emptyForm });
  };

  const openEdit = (p) => {
    setSaveError('');
    setEditModal(p);
    setForm({
      price: Number(p.price) || 0, max_users: Number(p.max_users) || 0, max_leads: Number(p.max_leads) || 0,
      yearlyPrice: Number(p.features?.yearlyPrice) || 0,
      whatsappLimit: p.features?.whatsappLimit || '',
      automationAccess: !!p.features?.automationAccess,
      aiFeatures: !!p.features?.aiFeatures,
      reportsAccess: p.features?.reportsAccess || 'Basic',
      bookingAccess: p.features?.bookingAccess ?? true,
    });
  };

  const saveEdit = async () => {
    const features = {
      yearlyPrice: form.yearlyPrice, whatsappLimit: form.whatsappLimit,
      automationAccess: form.automationAccess, aiFeatures: form.aiFeatures,
      reportsAccess: form.reportsAccess, bookingAccess: form.bookingAccess,
    };
    if (editModal.isNew && !newName.trim()) return setSaveError('Plan name is required.');
    setSaving(true);
    setSaveError('');
    try {
      if (editModal.isNew) {
        await superAdminAPI.createPlan({ name: newName.trim(), price: form.price, max_users: form.max_users, max_leads: form.max_leads, features });
      } else {
        await superAdminAPI.updatePlan(editModal.id, { price: form.price, max_users: form.max_users, max_leads: form.max_leads, features });
      }
      setEditModal(null);
      load();
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Could not save the plan.');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0"><Star size={20} /></span>
        <div>
          <h1 className="text-2xl font-bold text-[#141a3d] tracking-tight">Plans &amp; Subscriptions</h1>
          <p className="text-sm text-gray-500">Manage the pricing plans available to organizations.</p>
        </div>
        <button onClick={openCreate}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
          <Plus size={16} /> Add Plan
        </button>
      </div>

      <div className="border-b">
        <span className="inline-block px-1 pb-2 text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600 -mb-px">Pricing Plans</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {plans.map((p, i) => (
          <div key={p.id} className={`bg-white rounded-2xl border p-6 flex flex-col shadow-[0_2px_12px_rgba(99,102,241,0.06)] ${!p.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between">
              <span className={`w-11 h-11 rounded-xl ${ICON_TILES[i % ICON_TILES.length]} text-white flex items-center justify-center`}><Star size={18} /></span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                {p.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <button onClick={() => openEdit(p)} className="text-left mt-4">
              <h3 className="text-lg font-bold text-[#141a3d] hover:text-indigo-600">{p.name}</h3>
            </button>
            {p.description && <p className="text-xs text-gray-400 mt-1">{p.description}</p>}
            <button onClick={() => openEdit(p)} className="text-left mt-4">
              <span className="text-3xl font-extrabold text-[#141a3d]">{Number(p.price) === 0 ? 'Free' : `₹${Number(p.price).toLocaleString('en-IN')}`}</span>
              {Number(p.price) > 0 && <span className="text-sm font-medium text-gray-400">/mo</span>}
            </button>
            {Number(p.price) > 0 && p.features?.yearlyPrice > 0 && (
              <p className="text-xs text-gray-400">or ₹{Number(p.features.yearlyPrice).toLocaleString('en-IN')}/yr</p>
            )}

            <ul className="mt-5 space-y-2.5 flex-1">
              {planFeatures(p).map(([label, value]) => {
                if (value === null) return null;
                const included = value !== false;
                return (
                  <li key={label} className={`flex items-center gap-2.5 text-xs ${included ? 'text-gray-600' : 'text-gray-300 line-through'}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${included ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-100 text-gray-300'}`}>
                      {included ? <Check size={10} /> : <XIcon size={10} />}
                    </span>
                    {typeof value === 'string' ? value : label}
                  </li>
                );
              })}
            </ul>

            <button onClick={() => openEdit(p)}
              className="mt-6 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-indigo-300 text-xs font-semibold text-indigo-600 hover:bg-indigo-50">
              <Plus size={12} /> Edit Features
            </button>
            <button onClick={() => toggleStatus(p)}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium text-gray-600 hover:bg-gray-50">
              {p.is_active ? <><Ban size={13} /> Deactivate</> : <><CheckCircle2 size={13} /> Activate</>}
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-2">Click the name or price to edit</p>
          </div>
        ))}
      </div>

      {plans.length > 0 && (
        <div className="max-w-5xl mx-auto bg-white rounded-xl border">
          <button onClick={() => setShowComparison(o => !o)} className="w-full flex items-center justify-between px-5 py-3.5 text-left">
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <ChevronRight size={14} className={`text-indigo-500 transition-transform ${showComparison ? 'rotate-90' : ''}`} /> Full Feature Comparison
            </span>
            <span className="text-[11px] text-gray-400">{COMPARISON_ROWS.length} features across {plans.length} plans</span>
          </button>
          {showComparison && (
            <div className="overflow-x-auto border-t">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 bg-slate-50/60">
                    <th className="text-left px-5 py-3 font-semibold">Feature</th>
                    {plans.map(p => <th key={p.id} className="px-4 py-3 font-semibold text-center">{p.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map(([label, get]) => (
                    <tr key={label} className="border-t">
                      <td className="px-5 py-2.5 text-gray-600">{label}</td>
                      {plans.map(p => <td key={p.id} className="px-4 py-2.5 text-center"><CellValue value={get(p)} /></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {editModal && (
        <Modal title={editModal.isNew ? 'Add Plan' : `Edit ${editModal.name} plan`} onClose={() => !saving && setEditModal(null)} maxWidth="max-w-lg"
          footer={<>
            <button onClick={() => setEditModal(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={saveEdit} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : editModal.isNew ? 'Create Plan' : 'Save'}</button>
          </>}>
          {saveError && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{saveError}</div>}
          <div className="grid grid-cols-2 gap-3">
            {editModal.isNew && (
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Plan Name <span className="text-red-500">*</span></label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Growth" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Monthly Price</label>
              <input type="number" value={form.price} onChange={e => { e.target.value = e.target.value.replace(/^0+(?=\d)/, ''); setForm({ ...form, price: Number(e.target.value) }); }}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Yearly Price</label>
              <input type="number" value={form.yearlyPrice} onChange={e => { e.target.value = e.target.value.replace(/^0+(?=\d)/, ''); setForm({ ...form, yearlyPrice: Number(e.target.value) }); }}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Max Team Members</label>
              <input type="number" value={form.max_users} onChange={e => { e.target.value = e.target.value.replace(/^0+(?=\d)/, ''); setForm({ ...form, max_users: Number(e.target.value) }); }}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Max Leads (-1 = unlimited)</label>
              <input type="number" value={form.max_leads} onChange={e => { e.target.value = e.target.value.replace(/^0+(?=\d)/, ''); setForm({ ...form, max_leads: Number(e.target.value) }); }}
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
