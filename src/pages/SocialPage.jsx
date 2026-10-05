import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CalendarDays, List, Users, Plus, ChevronLeft, ChevronRight, ExternalLink, RotateCcw, Send, Pencil, Trash2, RefreshCw, Film, AlertCircle } from 'lucide-react';
import { socialAPI } from '../services/api';
import { useToast } from '../components/ui/Toast';
import ErrorState, { errorMessage } from '../components/ui/ErrorState';
import PostComposer from '../components/social/PostComposer';
import { PLATFORMS, statusOf } from '../components/social/socialShared';
import { formatDateTime, toDateTimeInput } from '../utils/dateTime.js';
import { FB_LOGIN_CONFIG_ID, loadFbSdk } from '../utils/facebookSdk';

// Social: write once, publish or schedule to Facebook Pages, Instagram and Google
// Business Profile (Ads & Social Phase 6).

const TABS = [
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'posts', label: 'Posts', icon: List },
  { id: 'accounts', label: 'Accounts', icon: Users },
];
const EDITABLE = ['draft', 'scheduled'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Calendar maths on plain YYYY-MM-DD strings (workspace dates), done in UTC so the
// browser's own timezone never shifts a day.
const ymd = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => ymd(new Date(Date.parse(`${s}T00:00:00Z`) + n * 864e5));
const monthGrid = (month) => {   // month: 'YYYY-MM' → 6 weeks of days, Monday first
  const first = `${month}-01`;
  const dow = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const start = addDays(first, -dow);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
};
const shiftMonth = (month, n) => { const [y, m] = month.split('-').map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return ymd(d).slice(0, 7); };

const TargetBadges = ({ post }) => (
  <div className="flex flex-wrap gap-1.5">
    {post.targets.map(t => {
      const P = PLATFORMS[t.platform];
      const tone = t.status === 'published' ? 'border-green-200' : t.status === 'failed' ? 'border-red-200' : 'border-gray-200';
      return (
        <span key={t.id} title={t.error || ''} className={`inline-flex items-center gap-1 text-[11px] border rounded-full pl-1 pr-2 py-0.5 ${tone}`}>
          <span className={`w-4 h-4 rounded-full flex items-center justify-center ${P.color}`}><P.icon size={10} /></span>
          <span className="max-w-[120px] truncate">{t.username ? `@${t.username}` : t.account_name}</span>
          {t.permalink ? <a href={t.permalink} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-brand-600" aria-label="Open post"><ExternalLink size={10} /></a>
            : t.status === 'failed' ? <AlertCircle size={10} className="text-red-500" /> : null}
        </span>
      );
    })}
  </div>
);

const PostCard = ({ post, onEdit, onAction }) => {
  const s = statusOf(post);
  const when = post.published_at || post.scheduled_at;
  const thumb = post.media?.[0];
  const errors = post.targets.filter(t => t.status === 'failed' && t.error);
  return (
    <div className="bg-white border rounded-xl p-4 flex gap-3">
      <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-gray-400">
        {thumb?.type === 'video' ? <Film size={20} /> : thumb?.preview_url ? <img src={thumb.preview_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px]">Text</span>}
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.cls}`}>{s.label}</span>
          <span className="text-xs text-gray-500">{when ? formatDateTime(when) : 'No date'}</span>
          {post.media?.length > 1 && <span className="text-[11px] text-gray-400">{post.media.length} items</span>}
        </div>
        <p className="text-sm text-gray-800 line-clamp-2 whitespace-pre-wrap break-words">{post.caption || <span className="text-gray-400">No text</span>}</p>
        <TargetBadges post={post} />
        {errors.map(t => <p key={t.id} className="text-xs text-red-600">{PLATFORMS[t.platform].label}: {t.error}</p>)}
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        {EDITABLE.includes(post.status) && <>
          <button onClick={() => onEdit(post)} className="p-1.5 border rounded-lg hover:bg-gray-50" title="Edit" aria-label="Edit"><Pencil size={14} /></button>
          <button onClick={() => onAction('publish', post)} className="p-1.5 border rounded-lg hover:bg-gray-50" title="Publish now" aria-label="Publish now"><Send size={14} /></button>
        </>}
        {['failed', 'partially_published'].includes(post.status) && (
          <button onClick={() => onAction('retry', post)} className="p-1.5 border rounded-lg hover:bg-gray-50" title="Retry failed accounts" aria-label="Retry"><RotateCcw size={14} /></button>
        )}
        {post.status !== 'publishing' && (
          <button onClick={() => onAction('delete', post)} className="p-1.5 border rounded-lg hover:bg-red-50 text-red-500" title="Delete" aria-label="Delete"><Trash2 size={14} /></button>
        )}
      </div>
    </div>
  );
};

const CalendarView = ({ month, setMonth, days, today, onOpenDay, onEdit }) => {
  const grid = monthGrid(month);
  const label = new Date(`${month}-01T00:00:00Z`).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <button onClick={() => setMonth(shiftMonth(month, -1))} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Previous month"><ChevronLeft size={16} /></button>
        <h3 className="font-semibold">{label}</h3>
        <button onClick={() => setMonth(shiftMonth(month, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Next month"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 text-[11px] text-gray-400 border-b">
        {WEEKDAYS.map(d => <div key={d} className="px-2 py-1.5">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {grid.map(day => {
          const posts = days[day] || [];
          const inMonth = day.startsWith(month);
          return (
            <div key={day} onClick={() => day >= today && onOpenDay(day)}
              className={`min-h-[92px] border-b border-r p-1.5 text-xs ${inMonth ? '' : 'bg-gray-50/70 text-gray-300'} ${day >= today ? 'cursor-pointer hover:bg-brand-50/40' : ''}`}>
              <div className={`mb-1 ${day === today ? 'inline-flex w-5 h-5 items-center justify-center rounded-full bg-brand-600 text-white font-semibold' : ''}`}>{Number(day.slice(8))}</div>
              <div className="space-y-1">
                {posts.slice(0, 3).map(p => {
                  const s = statusOf(p);
                  return (
                    <button key={p.id} onClick={(e) => { e.stopPropagation(); onEdit(p); }}
                      title={`${s.label} · ${[...new Set((p.targets || []).map(t => PLATFORMS[t.platform]?.label || t.platform))].join(', ')}\n${p.caption || '(media)'}`}
                      className="w-full text-left rounded border border-gray-100 bg-white px-1 py-0.5 text-[10px] hover:border-brand-200">
                      <span className="flex items-center gap-1">
                        {[...new Set((p.targets || []).map(t => t.platform))].map(pl => {
                          const P = PLATFORMS[pl];
                          return P ? <P.icon key={pl} size={10} className={P.color.split(' ')[0]} aria-label={P.label} /> : null;
                        })}
                        <span className="text-gray-500">{formatDateTime(p.published_at || p.scheduled_at, undefined, { dateStyle: undefined, timeStyle: 'short' })}</span>
                        <span className={`ml-auto shrink-0 rounded px-1 text-[9px] font-semibold ${s.cls}`}>{s.label}</span>
                      </span>
                      <span className="block truncate text-gray-700">{p.caption || '(media)'}</span>
                    </button>
                  );
                })}
                {posts.length > 3 && <p className="text-[10px] text-gray-400">+{posts.length - 3} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AccountsView = ({ data, reload }) => {
  const toast = useToast();
  const [busy, setBusy] = useState('');
  useEffect(() => { loadFbSdk().catch(() => {}); }, []);
  const run = async (key, fn, ok) => {
    setBusy(key);
    try { const r = await fn(); toast.success(ok(r.data)); await reload(); }
    catch (e) { toast.error(e.response?.data?.error || 'That didn\'t work. Please try again.'); }
    finally { setBusy(''); }
  };
  const connect = () => {
    if (!window.FB) return toast.error('Facebook is still loading. Please try again in a moment.');
    setBusy('connect');
    window.FB.login((resp) => {
      const token = resp?.authResponse?.accessToken;
      if (!token) { setBusy(''); return; }
      run('connect', () => socialAPI.connectMeta(token), (d) => `Found ${d.facebook} Page${d.facebook === 1 ? '' : 's'} and ${d.instagram} Instagram account${d.instagram === 1 ? '' : 's'}.${d.missing_scopes?.length ? ` Missing permission: ${d.missing_scopes.join(', ')} — reconnect and allow it to publish.` : ''}`);
    }, { config_id: FB_LOGIN_CONFIG_ID });
  };
  const accounts = data?.accounts || [];
  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-4 flex flex-wrap items-center gap-2">
        <button onClick={connect} disabled={!!busy} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
          {busy === 'connect' ? 'Connecting…' : 'Connect Facebook & Instagram'}
        </button>
        {data?.facebook_connected && (
          <button onClick={() => run('refresh', socialAPI.refreshMeta, (d) => `Updated: ${d.facebook} Pages, ${d.instagram} Instagram accounts.${d.errors?.length ? ` ${d.errors[0]}` : ''}`)} disabled={!!busy}
            className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 inline-flex items-center gap-1.5"><RefreshCw size={14} className={busy === 'refresh' ? 'animate-spin' : ''} /> Refresh from Facebook</button>
        )}
        {data?.google_connected ? (
          <button onClick={() => run('gbp', socialAPI.loadGoogle, (d) => `Found ${d.gbp} Google business location${d.gbp === 1 ? '' : 's'}.`)} disabled={!!busy}
            className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">{busy === 'gbp' ? 'Loading…' : 'Load Google Business locations'}</button>
        ) : (
          <Link to="/integrations" className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">Connect Google first (Integrations)</Link>
        )}
        <p className="w-full text-[11px] text-gray-400">Instagram accounts must be Business or Creator accounts linked to a Facebook Page. Google posting needs Business Profile API access on CurveLead's Google project.</p>
      </div>
      {accounts.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-10">No accounts yet.</p>
      ) : (
        <div className="bg-white border rounded-xl divide-y">
          {accounts.map(a => {
            const P = PLATFORMS[a.platform];
            const expired = a.status === 'expired' && a.platform !== 'gbp';
            const warn = expired ? null : a.status !== 'active' ? a.last_error || 'Reconnect this account.'
              : a.meta?.missing_scopes?.length ? `Can't publish yet — reconnect and allow ${a.meta.missing_scopes.join(', ')}.`
              : a.meta?.can_create_content === false ? 'Your Page role can\'t create posts.' : null;
            return (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                {a.picture_url ? <img src={a.picture_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                  : <span className={`w-9 h-9 rounded-full flex items-center justify-center ${P.color}`}><P.icon size={16} /></span>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate flex items-center gap-2">{a.username ? `@${a.username}` : a.name}
                    {expired && <button onClick={connect} disabled={busy === 'connect'} title={a.last_error || undefined}
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 hover:bg-red-200 shrink-0">Expired – Reconnect</button>}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{P.label}{a.meta?.page_name ? ` · via ${a.meta.page_name}` : ''}{a.meta?.address ? ` · ${a.meta.address}` : ''}</p>
                  {warn && <p className="text-xs text-amber-700 mt-0.5">{warn}</p>}
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={a.is_active} onChange={e => run(`t-${a.id}`, () => socialAPI.setAccountActive(a.id, e.target.checked), () => (e.target.checked ? 'Shown in the composer.' : 'Hidden from the composer.'))} />
                  Use for posts
                </label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SocialPage = () => {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = TABS.find(t => t.id === params.get('tab')) || TABS[0];
  const today = toDateTimeInput(new Date()).slice(0, 10);   // workspace date
  const [month, setMonth] = useState(today.slice(0, 7));
  const [accounts, setAccounts] = useState(null);
  const [calendar, setCalendar] = useState({ days: {} });
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [composer, setComposer] = useState(null);   // { post?, defaultTime? }

  const loadAccounts = useCallback(async () => {
    const { data } = await socialAPI.getAccounts();
    setAccounts(data);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const grid = monthGrid(month);
      const [cal, list] = await Promise.all([
        socialAPI.getCalendar(grid[0], grid[grid.length - 1]),
        socialAPI.getPosts(filter ? { status: filter } : {}),
        loadAccounts(),
      ]);
      setCalendar(cal.data);
      setPosts(list.data.posts);
      setError('');
    } catch (e) { setError(errorMessage(e, 'Could not load your posts.')); }
    finally { setLoading(false); }
  }, [month, filter, loadAccounts]);

  useEffect(() => { load(); }, [load]);
  // While something is publishing, refresh every 10 s to show the result.
  const busyPosts = posts.some(p => p.status === 'publishing' || (p.status === 'scheduled' && new Date(p.next_attempt_at || p.scheduled_at) <= new Date(Date.now() + 60000)));
  useEffect(() => { if (!busyPosts) return undefined; const t = setInterval(load, 10000); return () => clearInterval(t); }, [busyPosts, load]);

  const action = async (kind, post) => {
    try {
      if (kind === 'delete') {
        const msg = ['published', 'partially_published'].includes(post.status)
          ? 'Remove this post from CurveLead? It stays on Facebook, Instagram and Google — delete it there if needed.'
          : 'Delete this post? It won\'t be published.';
        if (!window.confirm(msg)) return;
        await socialAPI.deletePost(post.id); toast.success('Deleted.');
      }
      if (kind === 'publish') { await socialAPI.publishNow(post.id); toast.success('Publishing now.'); }
      if (kind === 'retry') { await socialAPI.retry(post.id); toast.success('Retrying the failed accounts.'); }
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'That didn\'t work.'); }
  };

  const openEdit = (post) => (EDITABLE.includes(post.status) ? setComposer({ post }) : setParams({ tab: 'posts' }));
  const counts = useMemo(() => posts.reduce((m, p) => ({ ...m, [p.status]: (m[p.status] || 0) + 1 }), {}), [posts]);
  const usable = (accounts?.accounts || []).filter(a => a.is_active);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Social</h1>
          <p className="text-sm text-gray-500">Write once, post to Facebook, Instagram and Google — now or on a schedule.</p>
        </div>
        <button onClick={() => setComposer({})} disabled={!usable.length} title={usable.length ? '' : 'Connect an account first'}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 inline-flex items-center gap-1.5">
          <Plus size={16} /> New post
        </button>
      </div>

      <div className="inline-flex max-w-full overflow-x-auto bg-white rounded-xl border border-gray-200 p-1 gap-1 shadow-sm">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setParams(t.id === TABS[0].id ? {} : { tab: t.id })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab.id === t.id ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {error && <ErrorState message={error} onRetry={load} retrying={loading} />}

      {accounts && !accounts.accounts.length && tab.id !== 'accounts' && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-xl px-4 py-3 text-sm">
          Connect a Facebook Page, Instagram account or Google Business location to start posting.{' '}
          <button onClick={() => setParams({ tab: 'accounts' })} className="font-semibold underline">Connect accounts</button>
        </div>
      )}

      {tab.id === 'calendar' && (
        <CalendarView month={month} setMonth={setMonth} days={calendar.days || {}} today={today}
          onOpenDay={(day) => usable.length && setComposer({ defaultTime: `${day}T${day === today ? toDateTimeInput(new Date(Date.now() + 3600e3)).slice(11, 16) : '10:00'}` })}
          onEdit={openEdit} />
      )}
      {tab.id === 'calendar' && calendar.timezone && <p className="text-[11px] text-gray-400">Times in {calendar.timezone.replace(/_/g, ' ')} (Settings → Business).</p>}

      {tab.id === 'posts' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {[['', 'All'], ['scheduled', 'Scheduled'], ['published,partially_published', 'Published'], ['failed,partially_published', 'Needs attention'], ['draft', 'Drafts']].map(([v, l]) => (
              <button key={l} onClick={() => setFilter(v)} className={`px-3 py-1 rounded-full text-xs border ${filter === v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {l}{!v && posts.length ? ` (${posts.length})` : v === 'failed,partially_published' && (counts.failed || counts.partially_published) && !filter ? ` (${(counts.failed || 0) + (counts.partially_published || 0)})` : ''}
              </button>
            ))}
          </div>
          {posts.length === 0 && !loading ? <p className="text-sm text-gray-500 text-center py-10">No posts here yet.</p>
            : posts.map(p => <PostCard key={p.id} post={p} onEdit={(post) => setComposer({ post })} onAction={action} />)}
        </div>
      )}

      {tab.id === 'accounts' && <AccountsView data={accounts} reload={loadAccounts} />}

      {composer && accounts && (
        <PostComposer post={composer.post || null} defaultTime={composer.defaultTime} accounts={accounts.accounts}
          onClose={() => setComposer(null)} onSaved={() => { setComposer(null); load(); }} />
      )}
    </div>
  );
};

export default SocialPage;
