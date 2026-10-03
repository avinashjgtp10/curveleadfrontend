// Workspace country / currency / timezone (Settings → Business). Set once from the auth
// payload; every money and number on screen goes through here instead of a hardcoded
// "₹" + en-IN. Amounts are shown in the currency they were recorded in — never converted.
export const DEFAULT_LOCALE = { country: 'IN', currency: 'INR', timezone: 'Asia/Kolkata' };

let workspace = { ...DEFAULT_LOCALE };

const validCurrency = (c) => { try { return /^[A-Z]{3}$/.test(c || '') && !!new Intl.NumberFormat('en', { style: 'currency', currency: c }); } catch { return false; } };

export function intlLocale(country = workspace.country) {
  const tag = `en-${country || DEFAULT_LOCALE.country}`;
  try { return Intl.NumberFormat.supportedLocalesOf([tag]).length ? tag : 'en'; } catch { return 'en'; }
}

export function setWorkspaceLocale({ country, currency } = {}) {
  workspace = {
    ...workspace,
    country: /^[A-Z]{2}$/.test(country || '') ? country : DEFAULT_LOCALE.country,
    currency: validCurrency(currency) ? currency : DEFAULT_LOCALE.currency,
  };
}
export const workspaceCurrency = () => workspace.currency;
export const workspaceCountry = () => workspace.country;

