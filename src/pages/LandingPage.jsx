import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  FileText,
  Gauge,
  Globe,
  Lightbulb,
  Menu,
  MessageCircle,
  Megaphone,
  PhoneCall,
  PieChart,
  Plug,
  Send,
  Shuffle,
  Sparkles,
  Star,
  Target,
  Users,
  Wallet,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import BrandLogo from '../components/ui/BrandLogo';

const painPoints = [
  'Meta leads sit unseen until someone exports a CSV.',
  'Salespeople forget who needs a callback today.',
  'WhatsApp chats, brochures, quotations, and notes live in different places.',
  'Ad spend keeps rising, but nobody knows which campaign actually closes.',
];

const workflow = [
  {
    icon: Zap,
    label: 'Capture',
    title: 'Pull leads from Meta & Google Ads into one workspace',
    desc: 'Facebook, Instagram, and Google lead form enquiries land directly in your pipeline with source, campaign, owner, and stage attached — or push leads in from any other system via API.',
  },
  {
    icon: Gauge,
    label: 'Prioritise',
    title: 'See exactly which leads need attention today',
    desc: 'Every lead carries a live Intent Score, a Hot/Warm/Cold label, and a follow-up health status built from real call outcomes and response times, not a black-box AI guess, so your team always knows who to call next and why.',
  },
  {
    icon: MessageCircle,
    label: 'Engage',
    title: 'Move every conversation to WhatsApp faster',
    desc: 'Use a shared WhatsApp inbox, lead notes, files, brochures, and follow-ups so every salesperson knows the full context.',
  },
  {
    icon: BarChart3,
    label: 'Measure',
    title: 'See campaign ROI and team performance',
    desc: 'Track leads by source, staff, campaign, pipeline stage, revenue, and follow-up activity from one dashboard.',
  },
];

const featureAccents = {
  blue: { card: 'bg-blue-50/60 border-blue-100', icon: 'bg-blue-100 text-blue-600' },
  pink: { card: 'bg-pink-50/60 border-pink-100', icon: 'bg-pink-100 text-pink-600' },
  purple: { card: 'bg-violet-50/60 border-violet-100', icon: 'bg-violet-100 text-violet-600' },
  green: { card: 'bg-emerald-50/60 border-emerald-100', icon: 'bg-emerald-100 text-emerald-600' },
};

// Six core cards carry the main promise (ad lead → WhatsApp → follow-up → ROI); everything
// else sits in three collapsed groups so the page isn't a feature dump. `beta` marks
// features that aren't fully live yet, so the page never promises more than the product.
const features = [
  { icon: Zap, title: 'Meta & Google lead capture', accent: 'blue', desc: 'Facebook, Instagram and Google lead form enquiries land in your pipeline in real time, with campaign, ad and owner attached.' },
  { icon: MessageCircle, title: 'Shared WhatsApp Inbox', accent: 'green', desc: 'Reply, qualify, send approved templates and keep every conversation tied to the right lead.' },
  { icon: Gauge, title: 'Lead Intent Index', accent: 'purple', desc: 'A live 0-100 score, Hot/Warm/Cold label and a suggested next action for every lead, built from real activity. Fully explainable.' },
  { icon: Clock, title: 'Follow-up Discipline', accent: 'pink', desc: 'Schedule, complete and track callbacks, with response-time tracking that flags slow replies before they cost you.' },
  { icon: Shuffle, title: 'Smart Lead Routing', accent: 'blue', desc: 'Auto-assign new leads by source, campaign or location, or round-robin across the team, so nothing sits unclaimed.' },
  { icon: Megaphone, title: 'Campaign ROI', accent: 'green', desc: 'Connect ad spend to leads, customers, cost per lead and revenue, campaign by campaign.' },
];

