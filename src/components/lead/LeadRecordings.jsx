import { useState, useEffect, useRef } from 'react';
import { Mic, Video, Upload, Loader2, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { recordingAPI } from '../../services/api';

const fmtSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const StatusChip = ({ status }) => {
  const map = {
    pending:    { label: 'Pending',      cls: 'bg-gray-100 text-gray-500' },
    processing: { label: 'Analyzing…',  cls: 'bg-blue-50 text-blue-600 animate-pulse' },
    done:       { label: 'Analyzed',     cls: 'bg-green-50 text-green-600' },
    failed:     { label: 'Failed',       cls: 'bg-red-50 text-red-500' },
    too_large:  { label: 'Too Large',    cls: 'bg-amber-50 text-amber-600' },
  };
  const s = map[status] || map.pending;
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
};

const ScoreBar = ({ score }) => {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? 'bg-green-500' : score >= 4 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700">{score}/10</span>
    </div>
  );
};

const AnalysisPanel = ({ analysis }) => {
  if (!analysis || analysis.error) {
    return <p className="text-xs text-red-400 mt-2">{analysis?.error || 'Analysis not available'}</p>;
  }
  const sentimentColor = { positive: 'text-green-600', neutral: 'text-gray-500', negative: 'text-red-500', unclear: 'text-gray-400' };
  return (
    <div className="mt-3 space-y-3 text-sm">
      <div>
        <p className="text-xs text-gray-400 mb-1">Pitch Score</p>
        <ScoreBar score={analysis.overall_score} />
      </div>
      <p className="text-xs text-gray-600 leading-relaxed">{analysis.summary}</p>
      <div className="grid grid-cols-2 gap-2">
        {analysis.pitch_covered?.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-green-600 mb-1">Covered</p>
            <ul className="space-y-0.5">
              {analysis.pitch_covered.map((p, i) => (
                <li key={i} className="flex items-start gap-1 text-[11px] text-gray-600">
                  <CheckCircle size={10} className="text-green-500 mt-0.5 shrink-0" />{p}
                </li>
              ))}
            </ul>
          </div>
        )}
        {analysis.pitch_missed?.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-red-500 mb-1">Missed</p>
            <ul className="space-y-0.5">
              {analysis.pitch_missed.map((p, i) => (
                <li key={i} className="flex items-start gap-1 text-[11px] text-gray-600">
                  <XCircle size={10} className="text-red-400 mt-0.5 shrink-0" />{p}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {analysis.improvements?.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-amber-600 mb-1">Improvements</p>
          <ul className="space-y-0.5">
            {analysis.improvements.map((p, i) => (
              <li key={i} className="text-[11px] text-gray-600">• {p}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex items-center gap-3 pt-1 border-t">
        <span className="text-[10px] text-gray-400">Sentiment:</span>
        <span className={`text-[11px] font-medium capitalize ${sentimentColor[analysis.customer_sentiment] || 'text-gray-500'}`}>
          {analysis.customer_sentiment || '—'}
        </span>
        {analysis.next_action && (
          <>
            <span className="text-[10px] text-gray-400 ml-auto">Next:</span>
            <span className="text-[11px] text-brand-600">{analysis.next_action}</span>
          </>
        )}
      </div>
    </div>
  );
};

const RecordingCard = ({ recording, onDelete, onRetry }) => {
  const [expanded, setExpanded] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const hasAnalysis = recording.analysis_status === 'done';
  const isProcessing = recording.analysis_status === 'processing' || recording.analysis_status === 'pending';
  const isFailed = recording.analysis_status === 'failed';

  const handleRetry = async () => {
    setRetrying(true);
    await onRetry(recording.id);
    setRetrying(false);
  };

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-3 bg-gray-50">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${recording.recording_type === 'video' ? 'bg-violet-100' : 'bg-brand-100'}`}>
          {recording.recording_type === 'video'
            ? <Video size={15} className="text-violet-600" />
            : <Mic  size={15} className="text-brand-600" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{recording.title || recording.file_name}</p>
          <p className="text-[10px] text-gray-400">
            {recording.uploaded_by_name && `${recording.uploaded_by_name} · `}{fmtDate(recording.created_at)}
            {recording.file_size ? ` · ${fmtSize(recording.file_size)}` : ''}
          </p>
        </div>
        <StatusChip status={recording.analysis_status} />
        {hasAnalysis && (
          <button onClick={() => setExpanded(e => !e)} className="text-gray-400 hover:text-gray-600 ml-1">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
        {isProcessing && <Loader2 size={14} className="text-blue-400 animate-spin ml-1" />}
        {isFailed && (
          <button onClick={handleRetry} disabled={retrying}
            title="Retry AI analysis"
            className="flex items-center gap-1 text-[11px] text-amber-600 hover:text-amber-700 border border-amber-300 rounded px-1.5 py-0.5 ml-1 disabled:opacity-50">
            {retrying ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            Retry
          </button>
        )}
        <button onClick={() => onDelete(recording.id)} className="text-gray-300 hover:text-red-400 ml-1">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Playback */}
      {recording.playback_url && (
        <div className="px-3 py-2 border-t bg-white">
          {recording.recording_type === 'video'
            ? <video src={recording.playback_url} controls className="w-full rounded max-h-48" />
            : <audio src={recording.playback_url} controls className="w-full h-8" />
          }
        </div>
      )}

      {/* Analysis */}
      {expanded && hasAnalysis && (
        <div className="px-3 pb-3 border-t bg-white">
          <AnalysisPanel analysis={recording.analysis} />
        </div>
      )}

      {recording.analysis_status === 'too_large' && (
        <div className="px-3 py-2 border-t bg-amber-50 flex items-center gap-1.5">
          <AlertCircle size={13} className="text-amber-500" />
          <p className="text-xs text-amber-600">File exceeds 25 MB — AI transcription not available. You can still play it back.</p>
        </div>
      )}
    </div>
  );
};

export default function LeadRecordings({ leadId }) {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const fileRef = useRef();
  const pollRef = useRef();

  const load = async () => {
    try {
      const { data } = await recordingAPI.getByLead(leadId);
      setRecordings(data.recordings || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    return () => clearInterval(pollRef.current);
  }, [leadId]);

  // Poll while any recording is still processing
  useEffect(() => {
    clearInterval(pollRef.current);
    const hasProcessing = recordings.some(r => r.analysis_status === 'pending' || r.analysis_status === 'processing');
    if (hasProcessing) {
      pollRef.current = setInterval(load, 8000);
    }
    return () => clearInterval(pollRef.current);
  }, [recordings]);

  const handleFileSelect = (file) => {
    if (!file) return;
    const ok = /^(audio|video)\//i.test(file.type) || /\.(mp3|mp4|wav|m4a|ogg|webm|mpeg|aac|flac|mov|avi|mkv)$/i.test(file.name);
    if (!ok) return alert('Only audio and video files are supported.');
    setPendingFile(file);
    setUploadTitle(file.name.replace(/\.[^.]+$/, ''));
    setShowUpload(true);
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    try {
      await recordingAPI.upload(leadId, pendingFile, uploadTitle.trim() || undefined);
      setPendingFile(null);
      setUploadTitle('');
      setShowUpload(false);
      await load();
    } catch (e) {
      alert(e.response?.data?.error || 'Upload failed.');
    } finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this recording?')) return;
    await recordingAPI.delete(id).catch(() => {});
    setRecordings(r => r.filter(x => x.id !== id));
  };

  const handleRetry = async (id) => {
    try {
      await recordingAPI.retry(id);
      setRecordings(r => r.map(x => x.id === id ? { ...x, analysis_status: 'pending', analysis: null, transcription: null } : x));
    } catch (e) {
      alert(e.response?.data?.error || 'Retry failed.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Call & Demo Recordings</h3>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
        >
          <Upload size={13} /> Upload
        </button>
        <input ref={fileRef} type="file" accept="audio/*,video/*,.mp3,.mp4,.m4a,.wav,.ogg,.webm,.flac,.aac,.mov" className="hidden"
          onChange={e => { handleFileSelect(e.target.files[0]); e.target.value = ''; }} />
      </div>

      {/* Upload confirmation panel */}
      {showUpload && pendingFile && (
        <div
          className={`mb-4 border-2 rounded-xl p-4 transition-colors ${dragOver ? 'border-brand-400 bg-brand-50' : 'border-dashed border-gray-200 bg-gray-50'}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
        >
          <div className="flex items-center gap-2 mb-3">
            {/^video\//i.test(pendingFile.type) ? <Video size={16} className="text-violet-600" /> : <Mic size={16} className="text-brand-600" />}
            <span className="text-sm font-medium truncate max-w-[200px]">{pendingFile.name}</span>
            <span className="text-xs text-gray-400">{fmtSize(pendingFile.size)}</span>
          </div>
          <input
            type="text" placeholder="Recording title (optional)"
            value={uploadTitle}
            onChange={e => setUploadTitle(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
          {pendingFile.size > 25 * 1024 * 1024 && (
            <p className="text-xs text-amber-600 flex items-center gap-1 mb-2">
              <AlertCircle size={12} />File is over 25 MB — will be uploaded to S3 but AI analysis won't be available.
            </p>
          )}
          <div className="flex gap-2">
            <button onClick={handleUpload} disabled={uploading}
              className="flex items-center gap-1.5 text-xs bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-60">
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {uploading ? 'Uploading…' : 'Upload & Analyze'}
            </button>
            <button onClick={() => { setShowUpload(false); setPendingFile(null); }}
              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg border">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
      ) : recordings.length === 0 ? (
        <div
          className={`border-2 border-dashed rounded-xl py-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current?.click()}
        >
          <div className="flex justify-center mb-2">
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center"><Mic size={16} className="text-brand-600" /></div>
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center"><Video size={16} className="text-violet-600" /></div>
            </div>
          </div>
          <p className="text-sm text-gray-400">Drop a call recording or demo video here</p>
          <p className="text-xs text-gray-300 mt-1">MP3, MP4, WAV, M4A, WEBM, MOV · up to 100 MB</p>
          <p className="text-xs text-brand-500 mt-2">AI will transcribe and score the pitch automatically</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recordings.map(r => (
            <RecordingCard key={r.id} recording={r} onDelete={handleDelete} onRetry={handleRetry} />
          ))}
        </div>
      )}
    </div>
  );
}
