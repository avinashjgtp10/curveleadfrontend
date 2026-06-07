import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Users, TrendingUp, MessageCircle, Bot, BarChart3, CheckCircle, ArrowRight, Menu, X, ChevronDown } from 'lucide-react';

const features = [
  { icon: Zap, title: 'Auto-capture from Meta Ads', desc: 'Leads from Facebook & Instagram land in your pipeline instantly.' },
  { icon: Bot, title: 'AI Lead Scoring', desc: 'Hot/Warm/Cold classification powered by AI. Focus on what converts.' },
  { icon: MessageCircle, title: 'WhatsApp Inbox', desc: 'Shared team inbox. Reply, qualify, close — all from one place.' },
  { icon: Users, title: 'Visual Pipeline', desc: 'Drag-drop leads through stages. Real-time team collaboration.' },
  { icon: TrendingUp, title: 'Campaign ROI', desc: 'Track spend vs leads vs revenue. Know exactly what works.' },
  { icon: BarChart3, title: 'Reports & Analytics', desc: 'Conversion by source, staff, campaign. Make data-driven decisions.' },
];

const plans = [
  { name: 'Free', price: 0, features: ['20 leads', '1 user', 'Pipeline', 'Email support'] },
  { name: 'Starter', price: 9, features: ['100 leads', '1 user', 'Meta Ads', 'WhatsApp inbox'] },
  { name: 'Growth', price: 29, features: ['Unlimited leads', '5 users', 'AI scoring', 'Campaigns', 'Reports'], popular: true },
  { name: 'Pro', price: 79, features: ['Everything in Growth', 'Unlimited users', 'API access', 'Priority support'] },
];

const faqs = [
  { q: 'Is there a free trial?', a: '14-day free trial, no credit card. Plus a free forever plan with 20 leads.' },
  { q: 'How does Meta Ads integration work?', a: 'Connect your Facebook page once. Lead form leads auto-import into CurveLead.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel anytime, no questions asked.' },
  { q: 'Is my data secure?', a: 'Bank-grade encryption, daily backups, GDPR compliant.' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur border-b z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CL</span>
            </div>
            <span className="font-bold text-xl">CurveLead</span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900">FAQ</a>
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-brand-600">Sign In</button>
            <button onClick={() => navigate('/signup')} className="px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">Start Free</button>
          </div>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2">{mobileMenu ? <X size={24} /> : <Menu size={24} />}</button>
        </div>
        {mobileMenu && (
          <div className="md:hidden border-t bg-white p-4 space-y-3">
            <a href="#features" onClick={() => setMobileMenu(false)} className="block py-2 text-gray-600">Features</a>
            <a href="#pricing" onClick={() => setMobileMenu(false)} className="block py-2 text-gray-600">Pricing</a>
            <button onClick={() => navigate('/signup')} className="w-full px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold">Start Free</button>
          </div>
        )}
      </nav>

      <section className="pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm font-medium mb-6">
            <Zap size={14} /> 14-day free trial — No credit card
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            Capture leads. <br/><span className="text-brand-600">Close deals.</span> Grow faster.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto">
            Lead management platform for businesses in India and beyond. Auto-capture from Meta Ads. AI scoring. WhatsApp automation.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => navigate('/signup')} className="px-8 py-3.5 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 shadow-lg shadow-brand-200 flex items-center gap-2">
              Start Free Trial <ArrowRight size={18} />
            </button>
            <a href="#features" className="px-8 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">See Features</a>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-brand-600 to-purple-600 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 px-4 text-center">
          {[{n:'50+',l:'Businesses'},{n:'5,000+',l:'Leads'},{n:'$500K+',l:'Deals Closed'},{n:'12+',l:'Countries'}].map(s => (
            <div key={s.l}>
              <p className="text-3xl font-bold text-white">{s.n}</p>
              <p className="text-sm text-white/70">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-14">Everything you need to convert leads</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border hover:shadow-lg transition">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center mb-4">
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-14">Simple, transparent pricing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map(p => (
              <div key={p.name} className={`rounded-2xl p-6 border-2 relative ${p.popular ? 'border-brand-600 shadow-xl' : 'border-gray-200'}`}>
                {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-600 text-white text-xs font-bold rounded-full">POPULAR</div>}
                <h3 className="text-xl font-bold">{p.name}</h3>
                <div className="mt-4"><span className="text-4xl font-extrabold">${p.price}</span><span className="text-gray-500 text-sm">/month</span></div>
                <ul className="mt-6 space-y-2.5">
                  {p.features.map(f => <li key={f} className="flex items-start gap-2 text-sm text-gray-600"><CheckCircle size={15} className="text-green-500 mt-0.5 shrink-0" />{f}</li>)}
                </ul>
                <button onClick={() => navigate('/signup')} className={`mt-6 w-full py-2.5 rounded-xl text-sm font-semibold ${p.popular ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {p.price === 0 ? 'Start Free' : 'Start Trial'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="bg-white rounded-xl border overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span className="font-medium text-sm">{f.q}</span>
                  <ChevronDown size={18} className={`text-gray-400 transition ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-4 text-sm text-gray-500">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-brand-600 to-purple-700 rounded-3xl p-10 sm:p-14 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to capture more leads?</h2>
          <p className="mt-4 text-white/80 text-lg">14-day free trial. No credit card required.</p>
          <button onClick={() => navigate('/signup')} className="mt-8 px-10 py-4 bg-white text-brand-700 rounded-xl font-bold hover:bg-gray-50 shadow-lg flex items-center gap-2 mx-auto">
            Get Started Free <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-5xl mx-auto text-center text-xs">
          <p>© 2026 CurveLead. Built in Baramati, India.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
