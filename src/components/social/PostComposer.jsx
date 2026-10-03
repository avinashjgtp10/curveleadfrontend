import { useMemo, useRef, useState } from 'react';
import { X, ImagePlus, Wand2, Link2, Send, CalendarDays, Save, Trash2, Film, AlertCircle, Loader2 } from 'lucide-react';
import { socialAPI } from '../../services/api';
import { useToast } from '../ui/Toast';
import DateTimePicker from '../ui/DateTimePicker';
import { dateTimeInputToUTC, toDateTimeInput } from '../../utils/dateTime.js';
import { PLATFORMS, composerProblems, countHashtags } from './socialShared';

// Write, schedule or publish one post to several accounts at once.
// post: an existing draft/scheduled post to edit, or null for a new one.
// defaultTime: 'YYYY-MM-DDTHH:mm' (workspace time) to pre-fill when opened from the calendar.
const PostComposer = ({ post, accounts, defaultTime, onClose, onSaved }) => {
  const toast = useToast();
  const active = accounts.filter(a => a.is_active || post?.targets?.some(t => t.account_id === a.id));
  const [caption, setCaption] = useState(post?.caption || '');
  const [link, setLink] = useState(post?.link_url || '');
  const [media, setMedia] = useState(post?.media || []);
  const [selected, setSelected] = useState(() => new Set(post?.targets?.map(t => t.account_id) || active.filter(a => a.status === 'active').map(a => a.id)));
  const [mode, setMode] = useState(post?.status === 'draft' ? 'draft' : post?.scheduled_at || defaultTime ? 'schedule' : 'now');
  const [when, setWhen] = useState(post?.scheduled_at ? toDateTimeInput(post.scheduled_at) : defaultTime || '');
  const [uploading, setUploading] = useState(null);
  const [saving, setSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);
  const [ai, setAi] = useState({ open: false, prompt: '', language: 'en', busy: false, captions: [], hashtags: [] });
  const fileRef = useRef(null);

  const platforms = useMemo(() => [...new Set(active.filter(a => selected.has(a.id)).map(a => a.platform))], [active, selected]);
  const problems = composerProblems({ caption, media, platforms });
  const strictest = platforms.length ? Math.min(...platforms.map(p => PLATFORMS[p].caption)) : null;

  const toggle = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const upload = async (files) => {
    for (const file of files) {
      if (media.length >= 10) { toast.error('At most 10 photos or videos.'); break; }
      setUploading({ name: file.name, pct: 0 });
      try {
        const { data } = await socialAPI.uploadMedia(file, (e) => setUploading({ name: file.name, pct: e.total ? Math.round((e.loaded / e.total) * 100) : 0 }));
        setMedia(m => [...m, data.media]);
      } catch (e) { toast.error(e.response?.data?.error || `Could not upload ${file.name}.`); }
    }
    setUploading(null);
  };

  const generate = async () => {
    setAi(a => ({ ...a, busy: true }));
    try {
      const { data } = await socialAPI.captions({ prompt: ai.prompt, language: ai.language, platforms });
      setAi(a => ({ ...a, busy: false, captions: data.captions, hashtags: data.hashtags }));
    } catch (e) { setAi(a => ({ ...a, busy: false })); toast.error(e.response?.data?.error || 'Could not write captions.'); }
  };
  const addHashtag = (h) => setCaption(c => (c.includes(h) ? c : `${c.trimEnd()}${c.trim() ? (/#\S+$/.test(c.trim()) ? ' ' : '\n\n') : ''}${h}`));

  const save = async () => {
    setServerErrors([]);
    let scheduled_at = null;
    if (mode === 'schedule' || (mode === 'draft' && when)) {
      if (!when) return toast.error('Pick a date and time.');
      try { scheduled_at = dateTimeInputToUTC(when); } catch (e) { return toast.error(e.message); }
    }
    const body = { caption, link_url: link || null, media, account_ids: [...selected], scheduled_at, draft: mode === 'draft' };
    setSaving(true);
    try {
      if (post) await socialAPI.updatePost(post.id, body); else await socialAPI.createPost(body);
      toast.success(mode === 'draft' ? 'Draft saved.' : mode === 'now' ? 'Publishing now — results appear in a moment.' : 'Post scheduled.');
      onSaved();
    } catch (e) {
      setServerErrors(e.response?.data?.errors || [e.response?.data?.error || 'Could not save the post.']);
    } finally { setSaving(false); }
  };

  const blocked = mode !== 'draft' && (problems.length > 0 || !selected.size);

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-8">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold">{post ? 'Edit post' : 'New post'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Accounts */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Post to</p>
            {active.length === 0 ? (
              <p className="text-sm text-gray-500">No accounts connected yet — connect them in the Accounts tab.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {active.map(a => {
                  const P = PLATFORMS[a.platform];
                  const on = selected.has(a.id);
                  const off = a.status !== 'active';
                  return (
                    <button key={a.id} type="button" onClick={() => toggle(a.id)} disabled={off && !on}
                      title={off ? a.last_error || 'Reconnect this account' : ''}
                      className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border text-sm transition ${on ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'} ${off ? 'opacity-50' : ''}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center ${P.color}`}><P.icon size={13} /></span>
                      <span className="max-w-[160px] truncate">{a.username ? `@${a.username}` : a.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Caption + AI */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="social-caption" className="text-xs font-semibold text-gray-500">Text</label>
              <button type="button" onClick={() => setAi(a => ({ ...a, open: !a.open }))} className="text-xs font-semibold text-violet-600 hover:underline inline-flex items-center gap-1">
                <Wand2 size={13} /> Write with AI
              </button>
            </div>
            {ai.open && (
              <div className="mb-2 rounded-xl border border-violet-200 bg-violet-50/50 p-3 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input value={ai.prompt} onChange={e => setAi(a => ({ ...a, prompt: e.target.value }))} placeholder="What's the post about? e.g. Weekend hair spa offer, book on WhatsApp"
                    className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white" />
                  <div className="flex gap-2">
                    <select value={ai.language} onChange={e => setAi(a => ({ ...a, language: e.target.value }))} className="px-2 py-2 border rounded-lg text-sm bg-white">
                      <option value="en">English</option><option value="hi">Hindi</option><option value="mr">Marathi</option>
                    </select>
                    <button type="button" onClick={generate} disabled={ai.busy || ai.prompt.trim().length < 3}
                      className="px-3 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-1.5">
                      {ai.busy ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} Ideas
                    </button>
                  </div>
                </div>
                {ai.captions.map((c, i) => (
                  <button key={i} type="button" onClick={() => setCaption(c)} className="block w-full text-left text-sm bg-white border rounded-lg px-3 py-2 hover:border-violet-400 whitespace-pre-wrap">{c}</button>
                ))}
                {ai.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {ai.hashtags.map(h => (
                      <button key={h} type="button" onClick={() => addHashtag(h)} className={`text-xs px-2 py-0.5 rounded-full border ${caption.includes(h) ? 'bg-violet-100 border-violet-300 text-violet-800' : 'bg-white hover:bg-violet-50'}`}>{h}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <textarea id="social-caption" rows={6} value={caption} onChange={e => setCaption(e.target.value)} placeholder="Write your post…"
              className="w-full px-3 py-2.5 border rounded-lg text-sm" />
            <div className="flex flex-wrap justify-between gap-2 text-[11px] text-gray-400 mt-1">
              <span>{platforms.includes('instagram') ? `${countHashtags(caption)}/30 hashtags` : ''}</span>
              <span className={strictest && caption.length > strictest ? 'text-red-600 font-semibold' : ''}>{caption.length}{strictest ? ` / ${strictest.toLocaleString()}` : ''} characters</span>
            </div>
          </div>

          {/* Link */}
          <div className="flex items-center gap-2">
            <Link2 size={15} className="text-gray-400 shrink-0" />
            <input value={link} onChange={e => setLink(e.target.value)} placeholder="Link (optional) — Facebook shows a preview, Google adds a Learn more button"
              className="flex-1 px-3 py-2 border rounded-lg text-sm" />
          </div>

          {/* Media */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Photos & video</p>
            <div className="flex flex-wrap gap-2">
              {media.map((m, i) => (
                <div key={m.s3_key} className="relative w-24 h-24 rounded-lg overflow-hidden border bg-gray-50">
                  {m.type === 'video'
                    ? <div className="w-full h-full flex items-center justify-center text-gray-500"><Film size={24} /></div>
                    : m.preview_url ? <img src={m.preview_url} alt="" className="w-full h-full object-cover" /> : null}
                  <button type="button" onClick={() => setMedia(ms => ms.filter((_, j) => j !== i))} aria-label="Remove"
                    className="absolute top-1 right-1 p-1 bg-white/90 rounded-full shadow hover:bg-white"><Trash2 size={12} /></button>
                  {m.width && <span className="absolute bottom-1 left-1 text-[9px] bg-black/50 text-white rounded px-1">{m.width}×{m.height}</span>}
                </div>
              ))}
              {media.length < 10 && (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={!!uploading}
                  className="w-24 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-gray-400 hover:border-brand-400 hover:text-brand-600 text-[11px] gap-1">
                  {uploading ? <><Loader2 size={18} className="animate-spin" />{uploading.pct}%</> : <><ImagePlus size={20} />Add</>}
                </button>
              )}
              <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" className="hidden"
                onChange={e => { const f = [...e.target.files]; e.target.value = ''; upload(f); }} />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">JPG/PNG up to 8 MB (Instagram: 4:5 to 1.91:1), MP4/MOV up to 100 MB. Several photos make a carousel.</p>
          </div>

          {/* When */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">When</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {[['now', 'Post now', Send], ['schedule', 'Schedule', CalendarDays], ['draft', 'Save as draft', Save]].map(([id, label, Icon]) => (
                <button key={id} type="button" onClick={() => setMode(id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border inline-flex items-center gap-1.5 ${mode === id ? 'bg-brand-600 text-white border-brand-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
            {(mode === 'schedule' || mode === 'draft') && (
              <div>
                <DateTimePicker value={when} onChange={setWhen} min={toDateTimeInput(new Date(Date.now() + 120000))} className="w-60" />
                <p className="text-[11px] text-gray-400 mt-1">Workspace time. {mode === 'draft' ? 'Optional for drafts.' : 'You can edit or cancel it until it starts publishing.'}</p>
              </div>
            )}
          </div>

          {(problems.length > 0 || serverErrors.length > 0) && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900 space-y-0.5">
              {[...new Set([...serverErrors, ...problems])].map(p => <p key={p} className="flex gap-1.5"><AlertCircle size={14} className="mt-0.5 shrink-0" />{p}</p>)}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">Cancel</button>
          <button onClick={save} disabled={saving || blocked || !!uploading}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 inline-flex items-center gap-1.5">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {mode === 'now' ? 'Publish now' : mode === 'schedule' ? 'Schedule' : 'Save draft'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostComposer;
