import { parsePhoneNumberFromString } from 'libphonenumber-js/max';
export const SOURCE_LABELS = Object.freeze({ manual: 'Manual', meta_ads: 'Meta Ads', google_ads: 'Google Ads', whatsapp: 'WhatsApp', website: 'Website', api: 'API', import: 'Import', referral: 'Referral', organic: 'Organic', instagram: 'Instagram', walkin: 'Walk-in', other: 'Other' });
export const sourceLabel = value => SOURCE_LABELS[String(value || '').trim().toLowerCase()] || 'Other';
export function initials(name, count = 2) {
  const first = word => typeof Intl.Segmenter === 'function' ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(word)][0]?.segment : Array.from(word)[0];
  return String(name || '').normalize('NFKC').trim().split(/\s+/).slice(0,count).map(first).join('').toUpperCase() || '?';
}
export function normalizePhone(value) {
  let input = String(value ?? '').trim();
  if (/^91[6-9]\d{9}$/.test(input.replace(/[\s()-]/g, ''))) input = '+' + input;
  const parsed = parsePhoneNumberFromString(input, { defaultCountry: 'IN', extract: false });
  if (!parsed?.isValid() || parsed.ext) throw new Error('Enter a valid phone number, including country code for numbers outside India.');
  return parsed.number;
}
