import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentAPI, attendanceAPI, feeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Phone, MessageCircle, GraduationCap, BookOpen, Calendar,
  IndianRupee, Award, Clock, CheckCircle, XCircle, MapPin, Mail, User, Trash2, Download, Send
} from 'lucide-react';

const statusColors = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  dropped: 'bg-red-100 text-red-700',
};

const certColors = {
  not_issued: 'bg-gray-100 text-gray-600',
  issued: 'bg-amber-100 text-amber-700',
  sent: 'bg-green-100 text-green-700',
};

const StudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [student, setStudent] = useState(null);
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditFeeModal, setShowEditFeeModal] = useState(false);
  const [editFeeForm, setEditFeeForm] = useState({ id: '', total_fee: '', discount: '', payment_type: '' });
  const [savingFee, setSavingFee] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const { data } = await studentAPI.getOne(id);
      setStudent(data.student);
      setFees(data.fees || []);
      setPayments(data.payments || []);
      setAttendanceSummary(data.attendanceSummary || []);
    } catch (error) {
      console.error('Load student error:', error);
    } finally { setLoading(false); }
  };

  const handleEditFee = async () => {
    setSavingFee(true);
    try {
      const totalFee = parseFloat(editFeeForm.total_fee) || 0;
      const discount = parseFloat(editFeeForm.discount) || 0;
      const netFee = totalFee - discount;
      const amountPaid = parseFloat(fees[0]?.amount_paid) || 0;
      const balance = netFee - amountPaid;
      const status = balance <= 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'pending';

      await feeAPI.updateFee(editFeeForm.id, {
        total_fee: totalFee,
        discount,
        net_fee: netFee,
        balance,
        status,
        payment_type: editFeeForm.payment_type,
      });
      setShowEditFeeModal(false);
      loadData();
    } catch (e) { alert(e.response?.data?.error || 'Failed to update fee.'); }
    finally { setSavingFee(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Student not found.</p>
        <button onClick={() => navigate(-1)} className="mt-3 text-brand-600 font-medium">← Back to Students</button>
      </div>
    );
  }

  const presentDays = attendanceSummary.find(a => a.status === 'present')?.count || 0;
  const absentDays = attendanceSummary.find(a => a.status === 'absent')?.count || 0;
  const lateDays = attendanceSummary.find(a => a.status === 'late')?.count || 0;
  const totalDays = parseInt(presentDays) + parseInt(absentDays) + parseInt(lateDays);
  const attendancePct = totalDays > 0 ? (((parseInt(presentDays) + parseInt(lateDays)) / totalDays) * 100).toFixed(0) : 0;

  const totalPaid = fees.reduce((sum, f) => sum + parseFloat(f.amount_paid || 0), 0);
  const totalBalance = fees.reduce((sum, f) => sum + parseFloat(f.balance || 0), 0);
  const totalFee = fees.reduce((sum, f) => sum + parseFloat(f.net_fee || 0), 0);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back to Students
      </button>

      {/* Student Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-brand-700 font-bold text-2xl">{student.name?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{student.name}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Phone size={14} /> {student.phone}</span>
                  {student.email && <span className="flex items-center gap-1"><Mail size={14} /> {student.email}</span>}
                  {student.address && <span className="flex items-center gap-1"><MapPin size={14} /> {student.address}</span>}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[student.status]}`}>
                {student.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
              {student.course_name && (
                <div className="flex items-center gap-1.5"><BookOpen size={15} className="text-gray-400" /> {student.course_name}</div>
              )}
              {student.batch_name && (
                <div className="flex items-center gap-1.5"><User size={15} className="text-gray-400" /> {student.batch_name}</div>
              )}
              <div className="flex items-center gap-1.5"><Calendar size={15} className="text-gray-400" /> Enrolled: {new Date(student.enrollment_date).toLocaleDateString('en-IN')}</div>
              {student.expected_completion && (
                <div className="flex items-center gap-1.5"><Clock size={15} className="text-gray-400" /> Ends: {new Date(student.expected_completion).toLocaleDateString('en-IN')}</div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Contact */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <a href={`tel:${student.phone}`} className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100">
            <Phone size={16} /> Call
          </a>
          <a href={`https://wa.me/91${student.phone?.replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100">
            <MessageCircle size={16} /> WhatsApp
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isAdmin && (
          <>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-xs font-medium text-green-500">Fee Paid</p>
              <p className="text-lg font-bold text-green-700 mt-1">₹{totalPaid.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-xs font-medium text-red-500">Balance Due</p>
              <p className="text-lg font-bold text-red-700 mt-1">₹{totalBalance.toLocaleString('en-IN')}</p>
            </div>
          </>
        )}
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs font-medium text-blue-500">Attendance</p>
          <p className="text-lg font-bold text-blue-700 mt-1">{attendancePct}% <span className="text-xs font-normal">({totalDays} days)</span></p>
        </div>
        <div className={`rounded-xl p-4 ${certColors[student.certificate_status]}`}>
          <p className="text-xs font-medium opacity-70">Certificate</p>
          <p className="text-lg font-bold mt-1 capitalize">{student.certificate_status?.replace(/_/g, ' ')}</p>
        </div>
      </div>

      {/* Attendance Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <GraduationCap size={18} /> Attendance Summary
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle size={20} className="text-green-500" />
            <div>
              <p className="text-xs text-green-600">Present</p>
              <p className="text-lg font-bold text-green-700">{presentDays}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <XCircle size={20} className="text-red-500" />
            <div>
              <p className="text-xs text-red-600">Absent</p>
              <p className="text-lg font-bold text-red-700">{absentDays}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
            <Clock size={20} className="text-amber-500" />
            <div>
              <p className="text-xs text-amber-600">Late</p>
              <p className="text-lg font-bold text-amber-700">{lateDays}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Details (Admin only) */}
      {isAdmin && fees.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <IndianRupee size={18} /> Fee Details
            </h3>
            <button onClick={() => {
              const f = fees[0];
              setEditFeeForm({
                id: f.id,
                total_fee: f.total_fee,
                discount: f.discount,
                payment_type: f.payment_type,
              });
              setShowEditFeeModal(true);
            }} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200">
              Edit Fee
            </button>
          </div>
          {fees.map(fee => (
            <div key={fee.id} className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Fee</span>
                <span className="font-medium">₹{parseFloat(fee.total_fee).toLocaleString('en-IN')}</span>
              </div>
              {parseFloat(fee.discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="font-medium text-green-600">-₹{parseFloat(fee.discount).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-gray-700 font-medium">Net Fee</span>
                <span className="font-bold">₹{parseFloat(fee.net_fee).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Paid</span>
                <span className="font-medium text-green-600">₹{parseFloat(fee.amount_paid).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Balance</span>
                <span className="font-medium text-red-600">₹{parseFloat(fee.balance).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment Type</span>
                <span className="font-medium capitalize">{fee.payment_type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  fee.status === 'paid' ? 'bg-green-100 text-green-700' :
                  fee.status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                }`}>{fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment History (Admin only) */}
      {isAdmin && payments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Payment History</h3>
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <span className="font-semibold text-green-600">₹{parseFloat(p.amount).toLocaleString('en-IN')}</span>
                  <span className="text-gray-400 ml-2">{new Date(p.payment_date).toLocaleDateString('en-IN')}</span>
                  <span className="text-gray-400 ml-2 capitalize">{p.payment_mode?.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400 mr-2">{p.receipt_number}</span>
                  <button onClick={async () => {
                    try {
                      const { data } = await feeAPI.downloadReceiptPDF(p.student_fee_id, p.id);
                      const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
                      const a = document.createElement('a'); a.href = url; a.download = `Receipt_${p.receipt_number}.pdf`; a.click();
                      window.URL.revokeObjectURL(url);
                    } catch (e) { alert('Failed to download PDF'); }
                  }} className="p-1.5 hover:bg-blue-50 rounded text-blue-500" title="Download PDF">
                    <Download size={14} />
                  </button>
                  {student.email && (
                    <button onClick={async () => {
                      try {
                        await feeAPI.emailReceipt(p.student_fee_id, p.id, { email: student.email });
                        alert(`Receipt emailed to ${student.email}`);
                      } catch (e) { alert(e.response?.data?.error || 'Failed to send email'); }
                    }} className="p-1.5 hover:bg-green-50 rounded text-green-500" title="Email Receipt">
                      <Send size={14} />
                    </button>
                  )}
                  <button onClick={async () => {
                    if (!window.confirm('Delete this payment? Balance will be restored.')) return;
                    try { await feeAPI.deletePayment(p.id); loadData(); } catch (e) { alert('Failed'); }
                  }} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500" title="Delete Payment">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Student Button */}
      {isAdmin && (
        <div className="pt-4 border-t border-gray-200">
          <button onClick={async () => {
            if (!window.confirm('Delete this student and all their records? This cannot be undone.')) return;
            try { await studentAPI.delete(id); navigate('/students'); } catch (e) { alert('Failed'); }
          }} className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition">
            <Trash2 size={16} className="inline mr-2" />Delete Student
          </button>
        </div>
      )}
      {/* Edit Fee Modal */}
      {showEditFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowEditFeeModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">Edit Fee Details</h2>
              <button onClick={() => setShowEditFeeModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Trash2 size={0} /><span className="text-xl leading-none">&times;</span></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Fee (₹)</label>
                <input type="number" value={editFeeForm.total_fee} onChange={e => setEditFeeForm({...editFeeForm, total_fee: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₹)</label>
                <input type="number" value={editFeeForm.discount} onChange={e => setEditFeeForm({...editFeeForm, discount: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="p-3 bg-brand-50 rounded-lg flex justify-between">
                <span className="text-sm font-medium text-brand-800">Net Fee</span>
                <span className="text-sm font-bold text-brand-700">₹{((parseFloat(editFeeForm.total_fee) || 0) - (parseFloat(editFeeForm.discount) || 0)).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                <select value={editFeeForm.payment_type} onChange={e => setEditFeeForm({...editFeeForm, payment_type: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="full">Full Payment</option>
                  <option value="installment">Installments</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowEditFeeModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={handleEditFee} disabled={savingFee}
                  className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
                  {savingFee ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetailPage;
