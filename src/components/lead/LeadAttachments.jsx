import { useEffect, useState, useRef } from 'react';
import { attachmentsAPI } from '../../services/api';
import { Paperclip, Upload, FileText, Image as ImageIcon, FileAudio, FileVideo, File, Download, Trash2, Send } from 'lucide-react';

const fileTypeIcons = {
  image: ImageIcon,
  pdf: FileText,
  doc: FileText,
  audio: FileAudio,
  video: FileVideo,
  other: File,
};

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const LeadAttachments = ({ leadId }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
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
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) return alert('File too large. Max 25MB.');

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);
      await attachmentsAPI.upload(leadId, formData);
      setDescription('');
      e.target.value = '';
      load();
    } catch (err) { alert(err.response?.data?.error || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this file?')) return;
    try { await attachmentsAPI.delete(leadId, id); load(); } catch (e) { alert('Failed'); }
  };

  const handleShare = async (id) => {
    try {
      const { data } = await attachmentsAPI.shareWhatsApp(leadId, id);
      window.open(data.whatsapp_url, '_blank');
    } catch (e) { alert('Failed'); }
  };

  return (
    <div className="bg-white rounded-2xl border p-5">
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
          <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload File (Max 25MB)'}
        </button>
        <p className="text-[10px] text-gray-500 mt-1.5 text-center">PDF, images, docs, audio, video</p>
      </div>

      {loading ? (
        <div className="text-center py-6 text-sm text-gray-400">Loading...</div>
      ) : files.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No files yet. Upload meeting notes, photos, contracts, etc.</p>
      ) : (
        <div className="space-y-2">
          {files.map(f => {
            const Icon = fileTypeIcons[f.file_type] || File;
            return (
              <div key={f.id} className="p-3 bg-gray-50 rounded-xl flex items-start gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-gray-500" />
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
                  <a href={f.file_url} download className="p-1.5 hover:bg-white rounded text-gray-500" title="Download">
                    <Download size={14} />
                  </a>
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
