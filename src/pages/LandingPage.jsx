import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle,
  ChevronDown,
  Clock,
  FileText,
  Gauge,
  Lightbulb,
  Menu,
  MessageCircle,
  Megaphone,
  PhoneCall,
  Send,
  Shuffle,
  Sparkles,
  Target,
  Timer,
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

const features = [
  { icon: Gauge, title: 'Lead Intent Index', desc: 'A live 0-100 score, Hot/Warm/Cold label, and follow-up health for every lead, with a plain-language reason and a suggested next action. Fully explainable, never a black box.' },
  { icon: Timer, title: 'Response Time Tracking', desc: 'See exactly how fast each enquiry gets a first response, and get flagged before you breach your own SLA.' },
  { icon: Clock, title: 'Follow-up Discipline', desc: 'Schedule, complete, and track callbacks so fewer enquiries slip away.' },
  { icon: MessageCircle, title: 'Shared WhatsApp Inbox', desc: 'Reply, qualify, and keep conversation history tied to the right lead.' },
  { icon: Megaphone, title: 'Campaign ROI', desc: 'Connect ad spend to leads, won deals, CPL, and revenue outcomes.' },
  { icon: Lightbulb, title: 'AI Sales Coaching', desc: 'An AI-built playbook of best practices and objection handling, generated from your own team’s won and lost calls.' },
  { icon: FileText, title: 'Quotations', desc: 'Create, send, accept, reject, and manage quotations inside the sales flow.' },
  { icon: BookOpen, title: 'Brochures & Files', desc: 'Keep product material ready and share it with leads from the same workspace.' },
  { icon: Users, title: 'Team Workspace', desc: 'Invite staff, assign ownership, monitor activity, and keep customer data separated by tenant.' },
  { icon: Shuffle, title: 'Smart Lead Routing', desc: 'Auto-assign new leads to the right person, or round-robin across a team, based on source, campaign, or location — nothing sits unclaimed.' },
  { icon: Workflow, title: 'Automation Sequences', desc: 'Auto-enroll matched leads into a scripted follow-up sequence the moment they land, so early nurture never depends on someone remembering.' },
  { icon: PhoneCall, title: 'AI Calling Agent', desc: 'A configurable AI voice agent that calls new leads automatically — pick the voice, persona, and opening line.' },
];

const plans = [
  { name: 'Free', monthly: '$0', yearly: '$0', sub: 'for getting started', features: ['20 leads', '1 user', 'Pipeline', 'Email support'] },
  { name: 'Starter', monthly: '$9', yearly: '$90', features: ['100 leads', '1 user', 'Meta Ads capture', 'WhatsApp inbox'] },
  { name: 'Growth', monthly: '$29', yearly: '$290', features: ['Unlimited leads', '5 users', 'Lead Intent Index', 'Campaign ROI', 'Reports'], popular: true },
  { name: 'Pro', price: 'Custom', sub: 'for sales teams', features: ['Everything in Growth', 'Unlimited users', 'Priority support', 'Advanced setup help'] },
];

const faqs = [
  { q: 'Who is CurveLead built for?', a: 'Sales teams that receive leads from Meta Ads, Google Ads, websites, forms, and WhatsApp, especially teams that need faster follow-up and campaign visibility.' },
  { q: 'Is CurveLead only for academies?', a: 'No. The current product is a lead engagement CRM for any business that captures, follows up, and closes enquiries.' },
  { q: 'Does it replace WhatsApp?', a: 'No. It helps your team manage lead context, follow-ups, files, and reporting around WhatsApp conversations.' },
  { q: 'Is the lead scoring AI?', a: 'No, and that is deliberate. Every lead’s Intent Score and follow-up health are calculated from real activity in your account, like response times and call outcomes, so you can always see exactly why a lead is Hot or Cold. We do use AI elsewhere, for the sales coaching playbook, market analysis, and optional AI calling, but never as an unexplainable scoring layer.' },
  { q: 'Can I try it before paying?', a: 'Yes. Start free, test the workflow, and upgrade when your team needs higher lead limits or advanced features.' },
];

const productStats = [
  { value: 'Meta + Google', label: 'lead capture ready' },
  { value: 'Live', label: 'intent score & follow-up health' },
  { value: 'WhatsApp', label: 'shared sales inbox' },
  { value: 'ROI', label: 'campaign reporting' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  const closeMenu = () => setMobileMenu(false);
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
            <a href="/login" className="text-sm font-semibold text-brand-700">Sign In</a>
            <a href="/signup" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
              Start Free
            </a>
          </div>

          <button onClick={() => setMobileMenu(!mobileMenu)} className="p-2 md:hidden" aria-label="Open menu">
            {mobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenu && (
          <div className="space-y-3 border-t bg-white p-4 md:hidden">
            <a href="#workflow" onClick={closeMenu} className="block py-2 text-gray-600">Workflow</a>
            <a href="#features" onClick={closeMenu} className="block py-2 text-gray-600">Features</a>
            <a href="#pricing" onClick={closeMenu} className="block py-2 text-gray-600">Pricing</a>
            <a href="/signup" className="block w-full rounded-lg bg-brand-600 px-5 py-2.5 text-center text-sm font-semibold text-white">Start Free</a>
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
                  Start Free Trial <ArrowRight size={18} />
                </a>
                <a href="#workflow" className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-7 py-3.5 font-semibold text-gray-800 hover:bg-gray-50">
                  See how it works
                </a>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {productStats.map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-lg font-bold text-gray-950">{stat.value}</p>
                    <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-2xl shadow-gray-200/70">
              <div className="rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Today</p>
                    <p className="font-semibold">Lead command center</p>
                  </div>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Live</span>
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

        <section id="features" className="bg-gray-950 px-4 py-20 text-white sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-brand-300">Product surface</p>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">More than a CRM list. It is your sales operating room.</h2>
                <p className="mt-5 leading-7 text-gray-300">
                  CurveLead keeps lead context, WhatsApp conversations, campaign reporting, sales material, quotations, and staff activity together.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {features.map((feature) => (
                  <div key={feature.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                    <feature.icon size={22} className="text-brand-300" />
                    <h3 className="mt-4 font-bold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-300">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
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
                  <p className="text-sm text-gray-500">June Campaign ROI</p>
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
                    {plan.name === 'Pro' ? 'Talk to us' : user ? 'Open Billing' : 'Start Free'}
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
              Get Started Free <ArrowRight size={18} />
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
              <a href="/privacy-policy" className="hover:text-gray-950 transition-colors">Privacy Policy</a>
              <a href="/terms-of-service" className="hover:text-gray-950 transition-colors">Terms of Service</a>
              <a href="/contact" className="hover:text-gray-950 transition-colors">Contact Us</a>
              <a href="mailto:support@curvelead.com" className="hover:text-gray-950 transition-colors">support@curvelead.com</a>
            </nav>
          </div>
          <p className="mt-6 text-sm text-gray-400">© 2026 CurveLead. Built in Baramati, India.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
