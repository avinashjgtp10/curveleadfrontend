import { useEffect, useMemo, useState, useRef } from 'react';
import { brochuresAPI } from '../services/api';
import {
  Plus, FileText, Image as ImageIcon, Trash2, BookOpen, X, MessageCircle,
  Search, ChevronDown, Upload, Sparkles, Eye, Send, HardDrive, MoreVertical,
  LayoutGrid, List, ArrowLeft, ArrowRight, ImagePlus, Share2, Download, Check,
} from 'lucide-react';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'products', label: 'Products' },
  { value: 'services', label: 'Services' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'company', label: 'Company' },
];

const CATEGORY_BADGE = {
  products: 'bg-indigo-50 text-indigo-600',
  services: 'bg-sky-50 text-sky-600',
  pricing: 'bg-amber-50 text-amber-700',
  company: 'bg-emerald-50 text-emerald-700',
  general: 'bg-gray-100 text-gray-600',
};

const COVER_GRADIENTS = [
  'from-stone-200 to-stone-300 text-stone-800',
  'from-rose-200 to-pink-300 text-rose-900',
  'from-neutral-900 to-neutral-700 text-amber-300',
  'from-slate-700 to-slate-900 text-white',
  'from-emerald-100 to-teal-200 text-emerald-900',
  'from-amber-100 to-orange-200 text-orange-900',
  'from-blue-900 to-indigo-950 text-white',
  'from-orange-100 to-amber-200 text-amber-900',
];

const emptyForm = { name: '', category: '', description: '', coverImage: null, coverPreview: '' };
const emptySharing = { allowSharing: true, trackViews: true, allowDownload: false, notify: true };

