import { useEffect, useState } from 'react';
import { staffAPI } from '../services/api';
import { Plus, UserCog, X, Trash2 } from 'lucide-react';

const StaffPage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'staff', password: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await staffAPI.getAll();
      setStaff(data.staff || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleInvite = async () => {
    if (!form.name || !form.email || !form.password) return alert('All fields required');
    try {
      await staffAPI.invite(form);
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', role: 'staff', password: '' });
      loadData();
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this team member?')) return;
    try { await staffAPI.delete(id); loadData(); } catch (e) { alert('Failed'); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Manage your team members</p>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 flex items-center gap-2">
          <Plus size={16} /> Add Member
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
      ) : staff.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <UserCog size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No team members yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border divide-y">
          {staff.map(s => (
            <div key={s.id} className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                <span className="text-brand-700 font-semibold text-sm">{s.name?.charAt(0)?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{s.name}</p>
                <p className="text-xs text-gray-500">{s.email}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 capitalize">{s.role}</span>
              {s.role !== 'admin' && (
                <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={14} /></button>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">Add Team Member</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <input type="text" placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <input type="email" placeholder="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <input type="password" placeholder="Initial Password *" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={handleInvite} className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold">Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;
