// One verdict about "what does a brand-new lead get on WhatsApp?", from the two things that can send a first message:
//   * the Welcome message (one setting, edited from Auto messages and the Integrations page)
//   * Sequence rules that start when "a new lead is received"
// Pure: the screens pass in what the existing APIs return.
export const WELCOME_EDIT_PATH = '/whatsapp?tab=auto';
export const SEQUENCE_PATH = '/lead-automation';

/**
 * @param responder { enabled, template, message } (hub auto-messages: welcome_enabled, welcome_template_name, welcome_message)
 * @param rules     trigger rules ({ trigger_type, is_active, sequence_name, name })
 * @returns { state: none|welcome|sequence|both|incomplete, tone: ok|warn|muted, headline, detail, welcome, sequences }
 */
export const welcomeStatus = ({ responder, rules } = {}) => {
  const template = String(responder?.template || '').trim();
  const message = String(responder?.message || '').trim();
  const enabled = !!responder?.enabled;
  const sequences = (Array.isArray(rules) ? rules : [])
    .filter((r) => r?.trigger_type === 'new_lead' && r.is_active !== false)
    .map((r) => r.sequence_name || r.name || 'a sequence');
  const welcomeOn = enabled && !!(template || message);
  const incomplete = enabled && !template && !message;
  const welcome = { on: welcomeOn, template, textOnly: welcomeOn && !template };
  const welcomeText = template ? `the template “${template}”` : 'a plain-text message (it only reaches leads who have already messaged you in the last 24 hours)';

  if (welcomeOn && sequences.length) {
    return { state: 'both', tone: 'warn', welcome, sequences,
      headline: 'Two things may send a first message to new leads',
      detail: `The welcome message (${welcomeText}) and the first step of ${sequences.map((s) => `“${s}”`).join(', ')}. If that step goes out straight away, new leads get two messages. Keep one of them.` };
  }
  if (welcomeOn) {
    return { state: 'welcome', tone: welcome.textOnly ? 'warn' : 'ok', welcome, sequences,
      headline: 'New leads get a welcome message',
      detail: `Sent as ${welcomeText}.${welcome.textOnly ? ' Choose a template so it reaches brand-new leads.' : ''}` };
  }
  if (incomplete) {
    return { state: 'incomplete', tone: 'warn', welcome, sequences,
      headline: 'The welcome message is on but has nothing to send',
      detail: sequences.length ? `Pick a template or write a message, or turn it off. New leads still start ${sequences.map((s) => `“${s}”`).join(', ')}.` : 'Pick a template or write a message, or turn it off.' };
  }
  if (sequences.length) {
    return { state: 'sequence', tone: 'ok', welcome, sequences,
      headline: 'A sequence sends the first message to new leads',
      detail: `${sequences.map((s) => `“${s}”`).join(', ')} starts when a new lead is received. The separate welcome message is off.` };
  }
  return { state: 'none', tone: 'muted', welcome, sequences,
    headline: 'No automatic first message is set up', detail: 'New leads wait until someone messages them. Turn on the welcome message, or start a sequence for new leads.' };
};
