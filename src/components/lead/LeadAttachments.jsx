import { useEffect, useState, useRef } from 'react';
import { attachmentsAPI } from '../../services/api';
import { Paperclip, Upload, FileText, Image as ImageIcon, FileAudio, FileVideo, File as FileIcon, Download, Trash2, Send, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

const fileTypeIcons = {
  image: ImageIcon,
  pdf: FileText,
  doc: FileText,
  audio: FileAudio,
  video: FileVideo,
  other: FileIcon,
};

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MAX_FILE_MB = 5;

const compressImage = (file) => new Promise((resolve) => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    URL.revokeObjectURL(url);
    const MAX_DIM = 1024;
    let { width, height } = img;
    if (width > MAX_DIM || height > MAX_DIM) {
      if (width > height) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM; }
      else { width = Math.round((width * MAX_DIM) / height); height = MAX_DIM; }
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    canvas.toBlob(blob => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.75);
  };
  img.src = url;
});

// Lightbox modal
const Lightbox = ({ images, index, onClose }) => {
  const [current, setCurrent] = useState(index);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrent(c => Math.min(c + 1, images.length - 1));
      if (e.key === 'ArrowLeft') setCurrent(c => Math.max(c - 1, 0));
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [images.length, onClose]);

  const img = images[current];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300 p-2">
        <X size={28} />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setCurrent(c => Math.max(c - 1, 0)); }}
            disabled={current === 0}
            className="absolute left-4 text-white hover:text-gray-300 p-2 disabled:opacity-30">
            <ChevronLeft size={36} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setCurrent(c => Math.min(c + 1, images.length - 1)); }}
            disabled={current === images.length - 1}
            className="absolute right-4 text-white hover:text-gray-300 p-2 disabled:opacity-30">
            <ChevronRight size={36} />
          </button>
        </>
      )}

      <div onClick={e => e.stopPropagation()} className="max-w-4xl max-h-[90vh] flex flex-col items-center gap-3">
        <img src={img.file_url} alt={img.file_name}
          className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl" />
        <div className="text-center">
          <p className="text-white text-sm font-medium">{img.file_name}</p>
          <p className="text-gray-400 text-xs">{formatBytes(img.file_size)} • {img.uploaded_by_name}</p>
        </div>
        {images.length > 1 && (
          <p className="text-gray-500 text-xs">{current + 1} / {images.length}</p>
        )}
      </div>
    </div>
  );
};

const LeadAttachments = ({ leadId, onActivityAdded }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [lightbox, setLightbox] = useState(null); // index into images array
  const fileInputRef = useRef();

  useEffect(() => { load(); }, [leadId]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await attachmentsAPI.getByLead(leadId);
      setFiles(data.attachments || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleUpload = async (e) => {
    let file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      file = await compressImage(file);
    } else if (file.size > MAX_FILE_MB * 1024 * 1024) {
      return alert(`File too large. Max ${MAX_FILE_MB}MB for non-image files.`);
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);
      await attachmentsAPI.upload(leadId, formData);
      setDescription('');
      e.target.value = '';
      load();
      onActivityAdded?.();
    } catch (err) { alert(err.response?.data?.error || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this file?')) return;
    try { await attachmentsAPI.delete(leadId, id); load(); } catch (e) { alert('Failed'); }
  };

  const handleDownload = async (f) => {
    try {
      const res = await fetch(f.file_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = f.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Download failed'); }
  };

  const handleShare = async (id) => {
    try {
      const { data } = await attachmentsAPI.shareWhatsApp(leadId, id);
      window.open(data.whatsapp_url, '_blank');
    } catch (e) { alert('Failed'); }
  };

  const images = files.filter(f => f.file_type === 'image');

  return (
    <div className="bg-white rounded-2xl border p-5">
      {lightbox !== null && (
        <Lightbox images={images} index={lightbox} onClose={() => setLightbox(null)} />
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Paperclip size={18} /> Files & Documents
        </h3>
        <span className="text-xs text-gray-400">{files.length} file{files.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Upload zone */}
      <div className="mb-4 p-3 bg-brand-50 rounded-xl border-2 border-dashed border-brand-200">
        <input ref={fileInputRef} type="file" hidden onChange={handleUpload}
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,audio/*,video/*" />
        <input type="text" placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm mb-2" />
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="w-full px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2">
          <Upload size={16} /> {uploading ? 'Compressing & Uploading...' : 'Upload File'}
        </button>
        <p className="text-[10px] text-gray-500 mt-1.5 text-center">Images auto-compressed · PDF/docs max 5MB</p>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {images.map((f, i) => (
            <button key={f.id} onClick={() => setLightbox(i)}
              className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
              <img src={f.file_url} alt={f.file_name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-6 text-sm text-gray-400">Loading...</div>
      ) : files.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No files yet. Upload meeting notes, photos, contracts, etc.</p>
      ) : (
        <div className="space-y-2">
          {files.map(f => {
            const Icon = fileTypeIcons[f.file_type] || FileIcon;
            return (
              <div key={f.id} className="p-3 bg-gray-50 rounded-xl flex items-start gap-3">
                <div
                  onClick={() => f.file_type === 'image' ? setLightbox(images.findIndex(i => i.id === f.id)) : null}
                  className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 ${f.file_type === 'image' ? 'cursor-pointer' : 'bg-white flex items-center justify-center'}`}>
                  {f.file_type === 'image'
                    ? <img src={f.file_url} alt={f.file_name} className="w-full h-full object-cover" />
                    : <Icon size={20} className="text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <a href={f.file_url} target="_blank" rel="noopener noreferrer"
                    className="font-medium text-sm text-gray-700 hover:text-brand-600 truncate block">
                    {f.file_name}
                  </a>
                  {f.description && <p className="text-xs text-gray-500 truncate">{f.description}</p>}
                  <p className="text-[10px] text-gray-400">
                    {formatBytes(f.file_size)} • {f.uploaded_by_name} • {new Date(f.uploaded_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleDownload(f)} className="p-1.5 hover:bg-white rounded text-gray-500" title="Download">
                    <Download size={14} />
                  </button>
                  <button onClick={() => handleShare(f.id)} className="p-1.5 hover:bg-green-50 rounded text-green-500" title="Share on WhatsApp">
                    <Send size={14} />
                  </button>
                  <button onClick={() => handleDelete(f.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LeadAttachments;
