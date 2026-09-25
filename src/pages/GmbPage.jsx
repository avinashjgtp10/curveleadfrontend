import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star, MessageSquareText, Megaphone, BarChart3, Sparkles, Lock } from 'lucide-react';
import { gmbAPI } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { Card, Toggle, Loading, ErrorBox, useLoad } from '../components/whatsapp/hubUi';

// "Connect Google Business Profile" needs a real OAuth app (Client ID/Secret) that
// doesn't exist in this deployment yet — same shape as connecting WhatsApp/Facebook,
// but for the Business Profile API. These tabs stay locked until that's set up.
const ComingSoon = ({ title, description }) => (
  <Card>
    <div className="text-center py-10">
      <Lock size={32} className="mx-auto text-gray-300 mb-3" />
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto">{description}</p>
      <p className="text-xs text-gray-400 mt-3">Needs a Google Business Profile connection (OAuth), which isn't set up yet.</p>
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
  { id: 'requests', label: 'Review Requests', icon: Star, Component: ReviewRequestsTab },
  { id: 'reviews', label: 'Reviews', icon: MessageSquareText, Component: () => (
    <ComingSoon title="Review monitoring & AI replies"
      description="See new Google reviews as they come in, get notified immediately for anything 3 stars or below, and have AI draft a reply in your own tone for approval." />
  ) },
  { id: 'posts', label: 'Posts', icon: Megaphone, Component: () => (
    <ComingSoon title="AI-drafted Google posts"
      description="Keep your listing active with regular AI-drafted posts about offers and updates, built from the same knowledge as AI Auto-reply." />
  ) },
  { id: 'insights', label: 'Insights', icon: BarChart3, Component: () => (
    <ComingSoon title="Profile insights"
      description="Search views, direction requests, and call clicks from your Business Profile, alongside your other reports." />
  ) },
];

const GmbPage = () => {
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab = TABS.find(t => t.id === requested) || TABS[0];
  const Active = tab.Component;

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
      <Active />
    </div>
  );
};

export default GmbPage;
