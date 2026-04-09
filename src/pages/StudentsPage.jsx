import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI, courseAPI, batchAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Search, GraduationCap, Phone, X, IndianRupee,
  Award, ChevronRight, Calendar, BookOpen, Users
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

const StudentsPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  // Helper to generate installment schedule
  const generateInstallmentDates = (numInst, enrollDate, totalFee, discount) => {
    const netFee = (parseFloat(totalFee) || 0) - (parseFloat(discount) || 0);
    const perInst = Math.ceil(netFee / numInst);
    const dates = [];
    for (let i = 0; i < numInst; i++) {
      const d = new Date(enrollDate || new Date());
      d.setMonth(d.getMonth() + i);
      const amount = i === numInst - 1 ? netFee - (perInst * (numInst - 1)) : perInst;
      dates.push({ amount: Math.max(amount, 0), due_date: d.toISOString().split('T')[0] });
    }
    return dates;
  };
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ course_id: '', batch_id: '', status: '', search: '' });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    loadCourses();
    loadBatches();
  }, []);

  useEffect(() => { loadStudents(); }, [filters.course_id, filters.batch_id, filters.status, pagination.page]);

  const loadCourses = async () => {
    try { const { data } = await courseAPI.getAll(); setCourses(data.courses); } catch (e) { console.error(e); }
  };

  const loadBatches = async () => {
    try { const { data } = await batchAPI.getAll({ active_only: 'true' }); setBatches(data.batches); } catch (e) { console.error(e); }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const { data } = await studentAPI.getAll({ ...filters, page: pagination.page, limit: 20 });
      setStudents(data.students);
      setPagination(data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    loadStudents();
  };

  const openAddModal = () => {
    setForm({
      name: '', phone: '', email: '', address: '',
      course_id: '', batch_id: '', enrollment_date: new Date().toISOString().split('T')[0],
      total_fee: '', discount: '0', payment_type: 'full', total_installments: '2',
      installment_dates: [],
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await studentAPI.create({
        ...form,
        total_fee: parseFloat(form.total_fee) || 0,
        discount: parseFloat(form.discount) || 0,
        total_installments: parseInt(form.total_installments) || 2,
        installment_details: form.installment_dates.map(d => ({ amount: parseFloat(d.amount), due_date: d.due_date })),
      });
      setShowModal(false);
      loadStudents();
    } catch (err) { alert(err.response?.data?.error || 'Failed to add student.'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await studentAPI.update(id, { status });
      loadStudents();
    } catch (e) { console.error(e); }
  };

  const handleCertChange = async (id, certificate_status) => {
    try {
      const updates = { certificate_status };
      if (certificate_status === 'issued') updates.certificate_issued_date = new Date().toISOString().split('T')[0];
      await studentAPI.update(id, updates);
      loadStudents();
    } catch (e) { console.error(e); }
  };

  // When course changes in form, auto-fill fee
  const handleCourseChange = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    setForm(f => ({
      ...f,
      course_id: courseId,
      total_fee: course?.fee_amount || '',
    }));
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by name or phone..."
              value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Search</button>
        </form>
        <button onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">
          <Plus size={18} /> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select value={filters.course_id} onChange={e => { setFilters(f => ({ ...f, course_id: e.target.value })); setPagination(p => ({ ...p, page: 1 })); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">All Courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filters.batch_id} onChange={e => { setFilters(f => ({ ...f, batch_id: e.target.value })); setPagination(p => ({ ...p, page: 1 })); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">All Batches</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPagination(p => ({ ...p, page: 1 })); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="dropped">Dropped</option>
        </select>
        <span className="self-center text-sm text-gray-500">{pagination.total} students</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <GraduationCap size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No students found</p>
            <p className="text-sm mt-1">Enroll students from leads or add manually</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Course</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Batch</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  {isAdmin && <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Fee</th>}
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Certificate</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{s.course_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{s.batch_name || '—'}</td>
                    <td className="px-4 py-3">
                      <select value={s.status} onChange={e => handleStatusChange(s.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border-0 ${statusColors[s.status]}`}>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="dropped">Dropped</option>
                      </select>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div>
                          <span className="text-green-600 font-medium">₹{parseFloat(s.total_paid || 0).toLocaleString('en-IN')}</span>
                          {parseFloat(s.total_balance || 0) > 0 && (
                            <span className="text-red-500 text-xs ml-1">(₹{parseFloat(s.total_balance).toLocaleString('en-IN')} due)</span>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <select value={s.certificate_status} onChange={e => handleCertChange(s.id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${certColors[s.certificate_status]}`}>
                        <option value="not_issued">Not Issued</option>
                        <option value="issued">Issued</option>
                        <option value="sent">Sent</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => navigate(`/students/${s.id}`)}
                        className="p-1.5 hover:bg-brand-50 rounded text-brand-600" title="View Details">
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page <= 1}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded disabled:opacity-40">Previous</button>
            <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</span>
            <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pagination.pages}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-bold">Add New Student</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date</label>
                  <input type="date" value={form.enrollment_date} onChange={e => setForm({ ...form, enrollment_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                  <select value={form.course_id} onChange={e => handleCourseChange(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white" required>
                    <option value="">Select course</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name} (₹{parseFloat(c.fee_amount).toLocaleString('en-IN')})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                  <select value={form.batch_id} onChange={e => setForm({ ...form, batch_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">Select batch</option>
                    {batches.filter(b => !form.course_id || b.course_id === form.course_id).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <hr />
              <h3 className="font-semibold text-gray-800 text-sm">Fee Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Fee (₹)</label>
                  <input type="number" value={form.total_fee} onChange={e => setForm({ ...form, total_fee: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₹)</label>
                  <input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                  <select value={form.payment_type} onChange={e => {
                    const type = e.target.value;
                    const numInst = parseInt(form.total_installments) || 2;
                    setForm(f => ({
                      ...f, payment_type: type,
                      installment_dates: type === 'installment' ? generateInstallmentDates(numInst, f.enrollment_date, f.total_fee, f.discount) : [],
                    }));
                  }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="full">Full Payment</option>
                    <option value="installment">Installments</option>
                  </select>
                </div>
                {form.payment_type === 'installment' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">No. of Installments</label>
                    <select value={form.total_installments} onChange={e => {
                      const num = parseInt(e.target.value);
                      setForm(f => ({
                        ...f, total_installments: e.target.value,
                        installment_dates: generateInstallmentDates(num, f.enrollment_date, f.total_fee, f.discount),
                      }));
                    }}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Custom Installment Dates */}
              {form.payment_type === 'installment' && form.installment_dates.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Installment Schedule</label>
                  {form.installment_dates.map((inst, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs font-semibold text-gray-500 w-6">{idx + 1}.</span>
                      <input type="number" value={inst.amount}
                        onChange={e => {
                          const updated = [...form.installment_dates];
                          updated[idx] = { ...updated[idx], amount: e.target.value };
                          setForm({ ...form, installment_dates: updated });
                        }}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm" placeholder="Amount" />
                      <span className="text-xs text-gray-400">due on</span>
                      <input type="date" value={inst.due_date}
                        onChange={e => {
                          const updated = [...form.installment_dates];
                          updated[idx] = { ...updated[idx], due_date: e.target.value };
                          setForm({ ...form, installment_dates: updated });
                        }}
                        className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                    </div>
                  ))}
                </div>
              )}
              {form.total_fee && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <span className="text-gray-500">Net Fee: </span>
                  <span className="font-semibold text-gray-900">
                    ₹{((parseFloat(form.total_fee) || 0) - (parseFloat(form.discount) || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">Add Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
