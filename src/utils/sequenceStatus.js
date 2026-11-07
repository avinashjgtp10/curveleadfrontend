// What to say about a sequence in the list, and how to copy one. Pure; fed by GET /automations/sequences.
const num = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0; };
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Active | Paused | Draft | Has errors.
//   errors  : at least one lead is blocked, failed or uncertain
//   active  : switched on
//   paused  : switched off, but leads have been in it before (so turning it on resumes something)
//   draft   : switched off and never used
export const sequenceStatus = (seq) => {
  const errors = num(seq?.with_errors);
  if (errors > 0) return { key: 'errors', label: 'Has errors', tone: 'bad', detail: `${plural(errors, 'lead')} blocked or failed. Open Automation Leads to see why.` };
  if (seq?.is_active) return { key: 'active', label: 'Active', tone: 'ok', detail: 'New leads that match a trigger are added and messaged.' };
  if (num(seq?.enrolled_total) > 0) return { key: 'paused', label: 'Paused', tone: 'warn', detail: 'Nothing is sent while it is paused. Leads already in it wait until you resume.' };
  return { key: 'draft', label: 'Draft', tone: 'muted', detail: 'Not turned on yet. Nothing is sent.' };
};

// "3 steps · 12 leads enrolled (7 in progress) · 1 needs review". Lead counts are left out when the server did not send them.
export const sequenceSummary = (seq) => {
  const parts = [plural(seq?.steps?.length || 0, 'step')];
  if (seq && seq.enrolled_total !== undefined) {
    const total = num(seq.enrolled_total); const active = num(seq.enrolled_active); const review = num(seq.in_review);
    parts.push(`${plural(total, 'lead')} enrolled${active ? ` (${active} in progress)` : ''}`);
    if (review) parts.push(`${review} need${review === 1 ? 's' : ''} review`);
  }
  return parts.join(' · ');
};

// The one button the row shows: pause a live sequence, resume a paused one, turn on a draft.
export const toggleAction = (seq) => {
  const s = sequenceStatus(seq);
  if (seq?.is_active) return { key: 'pause', label: 'Pause', next: false };
  return s.key === 'paused' || (s.key === 'errors' && num(seq?.enrolled_total) > 0)
    ? { key: 'resume', label: 'Resume', next: true } : { key: 'turn_on', label: 'Turn on', next: true };
};

// A step as the API wants it on save (preview URLs are client-only; answer aliases are trimmed). Same mapping the editor uses.
export const stepPayload = (step) => ({
  ...step,
  media: (step.media || []).map(({ preview_url, ...m }) => m),
  reply_routes: (step.reply_routes || []).map((route) => ({ ...route, aliases: (route.aliases || []).map((a) => a.trim()).filter(Boolean) })),
});

// "Copy of X", "Copy of X (2)"… that no existing sequence already uses.
export const copyName = (name, existing = []) => {
  const taken = new Set(existing.map((n) => String(n).toLowerCase()));
  const base = `Copy of ${name}`;
  if (!taken.has(base.toLowerCase())) return base;
  for (let i = 2; i < 100; i += 1) if (!taken.has(`${base} (${i})`.toLowerCase())) return `${base} (${i})`;
  return `${base} (${Date.now()})`;
};

// A saved sequence as a create-request: new name, switched off, same steps and stop rules, no server ids.
export const duplicatePayload = (seq, existingNames = []) => ({
  name: copyName(seq.name, existingNames),
  description: seq.description || '',
  is_active: false,
  stop_conditions: { ...(seq.stop_conditions || {}) },
  steps: (seq.steps || []).map(({ id, sequence_id, tenant_id, created_at, ...step }) => stepPayload(step)),
});
