export const DEFAULT_HIDDEN_STAGES = Object.freeze(['unqualified', 'lost']);
export const normalizeHiddenStages = value => Array.isArray(value)
  ? [...new Set(value.filter(v => typeof v === 'string').map(v => v.trim().toLowerCase()).filter(Boolean))]
  : [...DEFAULT_HIDDEN_STAGES];
export const effectiveHiddenStages = (hidden, stage) => normalizeHiddenStages(hidden).filter(s => s !== String(stage || '').toLowerCase());

// Generation checks also protect against transports that finish despite cancellation.
export function createLatestRequest() {
  let generation = 0, controller;
  return {
    begin() {
      controller?.abort();
      controller = new AbortController();
      const current = ++generation, signal = controller.signal;
      return { signal, isCurrent: () => current === generation && !signal.aborted };
    },
    cancel() { generation++; controller?.abort(); },
  };
}

const fold = value => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
  .replace(/ß/g, 'ss').replace(/æ/g, 'ae').replace(/œ/g, 'oe').replace(/ł/g, 'l').replace(/ø/g, 'o').replace(/đ/g, 'd');
// Keep offsets into the original string, including astral letters and combined accents.
export function matchParts(value, search, digitsOnly = false) {
  const text = String(value ?? '');
  const query = digitsOnly ? String(search || '').replace(/\D/g, '') : fold(String(search || '').trim());
  if (!query) return [{ text, match: false }];
  let normalized = '', ranges = [], offset = 0;
  const graphemes = typeof Intl.Segmenter === 'function'
    ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map(s => s.segment)
    : Array.from(text);
  for (const grapheme of graphemes) {
    const fragment = digitsOnly ? grapheme.replace(/\D/g, '') : fold(grapheme);
    normalized += fragment;
    for (let i = 0; i < fragment.length; i++) ranges.push([offset, offset + grapheme.length]);
    offset += grapheme.length;
  }
  const spans = [];
  for (let index = normalized.indexOf(query); index !== -1; index = normalized.indexOf(query, index + query.length)) {
    const start = ranges[index][0], end = ranges[index + query.length - 1][1];
    if (spans.length && start <= spans.at(-1)[1]) spans.at(-1)[1] = end;
    else spans.push([start, end]);
  }
  const parts = []; let cursor = 0;
  for (const [start, end] of spans) {
    if (start > cursor) parts.push({ text: text.slice(cursor, start), match: false });
    parts.push({ text: text.slice(start, end), match: true }); cursor = end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false });
  return parts.length ? parts : [{ text, match: false }];
}
