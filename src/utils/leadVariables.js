// The lead details a message can include, named once. {{city}} in a message and "City or location" in the template mapper are
// the same thing (the lead's Location field). Matches utils/templateVars.js on the server.
export const LEAD_VARIABLES = [
  { key: 'name', token: '{{name}}', field: 'name', label: 'Lead’s name', example: 'Priya', help: 'The name saved on the lead.' },
  { key: 'phone', token: '{{phone}}', field: 'phone', label: 'Phone number', example: '+91 98765 43210', help: 'The lead’s phone number.' },
  { key: 'email', token: '{{email}}', field: 'email', label: 'Email address', example: 'priya@example.com', help: 'The lead’s email, if saved.' },
  { key: 'city', token: '{{city}}', field: 'location', label: 'City or location', example: 'Baramati', help: 'The lead’s Location field.' },
  { key: 'source', token: '{{source}}', field: 'source', label: 'Where the lead came from', example: 'meta ads', help: 'For example “meta ads” or “website”.' },
];

// Options for filling a WhatsApp template slot ({{1}}, {{2}}…). Values are the stored field names and must not change.
export const TEMPLATE_FIELD_OPTIONS = [
  ...LEAD_VARIABLES.map((v) => ({ value: v.field, label: v.label })),
  { value: 'product', label: 'Product (from the lead form)' },
  { value: 'literal', label: 'Fixed text' },
];

// Words people try that the system does not fill, and what they probably meant.
const SUGGESTIONS = { location: 'city', town: 'city', first_name: 'name', firstname: 'name', fullname: 'name', full_name: 'name', customer: 'name', mobile: 'phone', number: 'phone', phone_number: 'phone', lead_source: 'source' };

// Variables in a message that will not be filled: anything in {{double braces}} that is not one of ours (numbers are template slots).
export const unknownVariables = (text) => {
  const known = new Set(LEAD_VARIABLES.map((v) => v.key));
  const seen = new Map();
  for (const m of String(text || '').matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)) {
    const raw = m[1]; const key = raw.toLowerCase();
    if (/^\d+$/.test(key) || known.has(key) || seen.has(key)) continue;
    const guess = SUGGESTIONS[key];
    seen.set(key, { token: `{{${raw}}}`, suggestion: guess ? `{{${guess}}}` : null });
  }
  return [...seen.values()];
};

// A message with example values filled in, for previews.
export const fillExamples = (text) => LEAD_VARIABLES.reduce((out, v) => out.replace(new RegExp(v.token.replace(/[{}]/g, '\\$&'), 'gi'), v.example), String(text || ''));
