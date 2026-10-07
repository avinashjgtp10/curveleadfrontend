import { Fragment, useEffect, useState } from 'react';
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
  HelpCircle,
  Lightbulb,
  Menu,
  MessageCircle,
  Megaphone,
  PhoneCall,
  PieChart,
  Plug,
  Shuffle,
  Sparkles,
  Star,
  Tag,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import BrandLogo from '../components/ui/BrandLogo';

const painPoints = [
  { icon: FileText, text: 'Meta leads sit unseen until someone exports a CSV.', tone: 'bg-violet-50 text-violet-600' },
  { icon: Clock, text: 'Salespeople forget who needs a callback today.', tone: 'bg-blue-50 text-blue-600' },
  { icon: MessageCircle, text: 'WhatsApp chats, brochures, quotations, and notes live in different places.', tone: 'bg-pink-50 text-pink-600' },
  { icon: TrendingUp, text: 'Ad spend keeps rising, but nobody knows which campaign actually closes.', tone: 'bg-amber-50 text-amber-600' },
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

const workflowAccents = {
  Capture: { icon: 'bg-violet-100 text-violet-600', badge: 'bg-violet-50 text-violet-600', bar: 'bg-violet-500', label: 'text-violet-600' },
  Prioritise: { icon: 'bg-blue-100 text-blue-600', badge: 'bg-blue-50 text-blue-600', bar: 'bg-blue-500', label: 'text-blue-600' },
  Engage: { icon: 'bg-pink-100 text-pink-600', badge: 'bg-pink-50 text-pink-600', bar: 'bg-pink-500', label: 'text-pink-600' },
  Measure: { icon: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500', label: 'text-emerald-600' },
};

const featureAccents = {
  purple: { icon: 'bg-violet-100 text-violet-600', badge: 'bg-violet-50 text-violet-600', bar: 'bg-violet-500', blob: 'bg-violet-300' },
  green: { icon: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500', blob: 'bg-emerald-300' },
  pink: { icon: 'bg-pink-100 text-pink-600', badge: 'bg-pink-50 text-pink-600', bar: 'bg-pink-500', blob: 'bg-pink-300' },
  blue: { icon: 'bg-blue-100 text-blue-600', badge: 'bg-blue-50 text-blue-600', bar: 'bg-blue-500', blob: 'bg-blue-300' },
  violet: { icon: 'bg-indigo-100 text-indigo-600', badge: 'bg-indigo-50 text-indigo-600', bar: 'bg-indigo-500', blob: 'bg-indigo-300' },
};

// Six core cards carry the main promise (ad lead → WhatsApp → follow-up → ROI); everything
// else sits in three collapsed groups so the page isn't a feature dump. `beta` marks
// features that aren't fully live yet, so the page never promises more than the product.
const features = [
  { icon: Zap, title: 'Meta & Google lead capture', accent: 'purple', desc: 'Facebook, Instagram and Google lead form enquiries land in your pipeline in real time, with campaign, ad and owner attached.' },
  { icon: MessageCircle, title: 'Shared WhatsApp Inbox', accent: 'green', desc: 'Reply, qualify, send approved templates and keep every conversation tied to the right lead.' },
  { icon: Gauge, title: 'Lead Intent Index', accent: 'pink', desc: 'A live 0-100 score, Hot/Warm/Cold label and a suggested next action for every lead, built from real activity. Fully explainable.' },
  { icon: Clock, title: 'Follow-up Discipline', accent: 'blue', desc: 'Schedule, complete and track callbacks, with response-time tracking that flags slow replies before they cost you.' },
  { icon: Shuffle, title: 'Smart Lead Routing', accent: 'violet', desc: 'Auto-assign new leads by source, campaign or location, or round-robin across the team, so nothing sits unclaimed.' },
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

// Built-in Tailwind delay utilities only (no arbitrary values) — arbitrary delay-[Npx]
// classes built from a runtime prop wouldn't be statically discoverable by Tailwind's
// JIT scanner, so the usable stagger steps are limited to this fixed set.
const REVEAL_DELAYS = { 0: '', 100: 'delay-100', 150: 'delay-150', 200: 'delay-200', 300: 'delay-300' };

// Fades + slides a section's content up into place the first time it scrolls into
// view — no animation library, just IntersectionObserver + a Tailwind transition.
// Fires once per element (observer disconnects after reveal) so it never re-triggers
// on scroll-back, and respects reduced-motion by skipping straight to visible.
const Reveal = ({ children, className = '', delay = 0 }) => {
  const ref = useState(() => ({ current: null }))[0];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setVisible(true); return; }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return (
    <div
      ref={(el) => { ref.current = el; }}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${REVEAL_DELAYS[delay] || ''} ${className}`}
    >
      {children}
    </div>
  );
};

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
            <a href="#workflow" className="text-sm font-medium text-gray-600 transition-colors hover:text-brand-600">Workflow</a>
            <a href="#features" className="text-sm font-medium text-gray-600 transition-colors hover:text-brand-600">Features</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 transition-colors hover:text-brand-600">Pricing</a>
            <a href="/login" className="text-sm font-semibold text-brand-700 hover:text-brand-800">Sign in</a>
            <a href="/signup" className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md">
              Start free
            </a>
          </div>

          <button onClick={() => setMobileMenu(!mobileMenu)} className="p-2 md:hidden" aria-label={mobileMenu ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenu}>
            {mobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenu && (
          <div className="space-y-1 border-t border-gray-100 bg-white p-4 md:hidden">
            <a href="#workflow" onClick={closeMenu} className="block rounded-lg px-2 py-2.5 font-medium text-gray-600 transition-colors hover:bg-brand-50 hover:text-brand-700">Workflow</a>
            <a href="#features" onClick={closeMenu} className="block rounded-lg px-2 py-2.5 font-medium text-gray-600 transition-colors hover:bg-brand-50 hover:text-brand-700">Features</a>
            <a href="#pricing" onClick={closeMenu} className="block rounded-lg px-2 py-2.5 font-medium text-gray-600 transition-colors hover:bg-brand-50 hover:text-brand-700">Pricing</a>
            <a href="/login" onClick={closeMenu} className="block rounded-lg px-2 py-2.5 font-semibold text-brand-700 transition-colors hover:bg-brand-50">Sign in</a>
            <a href="/signup" onClick={closeMenu} className="mt-2 block w-full rounded-full bg-brand-600 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm">Start free</a>
          </div>
        )}
      </nav>

      <main>
        <section className="relative overflow-hidden bg-gray-950 px-4 pb-20 pt-32 sm:px-6">
          <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="pointer-events-none absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.95fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-400">WhatsApp CRM &amp; Lead Management</p>
              <h1 className="mt-4 max-w-xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
                Turn ad leads into WhatsApp conversations before they go cold.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-gray-400">
                CurveLead captures enquiries, scores them from real activity — not a black box — keeps follow-ups on track, and shows which campaigns and salespeople are actually closing.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-brand-900/50 hover:bg-brand-500">
                  Start free <ArrowRight size={18} />
                </a>
                <a href="#workflow" className="inline-flex items-center justify-center rounded-full border border-white/15 px-7 py-3.5 font-semibold text-white hover:bg-white/5">
                  See how it works
                </a>
              </div>
              <p className="mt-8 flex items-center gap-2 text-sm text-gray-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Built for Meta Lead Ads, Google Ads &amp; the WhatsApp Business API
              </p>
            </div>

            {/* Product dashboard preview */}
            <div className="relative">
              <div className="rounded-2xl border border-white/10 bg-[#0F1629] shadow-2xl shadow-black/40">
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <p className="ml-1 text-xs font-medium text-gray-400">Sales dashboard — Lead Management</p>
                  <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
                  {[
                    { label: 'New Leads', value: '1,284', delta: '+12.4%' },
                    { label: 'Contacted', value: '812', delta: '+6.1%' },
                    { label: 'Hot Leads', value: '396', delta: '+0.4%' },
                    { label: 'Won', value: '148', delta: '+8.2%', highlight: true },
                  ].map((s) => (
                    <div key={s.label} className={`rounded-xl border p-3 ${s.highlight ? 'border-brand-500/40 bg-brand-500/10' : 'border-white/10 bg-white/[0.02]'}`}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{s.label}</p>
                      <p className={`mt-1.5 text-xl font-extrabold ${s.highlight ? 'text-brand-400' : 'text-white'}`}>{s.value}</p>
                      <p className="mt-1 text-[10px] font-semibold text-emerald-400">▲ {s.delta}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 px-4 pb-4 sm:grid-cols-[1.2fr_1fr]">
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-300">Leads by Source</p>
                      <p className="text-[10px] text-gray-500">Last 30 days</p>
                    </div>
                    <div className="mt-4 flex h-20 items-end gap-2.5">
                      {[
                        { h: 'h-[55%]', label: 'FB' }, { h: 'h-[85%]', label: 'IG' }, { h: 'h-[40%]', label: 'Web' },
                        { h: 'h-[62%]', label: 'WA' }, { h: 'h-[30%]', label: 'Ads' },
                      ].map((bar) => (
                        <div key={bar.label} className="flex flex-1 flex-col items-center gap-1.5">
                          <div className="flex h-full w-full items-end rounded-md bg-white/5">
                            <div className={`w-full rounded-md bg-brand-500 ${bar.h}`} />
                          </div>
                          <span className="text-[9px] font-medium text-gray-500">{bar.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-300">Assignment Load</p>
                      <span className="text-[9px] font-bold text-brand-400">Round robin</span>
                    </div>
                    <div className="mt-3 space-y-2.5">
                      {[
                        { name: 'Rohan M.', count: '7/12', w: 'w-[58%]' },
                        { name: 'Priya N.', count: '10/12', w: 'w-[83%]' },
                        { name: 'Arjun R.', count: '4/12', w: 'w-[33%]' },
                      ].map((p) => (
                        <div key={p.name}>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-medium text-gray-300">{p.name}</span>
                            <span className="text-gray-500">{p.count}</span>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-white/5">
                            <div className={`h-1.5 rounded-full bg-brand-500 ${p.w}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating "lead routed" toast */}
              <div className="absolute -bottom-6 -left-4 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-2xl sm:-left-8">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <CheckCircle size={13} /> Lead routed <span className="ml-auto font-normal text-gray-400">0.4s</span>
                </div>
                <p className="mt-1.5 text-xs font-semibold text-gray-900">Ananya Iyer · Instagram Ad</p>
                <p className="text-[11px] text-gray-500">→ Assigned to Rohan Mehta</p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-y border-gray-100 bg-gradient-to-b from-gray-50 to-white px-4 py-16 sm:px-6">
          <Reveal className="relative mx-auto max-w-7xl">
            <h2 className="text-center text-2xl font-extrabold text-gray-950 sm:text-3xl">The sales problems CurveLead is built to stop</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {painPoints.map((point) => (
                <div key={point.text} className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-md shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-gray-300/50">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${point.tone}`}>
                    <point.icon size={18} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-gray-600">{point.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="px-4 py-16 sm:px-6">
          <Reveal className="mx-auto max-w-7xl">
            <img
              src="/lead-capture-hero.png"
              alt="CurveLead captures every lead from all your marketing channels and puts them in one place, so you never miss an opportunity."
              className="w-full rounded-2xl"
              loading="lazy"
            />
          </Reveal>
        </section>

        <section className="border-y border-gray-200 bg-gray-50 px-4 py-16 sm:px-6">
          <Reveal className="mx-auto max-w-7xl">
            <img
              src="/lead-profiles-hero.png"
              alt="Lead profiles — contact details, source, requirement, pipeline stage, and full interaction history, in one card."
              className="w-full rounded-2xl"
              loading="lazy"
            />
          </Reveal>
        </section>

        <section className="px-4 py-16 sm:px-6">
          <Reveal className="mx-auto max-w-7xl">
            <img
              src="/lead-tracking-hero.png"
              alt="Track every lead interaction — see how each lead engages from first touch to conversion, so your team knows exactly when to follow up."
              className="w-full rounded-2xl"
              loading="lazy"
            />
          </Reveal>
        </section>

        <section id="workflow" className="relative overflow-hidden bg-gradient-to-b from-white to-violet-50/50 px-4 py-24 sm:px-6">
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-violet-200 to-transparent opacity-55 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-gradient-to-br from-blue-200 to-transparent opacity-45 blur-3xl" />

          <Reveal className="relative mx-auto max-w-7xl text-center">
            <span className="inline-flex items-center rounded-full bg-violet-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-violet-700 ring-1 ring-violet-100">
              Capture to close
            </span>
            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-extrabold leading-tight text-gray-950 sm:text-4xl lg:text-5xl">
              One workflow for every enquiry{' '}
              <span className="bg-gradient-to-r from-violet-600 to-brand-500 bg-clip-text text-transparent">your team handles.</span>
            </h2>
            <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-gradient-to-r from-violet-500 to-brand-400" />

            <div className="mt-14 grid grid-cols-1 items-stretch gap-5 text-left sm:grid-cols-2 lg:flex lg:flex-row lg:items-stretch">
              {workflow.map((step, i) => {
                const accent = workflowAccents[step.label];
                return (
                  <Fragment key={step.title}>
                    <div className="group relative flex flex-col rounded-[22px] border border-gray-100 bg-white p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_32px_-10px_rgba(0,0,0,0.14)] lg:flex-1">
                      <span className={`absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${accent.badge}`}>
                        0{i + 1}
                      </span>
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${accent.icon}`}>
                        <step.icon size={20} />
                      </div>
                      <p className={`mt-4 text-xs font-bold uppercase tracking-wider ${accent.label}`}>{step.label}</p>
                      <h3 className="mt-2 text-lg font-bold leading-snug text-gray-950">{step.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-gray-600">{step.desc}</p>
                      <div className={`mt-5 h-1 w-10 rounded-full ${accent.bar}`} />
                    </div>
                    {i < workflow.length - 1 && (
                      <div className="flex shrink-0 items-center justify-center sm:hidden lg:flex">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm">
                          <ArrowRight size={15} className="rotate-90 lg:rotate-0" />
                        </div>
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </Reveal>
        </section>

        <section id="features" className="relative overflow-hidden bg-gradient-to-b from-white via-violet-50/40 to-white px-4 py-24 sm:px-6">
          <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-violet-200 to-transparent opacity-55 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-blue-200 to-transparent opacity-45 blur-3xl" />

          <Reveal className="relative mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
              {/* Left: intro + product visual */}
              <div>
                <span className="inline-flex items-center rounded-full bg-violet-50 px-3 py-1 text-sm font-bold uppercase tracking-wider text-violet-700 ring-1 ring-violet-100">
                  Product surface
                </span>
                <h2 className="mt-4 text-3xl font-extrabold leading-tight text-gray-950 sm:text-4xl lg:text-5xl">
                  More than a CRM list. It is your{' '}
                  <span className="bg-gradient-to-r from-brand-600 to-violet-500 bg-clip-text text-transparent">sales operating room</span>.
                </h2>
                <p className="mt-5 leading-7 text-gray-600">
                  CurveLead keeps lead context, WhatsApp conversations, campaign reporting, sales material, quotations, and staff activity together.
                </p>

                {/* Floating product mockup with integration nodes */}
                <div className="relative mx-auto mt-14 h-72 w-full max-w-sm sm:mt-16">
                  <svg viewBox="0 0 320 260" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                    <path d="M230,55 C255,65 270,75 262,95" fill="none" stroke="#c7d2fe" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M235,120 C262,120 278,120 282,130" fill="none" stroke="#c7d2fe" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M225,175 C250,185 262,190 262,200" fill="none" stroke="#c7d2fe" strokeWidth="1.5" strokeDasharray="3 3" />
                  </svg>

                  <div className="absolute left-0 top-6 w-[230px] rounded-2xl border border-gray-100 bg-white p-3 shadow-xl shadow-gray-200/70">
                    <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2">
                      <div className="flex h-4 w-4 items-center justify-center rounded bg-brand-600"><Sparkles size={9} className="text-white" /></div>
                      <span className="text-[11px] font-extrabold text-gray-900">CurveLead</span>
                    </div>
                    <div className="flex gap-2.5 pt-2.5">
                      <div className="w-16 shrink-0 space-y-1">
                        {[
                          { icon: Users, label: 'Leads', active: true },
                          { icon: MessageCircle, label: 'Conversations' },
                          { icon: Megaphone, label: 'Campaigns' },
                          { icon: BarChart3, label: 'Reports' },
                          { icon: Users, label: 'Team' },
                        ].map((item) => (
                          <div key={item.label} className={`flex items-center gap-1 rounded px-1 py-0.5 text-[7.5px] font-medium ${item.active ? 'bg-brand-50 text-brand-700' : 'text-gray-400'}`}>
                            <item.icon size={9} /> {item.label}
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {[
                          { tone: 'bg-emerald-50 text-emerald-700', tag: 'New' },
                          { tone: 'bg-red-50 text-red-700', tag: 'Hot' },
                          { tone: 'bg-amber-50 text-amber-700', tag: 'Warm' },
                        ].map((row, i) => (
                          <div key={i} className="flex items-center gap-1.5 rounded-lg border border-gray-100 px-1.5 py-1.5">
                            <div className="h-4 w-4 shrink-0 rounded-full bg-gray-100" />
                            <div className="h-1.5 flex-1 rounded-full bg-gray-100" />
                            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[7px] font-bold ${row.tone}`}>{row.tag}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Integration nodes */}
                  <div className="absolute right-6 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-100">
                    <Target size={16} className="text-blue-600" />
                  </div>
                  <div className="absolute right-0 top-[108px] flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-100">
                    <Globe size={16} className="text-red-500" />
                  </div>
                  <div className="absolute right-4 top-[192px] flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-100">
                    <MessageCircle size={16} className="text-emerald-600" />
                  </div>

                  {/* Floating stat chip */}
                  <div className="absolute bottom-0 left-6 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg ring-1 ring-gray-100">
                    <TrendingUp size={14} className="text-brand-600" />
                    <div className="text-[10px] leading-3">
                      <p className="font-bold text-gray-900">More conversations</p>
                      <p className="text-gray-400">More customers</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: feature cards + Sell/Automate/Grow strip */}
              <div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {features.map((feature, i) => {
                    const accent = featureAccents[feature.accent] ?? { icon: 'bg-gray-100 text-gray-600', badge: 'bg-gray-100 text-gray-500', bar: 'bg-gray-400', blob: 'bg-gray-300' };
                    return (
                      <div
                        key={feature.title}
                        className="group relative overflow-hidden rounded-[20px] border border-gray-100 bg-white p-5 shadow-md shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1.5 hover:border-gray-200 hover:shadow-2xl hover:shadow-violet-200/50"
                      >
                        <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-50 ${accent.blob}`} />
                        <span className={`absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${accent.badge}`}>0{i + 1}</span>
                        <div className={`relative inline-flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${accent.icon}`}>
                          <feature.icon size={21} />
                        </div>
                        <h3 className="relative mt-4 font-bold text-gray-950">{feature.title}</h3>
                        <p className="relative mt-2 text-sm leading-6 text-gray-600">{feature.desc}</p>
                        <div className={`relative mt-4 h-1 w-9 rounded-full ${accent.bar}`} />
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <div className="grid divide-y divide-gray-100 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
                    {featureGroups.map((group, i) => {
                      const GroupIcon = [Tag, Workflow, TrendingUp][i];
                      return (
                        <details key={group.label} className="group/acc">
                          <summary className="flex cursor-pointer list-none items-center gap-2.5 px-5 py-4 transition-colors hover:bg-violet-50/50">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                              <GroupIcon size={15} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900">{group.label}</p>
                              <p className="truncate text-xs text-gray-400">{group.items.map((it) => it.title).join(', ')}</p>
                            </div>
                            <ChevronDown size={16} className="shrink-0 text-gray-400 transition-transform group-open/acc:rotate-180" />
                          </summary>
                          <div className="space-y-3 px-5 pb-4">
                            {group.items.map((item) => (
                              <div key={item.title} className="flex gap-2.5">
                                <item.icon size={16} className="mt-0.5 shrink-0 text-brand-600" />
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{item.title}{item.beta && <BetaChip />}</p>
                                  <p className="text-xs text-gray-500">{item.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <section id="google-business-profile" aria-labelledby="gbp-heading" className="relative overflow-hidden border-y border-gray-100 bg-gradient-to-b from-gray-50 to-white px-4 py-24 sm:px-6 scroll-mt-16">
          <div className="pointer-events-none absolute -top-24 -right-20 h-80 w-80 rounded-full bg-gradient-to-br from-blue-200 to-transparent opacity-45 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-gradient-to-br from-amber-100 to-transparent opacity-45 blur-3xl" />

          <Reveal className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.95fr]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 ring-1 ring-blue-100">
                <Star size={12} className="fill-blue-600 text-blue-600" /> Google Business Profile
              </span>
              <h2 id="gbp-heading" className="mt-4 text-3xl font-extrabold leading-tight text-gray-950 sm:text-4xl">
                Manage your listing <span className="bg-gradient-to-r from-blue-600 to-brand-500 bg-clip-text text-transparent">without leaving CurveLead.</span>
              </h2>
              <p className="mt-4 leading-7 text-gray-600">Connect your Google account securely and manage your listing right from your sales workspace:</p>
              <ul className="mt-5 space-y-3">
                {[
                  { icon: Globe, text: 'Update hours, phone, website and description' },
                  { icon: MessageCircle, text: 'Reply to Google reviews from one inbox' },
                  { icon: BarChart3, text: 'Track calls, direction requests and search views' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon size={14} /></span>
                    {text}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm leading-6 text-gray-500">Uses secure Google sign-in. CurveLead only accesses the Business Profiles you manage. See our <a href="/privacy-policy" className="text-brand-600 underline hover:text-brand-700">Privacy Policy</a>.</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xl shadow-gray-200/60">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50"><Star size={13} className="fill-blue-600 text-blue-600" /></div>
                  <p className="text-sm font-bold text-gray-900">CurveLead Salon &amp; Spa</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Connected</span>
              </div>
              <div className="grid grid-cols-3 gap-3 border-b border-gray-100 py-4 text-center">
                {[{ label: 'Calls', value: '128' }, { label: 'Direction requests', value: '64' }, { label: 'Search views', value: '2.4k' }].map((s) => (
                  <div key={s.label}>
                    <p className="text-lg font-extrabold text-gray-950">{s.value}</p>
                    <p className="mt-0.5 text-[10px] text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-4">
                {[
                  { name: 'Priya S.', stars: 5, text: '"Amazing service, highly recommend!"', replied: true },
                  { name: 'Rahul M.', stars: 4, text: '"Great experience, will come back."', replied: false },
                ].map((r) => (
                  <div key={r.name} className="rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-900">{r.name}</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={11} className={i < r.stars ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                        ))}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{r.text}</p>
                    <span className={`mt-1.5 inline-block text-[10px] font-semibold ${r.replied ? 'text-emerald-600' : 'text-brand-600'}`}>{r.replied ? '✓ Replied' : 'Reply now →'}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        <section className="relative overflow-hidden px-4 py-24 sm:px-6">
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-emerald-100 via-brand-50 to-transparent opacity-50 blur-3xl" />

          <Reveal className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.95fr]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
                <TrendingUp size={12} /> Visibility for owners
              </span>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight text-gray-950 sm:text-4xl">
                Know exactly where{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-brand-500 bg-clip-text text-transparent">every dollar</span>{' '}
                of ad spend is going.
              </h2>
              <p className="mt-5 leading-7 text-gray-600">
                Track leads by campaign, stage, staff member, source, revenue, and follow-up activity. Owners get the control they need without chasing every salesperson for updates.
              </p>
              <div className="mt-7 grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
                {[
                  { label: 'Revenue tracked', value: '$84k' },
                  { label: 'Campaigns monitored', value: '12' },
                  { label: 'Team members visible', value: '100%' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-xl font-extrabold text-gray-950">{stat.value}</p>
                    <p className="mt-1 text-xs leading-4 text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xl shadow-gray-200/60">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">June Campaign ROI <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Sample data</span></p>
                  <p className="text-2xl font-extrabold text-gray-950">$84,000 revenue</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Target size={22} />
                </div>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Cost per lead</p>
                  <p className="mt-1 text-lg font-extrabold text-gray-950">$4.20</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-600"><TrendingUp size={10} /> 18% lower</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Conversion rate</p>
                  <p className="mt-1 text-lg font-extrabold text-gray-950">12.5%</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-600"><TrendingUp size={10} /> 3.2% up</p>
                </div>
              </div>

              {[
                { label: 'Instagram Enquiry Ads', value: '72%', width: 'w-[72%]' },
                { label: 'Facebook Retargeting', value: '51%', width: 'w-[51%]' },
                { label: 'Website Lead Form', value: '38%', width: 'w-[38%]' },
              ].map((row) => (
                <div key={row.label} className="mb-4 last:mb-0">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{row.label}</span>
                    <span className="text-gray-500">{row.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className={`h-2 rounded-full bg-gradient-to-r from-brand-600 to-emerald-500 ${row.width}`} />
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section id="pricing" className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white px-4 py-24 sm:px-6">
          <div className="pointer-events-none absolute -top-20 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-100 to-transparent opacity-55 blur-3xl" />

          <Reveal className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 ring-1 ring-brand-100">
                <Wallet size={12} /> Pricing
              </span>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight text-gray-950 sm:text-4xl">
                Simple pricing while you{' '}
                <span className="bg-gradient-to-r from-brand-600 to-violet-500 bg-clip-text text-transparent">validate your workflow.</span>
              </h2>
              <p className="mt-4 text-lg text-gray-600">Start free, then upgrade when your team needs more leads, users, AI, and reporting.</p>

              <div className="mt-7 inline-flex items-center rounded-full border border-gray-200 bg-white p-1 shadow-sm">
                {[
                  { id: 'monthly', label: 'Monthly' },
                  { id: 'yearly', label: 'Yearly' },
                ].map((period) => (
                  <button
                    key={period.id}
                    onClick={() => setBillingPeriod(period.id)}
                    className={`relative flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-all ${billingPeriod === period.id ? 'bg-brand-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {period.label}
                    {period.id === 'yearly' && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${billingPeriod === 'yearly' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                        -17%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`group relative flex flex-col rounded-[22px] border bg-white p-6 transition-all duration-300 hover:-translate-y-1.5 ${plan.popular ? 'border-brand-200 shadow-2xl shadow-brand-200/70 lg:scale-105' : 'border-gray-100 shadow-md shadow-gray-200/50 hover:border-gray-200 hover:shadow-2xl hover:shadow-gray-300/50'}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-600 to-violet-500 px-3.5 py-1 text-xs font-bold text-white shadow-md">
                      MOST POPULAR
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-gray-950">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-gray-950">{plan.price || plan[billingPeriod]}</span>
                    <p className="mt-1 text-sm text-gray-500">
                      {plan.sub || (billingPeriod === 'yearly' ? 'per year' : 'per month')}
                    </p>
                    {billingPeriod === 'yearly' && plan.name !== 'Free' && plan.name !== 'Pro' && (
                      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Two months free</p>
                    )}
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handlePlanClick(plan.name)}
                    className={`mt-7 w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${plan.popular ? 'bg-brand-600 text-white shadow-md shadow-brand-200 hover:bg-brand-700' : 'bg-gray-50 text-gray-800 hover:bg-gray-100'}`}
                  >
                    {plan.name === 'Pro' ? 'Talk to us' : user ? 'Open billing' : 'Start free'}
                  </button>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section id="faq" className="relative overflow-hidden bg-gradient-to-b from-white to-violet-50/30 px-4 py-24 sm:px-6">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-200 to-transparent opacity-45 blur-3xl" />

          <Reveal className="relative mx-auto max-w-3xl">
            <div className="text-center">
              <span className="inline-flex items-center rounded-full bg-violet-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-violet-700 ring-1 ring-violet-100">
                FAQ
              </span>
              <h2 className="mx-auto mt-4 max-w-xl text-3xl font-extrabold leading-tight text-gray-950 sm:text-4xl">
                Questions sales teams ask first
              </h2>
              <p className="mx-auto mt-3 max-w-md text-gray-600">Still curious about something? Reach out any time — <a href="mailto:support@curvelead.com" className="font-semibold text-brand-600 hover:underline">support@curvelead.com</a>.</p>
            </div>

            <div className="mt-10 space-y-3">
              {faqs.map((faq, index) => {
                const open = openFaq === index;
                return (
                  <div
                    key={faq.q}
                    className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 ${open ? 'border-brand-200 shadow-md shadow-brand-100/40' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'}`}
                  >
                    <button onClick={() => setOpenFaq(open ? null : index)} className="flex w-full items-center gap-3 px-5 py-4 text-left">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${open ? 'bg-brand-600 text-white' : 'bg-violet-50 text-violet-600'}`}>
                        <HelpCircle size={15} />
                      </span>
                      <span className="flex-1 text-sm font-semibold text-gray-900">{faq.q}</span>
                      <ChevronDown size={18} className={`shrink-0 text-gray-400 transition-transform duration-300 ${open ? 'rotate-180 text-brand-600' : ''}`} />
                    </button>
                    <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <p className="px-5 pb-5 pl-16 text-sm leading-6 text-gray-600">{faq.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </section>

        <section className="px-4 py-16 sm:px-6">
          <Reveal className="mx-auto max-w-7xl">
            <img
              src="/field-force-hero.png"
              alt="The mobile CRM your field team will actually use — leads, routes and follow-ups in every agent's pocket, even without signal."
              className="w-full rounded-2xl"
              loading="lazy"
            />
          </Reveal>
        </section>

        <section className="px-4 pb-24 pt-4 sm:px-6">
          <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-600 via-brand-700 to-violet-800 px-6 py-16 text-center text-white shadow-2xl shadow-brand-200 sm:px-12">
            <div className="pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />
            <div className="pointer-events-none absolute left-6 top-6 h-24 w-24 bg-[radial-gradient(circle,rgba(255,255,255,0.35)_1.5px,transparent_1.5px)] bg-[length:14px_14px] opacity-40" />
            <div className="pointer-events-none absolute bottom-6 right-6 h-24 w-24 bg-[radial-gradient(circle,rgba(255,255,255,0.35)_1.5px,transparent_1.5px)] bg-[length:14px_14px] opacity-40" />

            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider ring-1 ring-white/20">
                <Sparkles size={12} /> Free to start, no card required
              </span>
              <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
                Ready to stop losing leads after the first enquiry?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-7 text-white/80">
                Bring your Meta Ads leads, WhatsApp follow-ups, team pipeline, brochures, quotations, and reporting into CurveLead.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 font-bold text-brand-700 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-xl">
                  Start free <ArrowRight size={18} />
                </a>
                <a href="#workflow" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-8 py-3.5 font-semibold text-white transition-colors hover:bg-white/10">
                  See how it works
                </a>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-gray-100 bg-gray-50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <BrandLogo className="w-28 h-auto" />
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              <a href="#features" className="transition-colors hover:text-brand-600">Features</a>
              <a href="#pricing" className="transition-colors hover:text-brand-600">Pricing</a>
              <a href="/login" className="transition-colors hover:text-brand-600">Sign in</a>
              <a href="#google-business-profile" className="transition-colors hover:text-brand-600">Google Business Profile</a>
              <a href="/privacy-policy" className="transition-colors hover:text-brand-600">Privacy Policy</a>
              <a href="/terms-of-service" className="transition-colors hover:text-brand-600">Terms of Service</a>
              <a href="/contact" className="transition-colors hover:text-brand-600">Contact Us</a>
              <a href="mailto:support@curvelead.com" className="font-medium text-brand-600 transition-colors hover:text-brand-700">support@curvelead.com</a>
            </nav>
          </div>
          <div className="mt-8 flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-400">© 2026 CurveLead. Built in India.</p>
            <p className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> All systems operational
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