const featureGroups = [
  { label: 'Sell', items: [
    { icon: FileText, title: 'Quotations', desc: 'Create, send and track quotations inside the sales flow.' },
    { icon: BookOpen, title: 'Brochures & Files', desc: 'Share product material with leads from the same workspace.' },
    { icon: Calendar, title: 'Appointments', desc: 'Book demos and visits with automatic WhatsApp confirmations and reminders.' },
    { icon: Users, title: 'Team Workspace', desc: 'Invite staff, assign ownership and monitor activity.' },
  ] },
  { label: 'Automate', items: [
    { icon: Workflow, title: 'Automation Sequences', desc: 'Enrol matching leads into a scripted WhatsApp or email follow-up the moment they land.' },
    { icon: PhoneCall, title: 'AI Calling Agent', desc: 'A configurable AI voice agent that calls new leads.', beta: true },
    { icon: Plug, title: 'Integrations & API', desc: 'Website forms, webhooks and a REST API for any other lead source.' },
  ] },
  { label: 'Grow', items: [
    { icon: PieChart, title: 'Reports & Analytics', desc: 'Funnels, lead sources, staff performance and campaign breakdowns.' },
    { icon: Lightbulb, title: 'AI Sales Coaching', desc: "A playbook built from your own team's won and lost calls." },
    { icon: Globe, title: 'Market Intelligence', desc: 'AI competitor and market analysis for your business.' },
    { icon: Star, title: 'Google Business Profile', desc: 'Review requests on WhatsApp today; review replies and profile insights once Google approves access.', beta: true },
  ] },
];

const BetaChip = () => <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[10px] font-semibold text-amber-800">Beta</span>;


const plans = [
  { name: 'Free', monthly: '$0', yearly: '$0', sub: 'for getting started', features: ['20 leads', '1 user', 'Pipeline', 'Email support'] },
  { name: 'Starter', monthly: '$9', yearly: '$90', features: ['100 leads', '1 user', 'Meta Ads capture', 'WhatsApp inbox'] },
  { name: 'Growth', monthly: '$29', yearly: '$290', features: ['Unlimited leads', '5 users', 'Lead Intent Index', 'Campaign ROI', 'Reports'], popular: true },
  { name: 'Pro', price: 'Custom', sub: 'for sales teams', features: ['Everything in Growth', 'Unlimited users', 'Priority support', 'Advanced setup help'] },
];

