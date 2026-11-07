// Reply branching: turn a template's quick-reply buttons into reply routes, and say plainly where every other reply goes.
export const DEFAULT_PATH_TEXT = 'Any other reply goes to a team member to review.';

const norm = (s) => String(s || '').trim().toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ');

// The texts of a template's quick-reply buttons, in order (link and phone buttons cannot be answered).
export const templateButtons = (template) => (template?.components || [])
  .filter((c) => c.type === 'BUTTONS')
  .flatMap((c) => c.buttons || [])
  .filter((b) => b.type === 'QUICK_REPLY' && String(b.text || '').trim())
  .map((b) => String(b.text).trim());

// Existing routes plus one new empty route per button that has none yet. Never removes or edits what the user already set.
export const routesFromButtons = (template, existing = []) => {
  const have = new Set(existing.map((r) => norm(r.answer)));
  const added = templateButtons(template)
    .filter((text) => !have.has(norm(text)))
    .map((text) => ({ answer: text, classification: text, aliases: [], sequence_id: '' }));
  return [...existing, ...added];
};

// Buttons of the template that have no route yet (so the editor can say which answers fall to the default path).
export const unroutedButtons = (template, routes = []) => {
  const have = new Set(routes.map((r) => norm(r.answer)));
  return templateButtons(template).filter((text) => !have.has(norm(text)));
};

export const routeIssue = (route) => {
  if (!String(route?.answer || '').trim()) return 'Add the answer text.';
  if (!route?.sequence_id) return 'Choose which sequence a lead who gives this answer should start.';
  return null;
};
