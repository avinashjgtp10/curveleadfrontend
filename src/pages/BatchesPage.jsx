import { useState, useEffect } from 'react';
import { batchAPI, courseAPI, staffAPI } from '../services/api';
import PageLoader from '../components/ui/PageLoader';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, X, Users, Calendar, BookOpen } from 'lucide-react';

const BatchesPage = () => {
  const { isAdmin } = useAuth();
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ course_id: '', name: '', trainer_name: '', start_date: '', end_date: '', capacity: '20' });

  useEffect(() => { loadBatches(); loadCourses(); loadTrainers(); }, []);

  const loadBatches = async () => {
    try { const { data } = await batchAPI.getAll(); setBatches(data.batches); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadCourses = async () => {
    try { const { data } = await courseAPI.getAll(); setCourses(data.courses); }
    catch (e) { console.error(e); }
  };

  const loadTrainers = async () => {
    try { const { data } = await staffAPI.getTrainers(); setTrainers(data.trainers); }
    catch (e) { console.error(e); }
  };

  const openAdd = () => {
    setSelected(null);
    setForm({ course_id: '', name: '', trainer_name: '', start_date: '', end_date: '', capacity: '20' });
    setShowModal(true);
  };

  const openEdit = (batch) => {
    setSelected(batch);
    setForm({
      course_id: batch.course_id || '', name: batch.name,
      trainer_name: batch.trainer_name || '',
      start_date: batch.start_date ? batch.start_date.split('T')[0] : '',
      end_date: batch.end_date ? batch.end_date.split('T')[0] : '',
      capacity: batch.capacity || '20',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, capacity: parseInt(form.capacity) || 20 };
      if (selected) { await batchAPI.update(selected.id, payload); }
      else { await batchAPI.create(payload); }
      setShowModal(false);
      loadBatches();
    } catch (err) { alert(err.response?.data?.error || 'Failed to save batch.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this batch?')) return;
    try { await batchAPI.delete(id); loadBatches(); }
    catch (e) { alert('Failed.'); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{batches.length} batches</p>
        {isAdmin && (
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">
            <Plus size={18} /> Add Batch
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {batches.map(batch => (
          <div key={batch.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${batch.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {batch.is_active ? 'Active' : 'Inactive'}
              </div>
              {isAdmin && (
                <div className="flex gap-1">
                  <button onClick={() => openEdit(batch)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Edit2 size={15} /></button>
                  <button onClick={() => handleDelete(batch.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                </div>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">{batch.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{batch.course_name || 'No course'}</p>
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-gray-100 text-sm text-gray-500">
              {batch.trainer_name && <span className="flex items-center gap-1"><Users size={14} /> {batch.trainer_name}</span>}
              <span className="flex items-center gap-1"><Users size={14} /> {batch.student_count || 0}/{batch.capacity}</span>
              {batch.start_date && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} /> {new Date(batch.start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {batches.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No batches yet</p>
          <p className="text-sm mt-1">Create your first batch to start assigning students</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">{selected ? 'Edit Batch' : 'Add Batch'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                <select value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white" required>
                  <option value="">Select course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="e.g. Morning Batch - April 2026" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trainer</label>
                  <select value={form.trainer_name} onChange={e => setForm({ ...form, trainer_name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">Select trainer</option>
                    {trainers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                  {trainers.length === 0 && <p className="text-xs text-gray-400 mt-1">Add staff with role "Trainer" first</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">
                  {selected ? 'Update' : 'Add Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchesPage;
