import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, CheckCircle2, ClipboardCheck, ClipboardList, MessageSquareText, Search, ShieldCheck, Star, Store, Target, TrendingUp, Trophy, XCircle } from 'lucide-react';
import BrandLogo from '../components/ui/BrandLogo';
import { useToast } from '../components/ui/Toast';
import CountryCodeSelect from '../components/ui/CountryCodeSelect';
import { gbpReportAPI } from '../services/api';

const scanSteps = [
  'Getting profile details',
  'Checking profile for SEO content',
  'Analysing your top competitors',
  'Reading reviews & ratings',
  'Analysing photos & posts',
  'Finalising your report',
];

const checklist = [
  { emoji: '🏆', title: 'Rank #1 on Google', desc: 'More calls & walk-ins' },
  { emoji: '⭐', title: 'More 5-star reviews', desc: 'Win customer trust' },
  { emoji: '📸', title: 'Beat local competitors', desc: 'Customers pick you first' },
  { emoji: '✏️', title: 'Grow without an agency', desc: 'Save time & money' },
];

const googleColors = ['#4285F4', '#EA4335', '#FBBC05', '#4285F4', '#34A853', '#EA4335'];

const trustStats = [
  { value: '5 min', label: 'to get your team live on CurveLead' },
  { value: '2x', label: 'faster first response on new leads' },
  { value: '100%', label: 'free report, no card or sign-up required' },
  { value: '24/7', label: 'Meta & Google lead capture' },
];

const industries = ['Salons', 'Clinics', 'Gyms', 'Real Estate', 'Coaching Institutes', 'Education', 'Home Services', 'Restaurants', 'Retail', 'And many more'];

const reportIncludes = [
  { icon: ClipboardCheck, label: 'Profile check', cls: 'bg-blue-50 text-blue-600' },
  { icon: MessageSquareText, label: 'Review activity', cls: 'bg-amber-50 text-amber-600' },
  { icon: TrendingUp, label: 'Visibility scan', cls: 'bg-green-50 text-green-600' },
];

// Mirrors the Starter plan in LandingPage.jsx's pricing section — kept in
// sync manually since it's the only plan referenced on this page.
const starterPlan = {
  name: 'CurveLead Starter',
  price: '$9',
  period: '/month',
  features: ['100 leads', '1 user', 'Meta Ads capture', 'WhatsApp inbox'],
};

const getInitials = (name) => (name || '')
  .split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';

const GbpReportPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ business: '', phone: '', countryIso: 'IN', countryDial: '+91' });
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('form'); // 'form' | 'scanning' | 'done'
  const [submitting, setSubmitting] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [leadId, setLeadId] = useState(null);
  const [businessDropdown, setBusinessDropdown] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [matchingBusinesses, setMatchingBusinesses] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Debounced live search against Google Places, proxied through the backend
  // so the API key never reaches the browser.
  useEffect(() => {
    const q = form.business.trim();
    if (!q || selectedBusiness) { setMatchingBusinesses([]); return; }
    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const { data } = await gbpReportAPI.searchBusiness(q);
        setMatchingBusinesses(data.results || []);
        setSearchError('');
      } catch (e) {
        setMatchingBusinesses([]);
        setSearchError(e.response?.data?.error || 'Search failed. Please try again.');
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [form.business, selectedBusiness]);

  const selectBusiness = (b) => {
    setForm({ ...form, business: b.name });
    setSelectedBusiness(b);
    setBusinessDropdown(false);
    if (error) setError('');
  };

  const handleSubmit = async () => {
    if (!form.business.trim()) return setError('Please enter your business name.');
    if (form.phone.replace(/\D/g, '').length < 6) return setError('Please enter a valid WhatsApp number.');
    setError('');
    setSubmitting(true);
    try {
      const { data } = await gbpReportAPI.submit({ business: form.business.trim(), phone: form.phone, countryDial: form.countryDial });
      setLeadId(data.lead.id);
      setStepIndex(0);
      setPhase('scanning');
    } catch (e) {
      setError(e.response?.data?.error || 'Could not submit right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Scan progress is tracked server-side (see gbpReportController.runSimulatedScan)
  // so it survives refreshes — this just polls it. There's still no real
  // Google Business Profile lookup behind it, the backend advances the step
  // on its own timer after insert.
  useEffect(() => {
    if (phase !== 'scanning' || !leadId) return;
    const poll = setInterval(async () => {
      try {
        const { data } = await gbpReportAPI.getStatus(leadId);
        setStepIndex(data.scan_step);
        if (data.scan_completed) {
          clearInterval(poll);
          setTimeout(() => {
            setPhase('done');
            toast.success("Thanks! We'll send your free Google Business report on WhatsApp shortly.");
          }, 800);
        }
      } catch (e) {
        // transient poll failure — keep trying on the next tick
      }
    }, 900);
    return () => clearInterval(poll);
  }, [phase, leadId]);

  // Real profile-completeness + nearby-competitor data via Google Places
  // (Place Details + Nearby Search), fetched once the scan reaches 'done'.
  // No fabricated numbers — see gbpReportController.getBusinessReport.
  useEffect(() => {
    if (phase !== 'done' || !selectedBusiness?.place_id) return;
    setReportLoading(true);
    gbpReportAPI.getBusinessReport(selectedBusiness.place_id)
      .then(({ data }) => setReport(data))
      .catch(() => setReport(null))
      .finally(() => setReportLoading(false));
  }, [phase, selectedBusiness]);

  // Derived, real numbers for the report headline/stats — no fabricated
  // figures. issuesFailed/competitorCount/completePct all come straight out
  // of the Places-backed report; perDay is just starterPlan.price / 30.
  const issuesFailed = report?.issues?.filter((i) => !i.ok).length ?? null;
  const competitorCount = report?.competitors?.length ?? null;
  const completePct = report?.issues?.length
    ? Math.round((report.issues.filter((i) => i.ok).length / report.issues.length) * 100)
    : null;
  const perDay = (parseFloat(starterPlan.price.replace('$', '')) / 30).toFixed(2);

  return (
    <div className="min-h-screen bg-white text-gray-950">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button className="flex items-center gap-2" onClick={() => navigate('/')}>
            <BrandLogo className="site-logo" />
          </button>
          <a href="/signup" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
            Start Free
          </a>
        </div>
      </nav>

      <section className="bg-gradient-to-b from-brand-50/60 to-white px-4 py-16 sm:px-6">
        {phase === 'form' && (
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-sm font-semibold text-green-700">
                <ShieldCheck size={15} /> Trusted by growing local businesses
              </div>
              <h1 className="flex max-w-xl flex-wrap items-center gap-x-3 text-4xl font-extrabold leading-tight tracking-normal sm:text-5xl">
                <span>
                  Grow your business from{' '}
                  {'Google'.split('').map((letter, i) => (
                    <span key={i} style={{ color: googleColors[i] }}>{letter}</span>
                  ))}
                  {' '}with CurveLead AI
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-bold align-middle shadow-sm">
                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-700">FREE</span>
                  <span className="text-gray-600">Rank Report</span>
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-gray-600">
                Get a free report on how your business shows up on Google, and what's costing you calls and walk-ins.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {checklist.map((item) => (
                  <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-sm text-gray-800">
                      <span className="mr-1.5">{item.emoji}</span>
                      <span className="font-bold text-gray-900">{item.title}</span>
                      <span className="text-gray-400"> → </span>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl shadow-brand-100/60">
              <p className="text-center text-xs font-bold uppercase tracking-wider text-brand-600">Get your free GBP report</p>

              <div className="mt-5">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">1</span>
                  Find your business on Google
                </label>
                <div className="relative mt-2">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.business}
                    onChange={e => { setForm({ ...form, business: e.target.value }); setSelectedBusiness(null); setBusinessDropdown(true); if (error) setError(''); }}
                    onFocus={() => setBusinessDropdown(true)}
                    onBlur={() => setTimeout(() => setBusinessDropdown(false), 150)}
                    placeholder="Start typing your business name..."
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />

                  {businessDropdown && !selectedBusiness && form.business.trim() && (
                    <div className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
                      {searching ? (
                        <p className="px-4 py-3 text-sm text-gray-400">Searching...</p>
                      ) : searchError ? (
                        <p className="px-4 py-3 text-sm text-red-500">{searchError}</p>
                      ) : matchingBusinesses.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-gray-400">No matches. Keep typing or pick from your Google listing directly.</p>
                      ) : (
                        matchingBusinesses.map(b => (
                          <button key={b.place_id} type="button" onMouseDown={() => selectBusiness(b)}
                            className="block w-full border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-gray-50">
                            <p className="text-sm font-semibold text-gray-900">{b.name}</p>
                            <p className="mt-0.5 text-xs text-gray-500">{b.address}</p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {selectedBusiness ? (
                  <div className="mt-2 flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{selectedBusiness.name}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">{selectedBusiness.address}</p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-brand-600">Selected</span>
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs text-gray-400">Type the name, then pick your business from the list.</p>
                )}
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">2</span>
                  Your WhatsApp number
                </label>
                <div className="mt-2 flex rounded-lg border border-gray-300 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
                  <CountryCodeSelect
                    value={form.countryIso}
                    onChange={c => setForm({ ...form, countryIso: c.iso, countryDial: c.dial })}
                    className="shrink-0"
                  />
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={form.phone}
                    onChange={e => { setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 15) }); if (error) setError(''); }}
                    placeholder="98765 43210"
                    className="w-full rounded-r-lg px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>

              {error && <p className="mt-3 text-xs font-medium text-red-500">{error}</p>}

              <button onClick={handleSubmit} disabled={submitting}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-400 py-3 text-sm font-bold text-white shadow-lg shadow-brand-100 hover:opacity-95 disabled:opacity-60">
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
              <p className="mt-3 text-center text-xs text-gray-400">Free report. No card or sign-up required.</p>
            </div>
          </div>
        )}

        {phase === 'scanning' && (
          <div className="mx-auto max-w-xl">
            <div className="mx-auto mb-8 w-fit rounded-2xl border border-gray-200 bg-white px-8 py-4 text-center shadow-sm">
              <p className="text-2xl font-extrabold text-brand-700">Scanning in progress</p>
              <p className="mt-1 text-sm text-gray-500">Building your free Google Business report</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center gap-3 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Store size={20} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{selectedBusiness?.name || form.business}</p>
                  <p className="truncate text-xs text-gray-500">{selectedBusiness?.address || 'Business location'}</p>
                </div>
              </div>
              <div className="h-1 w-full bg-gray-100">
                <div
                  className="h-1 bg-gradient-to-r from-brand-600 to-cyan-400 transition-all duration-700 ease-out"
                  style={{ width: `${((stepIndex + 1) / scanSteps.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-8">
              {scanSteps.map((step, i) => {
                const isDone = i < stepIndex;
                const isActive = i === stepIndex;
                return (
                  <div key={step} className="relative flex items-start gap-3 pb-6 last:pb-0">
                    {i < scanSteps.length - 1 && (
                      <span className={`absolute left-[9px] top-5 h-full w-px border-l ${isDone ? 'border-brand-300' : 'border-dashed border-gray-200'}`} />
                    )}
                    <span className="relative z-10 mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle2 size={19} className="text-brand-600" />
                      ) : isActive ? (
                        <span className="flex h-[19px] w-[19px] items-center justify-center">
                          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-600" />
                        </span>
                      ) : (
                        <span className="block h-[19px] w-[19px] rounded-full border-2 border-gray-200" />
                      )}
                    </span>
                    <p className={`text-sm ${isActive ? 'font-semibold text-brand-700' : isDone ? 'text-gray-500' : 'text-gray-400'}`}>
                      {step}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="mx-auto max-w-5xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Your Profile Report</h2>
              <button
                onClick={() => { setPhase('form'); setSelectedBusiness(null); setReport(null); setForm(f => ({ ...f, business: '' })); }}
                className="text-sm font-medium text-brand-600 hover:underline">
                Change business
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
              <div className="space-y-6">
              {/* Business summary — only data we actually have */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl shadow-brand-100/60">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 text-sm font-bold text-white">
                    {getInitials(selectedBusiness?.name || form.business)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900">{selectedBusiness?.name || form.business}</p>
                    <p className="truncate text-xs text-gray-500">{selectedBusiness?.address || '—'}</p>
                    {report?.business?.rating && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-gray-700">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {report.business.rating} ({report.business.review_count} reviews)
                      </p>
                    )}
                  </div>
                  <span className={`ml-auto shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${report ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                    {report ? `Report ready · ${issuesFailed} issue${issuesFailed === 1 ? '' : 's'} found` : 'Report on its way'}
                  </span>
                </div>

                {report ? (
                  <>
                    <h3 className="mt-4 text-xl font-extrabold leading-snug text-gray-900">
                      {selectedBusiness?.name || form.business} could be losing visibility to {competitorCount} nearby {competitorCount === 1 ? 'business' : 'businesses'} on Google.
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      Your profile is {completePct}% complete. Fixing the gaps below helps you show up more often in local search —{' '}
                      <a href="/signup" className="font-medium text-brand-600 hover:underline">start fixing it today</a>.
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-violet-50/60 p-3 text-center">
                        <p className="text-xl font-extrabold text-red-600">{competitorCount}</p>
                        <p className="mt-0.5 text-[11px] text-gray-500">Nearby competitors</p>
                      </div>
                      <div className="rounded-xl bg-violet-50/60 p-3 text-center">
                        <p className="text-xl font-extrabold text-red-600">{issuesFailed}</p>
                        <p className="mt-0.5 text-[11px] text-gray-500">Issues hurting visibility</p>
                      </div>
                      <div className="rounded-xl bg-violet-50/60 p-3 text-center">
                        <p className="text-xl font-extrabold text-red-600">{completePct}%</p>
                        <p className="mt-0.5 text-[11px] text-gray-500">Profile complete</p>
                      </div>
                    </div>

                    <a href="/signup"
                      className="mt-6 block w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-400 py-3 text-center text-sm font-bold text-white shadow-lg shadow-brand-100 hover:opacity-95">
                      Fix My Google Profile →
                      <span className="block text-xs font-normal text-white/80">Start today · {starterPlan.price}{starterPlan.period} · ~${perDay} a day</span>
                    </a>
                    <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-600" /> Free scan</span>
                      <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-600" /> Secure & private</span>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="mt-4 text-xl font-extrabold leading-snug text-gray-900">
                      We're building your free Google visibility report.
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      We'll WhatsApp the full breakdown — profile completeness, review activity, and where you may be losing visibility — to{' '}
                      <span className="font-semibold text-gray-800">{form.countryDial} {form.phone}</span> shortly.
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      {reportIncludes.map((item) => (
                        <div key={item.label} className="rounded-xl border border-gray-200 p-3 text-center">
                          <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg ${item.cls}`}>
                            <item.icon size={17} />
                          </div>
                          <p className="mt-2 text-xs font-medium text-gray-700">{item.label}</p>
                          <p className="mt-0.5 text-[10px] text-gray-400">Included</p>
                        </div>
                      ))}
                    </div>

                    <a href="/signup"
                      className="mt-6 block w-full rounded-xl bg-brand-600 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700">
                      Get These Fixes Done For You
                    </a>
                    <p className="mt-3 text-center text-xs text-gray-400">Free report. No card required to see it.</p>
                  </>
                )}
              </div>

              {reportLoading && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
                  Checking your profile and nearby listings...
                </div>
              )}

              {report?.issues?.some((i) => !i.ok) && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
                  <h3 className="flex items-center justify-center gap-2 font-bold text-gray-900">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                      <AlertTriangle size={15} className="text-amber-500" />
                    </span>
                    Why {selectedBusiness?.name || form.business} isn't showing up more
                  </h3>
                  <span className="mt-3 inline-block rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-600">
                    {issuesFailed} issue{issuesFailed === 1 ? '' : 's'}
                  </span>
                  <ul className="mt-4 space-y-2.5 border-t border-gray-100 pt-4 text-left">
                    {report.issues.filter((i) => !i.ok).map((issue) => (
                      <li key={issue.label} className="flex items-center gap-2 text-sm text-gray-700">
                        <XCircle size={16} className="shrink-0 text-red-500" /> {issue.label} missing
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report?.issues?.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h3 className="flex items-center gap-2 font-bold text-gray-900">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                      <ClipboardList size={15} className="text-blue-600" />
                    </span>
                    Profile completion
                  </h3>

                  <div className="mt-4 rounded-xl bg-violet-50/60 p-5 text-center">
                    <p className="bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-4xl font-extrabold text-transparent">
                      {completePct}%
                    </p>
                    <p className="mt-1 text-sm text-gray-600">{selectedBusiness?.name || form.business}'s profile is filled in</p>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
                      <div className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-400" style={{ width: `${completePct}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
                    {report.issues.map((issue) => (
                      <div key={issue.label} className={`flex items-center gap-2 text-sm ${issue.ok ? 'text-gray-700' : 'font-medium text-gray-800'}`}>
                        {issue.ok ? (
                          <CheckCircle size={15} className="shrink-0 text-green-600" />
                        ) : (
                          <XCircle size={15} className="shrink-0 text-red-500" />
                        )}
                        {issue.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report?.competitors?.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h3 className="flex items-center gap-2 font-bold text-gray-900">
                    <Trophy size={16} className="text-amber-500" /> Who's nearby on Google
                  </h3>

                  <div className="mt-4 flex items-start gap-3 rounded-xl bg-gradient-to-r from-red-800 to-red-700 p-4 text-white">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                      <Target size={16} />
                    </span>
                    <div>
                      <p className="font-bold">{competitorCount} businesses near you</p>
                      <p className="mt-0.5 text-sm text-white/80">In the same category on Google — see how your rating and reviews compare.</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      <span>Business</span>
                      <div className="flex gap-8">
                        <span>Rating</span>
                        <span>Reviews</span>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {report.competitors.map((c) => (
                        <div key={c.name} className="flex items-center justify-between py-2.5 text-sm">
                          <span className="truncate pr-3 text-gray-800">{c.name}</span>
                          <div className="flex shrink-0 items-center gap-6">
                            <span className="flex w-10 items-center gap-1 text-gray-700">
                              <Star size={12} className="fill-amber-400 text-amber-400" /> {c.rating ?? '—'}
                            </span>
                            <span className="w-10 text-right font-medium text-green-600">{c.review_count}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {report.business && (
                      <div className="mt-2 flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50/50 px-3 py-2.5 text-sm">
                        <span className="truncate pr-3 font-semibold text-brand-700">{report.business.name}</span>
                        <div className="flex shrink-0 items-center gap-6">
                          <span className="flex w-10 items-center gap-1 text-gray-700">
                            <Star size={12} className="fill-amber-400 text-amber-400" /> {report.business.rating ?? '—'}
                          </span>
                          <span className="w-10 text-right font-medium text-green-600">{report.business.review_count}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <a href="/signup"
                    className="mt-4 block w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-400 py-3 text-center text-sm font-bold text-white hover:opacity-95">
                    Beat Your Competitors →
                  </a>
                </div>
              )}

              <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-400 p-6 text-center text-white">
                {issuesFailed > 0 && (
                  <span className="mb-2 inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
                    Free trial available
                  </span>
                )}
                <p className="text-lg font-bold">
                  {issuesFailed > 0 ? `Want us to help fix all ${issuesFailed} issues?` : 'Want help keeping your profile in top shape?'}
                </p>
                <p className="mt-1 text-sm text-white/80">CurveLead keeps leads, reviews, and follow-ups in one place — not just a one-time report.</p>
                <a href="/signup"
                  className="mt-4 inline-block rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-brand-700 hover:bg-gray-50">
                  Yes, start my free trial →
                </a>
              </div>
              </div>

              {/* Pricing — CurveLead's real Starter plan, not a fabricated offer */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-brand-100/60 lg:sticky lg:top-6">
                <div className="bg-gradient-to-r from-violet-600 to-cyan-400 px-5 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white">
                  Get started today
                </div>
                <div className="p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-600">{starterPlan.name}</p>
                  <div className="mt-2 flex items-end gap-1.5">
                    <span className="text-4xl font-extrabold text-gray-900">{starterPlan.price}</span>
                    <span className="mb-1 text-sm text-gray-500">{starterPlan.period}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Cancel anytime. No setup fee.</p>

                  <ul className="mt-5 space-y-2.5">
                    {starterPlan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle size={15} className="shrink-0 text-green-600" /> {f}
                      </li>
                    ))}
                  </ul>

                  <a href="/signup"
                    className="mt-6 block w-full rounded-xl bg-brand-600 py-3 text-center text-sm font-bold text-white hover:bg-brand-700">
                    Start Free Trial
                  </a>
                  <p className="mt-3 text-center text-xs text-gray-400">7-day free trial · No card required to start</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {trustStats.map((stat) => (
              <div key={stat.label} className="rounded-xl bg-brand-50 p-5 text-center">
                <p className="text-2xl font-extrabold text-brand-700 sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-gray-100 pt-6 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Works for any business</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {industries.map((name) => (
                <span key={name} className="rounded-full border border-gray-200 px-4 py-1.5 text-sm text-gray-700">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white px-4 py-8 text-center sm:px-6">
        <p className="text-sm text-gray-400">© 2026 CurveLead. Built in India.</p>
      </footer>
    </div>
  );
};

export default GbpReportPage;
