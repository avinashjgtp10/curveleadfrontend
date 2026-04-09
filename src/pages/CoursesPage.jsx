import { useState, useEffect } from 'react';
import { courseAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, X, BookOpen, IndianRupee, Clock } from 'lucide-react';

const CoursesPage = () => {
  const { isAdmin } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', duration_value: '', duration_unit: 'months', fee_amount: '' });

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    try {
      const { data } = await courseAPI.getAll();
      setCourses(data.courses);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setSelected(null);
    setForm({ name: '', description: '', duration_value: '', duration_unit: 'months', fee_amount: '' });
    setShowModal(true);
  };

  const openEdit = (course) => {
    setSelected(course);
    setForm({
      name: course.name, description: course.description || '',
      duration_value: course.duration_value || '', duration_unit: course.duration_unit || 'months',
      fee_amount: course.fee_amount || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selected) {
        await courseAPI.update(selected.id, form);
      } else {
        await courseAPI.create(form);
      }
      setShowModal(false);
      loadCourses();
    } catch (err) { alert(err.response?.data?.error || 'Failed to save course.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this course?')) return;
    try {
      await courseAPI.delete(id);
      loadCourses();
    } catch (err) { alert('Failed to delete course.'); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{courses.length} courses</p>
        {isAdmin && (
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">
            <Plus size={18} /> Add Course
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map(course => (
          <div key={course.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                <BookOpen size={20} className="text-brand-600" />
              </div>
              {isAdmin && (
                <div className="flex gap-1">
                  <button onClick={() => openEdit(course)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(course.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">{course.name}</h3>
            {course.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description}</p>}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
              {course.duration_value && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock size={14} /> {course.duration_value} {course.duration_unit}
                </div>
              )}
              <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                <IndianRupee size={14} /> {parseFloat(course.fee_amount).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No courses yet</p>
          <p className="text-sm mt-1">Add your first course to get started</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">{selected ? 'Edit Course' : 'Add Course'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="e.g. Advanced Hair Styling" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none" placeholder="Course details..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input type="number" value={form.duration_value} onChange={e => setForm({ ...form, duration_value: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="e.g. 6" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select value={form.duration_unit} onChange={e => setForm({ ...form, duration_unit: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Amount (₹) *</label>
                <input type="number" value={form.fee_amount} onChange={e => setForm({ ...form, fee_amount: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="e.g. 25000" required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">
                  {selected ? 'Update' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
