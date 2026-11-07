// Turns the text stored for a failed WhatsApp message ("[131049] …" or plain text) into something a business owner can act on.
// Never invents a reason: when nothing was stored it says so.
const CODE_TEXT = {
  190: 'WhatsApp login has expired. Reconnect WhatsApp in Integrations.', 102: 'WhatsApp login has expired. Reconnect WhatsApp in Integrations.',
  10: 'WhatsApp access was denied. Reconnect WhatsApp in Integrations.', 200: 'WhatsApp access was denied. Reconnect WhatsApp in Integrations.', 131005: 'WhatsApp access was denied. Reconnect WhatsApp in Integrations.',
  131047: 'More than 24 hours since this person last messaged you. Send an approved template instead.',
  131026: 'This number can’t receive WhatsApp messages.',
  131049: 'Meta chose not to deliver this marketing message to this person. Try again in a day or two, wait until they reply, or use a Utility template.',
  131050: 'This person stopped marketing messages from your business. Don’t send them marketing templates.',
  130472: 'Meta didn’t deliver this message as part of a delivery experiment. Try again later.',
  131056: 'Too many messages to this number in a short time. Wait a moment and try again.',
  132001: 'This template doesn’t exist in that language on WhatsApp.',
  132000: 'The template’s variables don’t match what was sent.',
  130429: 'WhatsApp rate limit reached. Try again shortly.',
};
// Raw network / API wording that means nothing to a business owner.
const TECHNICAL = /OAuthException|\(#\d+\)|Graph API|Unsupported (post|get)|\bundefined\b|^Request failed|ECONN|ETIMEDOUT|status code|socket hang up/i;

export const parseFailure = (detail) => {
  const raw = String(detail ?? '').trim();
  if (!raw) return { recorded: false, code: null, text: 'Reason not recorded', raw: '' };
  const m = /^\[(\d{2,7})\]\s*/.exec(raw);
  const code = m ? m[1] : null;
  const body = (m ? raw.slice(m[0].length) : raw).trim();
  let text = body;
  if (!body || TECHNICAL.test(body)) text = (code && CODE_TEXT[code]) || (body ? 'WhatsApp couldn’t deliver this message (technical error).' : 'WhatsApp couldn’t deliver this message.');
  return { recorded: true, code, text, raw };
};
