import { useState, useEffect } from 'react';
import { batchAPI, attendanceAPI } from '../services/api';
import { CheckCircle, XCircle, Clock, Users, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const AttendancePage = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reportMode, setReportMode] = useState(false);
  const [report, setReport] = useState([]);
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => { loadBatches(); }, []);

  useEffect(() => {
    if (selectedBatch && !reportMode) loadAttendance();
  }, [selectedBatch, date]);

  useEffect(() => {
    if (selectedBatch && reportMode) loadReport();
  }, [selectedBatch, reportMonth, reportMode]);

  const loadBatches = async () => {
    try {
      const { data } = await batchAPI.getAll({ active_only: 'true' });
      setBatches(data.batches);
      if (data.batches.length > 0) setSelectedBatch(data.batches[0].id);
    } catch (e) { console.error(e); }
  };

  const loadAttendance = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const { data } = await attendanceAPI.getByBatch(selectedBatch, date);
      setStudents(data.students);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const { data } = await attendanceAPI.getBatchReport(selectedBatch, reportMonth);
      setReport(data.report);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleStatus = (studentId) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const cycle = [null, 'present', 'absent', 'late'];
      const currentIndex = cycle.indexOf(s.status);
      const nextStatus = cycle[(currentIndex + 1) % cycle.length];
      return { ...s, status: nextStatus };
    }));
    setSaved(false);
  };

  const markAll = (status) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
    setSaved(false);
  };

  const saveAttendance = async () => {
    const records = students
      .filter(s => s.status !== null)
      .map(s => ({ student_id: s.id, status: s.status }));

    if (records.length === 0) {
      alert('Please mark attendance for at least one student.');
      return;
    }

    setSaving(true);
    try {
      await attendanceAPI.mark(selectedBatch, { date, records });
      setSaved(true);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to save attendance.');
    } finally { setSaving(false); }
  };

  const changeDate = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const statusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle size={22} className="text-green-500" />;
      case 'absent': return <XCircle size={22} className="text-red-500" />;
      case 'late': return <Clock size={22} className="text-amber-500" />;
      default: return <div className="w-[22px] h-[22px] rounded-full border-2 border-gray-300" />;
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'late': return 'Late';
      default: return 'Not Marked';
    }
  };

  const summary = {
    present: students.filter(s => s.status === 'present').length,
    absent: students.filter(s => s.status === 'absent').length,
    late: students.filter(s => s.status === 'late').length,
    unmarked: students.filter(s => s.status === null).length,
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-wrap">
          <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white min-w-[200px]">
            <option value="">Select Batch</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.course_name})</option>)}
          </select>

          {!reportMode && (
            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg">
              <button onClick={() => changeDate(-1)} className="px-2 py-2 hover:bg-gray-100 rounded-l-lg"><ChevronLeft size={18} /></button>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="px-2 py-2 text-sm border-0 focus:ring-0 w-[130px]" />
              <button onClick={() => changeDate(1)} className="px-2 py-2 hover:bg-gray-100 rounded-r-lg"><ChevronRight size={18} /></button>
            </div>
          )}

          {reportMode && (
            <input type="month" value={reportMonth} onChange={e => setReportMonth(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setReportMode(!reportMode)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition ${
              reportMode ? 'bg-brand-50 text-brand-700 border-brand-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}>
            {reportMode ? 'Daily View' : 'Monthly Report'}
          </button>
        </div>
      </div>

      {!selectedBatch ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Users size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-500">Select a batch to mark attendance</p>
        </div>
      ) : reportMode ? (
        /* Monthly Report View */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">Monthly Attendance Report — {reportMonth}</h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
          ) : report.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No students in this batch</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
                    <th className="text-center px-4 py-3 font-medium text-green-600">Present</th>
                    <th className="text-center px-4 py-3 font-medium text-red-600">Absent</th>
                    <th className="text-center px-4 py-3 font-medium text-amber-600">Late</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Total</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.map(r => {
                    const total = parseInt(r.present_days) + parseInt(r.absent_days) + parseInt(r.late_days);
                    const pct = total > 0 ? (((parseInt(r.present_days) + parseInt(r.late_days)) / total) * 100).toFixed(0) : 0;
                    return (
                      <tr key={r.student_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{r.name}</p>
                          <p className="text-xs text-gray-400">{r.phone}</p>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-green-600">{r.present_days}</td>
                        <td className="px-4 py-3 text-center font-semibold text-red-600">{r.absent_days}</td>
                        <td className="px-4 py-3 text-center font-semibold text-amber-600">{r.late_days}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{total}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold ${pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Daily Attendance View */
        <>
          {/* Summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Present', count: summary.present, color: 'text-green-600 bg-green-50' },
              { label: 'Absent', count: summary.absent, color: 'text-red-600 bg-red-50' },
              { label: 'Late', count: summary.late, color: 'text-amber-600 bg-amber-50' },
              { label: 'Unmarked', count: summary.unmarked, color: 'text-gray-600 bg-gray-50' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Quick mark buttons */}
          <div className="flex gap-2">
            <button onClick={() => markAll('present')} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100">
              Mark All Present
            </button>
            <button onClick={() => markAll('absent')} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100">
              Mark All Absent
            </button>
          </div>

          {/* Student list */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No active students in this batch</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {students.map(s => (
                  <button key={s.id} onClick={() => toggleStatus(s.id)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition text-left">
                    <div className="flex items-center gap-3">
                      {statusIcon(s.status)}
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.phone}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      s.status === 'present' ? 'bg-green-100 text-green-700' :
                      s.status === 'absent' ? 'bg-red-100 text-red-700' :
                      s.status === 'late' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {statusLabel(s.status)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Save button */}
          {students.length > 0 && (
            <button onClick={saveAttendance} disabled={saving}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition ${
                saved ? 'bg-green-600 text-white' : 'bg-brand-600 text-white hover:bg-brand-700'
              } disabled:opacity-50`}>
              {saving ? 'Saving...' : saved ? '✓ Attendance Saved!' : 'Save Attendance'}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default AttendancePage;
