import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffAPI } from '../services/api';
import { Plus, Edit2, X, Phone, UserCog, Clock, CheckCircle, XCircle, Calendar, ChevronLeft, ChevronRight, Settings } from 'lucide-react';

const StaffPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('list');
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  // Time tracking
  const [timeDate, setTimeDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [gracePeriod, setGracePeriod] = useState(15);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInForm, setCheckInForm] = useState({});
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newGrace, setNewGrace] = useState(15);

  useEffect(() => { loadStaff(); }, []);
  useEffect(() => { if (tab === 'time') loadTimeLogs(); }, [tab, timeDate]);

  const loadStaff = async () => {
    try { const { data } = await staffAPI.getAll(); setStaff(data.staff); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadTimeLogs = async () => {
    setLoading(true);
    try { const { data } = await staffAPI.getTimeLogs(timeDate); setTimeLogs(data.staff); setGracePeriod(data.gracePeriod); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const openAdd = () => {
    setSelected(null);
    setForm({ name:'', phone:'', email:'', password:'', role:'Staff', base_salary:'', deduction_per_day:'', join_date: new Date().toISOString().split('T')[0], shift_start_time:'10:00' });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setSelected(s);
    setForm({ name:s.name, phone:s.phone, role:s.role, base_salary:s.base_salary, deduction_per_day:s.deduction_per_day, status:s.status, shift_start_time: s.shift_start_time?.slice(0,5) || '10:00' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selected) await staffAPI.update(selected.id, form);
      else await staffAPI.create(form);
      setShowModal(false); loadStaff();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const openCheckIn = (s) => {
    setCheckInForm({ staff_id: s.id, name: s.name, date: timeDate, check_in: '', check_out: '', notes: '' });
    setShowCheckInModal(true);
  };

  const handleCheckIn = async () => {
    if (!checkInForm.check_in) return alert('Enter check-in time');
    try {
      const { data } = await staffAPI.checkIn(checkInForm);
      alert(data.message);
      setShowCheckInModal(false); loadTimeLogs();
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const handleSaveSettings = async () => {
    try {
      await staffAPI.updateSettings({ grace_period_minutes: parseInt(newGrace) });
      setGracePeriod(parseInt(newGrace));
      setShowSettingsModal(false);
      alert('Grace period updated!');
    } catch (e) { alert('Failed'); }
  };

  const changeDate = (d) => {
    const dt = new Date(timeDate); dt.setDate(dt.getDate() + d);
    setTimeDate(dt.toISOString().split('T')[0]);
  };

  const statusBadge = (status, lateMin) => {
    if (!status) return <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">No Record</span>;
    const map = {
      present: 'bg-green-100 text-green-700', half_day: 'bg-amber-100 text-amber-700',
      absent: 'bg-red-100 text-red-700',
    };
    const label = status === 'half_day' ? `Half Day (${lateMin}m late)` : status.charAt(0).toUpperCase() + status.slice(1);
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${map[status] || 'bg-gray-100'}`}>{label}</span>;
  };

  if (loading && tab === 'list') return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex justify-between items-center">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {[{ key:'list', label:'Staff List' }, { key:'time', label:'Time Tracking' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {tab === 'time' && (
            <button onClick={() => { setNewGrace(gracePeriod); setShowSettingsModal(true); }}
              className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"><Settings size={18} /></button>
          )}
          {tab === 'list' && (
            <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">
              <Plus size={18} /> Add Staff
            </button>
          )}
        </div>
      </div>

      {tab === 'list' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map(s => (
              <div key={s.id} onClick={() => navigate(`/staff/${s.id}`)}
                className={`bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-md transition ${s.status === 'inactive' ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 bg-brand-100 rounded-full flex items-center justify-center">
                    <span className="text-brand-700 font-bold">{s.name?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span>
                    <button onClick={(e) => { e.stopPropagation(); openEdit(s); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-400"><Edit2 size={14} /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">{s.name}</h3>
                <p className="text-sm text-gray-500">{s.role}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-400"><Phone size={13} /> {s.phone}</div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm"><span className="text-gray-500">Salary: </span><span className="font-semibold">₹{parseFloat(s.base_salary).toLocaleString('en-IN')}</span></span>
                  <span className="text-xs text-gray-400">Shift: {s.shift_start_time?.slice(0,5) || '10:00'}</span>
                </div>
              </div>
            ))}
          </div>
          {staff.length === 0 && <div className="text-center py-12 text-gray-500"><UserCog size={40} className="mx-auto mb-3 text-gray-300" /><p>No staff yet</p></div>}
        </>
      ) : (
        /* Time Tracking Tab */
        <>
          <div className="flex items-center gap-3">
            <button onClick={() => changeDate(-1)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"><ChevronLeft size={18} /></button>
            <input type="date" value={timeDate} onChange={e => setTimeDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <button onClick={() => changeDate(1)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"><ChevronRight size={18} /></button>
            <span className="text-xs text-gray-400 ml-2">Grace period: {gracePeriod} min</span>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b"><tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Staff</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Shift</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">In</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Out</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {timeLogs.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><p className="font-medium text-gray-900">{s.name}</p><p className="text-xs text-gray-400">{s.role}</p></td>
                        <td className="px-4 py-3 text-center text-gray-500">{s.shift_start_time?.slice(0,5)}</td>
                        <td className="px-4 py-3 text-center font-medium">{s.check_in?.slice(0,5) || '—'}</td>
                        <td className="px-4 py-3 text-center">{s.check_out?.slice(0,5) || '—'}</td>
                        <td className="px-4 py-3 text-center">{statusBadge(s.status, s.late_by_minutes)}</td>
                        <td className="px-4 py-3 text-right">
                          {!s.check_in ? (
                            <button onClick={() => openCheckIn(s)} className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700">Check In</button>
                          ) : (
                            <button onClick={() => openCheckIn(s)} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200">Update</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add/Edit Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b"><h2 className="text-lg font-bold">{selected ? 'Edit Staff' : 'Add Staff'}</h2><button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={20} /></button></div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={form.name} onChange={e => setForm({...form, name:e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label><input type="text" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select value={form.role} onChange={e => setForm({...form, role:e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
                    <option>Trainer</option><option>Receptionist</option><option>Assistant</option><option>Manager</option><option>Staff</option>
                  </select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Shift Start Time</label>
                  <input type="time" value={form.shift_start_time} onChange={e => setForm({...form, shift_start_time:e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" /></div>
              </div>
              {!selected && (
                <>
                  <hr /><p className="text-xs text-gray-500">Login access (optional)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="text" value={form.password} onChange={e => setForm({...form, password:e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" /></div>
                  </div>
                </>
              )}
              <hr />
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Base Salary (₹) *</label><input type="number" value={form.base_salary} onChange={e => setForm({...form, base_salary:e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Deduction/Day (₹)</label><input type="number" value={form.deduction_per_day} onChange={e => setForm({...form, deduction_per_day:e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" /></div>
              </div>
              {selected && (
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status:e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="active">Active</option><option value="inactive">Inactive</option>
                  </select></div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold">{selected ? 'Update' : 'Add Staff'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check-In Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCheckInModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5">
            <h2 className="text-lg font-bold mb-4">Check-In: {checkInForm.name}</h2>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Check-In Time *</label>
                <input type="time" value={checkInForm.check_in} onChange={e => setCheckInForm({...checkInForm, check_in:e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Check-Out Time</label>
                <input type="time" value={checkInForm.check_out} onChange={e => setCheckInForm({...checkInForm, check_out:e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input type="text" value={checkInForm.notes} onChange={e => setCheckInForm({...checkInForm, notes:e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" /></div>
              <div className="flex gap-3">
                <button onClick={() => setShowCheckInModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm">Cancel</button>
                <button onClick={handleCheckIn} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grace Period Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowSettingsModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5">
            <h2 className="text-lg font-bold mb-4">Grace Period Settings</h2>
            <p className="text-sm text-gray-500 mb-3">Staff arriving after grace period will be auto-marked as Half Day.</p>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Grace Period (minutes)</label>
              <select value={newGrace} onChange={e => setNewGrace(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
                <option value="5">5 minutes</option><option value="10">10 minutes</option><option value="15">15 minutes</option>
                <option value="20">20 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option>
              </select></div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowSettingsModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm">Cancel</button>
              <button onClick={handleSaveSettings} className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;
