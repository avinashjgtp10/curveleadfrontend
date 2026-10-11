import { useRef, useState } from 'react';
import { Paperclip, X, Image as ImageIcon, Film, FileText, Loader2 } from 'lucide-react';
import { automationAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';

// Photo, document or video for one sequence step. Mirrors the server's limits so people get
// an instant message, but the server re-checks everything.
const MB = 1024 * 1024;
const LIMITS = {
  image: { exts: ['jpg', 'jpeg', 'png'], max: 5 },
  video: { exts: ['mp4', '3gp'], max: 16 },
  document: { exts: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'], max: 16 },
};
const ACCEPT = Object.values(LIMITS).flatMap(l => l.exts.map(e => `.${e}`)).join(',');
const ICONS = { image: ImageIcon, video: Film, document: FileText };
const fmtSize = (n) => (n >= MB ? `${(n / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

const localProblem = (file) => {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const kind = Object.entries(LIMITS).find(([, l]) => l.exts.includes(ext));
  if (!kind) return 'Use a photo (JPG, PNG), a video (MP4, 3GP) or a document (PDF, Word, Excel, PowerPoint, TXT).';
  if (file.size > kind[1].max * MB) return `${kind[0] === 'image' ? 'Photos' : kind[0] === 'video' ? 'Videos' : 'Documents'} can be at most ${kind[1].max} MB on WhatsApp.`;
  return null;
};

const StepAttachment = ({ media, onChange, stepNumber }) => {
  const toast = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(null); // upload progress 0-100
  const file = media?.[0];
  const Icon = file ? ICONS[file.type] || FileText : Paperclip;

  const pick = async (e) => {
    const chosen = e.target.files?.[0];
    e.target.value = '';
    if (!chosen) return;
    const problem = localProblem(chosen);
    if (problem) return toast.error(problem);
    setUploading(0);
    try {
      const { data } = await automationAPI.uploadStepMedia(chosen, (ev) => ev.total && setUploading(Math.round((ev.loaded / ev.total) * 100)));
      onChange([{ url: data.url, name: data.name, type: data.type, size: data.size, mime: data.mime, preview_url: data.preview_url }]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally { setUploading(null); }
  };

  return (
    <div className="mt-2">
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={pick} aria-label={`Step ${stepNumber} attachment`} />
      {uploading != null ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs text-gray-500">
          <Loader2 size={14} className="animate-spin" /> Uploading… {uploading}%
        </div>
      ) : file ? (
        <div className="flex items-center gap-2.5 rounded-lg border bg-gray-50 px-2.5 py-2">
          {file.type === 'image' && file.preview_url
            ? <img src={file.preview_url} alt="" className="h-9 w-9 rounded object-cover" />
            : <span className="flex h-9 w-9 items-center justify-center rounded bg-white border"><Icon size={16} className="text-gray-500" /></span>}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-gray-800">{file.name}</p>
            <p className="text-[11px] text-gray-400 capitalize">{file.type}{file.size ? ` · ${fmtSize(file.size)}` : ''}</p>
          </div>
          <button type="button" onClick={() => inputRef.current?.click()} className="text-[11px] font-semibold text-brand-600 hover:underline">Replace</button>
          <button type="button" onClick={() => onChange([])} aria-label="Remove attachment" className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"><X size={13} /></button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          className="flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs font-medium text-gray-500 hover:border-brand-300 hover:text-brand-700">
          <Paperclip size={14} /> Attach a photo, document or video
        </button>
      )}
      {file && (
        <p className="mt-1 text-[10px] leading-4 text-gray-400">
          The message above becomes the file's caption. WhatsApp only lets us send files within 24 hours of the customer's last message; for anyone else this step sends its approved template instead (use a template with an image, video or document header to reach new leads with a file). One file per step — add another step for more.
        </p>
      )}
    </div>
  );
};

export default StepAttachment;
