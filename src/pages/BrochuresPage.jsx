import { useEffect, useState, useRef } from 'react';
import { brochuresAPI } from '../services/api';
import { Plus, FileText, Image as ImageIcon, Trash2, BookOpen, X, MessageCircle } from 'lucide-react';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';

const BrochuresPage = () => {
  const confirm = useConfirmDialog();
  const [brochures, setBrochures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: 'products' });
  const [errors, setErrors] = useState({});
  const [filter, setFilter] = useState('');
  const fileRef = useRef();

  useEffect(() => { load(); }, [filter]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await brochuresAPI.getAll(filter ? { category: filter } : {});
      setBrochures(data.brochures || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files[0];
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Brochure name is required';
    if (!file) newErrors.file = 'Please select a file';
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('category', form.category);
      await brochuresAPI.upload(fd);
      setShowUpload(false);
      setForm({ name: '', description: '', category: 'products' });
      setErrors({});
      load();
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!await confirm({ title: 'Delete this brochure?' })) return;
    try { await brochuresAPI.delete(id); load(); } catch (e) { alert('Failed'); }
  };

  const handleShareWA = (b) => {
    const text = `Hi! Please find our brochure — *${b.name}*\n\n${b.file_url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm text-gray-500">Upload brochures, catalogs, price lists to share with leads</p>
        </div>
        <button onClick={() => { setErrors({}); setShowUpload(true); }}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 flex items-center gap-2">
          <Plus size={16} /> Upload Brochure
        </button>
      </div>

      <div className="flex gap-1 flex-wrap">
        {['', 'products', 'services', 'pricing', 'company'].map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${filter === c ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border'}`}>
            {c || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
      ) : brochures.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No brochures yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {brochures.map(b => {
            const Icon = b.file_type === 'image' ? ImageIcon : FileText;
            return (
              <div key={b.id} className="bg-white rounded-2xl border p-4 hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
                    <Icon size={22} className="text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <a href={b.file_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm hover:text-brand-600 truncate block">
                      {b.name}
                    </a>
                    {b.description && <p className="text-xs text-gray-500 line-clamp-2">{b.description}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 capitalize">{b.category}</span>
                      <span className="text-[10px] text-gray-400">Shared {b.times_shared}×</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 mt-3 pt-3 border-t">
                  <a href={b.file_url} target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-1.5 hover:bg-blue-50 rounded text-xs text-blue-600 text-center flex items-center justify-center gap-1">
                    View
                  </a>
                  <button onClick={() => handleShareWA(b)} className="flex-1 py-1.5 hover:bg-green-50 rounded text-xs text-green-600 flex items-center justify-center gap-1" title="Share via WhatsApp">
                    <MessageCircle size={12} /> Share
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="flex-1 py-1.5 hover:bg-red-50 rounded text-xs text-red-500 flex items-center justify-center gap-1">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowUpload(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold">Upload Brochure</h2>
              <button onClick={() => setShowUpload(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Brochure name <span className="text-red-500">*</span></label>
                <input type="text" value={form.name}
                  onChange={e => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors(er => ({ ...er, name: undefined })); }}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm ${errors.name ? 'border-red-500' : ''}`} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea placeholder="Optional" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white">
                  <option value="products">Products</option>
                  <option value="services">Services</option>
                  <option value="pricing">Pricing</option>
                  <option value="company">Company Info</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">File <span className="text-red-500">*</span></label>
                <input ref={fileRef} type="file" accept="application/pdf,image/*"
                  onChange={() => { if (errors.file) setErrors(er => ({ ...er, file: undefined })); }}
                  className={`w-full text-sm ${errors.file ? 'border border-red-500 rounded-lg p-1.5' : ''}`} />
                {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file}</p>}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowUpload(false)} className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={handleUpload} disabled={uploading}
                  className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrochuresPage;
