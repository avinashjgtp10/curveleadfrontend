import test from 'node:test';
import assert from 'node:assert/strict';
import { composerProblems, statusOf, countHashtags } from '../src/components/social/socialShared.js';

// Phase 6: the composer's instant checks mirror the server's rules.
const img = (w = 1080, h = 1080) => ({ type: 'image', width: w, height: h });

test('Instagram needs media, ≤ 30 hashtags and a 4:5–1.91:1 photo', () => {
  assert.deepEqual(composerProblems({ caption: 'hi', platforms: ['instagram'] }), ['Instagram: add a photo or video.']);
  assert.match(composerProblems({ caption: Array.from({ length: 31 }, (_, i) => `#a${i}`).join(' '), media: [img()], platforms: ['instagram'] })[0], /30 hashtags/);
  assert.match(composerProblems({ caption: 'x', media: [img(1080, 1920)], platforms: ['instagram'] })[0], /4:5 and 1.91:1/);
  assert.deepEqual(composerProblems({ caption: 'x', media: [img(1080, 1350)], platforms: ['instagram'] }), []);
});

test('Google Business: text, one photo, no video; Facebook: video on its own', () => {
  assert.deepEqual(composerProblems({ caption: '', platforms: ['gbp'] }), ['Google Business: add text.']);
  assert.ok(composerProblems({ caption: 'x', media: [{ type: 'video' }], platforms: ['gbp'] }).some(p => /videos aren't supported/.test(p)));
  assert.ok(composerProblems({ caption: 'x', media: [img(), img()], platforms: ['gbp'] }).some(p => /one photo/.test(p)));
  assert.deepEqual(composerProblems({ caption: 'x', media: [{ type: 'video' }, img()], platforms: ['facebook'] }), ['Facebook: post a video on its own.']);
  assert.match(composerProblems({ caption: 'x'.repeat(1600), platforms: ['facebook', 'gbp'] })[0], /Google Business: 100 characters too long/);
});

test('a scheduled post waiting for a retry shows as Retrying', () => {
  assert.equal(statusOf({ status: 'scheduled' }).label, 'Scheduled');
  assert.equal(statusOf({ status: 'scheduled', next_attempt_at: '2026-10-04T10:00:00Z' }).label, 'Retrying');
  assert.equal(statusOf({ status: 'partially_published' }).label, 'Partly published');
  assert.equal(countHashtags('Hello #one #two and#not'), 2);
});
