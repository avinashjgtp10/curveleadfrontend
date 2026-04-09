import { useState, useEffect } from 'react';
import { salaryAPI } from '../services/api';
import { X, Banknote, Smartphone, CreditCard } from 'lucide-react';

const modeLabels = { cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank Transfer' };
const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const SalaryPage = () => {
  const [tab, setTab] = useState('current');
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState({ staff: [], summary: {} });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [payForm, setPayForm] = useState({ payment_mode: 'bank_transfer', bonus: 0, notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (tab === 'current') loadSalary(); }, [month, year, tab]);
  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab]);

  const loadSalary = async () => { setLoading(true); try { const { data: res } = await salaryAPI.getOverview(month, year); setData(res); } catch(e){} finally { setLoading(false); } };
  const loadHistory = async () => { setLoading(true); try { const { data: res } = await salaryAPI.getHistory(12); setHistory(res.history); } catch(e){} finally { setLoading(false); } };

  const openPay = (s) => { setSelectedStaff(s); setPayForm({ payment_mode:'bank_transfer', bonus:s.bonus||0, notes:'' }); setShowPayModal(true); };

  const handlePay = async () => {
    if (!selectedStaff) return;
    setSaving(true);
    const bonus = parseFloat(payForm.bonus) || 0;
    const netSalary = selectedStaff.base_salary - selectedStaff.deductions + selectedStaff.incentives + bonus;
    try {
      await salaryAPI.process({
        staff_id: selectedStaff.staff_id, month, year,
        working_days: selectedStaff.working_days, days_present: selectedStaff.days_present,
        days_absent: selectedStaff.days_absent, base_salary: selectedStaff.base_salary,
        deductions: selectedStaff.deductions, bonus, incentives: selectedStaff.incentives,
        net_salary: netSalary, payment_mode: payForm.payment_mode, notes: payForm.notes,
      });
      setShowPayModal(false); loadSalary();
    } catch(e) { alert(e.response?.data?.error || 'Failed'); } finally { setSaving(false); }
  };

  const changeMonth = (d) => { let m=month+d, y=year; if(m>12){m=1;y++;} if(m<1){m=12;y--;} setMonth(m);setYear(y); };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[{key:'current',label:'This Month'},{key:'history',label:'History'}].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab===t.key?'bg-white text-gray-900 shadow-sm':'text-gray-500'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'current' ? (
        <>
          <div className="flex items-center gap-3">
            <button onClick={()=>changeMonth(-1)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">←</button>
            <span className="text-lg font-semibold">{monthNames[month-1]} {year}</span>
            <button onClick={()=>changeMonth(1)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">→</button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-xl p-4"><p className="text-xs text-blue-500">Total Salary</p><p className="text-xl font-bold text-blue-700">₹{(data.summary.total||0).toLocaleString('en-IN')}</p></div>
            <div className="bg-green-50 rounded-xl p-4"><p className="text-xs text-green-500">Paid</p><p className="text-xl font-bold text-green-700">₹{(data.summary.paid||0).toLocaleString('en-IN')}</p></div>
            <div className="bg-red-50 rounded-xl p-4"><p className="text-xs text-red-500">Pending</p><p className="text-xl font-bold text-red-700">₹{(data.summary.pending||0).toLocaleString('en-IN')}</p></div>
            <div className="bg-purple-50 rounded-xl p-4"><p className="text-xs text-purple-500">Staff</p><p className="text-xl font-bold text-purple-700">{data.summary.staffCount||0}</p></div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div> :
            data.staff.length === 0 ? <div className="text-center py-12 text-gray-500">No active staff</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b"><tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Staff</th>
                    <th className="text-center px-3 py-3 font-medium text-green-600 hidden md:table-cell">Present</th>
                    <th className="text-center px-3 py-3 font-medium text-amber-600 hidden md:table-cell">Half</th>
                    <th className="text-center px-3 py-3 font-medium text-red-600 hidden md:table-cell">Absent</th>
                    <th className="text-right px-3 py-3 font-medium text-gray-600 hidden lg:table-cell">Base</th>
                    <th className="text-right px-3 py-3 font-medium text-red-600 hidden lg:table-cell">Deduct</th>
                    <th className="text-right px-3 py-3 font-medium text-green-600 hidden lg:table-cell">Incentive</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-800">Net</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.staff.map(s=>(
                      <tr key={s.staff_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><p className="font-medium text-gray-900">{s.name}</p><p className="text-xs text-gray-400">{s.role}</p></td>
                        <td className="px-3 py-3 text-center text-green-600 font-medium hidden md:table-cell">{s.days_present}</td>
                        <td className="px-3 py-3 text-center text-amber-600 font-medium hidden md:table-cell">{s.days_half_day}</td>
                        <td className="px-3 py-3 text-center text-red-600 font-medium hidden md:table-cell">{s.days_absent}</td>
                        <td className="px-3 py-3 text-right hidden lg:table-cell">₹{s.base_salary.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-3 text-right text-red-600 hidden lg:table-cell">{s.deductions>0?`-₹${s.deductions.toLocaleString('en-IN')}`:'—'}</td>
                        <td className="px-3 py-3 text-right text-green-600 hidden lg:table-cell">{s.incentives>0?`+₹${s.incentives.toLocaleString('en-IN')}`:'—'}</td>
                        <td className="px-4 py-3 text-right font-bold">₹{s.net_salary.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.payment_status==='paid'?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}`}>{s.payment_status==='paid'?'Paid':'Pending'}</span></td>
                        <td className="px-4 py-3 text-right">
                          {s.payment_status!=='paid'?<button onClick={()=>openPay(s)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">Pay</button>:
                          <span className="text-xs text-gray-400">{modeLabels[s.payment_mode]||''}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t font-semibold"><tr>
                    <td className="px-4 py-3">Total</td>
                    <td className="px-3 py-3 text-center text-green-600 hidden md:table-cell">{data.staff.reduce((s,r)=>s+r.days_present,0)}</td>
                    <td className="px-3 py-3 text-center text-amber-600 hidden md:table-cell">{data.staff.reduce((s,r)=>s+r.days_half_day,0)}</td>
                    <td className="px-3 py-3 text-center text-red-600 hidden md:table-cell">{data.staff.reduce((s,r)=>s+r.days_absent,0)}</td>
                    <td className="px-3 py-3 text-right hidden lg:table-cell">₹{data.staff.reduce((s,r)=>s+r.base_salary,0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-3 text-right text-red-600 hidden lg:table-cell">-₹{data.staff.reduce((s,r)=>s+r.deductions,0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-3 text-right text-green-600 hidden lg:table-cell">+₹{data.staff.reduce((s,r)=>s+r.incentives,0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right">₹{data.staff.reduce((s,r)=>s+r.net_salary,0).toLocaleString('en-IN')}</td>
                    <td colSpan={2}></td>
                  </tr></tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div> :
          history.length===0 ? <div className="text-center py-12 text-gray-500">No salary history</div> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Month</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Staff</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Paid</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {history.map(h=>(
                  <tr key={`${h.month}-${h.year}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{monthNames[h.month-1]} {h.year}</td>
                    <td className="px-4 py-3 text-center">{h.staff_count}</td>
                    <td className="px-4 py-3 text-right font-semibold">₹{parseFloat(h.total_salary).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${parseInt(h.paid_count)===parseInt(h.staff_count)?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}`}>{h.paid_count}/{h.staff_count}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={()=>setShowPayModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b"><h2 className="text-lg font-bold">Pay — {selectedStaff.name}</h2><button onClick={()=>setShowPayModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={20} /></button></div>
            <div className="p-5 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Base</span><span>₹{selectedStaff.base_salary.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Present / Half / Absent</span><span>{selectedStaff.days_present} / {selectedStaff.days_half_day} / {selectedStaff.days_absent}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Deductions</span><span className="text-red-600">-₹{selectedStaff.deductions.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Incentives</span><span className="text-green-600">+₹{selectedStaff.incentives.toLocaleString('en-IN')}</span></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Bonus (₹)</label>
                <input type="number" value={payForm.bonus} onChange={e=>setPayForm({...payForm,bonus:e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" /></div>
              <div className="p-3 bg-brand-50 rounded-lg flex justify-between items-center">
                <span className="font-medium text-brand-800">Net Salary</span>
                <span className="text-xl font-bold text-brand-700">₹{(selectedStaff.base_salary - selectedStaff.deductions + selectedStaff.incentives + (parseFloat(payForm.bonus)||0)).toLocaleString('en-IN')}</span>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{v:'cash',l:'Cash',I:Banknote},{v:'upi',l:'UPI',I:Smartphone},{v:'bank_transfer',l:'Bank',I:CreditCard}].map(m=>(
                    <button key={m.v} type="button" onClick={()=>setPayForm({...payForm,payment_mode:m.v})}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border ${payForm.payment_mode===m.v?'border-brand-500 bg-brand-50 text-brand-700':'border-gray-200'}`}><m.I size={15}/> {m.l}</button>
                  ))}
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input type="text" value={payForm.notes} onChange={e=>setPayForm({...payForm,notes:e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" /></div>
              <button onClick={handlePay} disabled={saving} className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">{saving?'Processing...':'Mark as Paid'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryPage;