// formatMoney(1250) → "₹1,250" in an India workspace, "AED 1,250" in a UAE one.
// currency: the amount's own currency when known (an ad account's, a quotation's).
// country: whose digit grouping to use when it isn't this workspace's (a public quote page).
export function formatMoney(amount, currency, { decimals, compact = false, country } = {}) {
  if (amount === null || amount === undefined || amount === '') return '—';
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  const cur = validCurrency(currency) ? currency : workspace.currency;
  const opts = { style: 'currency', currency: cur };
  if (compact) Object.assign(opts, { notation: 'compact', maximumFractionDigits: 1 });
  else if (decimals != null) Object.assign(opts, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  else Object.assign(opts, { minimumFractionDigits: 0, maximumFractionDigits: Number.isInteger(n) ? 0 : 2 });
  return new Intl.NumberFormat(intlLocale(country), opts).format(n);
}

export const formatNumber = (n, opts = {}) => new Intl.NumberFormat(intlLocale(), opts).format(Number(n) || 0);

// The currency's symbol on its own, for input labels: "Budget (₹)", "Budget (AED)".
export function currencySymbol(currency = workspace.currency) {
  try {
    return new Intl.NumberFormat(intlLocale(), { style: 'currency', currency }).formatToParts(0).find(p => p.type === 'currency')?.value || currency;
  } catch { return currency; }
}

// Spend across several currencies is listed per currency, never added up without FX.
// spendByCurrency: { INR: 1200, USD: 30 } → "₹1,200 + $30"
export function formatMoneyByCurrency(spendByCurrency, fallback = '—') {
  const entries = Object.entries(spendByCurrency || {}).filter(([, v]) => v != null);
  if (!entries.length) return fallback;
  return entries.map(([cur, v]) => formatMoney(v, cur)).join(' + ');
}
export const isMixedCurrency = (spendByCurrency) => Object.keys(spendByCurrency || {}).length > 1;

// Countries offered in Settings, with the currency and timezone they usually use.
export const COUNTRIES = [
  ['IN', 'India', 'INR', 'Asia/Kolkata'],
  ['AE', 'United Arab Emirates', 'AED', 'Asia/Dubai'],
  ['SA', 'Saudi Arabia', 'SAR', 'Asia/Riyadh'],
  ['QA', 'Qatar', 'QAR', 'Asia/Qatar'],
  ['KW', 'Kuwait', 'KWD', 'Asia/Kuwait'],
  ['OM', 'Oman', 'OMR', 'Asia/Muscat'],
  ['BH', 'Bahrain', 'BHD', 'Asia/Bahrain'],
  ['US', 'United States', 'USD', 'America/New_York'],
  ['CA', 'Canada', 'CAD', 'America/Toronto'],
  ['GB', 'United Kingdom', 'GBP', 'Europe/London'],
  ['IE', 'Ireland', 'EUR', 'Europe/Dublin'],
  ['DE', 'Germany', 'EUR', 'Europe/Berlin'],
  ['FR', 'France', 'EUR', 'Europe/Paris'],
  ['NL', 'Netherlands', 'EUR', 'Europe/Amsterdam'],
  ['ES', 'Spain', 'EUR', 'Europe/Madrid'],
  ['IT', 'Italy', 'EUR', 'Europe/Rome'],
  ['AU', 'Australia', 'AUD', 'Australia/Sydney'],
  ['NZ', 'New Zealand', 'NZD', 'Pacific/Auckland'],
  ['SG', 'Singapore', 'SGD', 'Asia/Singapore'],
  ['MY', 'Malaysia', 'MYR', 'Asia/Kuala_Lumpur'],
  ['ID', 'Indonesia', 'IDR', 'Asia/Jakarta'],
  ['PH', 'Philippines', 'PHP', 'Asia/Manila'],
  ['BD', 'Bangladesh', 'BDT', 'Asia/Dhaka'],
  ['LK', 'Sri Lanka', 'LKR', 'Asia/Colombo'],
  ['NP', 'Nepal', 'NPR', 'Asia/Kathmandu'],
  ['PK', 'Pakistan', 'PKR', 'Asia/Karachi'],
  ['ZA', 'South Africa', 'ZAR', 'Africa/Johannesburg'],
  ['NG', 'Nigeria', 'NGN', 'Africa/Lagos'],
  ['KE', 'Kenya', 'KES', 'Africa/Nairobi'],
].map(([code, name, currency, timezone]) => ({ code, name, currency, timezone }));

export const CURRENCIES = [...new Set(COUNTRIES.map(c => c.currency))];

export function timezones() {
  try { return Intl.supportedValuesOf('timeZone'); } catch { return [...new Set(COUNTRIES.map(c => c.timezone))]; }
}

// Tax and bank fields per country. Keep in sync with backend utils/countryProfiles.js.
// gst_number holds the primary tax registration number whatever its local name.
const HOLDER = { key: 'account_holder', label: 'Account holder name' };
const BANK = { key: 'bank_name', label: 'Bank name' };
const ACCOUNT = { key: 'account_number', label: 'Account number' };
const IBAN = { key: 'iban', label: 'IBAN', upper: true };
const SWIFT = { key: 'swift', label: 'SWIFT / BIC', upper: true };
const GULF = { tax: [{ key: 'gst_number', label: 'TRN (VAT registration)' }], bank: [HOLDER, BANK, IBAN, SWIFT], default_tax_percent: 5 };
const EU = (vat) => ({ tax: [{ key: 'gst_number', label: 'VAT number', upper: true }], bank: [HOLDER, BANK, IBAN, SWIFT], default_tax_percent: vat });
const PROFILES = {
  IN: { tax: [{ key: 'gst_number', label: 'GSTIN', upper: true, placeholder: '22AAAAA0000A1Z5' }, { key: 'pan_number', label: 'PAN', upper: true, placeholder: 'AAAAA0000A' }],
        bank: [HOLDER, BANK, ACCOUNT, { key: 'ifsc', label: 'IFSC code', upper: true }, { key: 'upi', label: 'UPI ID', placeholder: 'yourname@upi' }], default_tax_percent: 18 },
  AE: GULF, SA: { ...GULF, default_tax_percent: 15 }, OM: GULF, BH: { ...GULF, default_tax_percent: 10 }, QA: { ...GULF, default_tax_percent: 0 }, KW: { ...GULF, default_tax_percent: 0 },
  GB: { tax: [{ key: 'gst_number', label: 'VAT number', upper: true }], bank: [HOLDER, BANK, ACCOUNT, { key: 'sort_code', label: 'Sort code' }, IBAN, SWIFT], default_tax_percent: 20 },
  IE: EU(23), DE: EU(19), FR: EU(20), NL: EU(21), ES: EU(21), IT: EU(22),
  US: { tax: [{ key: 'gst_number', label: 'EIN' }], bank: [HOLDER, BANK, ACCOUNT, { key: 'routing_number', label: 'Routing number (ABA)' }, SWIFT], default_tax_percent: 0 },
  CA: { tax: [{ key: 'gst_number', label: 'Business number (GST/HST)' }], bank: [HOLDER, BANK, ACCOUNT, { key: 'transit_number', label: 'Transit & institution number' }, SWIFT], default_tax_percent: 5 },
  AU: { tax: [{ key: 'gst_number', label: 'ABN' }], bank: [HOLDER, BANK, ACCOUNT, { key: 'bsb', label: 'BSB' }, SWIFT], default_tax_percent: 10 },
  NZ: { tax: [{ key: 'gst_number', label: 'GST number' }], bank: [HOLDER, BANK, ACCOUNT, SWIFT], default_tax_percent: 15 },
  SG: { tax: [{ key: 'gst_number', label: 'GST registration number' }], bank: [HOLDER, BANK, ACCOUNT, SWIFT], default_tax_percent: 9 },
};
const DEFAULT_PROFILE = { tax: [{ key: 'gst_number', label: 'Tax ID' }], bank: [HOLDER, BANK, ACCOUNT, IBAN, SWIFT], default_tax_percent: 0 };
export const countryProfile = (country = workspace.country) => PROFILES[country] || DEFAULT_PROFILE;

// Label for a saved bank field, including ones from a previous country.
export function bankLabel(country, key) {
  return countryProfile(country).bank.find(f => f.key === key)?.label
    || ({ ifsc: 'IFSC', upi: 'UPI' })[key] || key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
}
