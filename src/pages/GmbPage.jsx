import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star, MessageSquareText, Megaphone, BarChart3, Sparkles, Lock, CheckCircle, LinkIcon } from 'lucide-react';
import { gmbAPI } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import { Card, Toggle, Loading, ErrorBox, useLoad } from '../components/whatsapp/hubUi';

const CONNECT_MESSAGES = {
  success: { type: 'success', text: 'Google Business Profile connected.' },
  denied: { type: 'error', text: 'Connection cancelled — permission was not granted.' },
  no_refresh_token: { type: 'error', text: "Google didn't return a reusable connection. Try disconnecting access in your Google Account's third-party apps, then connect again." },
  error: { type: 'error', text: 'Something went wrong connecting to Google. Please try again.' },
};

// Shown at the top of every tab — connect once, applies to Reviews/Posts/Insights.
const ConnectionBar = ({ gmb, reload }) => {
  const toast = useToast();
  const confirm = useConfirmDialog();
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const connect = async () => {
    setConnecting(true);
    try {
      const { data } = await gmbAPI.connect();
      window.location.href = data.url;
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to start connection');
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!await confirm({ title: 'Disconnect Google Business Profile?', message: 'Review monitoring, posts, and insights will stop working until you reconnect.' })) return;
    setDisconnecting(true);
    try { await gmbAPI.disconnect(); toast.success('Disconnected.'); reload(); }
    catch { toast.error('Failed to disconnect'); }
    finally { setDisconnecting(false); }
  };

  if (gmb.gmb_connected) {
    return (
      <Card>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <CheckCircle size={16} className="text-green-600 shrink-0" />
            <span>
              Connected{gmb.gmb_account_name ? ` — ${gmb.gmb_account_name}` : ''}.
              {!gmb.gmb_locations_loaded && ' Waiting on Google to approve API access before reviews/posts/insights can load.'}
            </span>
          </div>
          <button onClick={disconnect} disabled={disconnecting}
            className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-50">
            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-600">Connect your Google Business Profile to unlock review monitoring, posts, and insights.</p>
        <button onClick={connect} disabled={connecting}
          className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 disabled:opacity-50 flex items-center gap-1.5">
          <LinkIcon size={13} /> {connecting ? 'Redirecting…' : 'Connect Google Business Profile'}
        </button>
      </div>
    </Card>
  );
};

const ComingSoon = ({ title, description, connected }) => (
  <Card>
    <div className="text-center py-10">
      <Lock size={32} className="mx-auto text-gray-300 mb-3" />
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto">{description}</p>
      <p className="text-xs text-gray-400 mt-3">
        {connected ? "Connected — waiting for Google to approve Business Profile API access." : 'Connect your Google Business Profile above to unlock this.'}
      </p>
    </div>
  </Card>
);

const ReviewRequestsTab = () => {
  const toast = useToast();
  const { data, error, loading, reload } = useLoad(() => gmbAPI.getSettings());
  const [enabled, setEnabled] = useState(false);
  const [reviewLink, setReviewLink] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [drafting, setDrafting] = useState(false);

  useEffect(() => {
    if (data) { setEnabled(data.enabled); setReviewLink(data.review_link); setMessage(data.message); }
  }, [data]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox>{error}</ErrorBox>;

  const save = async () => {
    setSaving(true);
    try {
      await gmbAPI.updateSettings({ enabled, review_link: reviewLink, message });
      toast.success('Saved.');
      reload();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const draft = async () => {
    setDrafting(true);
    try {
      const { data: res } = await gmbAPI.draftMessage();
      setMessage(res.message);
      toast.success('Draft ready — review before saving.');
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to draft a message'); }
    finally { setDrafting(false); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <Toggle checked={enabled} onChange={setEnabled} label="Ask for a Google review when a lead is won"
          hint="The moment a lead reaches a Won stage, this message is sent to them on WhatsApp automatically — no staff involved." />
      </Card>

      <Card title="Your Google review link">
        <p className="text-xs text-gray-500 mb-3">
          From your Google Business Profile: Home → "Get more reviews" → Share review form. It's a link that opens the review box directly, no searching needed.
        </p>
        <input value={reviewLink} onChange={e => setReviewLink(e.target.value)} placeholder="https://g.page/r/.../review"
          className="w-full px-3 py-2 border rounded-lg text-sm" />
      </Card>

      <Card title="Message"
        action={<button onClick={draft} disabled={drafting}
          className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700 disabled:opacity-50 flex items-center gap-1.5">
          <Sparkles size={13} /> {drafting ? 'Drafting…' : 'Draft with AI'}
        </button>}>
        <p className="text-xs text-gray-500 mb-3">
          Keep <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code> and <code className="bg-gray-100 px-1 rounded">{'{{review_link}}'}</code> in the message — they're swapped for the real values when it's sent.
        </p>
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
          className="w-full px-3 py-2 border rounded-lg text-sm" />
      </Card>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
};

const TABS = [
  { id: 'requests', label: 'Review Requests', icon: Star, showConnection: false },
  { id: 'reviews', label: 'Reviews', icon: MessageSquareText, showConnection: true,
    title: 'Review monitoring & AI replies',
    description: 'See new Google reviews as they come in, get notified immediately for anything 3 stars or below, and have AI draft a reply in your own tone for approval.' },
  { id: 'posts', label: 'Posts', icon: Megaphone, showConnection: true,
    title: 'AI-drafted Google posts',
    description: 'Keep your listing active with regular AI-drafted posts about offers and updates, built from the same knowledge as AI Auto-reply.' },
  { id: 'insights', label: 'Insights', icon: BarChart3, showConnection: true,
    title: 'Profile insights',
    description: 'Search views, direction requests, and call clicks from your Business Profile, alongside your other reports.' },
];

const GmbPage = () => {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab = TABS.find(t => t.id === requested) || TABS[0];
  const { data: gmb, reload } = useLoad(() => gmbAPI.getSettings());

  useEffect(() => {
    const status = params.get('gmb_connect');
    if (!status) return;
    const msg = CONNECT_MESSAGES[status] || CONNECT_MESSAGES.error;
    toast[msg.type === 'success' ? 'success' : 'error'](msg.text);
    reload();
    const next = new URLSearchParams(params);
    next.delete('gmb_connect');
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!gmb) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-5 border-b border-gray-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setParams(t.id === TABS[0].id ? {} : { tab: t.id })}
            className={`flex items-center gap-1.5 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab.id === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab.showConnection && <ConnectionBar gmb={gmb} reload={reload} />}

      {tab.id === 'requests'
        ? <ReviewRequestsTab />
        : <ComingSoon title={tab.title} description={tab.description} connected={gmb.gmb_connected} />}
    </div>
  );
};

export default GmbPage;
