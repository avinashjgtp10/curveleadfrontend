// Pure helpers behind the shared WhatsApp template picker.

// Accepts either list shape: the slim "sendable" one (body_text, variable_count, header_format) or Meta's full one (components).
export const normalizeTemplate = (t) => {
  const comps = Array.isArray(t?.components) ? t.components : [];
  const body = t?.body_text ?? comps.find((c) => c.type === 'BODY')?.text ?? '';
  const header = comps.find((c) => c.type === 'HEADER');
  const variableCount = t?.variable_count ?? new Set([...String(body).matchAll(/\{\{(\d+)\}\}/g)].map((m) => m[1])).size;
  return {
    key: `${t?.name}::${t?.language}`, name: t?.name || '', language: t?.language || '', category: categoryOf(t),
    status: t?.status || 'APPROVED', // the slim list only contains approved templates
    body, variableCount, headerFormat: t?.header_format ?? header?.format ?? null, unsupported: t?.unsupported || null, raw: t,
  };
};

// Unknown categories are treated as Marketing, exactly like the server (services/whatsappConsent.js).
export const categoryOf = (t) => {
  const c = String(t?.category || '').toUpperCase();
  return c === 'UTILITY' || c === 'AUTHENTICATION' ? c : 'MARKETING';
};
export const CATEGORY_LABEL = { MARKETING: 'Marketing', UTILITY: 'Utility', AUTHENTICATION: 'Authentication' };

// Templates nobody should pick by accident: Meta's sample, "test"/"sample" names, and names ending in an id or date stamp.
export const isSystemTemplate = (name) => {
  const n = String(name || '').toLowerCase();
  if (n === 'hello_world') return true;
  if (/(^|[_-])(test|testing|sample|tmp|temp|dummy)([_-]|$)/.test(n)) return true;
  return /[_-](?=[0-9a-f]*\d)[0-9a-f]{6,}$/.test(n); // _20251107, _a1b2c3d4
};

const GROUPS = [
  { id: 'welcome', label: 'Welcome & thank-you', test: /welcome|greet|thank|hello|enquir|inquir|intro/ },
  { id: 'booking', label: 'Bookings & reminders', test: /book|demo|visit|appoint|schedul|remind|confirm|meeting/ },
  { id: 'followup', label: 'Follow-ups', test: /follow|nudge|check_?in|missed|no_?show|quot|proposal|feedback|review|reactivat|win_?back/ },
  { id: 'offers', label: 'Offers & announcements', test: /offer|promo|sale|discount|festival|launch|deal|arrival|announce|diwali|eid|holiday/ },
];
export const groupOf = (name) => (GROUPS.find((g) => g.test.test(String(name || '').toLowerCase())) || { id: 'other', label: 'Other' });

// Groups in a sensible order for what the picker is used for (the purpose's own group first); empty groups are dropped.
const FIRST = { welcome: 'welcome', confirmation: 'booking', reminder: 'booking', followup: 'followup', broadcast: 'offers' };
export const groupTemplates = (items, purpose = 'any') => {
  const order = ['welcome', 'booking', 'followup', 'offers', 'other'];
  const first = FIRST[purpose];
  if (first) order.splice(order.indexOf(first), 1), order.unshift(first);
  const labels = Object.fromEntries([...GROUPS, { id: 'other', label: 'Other' }].map((g) => [g.id, g.label]));
  const by = {};
  for (const it of items) (by[groupOf(it.name).id] ||= []).push(it);
  return order.filter((id) => by[id]?.length).map((id) => ({ id, label: labels[id], items: by[id].sort((a, b) => a.name.localeCompare(b.name)) }));
};

export const searchTemplates = (items, q) => {
  const s = String(q || '').trim().toLowerCase();
  return s ? items.filter((i) => `${i.name} ${i.body}`.toLowerCase().includes(s)) : items;
};

export const fillSamples = (body, samples = []) => String(body || '').replace(/\{\{(\d+)\}\}/g, (m, n) => samples[Number(n) - 1] ?? m);

// Marketing templates only reach leads who opted in. Warn when one is used for something every lead should get.
export const marketingWarning = ({ template, purpose, optIn }) => {
  if (!template || template.category !== 'MARKETING') return null;
  if (!['welcome', 'confirmation', 'reminder'].includes(purpose)) return null;
  const what = { welcome: 'a welcome message', confirmation: 'a booking confirmation', reminder: 'a reminder' }[purpose];
  let text = `This is a Marketing template, but you are using it for ${what}. WhatsApp only lets you send Marketing templates to leads who have opted in, so everyone else would not receive it. A Utility template is the right choice here.`;
  const total = Number(optIn?.total); const opted = Number(optIn?.opted_in);
  if (Number.isFinite(total) && total > 0 && Number.isFinite(opted)) {
    text += ` Today ${opted} of ${total} leads (${Math.round((opted / total) * 100)}%) have opted in and can receive it.`;
  }
  return { tone: 'warn', text };
};
