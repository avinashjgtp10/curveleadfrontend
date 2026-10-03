import { Facebook, Instagram, Store } from 'lucide-react';

// Shared bits for the Social page. Limits mirror backend services/social/rules.js —
// the server re-checks everything; these only give instant feedback while typing.
export const PLATFORMS = {
  facebook: { label: 'Facebook', icon: Facebook, color: 'text-blue-600 bg-blue-50', caption: 63206 },
  instagram: { label: 'Instagram', icon: Instagram, color: 'text-pink-600 bg-pink-50', caption: 2200, hashtags: 30 },
  gbp: { label: 'Google Business', icon: Store, color: 'text-emerald-700 bg-emerald-50', caption: 1500 },
};

export const POST_STATUS = {
  draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-600' },
  scheduled: { label: 'Scheduled', cls: 'bg-blue-100 text-blue-700' },
  publishing: { label: 'Publishing…', cls: 'bg-amber-100 text-amber-700' },
  published: { label: 'Published', cls: 'bg-green-100 text-green-700' },
  partially_published: { label: 'Partly published', cls: 'bg-amber-100 text-amber-800' },
  failed: { label: 'Failed', cls: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-500' },
};

// "Retrying" is a scheduled post with a retry time after a failed attempt.
export const statusOf = (post) => (post.status === 'scheduled' && post.next_attempt_at ? { label: 'Retrying', cls: 'bg-amber-100 text-amber-800' } : POST_STATUS[post.status] || POST_STATUS.draft);

export const countHashtags = (text = '') => (text.match(/(^|\s)#[^\s#]+/g) || []).length;

// Instant checks for the composer (subset of the server rules).
export function composerProblems({ caption = '', media = [], platforms = [] }) {
  const out = [];
  const set = new Set(platforms);
  for (const p of set) {
    const L = PLATFORMS[p];
    if (caption.length > L.caption) out.push(`${L.label}: ${caption.length - L.caption} characters too long.`);
  }
  if (set.has('instagram')) {
    if (!media.length) out.push('Instagram: add a photo or video.');
    if (countHashtags(caption) > 30) out.push('Instagram: at most 30 hashtags.');
    const off = media.find(m => m.type === 'image' && m.width && m.height && (m.width / m.height < 0.795 || m.width / m.height > 1.915));
    if (off) out.push(`Instagram: photos must be between 4:5 and 1.91:1 (one is ${off.width}×${off.height}).`);
  }
  if (set.has('gbp')) {
    if (!caption.trim()) out.push('Google Business: add text.');
    if (media.some(m => m.type === 'video')) out.push('Google Business: videos aren\'t supported — use a photo.');
    if (media.length > 1) out.push('Google Business: one photo per post.');
  }
  if (set.has('facebook') && media.some(m => m.type === 'video') && media.length > 1) out.push('Facebook: post a video on its own.');
  return out;
}