const fmtSize = (bytes) => {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return '';
  return dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`w-10 h-6 rounded-full relative transition-colors shrink-0 border ${checked ? 'bg-brand-600 border-brand-600' : 'bg-gray-200 border-gray-200'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
  </button>
);

const BrochuresPage = () => {
  const confirm = useConfirmDialog();
  const [brochures, setBrochures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');
  const [openMenu, setOpenMenu] = useState(null);
  const [statFilter, setStatFilter] = useState('');
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [sharing, setSharing] = useState(emptySharing);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef();
  const coverInputRef = useRef();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await brochuresAPI.getAll();
      setBrochures(data.brochures || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const categoryCounts = useMemo(() => {
    const counts = {};
    brochures.forEach(b => { counts[b.category] = (counts[b.category] || 0) + 1; });
    return counts;
  }, [brochures]);

  const stats = useMemo(() => {
    const totalViews = brochures.reduce((sum, b) => sum + (b.views || 0), 0);
    const sharedCount = brochures.filter(b => (b.times_shared || 0) > 0).length;
    const totalBytes = brochures.reduce((sum, b) => sum + (b.file_size || 0), 0);
    return { total: brochures.length, shared: sharedCount, views: totalViews, size: fmtSize(totalBytes) || '0 MB' };
  }, [brochures]);

  const filtered = useMemo(() => {
    let list = brochures.filter(b =>
      (!category || b.category === category) &&
      (!search || b.name.toLowerCase().includes(search.toLowerCase())) &&
      (statFilter !== 'shared' || (b.times_shared || 0) > 0) &&
      (statFilter !== 'viewed' || (b.views || 0) > 0)
    );
    if (statFilter === 'viewed') list = [...list].sort((a, b) => (b.views || 0) - (a.views || 0));
    else if (statFilter === 'shared') list = [...list].sort((a, b) => (b.times_shared || 0) - (a.times_shared || 0));
    else if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'views') list = [...list].sort((a, b) => (b.views || 0) - (a.views || 0));
    else if (sortBy === 'shares') list = [...list].sort((a, b) => (b.times_shared || 0) - (a.times_shared || 0));
    else list = [...list].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return list;
  }, [brochures, category, search, sortBy, statFilter]);

  const resetWizard = () => {
    setStep(1); setForm(emptyForm); setSharing(emptySharing); setFile(null); setErrors({});
  };

  const openWizard = () => { resetWizard(); setCreateMenuOpen(false); setShowWizard(true); };

  const handleCoverChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setForm(prev => ({ ...prev, coverImage: f, coverPreview: URL.createObjectURL(f) }));
  };

  const goNext = () => {
    if (step === 1) {
      const errs = {};
      if (!form.name.trim()) errs.name = 'Brochure name is required';
      if (!form.category) errs.category = 'Category is required';
      setErrors(errs);
      if (Object.keys(errs).length) return;
    }
    if (step === 2 && !file) {
      setErrors({ file: 'Please select a file' });
      return;
    }
    setErrors({});
    setStep(s => Math.min(4, s + 1));
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('category', form.category);
      await brochuresAPI.upload(fd);
      setShowWizard(false);
      resetWizard();
      load();
    } catch (e) { alert(e.response?.data?.error || 'Failed to publish brochure'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setOpenMenu(null);
    if (!await confirm({ title: 'Delete this brochure?' })) return;
    try { await brochuresAPI.delete(id); load(); } catch (e) { alert('Failed'); }
  };

  const handleShareWA = (b) => {
    const text = `Hi! Please find our brochure — *${b.name}*\n\n${b.file_url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const STATS = [
    { key: '', label: 'Total Brochures', value: stats.total, sub: 'All categories', icon: FileText, iconCls: 'bg-indigo-100 text-indigo-600' },
    { key: 'shared', label: 'Shared Brochures', value: stats.shared, sub: 'With leads', icon: Send, iconCls: 'bg-emerald-100 text-emerald-600' },
    { key: 'viewed', label: 'Total Views', value: stats.views, sub: 'All brochures', icon: Eye, iconCls: 'bg-orange-100 text-orange-600' },
    { key: '', label: 'Total Size', value: stats.size, sub: 'All files', icon: HardDrive, iconCls: 'bg-blue-100 text-blue-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500">Manage and share brochures, catalogs, and price lists with your leads.</p>
        <div className="relative">
          <button onClick={() => setCreateMenuOpen(o => !o)}
            className="px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 flex items-center gap-2">
            <Plus size={16} /> Create Brochure <ChevronDown size={14} />
          </button>
          {createMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setCreateMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border shadow-xl z-20 p-2">
                <p className="text-xs font-semibold text-gray-500 px-2 py-1.5">Choose how you want to create</p>
                <button onClick={openWizard} className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-left">
                  <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shrink-0"><Upload size={16} /></div>
                  <div>
                    <p className="text-sm font-semibold">Upload File</p>
                    <p className="text-xs text-gray-500">Upload PDF, DOC, or other files</p>
                  </div>
                </button>
                <button onClick={() => { setCreateMenuOpen(false); alert('Create Manually is coming soon.'); }}
                  className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-left">
                  <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center text-violet-600 shrink-0"><Sparkles size={16} /></div>
                  <div>
                    <p className="text-sm font-semibold">Create Manually</p>
                    <p className="text-xs text-gray-500">Build brochure inside CurveLead</p>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map(s => {
          const clickable = !!s.key;
          const active = clickable && statFilter === s.key;
          return (
            <button key={s.label} type="button"
              onClick={clickable ? () => setStatFilter(f => f === s.key ? '' : s.key) : undefined}
              className={`bg-white rounded-2xl p-4 border text-left transition ${clickable ? 'cursor-pointer hover:shadow-md hover:border-brand-300' : 'cursor-default'} ${active ? 'ring-2 ring-brand-500 border-brand-300' : ''}`}>
              <div className={`w-10 h-10 ${s.iconCls} rounded-xl flex items-center justify-center shrink-0`}>
                <s.icon size={18} />
              </div>
              <p className="text-2xl font-bold mt-3 text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              <p className="text-[11px] text-gray-400 mt-1">{s.sub}</p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search brochures..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="px-3 py-2.5 border rounded-lg text-sm bg-white">
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.value ? c.label : 'Category: All'}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="px-3 py-2.5 border rounded-lg text-sm bg-white">
          <option value="recent">Sort: Recently Created</option>
          <option value="name">Sort: Name</option>
          <option value="views">Sort: Most Viewed</option>
          <option value="shares">Sort: Most Shared</option>
        </select>
        <div className="flex border rounded-lg overflow-hidden">
          <button onClick={() => setViewMode('grid')} className={`p-2.5 ${viewMode === 'grid' ? 'bg-brand-600 text-white' : 'bg-white text-gray-500'}`}><LayoutGrid size={16} /></button>
          <button onClick={() => setViewMode('list')} className={`p-2.5 ${viewMode === 'list' ? 'bg-brand-600 text-white' : 'bg-white text-gray-500'}`}><List size={16} /></button>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setCategory(c.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${category === c.value ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border'}`}>
            {c.label} ({c.value ? (categoryCounts[c.value] || 0) : brochures.length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-2'}>
          {filtered.map((b, i) => {
            const gradient = COVER_GRADIENTS[i % COVER_GRADIENTS.length];
            if (viewMode === 'list') {
              return (
                <div key={b.id} className="bg-white rounded-xl border p-3 flex items-center gap-3 hover:shadow-md transition">
                  <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{b.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] capitalize ${CATEGORY_BADGE[b.category] || CATEGORY_BADGE.general}`}>{b.category}</span>
                      <span className="text-[11px] text-gray-400">Created: {fmtDate(b.created_at) || '—'}</span>
                      <span className="text-[11px] text-gray-400">{b.views || 0} Views</span>
                      <span className="text-[11px] text-gray-400">{b.times_shared || 0} Shares</span>
                    </div>
                  </div>
                  <a href={b.file_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 border rounded-lg text-xs font-medium text-brand-600">View</a>
                  <button onClick={() => handleShareWA(b)} className="px-3 py-1.5 border rounded-lg text-xs font-medium text-green-600">Share</button>
                  <button onClick={() => handleDelete(b.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={14} /></button>
                </div>
              );
            }
            return (
              <div key={b.id} className="bg-white rounded-2xl border overflow-hidden hover:shadow-md transition">
                <div className={`relative h-32 bg-gradient-to-br ${gradient} p-4 flex flex-col justify-between`}>
                  <div className="relative">
                    <button onClick={() => setOpenMenu(openMenu === b.id ? null : b.id)}
                      className="absolute top-0 right-0 p-1 rounded-md hover:bg-black/10">
                      <MoreVertical size={16} />
                    </button>
                    {openMenu === b.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                        <div className="absolute top-6 right-0 w-40 bg-white rounded-lg border shadow-xl z-20 py-1 text-gray-700">
                          <a href={b.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50"><Download size={12} /> Download</a>
                          <button onClick={() => handleDelete(b.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-50 text-red-500"><Trash2 size={12} /> Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                  {b.file_type === 'image' ? <ImageIcon size={26} className="opacity-80" /> : <FileText size={26} className="opacity-80" />}
                  <p className="font-bold text-sm leading-tight uppercase line-clamp-2">{b.name}</p>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm truncate">{b.name}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] capitalize shrink-0 ${CATEGORY_BADGE[b.category] || CATEGORY_BADGE.general}`}>{b.category}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">Created: {fmtDate(b.created_at) || '—'}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] text-gray-500 flex items-center gap-1"><Eye size={12} /> {b.views || 0} Views</span>
                    <span className="text-[11px] text-gray-500 flex items-center gap-1"><Share2 size={12} /> {b.times_shared || 0} Shares</span>
                  </div>
                  <div className="flex gap-1.5 mt-3">
                    <a href={b.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 py-1.5 border rounded-lg text-xs font-medium text-brand-600 text-center">View</a>
                    <button onClick={() => handleShareWA(b)} className="flex-1 py-1.5 border rounded-lg text-xs font-medium text-brand-600 flex items-center justify-center gap-1">
                      <MessageCircle size={12} /> Share
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {viewMode === 'grid' && (
            <button onClick={openWizard}
              className="border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-6 min-h-[280px] hover:border-brand-400 hover:bg-brand-50/30 transition">
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-500 mb-3"><FileText size={22} /></div>
              <p className="font-semibold text-sm">{filtered.length === 0 ? 'No Brochures Yet' : 'Add Another'}</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Create and upload brochures to share with your leads and customers.</p>
              <span className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"><Plus size={14} /> Create Brochure</span>
            </button>
          )}
        </div>
      )}

      {!loading && filtered.length === 0 && viewMode === 'list' && (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No brochures found</p>
        </div>
      )}

      {/* ── Create Brochure Wizard ── */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowWizard(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b shrink-0">
              <h2 className="text-lg font-bold">Create Brochure</h2>
              <button onClick={() => setShowWizard(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>

            <div className="flex items-center gap-2 px-5 pt-4 shrink-0 overflow-x-auto">
              {['Basic Information', 'Upload File', 'Sharing Settings', 'Preview'].map((label, idx) => {
                const n = idx + 1;
                const active = step === n;
                const done = step > n;
                return (
                  <div key={label} className="flex items-center gap-2 shrink-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                      active ? 'bg-brand-600 text-white' : done ? 'bg-brand-100 text-brand-600 ring-1 ring-brand-300' : 'bg-gray-100 text-gray-400'}`}>
                      {done ? <Check size={13} strokeWidth={3} /> : n}
                    </div>
                    <span className={`text-xs font-medium whitespace-nowrap ${active ? 'text-brand-600' : done ? 'text-gray-600' : 'text-gray-400'}`}>{label}</span>
                    {n < 4 && <div className={`w-8 h-px ${done ? 'bg-brand-300' : 'bg-gray-200'}`} />}
                  </div>
                );
              })}
            </div>
            <div className="border-b mt-4 shrink-0" />

            <div className="p-5 overflow-y-auto flex-1">
              {step === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Brochure Name <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="Enter brochure name" value={form.name}
                        onChange={e => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors(er => ({ ...er, name: undefined })); }}
                        className={`w-full px-3 py-2.5 border rounded-lg text-sm ${errors.name ? 'border-red-500' : ''}`} />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Category <span className="text-red-500">*</span></label>
                      <select value={form.category}
                        onChange={e => { setForm({ ...form, category: e.target.value }); if (errors.category) setErrors(er => ({ ...er, category: undefined })); }}
                        className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white ${errors.category ? 'border-red-500' : ''}`}>
                        <option value="">Select category</option>
                        <option value="products">Products</option>
                        <option value="services">Services</option>
                        <option value="pricing">Pricing</option>
                        <option value="company">Company</option>
                        <option value="general">General</option>
                      </select>
                      {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                      <textarea placeholder="Enter description (optional)" maxLength={250} rows={4} value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        className="w-full px-3 py-2.5 border rounded-lg text-sm" />
                      <p className="text-[11px] text-gray-400 text-right mt-0.5">{form.description.length}/250</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cover Image (Optional)</label>
                    <div onClick={() => coverInputRef.current?.click()}
                      className="border-2 border-dashed rounded-xl h-56 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-400 hover:bg-gray-50 p-4">
                      {form.coverPreview ? (
                        <img src={form.coverPreview} alt="cover" className="max-h-full max-w-full rounded-lg object-cover" />
                      ) : (
                        <>
                          <ImagePlus size={28} className="text-gray-300 mb-2" />
                          <p className="text-sm text-gray-500">Drag & drop image here</p>
                          <p className="text-xs text-gray-400 my-1">or</p>
                          <span className="px-3 py-1.5 border rounded-lg text-xs font-medium text-brand-600">Browse Image</span>
                          <p className="text-[11px] text-gray-400 mt-2">JPG, PNG or WEBP (Max. 2MB)</p>
                        </>
                      )}
                    </div>
                    <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <p className="text-sm font-semibold mb-0.5">Upload Brochure File</p>
                    <p className="text-xs text-gray-500 mb-3">Upload your brochure, catalog, or price list file</p>
                    <div onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl h-40 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-400 hover:bg-gray-50 ${errors.file ? 'border-red-400' : ''}`}>
                      <Upload size={26} className="text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">Drag & drop your file here</p>
                      <p className="text-xs text-gray-400 my-1">or</p>
                      <span className="px-3 py-1.5 border rounded-lg text-xs font-medium text-brand-600">Browse Files</span>
                      <p className="text-[11px] text-gray-400 mt-2">PDF, DOC, DOCX (Max. 10MB)</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setErrors(er => ({ ...er, file: undefined })); } }} />
                    {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file}</p>}
                    {file && (
                      <div className="mt-3 flex items-center gap-2 border rounded-lg p-2.5">
                        <FileText size={18} className="text-red-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{file.name}</p>
                          <p className="text-[11px] text-gray-400">{fmtSize(file.size)}</p>
                        </div>
                        <span className="w-4 h-4 rounded-full bg-green-500 shrink-0" />
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm font-semibold mb-2">File Guidelines</p>
                    <ul className="space-y-2 text-xs text-gray-500">
                      <li>Supported formats: PDF, DOC, DOCX</li>
                      <li>Maximum file size: 10MB</li>
                      <li>For best experience, upload PDF</li>
                      <li>Your file will be securely stored</li>
                    </ul>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold">Sharing & Visibility Settings</p>
                    <p className="text-xs text-gray-500">Choose how you want to share this brochure with your leads</p>
                  </div>
                  {[
                    { key: 'allowSharing', label: 'Allow Sharing with Leads', sub: 'Enable leads to view and access this brochure', icon: FileText },
                    { key: 'trackViews', label: 'Track Brochure Views', sub: 'Track how many times this brochure is viewed', icon: Eye },
                    { key: 'allowDownload', label: 'Allow File Download', sub: 'Leads can download the brochure file', icon: Download },
                  ].map(opt => (
                    <div key={opt.key} className="flex items-center justify-between gap-3 border rounded-xl p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shrink-0"><opt.icon size={16} /></div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{opt.label}</p>
                          <p className="text-xs text-gray-500">{opt.sub}</p>
                        </div>
                      </div>
                      <Toggle checked={sharing[opt.key]} onChange={v => setSharing({ ...sharing, [opt.key]: v })} />
                    </div>
                  ))}
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-gray-600 mb-1.5">Additional Options</p>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={sharing.notify} onChange={e => setSharing({ ...sharing, notify: e.target.checked })} />
                      Notify me when brochure is viewed
                    </label>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <p className="text-sm font-semibold mb-2">Brochure Preview</p>
                    <div className="border rounded-xl p-3">
                      <div className={`h-52 rounded-lg bg-gradient-to-br ${COVER_GRADIENTS[0]} flex items-center justify-center overflow-hidden`}>
                        {form.coverPreview ? (
                          <img src={form.coverPreview} alt="cover" className="w-full h-full object-cover" />
                        ) : (
                          <p className="font-bold uppercase text-center px-4">{form.name || 'Brochure'}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-3 mt-2 text-gray-400">
                        <button className="p-1 hover:text-gray-600"><ArrowLeft size={16} /></button>
                        <span className="text-xs">1 / 1</span>
                        <button className="p-1 hover:text-gray-600"><ArrowRight size={16} /></button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2">Brochure Summary</p>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between gap-2"><span className="text-gray-500">Brochure Name</span><span className="font-medium text-right">{form.name || '—'}</span></div>
                      <div className="flex justify-between gap-2"><span className="text-gray-500">Category</span><span className="font-medium text-right capitalize">{form.category || '—'}</span></div>
                      <div className="flex justify-between gap-2"><span className="text-gray-500">Description</span><span className="font-medium text-right">{form.description || '—'}</span></div>
                      <div className="flex justify-between gap-2"><span className="text-gray-500">File Name</span><span className="font-medium text-right">{file ? `${file.name} (${fmtSize(file.size)})` : '—'}</span></div>
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-500">Sharing Settings</span>
                        <span className="font-medium text-right">
                          Sharing {sharing.allowSharing ? 'enabled' : 'disabled'}, View tracking {sharing.trackViews ? 'on' : 'off'}, Download {sharing.allowDownload ? 'on' : 'off'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-5 border-t shrink-0">
              <button onClick={() => step === 1 ? setShowWizard(false) : setStep(s => s - 1)}
                className="px-4 py-2.5 border rounded-lg text-sm font-medium">
                {step === 1 ? 'Cancel' : 'Back'}
              </button>
              {step < 4 ? (
                <button onClick={goNext} className="px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5">
                  Next <ArrowRight size={14} />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handlePublish} disabled={saving} className="px-4 py-2.5 border rounded-lg text-sm font-semibold disabled:opacity-50">
                    Save as Draft
                  </button>
                  <button onClick={handlePublish} disabled={saving} className="px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                    {saving ? 'Publishing...' : 'Publish Brochure'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrochuresPage;