const faqs = [
  { q: 'Who is CurveLead built for?', a: 'Sales teams that receive leads from Meta Ads, Google Ads, websites, forms, and WhatsApp, especially teams that need faster follow-up and campaign visibility.' },
  { q: 'Which industries use CurveLead?', a: 'Any business that runs ads or forms to get enquiries and closes them over WhatsApp or phone: salons and clinics, education and coaching, real estate, agencies, home services, retail and B2B sales teams.' },
  { q: 'Does it replace WhatsApp?', a: 'No. It helps your team manage lead context, follow-ups, files, and reporting around WhatsApp conversations.' },
  { q: 'Is the lead scoring AI?', a: 'No, and that is deliberate. Every lead’s Intent Score and follow-up health are calculated from real activity in your account, like response times and call outcomes, so you can always see exactly why a lead is Hot or Cold. We do use AI elsewhere, for the sales coaching playbook, market analysis, and optional AI calling, but never as an unexplainable scoring layer.' },
  { q: 'Can I try it before paying?', a: 'Yes. Start free, test the workflow, and upgrade when your team needs higher lead limits or advanced features.' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  const closeMenu = () => setMobileMenu(false);
  // The open mobile menu closes on Escape or once the page scrolls.
  useEffect(() => {
    if (!mobileMenu) return;
    const onKey = (e) => { if (e.key === 'Escape') setMobileMenu(false); };
    const onScroll = () => setMobileMenu(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('scroll', onScroll); };
  }, [mobileMenu]);
  const handlePlanClick = (planName) => {
    if (planName === 'Pro') {
      window.location.href = 'mailto:support@curvelead.com?subject=CurveLead%20Pro%20plan';
      return;
    }
    navigate(user ? '/billing' : '/signup');
  };

  return (
    <div className="min-h-screen bg-white text-gray-950">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button className="flex items-center gap-2" onClick={() => navigate('/')}>
            <BrandLogo className="site-logo" />
          </button>

          <div className="hidden items-center gap-7 md:flex">
            <a href="#workflow" className="text-sm text-gray-600 hover:text-gray-950">Workflow</a>
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-950">Features</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-950">Pricing</a>
            <a href="/login" className="text-sm font-semibold text-brand-700">Sign in</a>
            <a href="/signup" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
              Start free
            </a>
          </div>

          <button onClick={() => setMobileMenu(!mobileMenu)} className="p-2 md:hidden" aria-label={mobileMenu ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenu}>
            {mobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenu && (
          <div className="space-y-3 border-t bg-white p-4 md:hidden">
            <a href="#workflow" onClick={closeMenu} className="block py-2 text-gray-600">Workflow</a>
            <a href="#features" onClick={closeMenu} className="block py-2 text-gray-600">Features</a>
            <a href="#pricing" onClick={closeMenu} className="block py-2 text-gray-600">Pricing</a>
            <a href="/login" onClick={closeMenu} className="block py-2 font-semibold text-brand-700">Sign in</a>
            <a href="/signup" onClick={closeMenu} className="block w-full rounded-lg bg-brand-600 px-5 py-2.5 text-center text-sm font-semibold text-white">Start free</a>
          </div>
        )}
      </nav>

      <main>
        <section className="px-4 pb-12 pt-24 sm:px-6 lg:pb-16">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_0.92fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700">
                <Sparkles size={15} /> Built for Meta & Google Ads, WhatsApp, and fast follow-up
              </div>
              <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-normal sm:text-5xl lg:text-6xl">
                Turn ad leads into WhatsApp conversations before they go cold.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
                CurveLead captures enquiries, scores them from real activity — not a black box — keeps follow-ups on track, and shows which campaigns and salespeople are actually closing.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="/signup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-brand-100 hover:bg-brand-700">
                  Start free <ArrowRight size={18} />
                </a>
                <a href="#workflow" className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-7 py-3.5 font-semibold text-gray-800 hover:bg-gray-50">
                  See how it works
                </a>
              </div>
              <p className="mt-6 text-sm text-gray-500">Works with Meta Lead Ads · Google Ads · WhatsApp Business API</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-2xl shadow-gray-200/70">
              <div className="rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Today</p>
                    <p className="font-semibold">Lead command center</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">Sample data</span>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-brand-600 p-4 text-white">
                    <p className="text-sm text-white/70">New Meta leads</p>
                    <p className="mt-2 text-3xl font-bold">38</p>
                    <p className="mt-3 text-xs text-white/75">12 assigned in the last hour</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Hot leads</p>
                    <p className="mt-2 text-3xl font-bold text-gray-950">11</p>
                    <p className="mt-3 text-xs text-red-600">Flagged for urgent follow-up</p>
                  </div>
                  <div className="sm:col-span-2 rounded-lg border border-gray-200">
                    {[
                      { name: 'Aarav Kulkarni', source: 'Facebook Lead Form', score: 'HOT', tone: 'bg-red-50 text-red-700' },
                      { name: 'Priya Shah', source: 'Instagram Campaign', score: 'WARM', tone: 'bg-amber-50 text-amber-700' },
                      { name: 'Rahul Mehta', source: 'Website Form', score: 'NEW', tone: 'bg-blue-50 text-blue-700' },
                    ].map((lead) => (
                      <div key={lead.name} className="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-b-0">
                        <div>
                          <p className="text-sm font-semibold">{lead.name}</p>
                          <p className="text-xs text-gray-500">{lead.source}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${lead.tone}`}>{lead.score}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Send size={16} className="text-green-600" />
                      <p className="text-sm font-semibold">WhatsApp next</p>
                    </div>
                    <p className="text-xs leading-5 text-gray-500">Send brochure, schedule callback, and create quotation from the same lead view.</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Wallet size={16} className="text-brand-600" />
                      <p className="text-sm font-semibold">Revenue view</p>
                    </div>
                    <p className="text-xs leading-5 text-gray-500">Track campaign spend, won deals, and team conversion performance.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-gray-200 bg-gray-50 px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">The sales problems CurveLead is built to stop</h2>
            <div className="mt-8 grid gap-3 md:grid-cols-4">
              {painPoints.map((point) => (
                <div key={point} className="rounded-lg border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-600">
                  {point}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wider text-brand-600">Capture to close</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">One workflow for every enquiry your team handles.</h2>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-4">
              {workflow.map((step) => (
                <div key={step.title} className="rounded-lg border border-gray-200 bg-white p-5">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <step.icon size={21} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-600">{step.label}</p>
                  <h3 className="mt-2 text-lg font-bold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-gray-600">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="relative overflow-hidden bg-gradient-to-b from-white via-[#F8FAFC] to-white px-4 py-20 sm:px-6">
          <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-brand-200 via-blue-100 to-transparent opacity-50 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 -right-32 h-96 w-96 -translate-y-1/2 rounded-full bg-gradient-to-br from-pink-200 via-violet-100 to-transparent opacity-50 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-gradient-to-br from-emerald-100 to-transparent opacity-40 blur-3xl" />
          <div className="relative mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
              <div>
                <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-sm font-bold uppercase tracking-wider text-brand-600 ring-1 ring-brand-100">
                  Product surface
                </span>
                <h2 className="mt-4 text-3xl font-bold leading-tight text-gray-950 sm:text-4xl">
                  More than a CRM list. It is your{' '}
                  <span className="bg-gradient-to-r from-brand-600 to-violet-500 bg-clip-text text-transparent">sales operating room</span>.
                </h2>
                <p className="mt-5 leading-7 text-gray-600">
                  CurveLead keeps lead context, WhatsApp conversations, campaign reporting, sales material, quotations, and staff activity together.
                </p>
              </div>
              <div>
              <div className="grid gap-5 sm:grid-cols-2">
                {features.map((feature) => {
                  const accent = featureAccents[feature.accent] ?? { card: 'bg-white border-gray-100', icon: 'bg-gray-100 text-gray-600' };
                  return (
                    <div
                      key={feature.title}
                      className={`group relative rounded-2xl border bg-white/80 p-5 shadow-sm shadow-gray-200/40 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/60 ${accent.card}`}
                    >
                      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110 ${accent.icon}`}>
                        <feature.icon size={21} />
                      </div>
                      <h3 className="mt-4 font-bold text-gray-950">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{feature.desc}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 space-y-3">
                {featureGroups.map(group => (
                  <details key={group.label} className="group rounded-2xl border border-gray-200 bg-white px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-900">
                      <span>{group.label} <span className="ml-1 text-sm font-normal text-gray-500">· {group.items.map(i => i.title).join(', ')}</span></span>
                      <ChevronDown size={18} className="shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {group.items.map(item => (
                        <div key={item.title} className="flex gap-3">
                          <item.icon size={18} className="mt-0.5 shrink-0 text-brand-600" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.title}{item.beta && <BetaChip />}</p>
                            <p className="mt-0.5 text-sm text-gray-600">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
              </div>
            </div>
          </div>
        </section>

        <section id="google-business-profile" aria-labelledby="gbp-heading" className="border-y border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 scroll-mt-16">
          <div className="mx-auto max-w-7xl">
            <h2 id="gbp-heading" className="text-3xl font-bold sm:text-4xl">Manage your Google Business Profile</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">Connect your Google account securely and manage your listing without leaving CurveLead.</p>
            <ul className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                { icon: Globe, title: 'Update listing info', description: 'Edit hours, phone, website and description for your business.' },
                { icon: MessageCircle, title: 'Reply to Google reviews', description: 'See new reviews and respond to customers from one inbox.' },
                { icon: BarChart3, title: 'Track profile performance', description: 'Calls, direction requests, website clicks and search views.' },
              ].map(({ icon: Icon, title, description }) => (
                <li key={title} className="rounded-2xl border border-gray-200 bg-white p-6">
                  <Icon size={24} className="text-brand-600" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-bold">{title}</h3>
                  <p className="mt-2 leading-7 text-gray-600">{description}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-6 text-gray-600">Uses secure Google sign-in. CurveLead only accesses the Business Profiles you manage. See our <a href="/privacy-policy" className="text-brand-600 underline hover:text-brand-700">Privacy Policy</a>.</p>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-brand-600">Visibility for owners</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Know exactly where every dollar of ad spend is going.</h2>
              <p className="mt-5 leading-7 text-gray-600">
                Track leads by campaign, stage, staff member, source, revenue, and follow-up activity. Owners get the control they need without chasing every salesperson for updates.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl shadow-gray-100">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">June Campaign ROI <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Sample data</span></p>
                  <p className="text-2xl font-bold">$84,000 revenue</p>
                </div>
                <Target className="text-brand-600" size={28} />
              </div>
              {[
                { label: 'Instagram Enquiry Ads', value: '72%', width: 'w-[72%]' },
                { label: 'Facebook Retargeting', value: '51%', width: 'w-[51%]' },
                { label: 'Website Lead Form', value: '38%', width: 'w-[38%]' },
              ].map((row) => (
                <div key={row.label} className="mb-4 last:mb-0">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{row.label}</span>
                    <span className="text-gray-500">{row.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className={`h-2 rounded-full bg-brand-600 ${row.width}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-gray-50 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">Simple pricing while you validate your sales workflow.</h2>
              <p className="mt-4 text-gray-600">Start free, then upgrade when your team needs more leads, users, AI, and reporting.</p>
              <div className="mt-6 inline-flex rounded-lg border border-gray-200 bg-white p-1">
                {[
                  { id: 'monthly', label: 'Monthly' },
                  { id: 'yearly', label: 'Yearly' },
                ].map((period) => (
                  <button
                    key={period.id}
                    onClick={() => setBillingPeriod(period.id)}
                    className={`rounded-md px-4 py-2 text-sm font-semibold ${billingPeriod === period.id ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <div key={plan.name} className={`relative rounded-lg border bg-white p-6 ${plan.popular ? 'border-brand-600 shadow-xl shadow-brand-100' : 'border-gray-200'}`}>
                  {plan.popular && <div className="absolute -top-3 left-5 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">POPULAR</div>}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="mt-5">
                    <span className="text-3xl font-extrabold">{plan.price || plan[billingPeriod]}</span>
                    <p className="mt-1 text-sm text-gray-500">
                      {plan.sub || (billingPeriod === 'yearly' ? 'per year' : 'per month')}
                    </p>
                    {billingPeriod === 'yearly' && plan.name !== 'Free' && plan.name !== 'Pro' && (
                      <p className="mt-2 text-xs font-semibold text-green-700">Two months free</p>
                    )}
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle size={16} className="mt-0.5 shrink-0 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => handlePlanClick(plan.name)} className={`mt-7 w-full rounded-lg py-2.5 text-sm font-semibold ${plan.popular ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                    {plan.name === 'Pro' ? 'Talk to us' : user ? 'Open billing' : 'Start free'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-3xl font-bold">Questions sales teams ask first</h2>
            <div className="mt-10 space-y-3">
              {faqs.map((faq, index) => (
                <div key={faq.q} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="flex w-full items-center justify-between px-5 py-4 text-left">
                    <span className="text-sm font-semibold">{faq.q}</span>
                    <ChevronDown size={18} className={`shrink-0 text-gray-400 transition ${openFaq === index ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === index && <div className="px-5 pb-5 text-sm leading-6 text-gray-600">{faq.a}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-5xl rounded-2xl bg-brand-600 px-6 py-12 text-center text-white sm:px-10">
            <h2 className="text-3xl font-bold sm:text-4xl">Ready to stop losing leads after the first enquiry?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/80">
              Bring your Meta Ads leads, WhatsApp follow-ups, team pipeline, brochures, quotations, and reporting into CurveLead.
            </p>
            <a href="/signup" className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 font-bold text-brand-700 hover:bg-gray-50">
              Start free <ArrowRight size={18} />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <BrandLogo className="w-28 h-auto" />
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              <a href="#features" className="hover:text-gray-950 transition-colors">Features</a>
              <a href="#pricing" className="hover:text-gray-950 transition-colors">Pricing</a>
              <a href="/login" className="hover:text-gray-950 transition-colors">Sign in</a>
              <a href="#google-business-profile" className="hover:text-gray-950 transition-colors">Google Business Profile</a>
              <a href="/privacy-policy" className="hover:text-gray-950 transition-colors">Privacy Policy</a>
              <a href="/terms-of-service" className="hover:text-gray-950 transition-colors">Terms of Service</a>
              <a href="/contact" className="hover:text-gray-950 transition-colors">Contact Us</a>
              <a href="mailto:support@curvelead.com" className="hover:text-gray-950 transition-colors">support@curvelead.com</a>
            </nav>
          </div>
          <p className="mt-6 text-sm text-gray-400">© 2026 CurveLead. Built in India.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
