// What to tell a user about a chosen WhatsApp template. The one rule: never say "not found" unless WhatsApp really answered.
// Loading or a failed load is "checking" / "couldn't check", not "this template was deleted".
const norm = (v) => String(v || '').trim().toLowerCase();
const human = (s) => String(s || 'unknown').toLowerCase().replace(/_/g, ' ');

// Same matching as the server: ignore case and spaces; a name counts as approved if ANY language variant is approved.
export const findTemplate = (templates, name) => {
  const wanted = norm(name);
  if (!wanted) return { state: 'none' };
  const matches = (Array.isArray(templates) ? templates : []).filter((t) => norm(t.name) === wanted);
  if (!matches.length) return { state: 'not_found' };
  const approved = matches.find((t) => t.status === 'APPROVED');
  if (approved) return { state: 'verified', template: approved, status: 'APPROVED', language: approved.language };
  return { state: 'not_approved', template: matches[0], status: matches[0].status, language: matches[0].language };
};

/**
 * @param value     the saved/selected template name
 * @param check     the server's verdict for exactly this name ({state, status, language, message}), or undefined
 * @param listState 'loading' | 'error' | 'ready' for the template list the screen loaded itself
 * @param templates that list
 * @returns { state: none|checking|verified|not_approved|not_found|unverified, tone: ok|warn|bad|muted, text, template? }
 */
export const templateStatus = ({ value, check, listState, templates }) => {
  if (!norm(value)) return { state: 'none', tone: 'muted', text: '' };
  if (check) {
    const tone = { verified: 'ok', not_approved: 'warn', unverified: 'warn', not_found: 'bad' }[check.state] || 'muted';
    const text = check.state === 'verified' ? `Verified — approved${check.language ? ` (${check.language})` : ''}` : (check.message || 'Could not check this template.');
    return { state: check.state, tone, text, status: check.status };
  }
  if (listState === 'loading') return { state: 'checking', tone: 'muted', text: 'Checking with WhatsApp…' };
  if (listState === 'error') return { state: 'unverified', tone: 'warn', text: 'Couldn’t check this template with WhatsApp right now. It may still be fine.' };
  const r = findTemplate(templates, value);
  if (r.state === 'verified') return { state: 'verified', tone: 'ok', text: `Verified — approved${r.language ? ` (${r.language})` : ''}`, template: r.template, status: r.status };
  if (r.state === 'not_approved') return { state: 'not_approved', tone: 'warn', text: `Template "${value}" is ${human(r.status)} in WhatsApp Manager, so it can’t be sent yet.`, template: r.template, status: r.status };
  return { state: 'not_found', tone: 'bad', text: `Template "${value}" wasn’t found in your WhatsApp account.` };
};
