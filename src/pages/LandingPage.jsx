import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, GraduationCap, IndianRupee, TrendingUp, Clock, CheckCircle,
  Zap, Shield, BarChart3, Phone, Mail, ArrowRight, Star, ChevronDown, Menu, X
} from 'lucide-react';

const features = [
  { icon: Users, title: 'Lead Management', desc: 'Track every inquiry from first contact to enrollment. Never miss a follow-up again.' },
  { icon: GraduationCap, title: 'Student Management', desc: 'Enrollment, attendance, batch assignment, and certificate tracking — all in one place.' },
  { icon: IndianRupee, title: 'Fee & Revenue', desc: 'Installments, payment tracking, receipts, and reminders. Know exactly who owes what.' },
  { icon: Clock, title: 'Staff Time Tracking', desc: 'Check-in/out, auto half-day for late arrivals, configurable grace period.' },
  { icon: TrendingUp, title: 'P&L Reports', desc: 'Monthly, quarterly, yearly profit & loss. Revenue vs expenses vs salaries — Indian FY format.' },
  { icon: Zap, title: 'Meta Ads Integration', desc: 'Auto-capture leads from Facebook & Instagram ads directly into your pipeline.' },
];

const plans = [
  { name: 'Basic', price: 500, features: ['Up to 50 leads/month', 'Up to 30 students', '2 staff members', 'Fee tracking', 'Basic reports'], popular: false },
  { name: 'Pro', price: 1000, features: ['Unlimited leads', 'Up to 100 students', '5 staff members', 'PDF receipts', 'P&L reports', 'Meta Ads integration'], popular: true },
  { name: 'Premium', price: 2000, features: ['Everything in Pro', 'Unlimited students', 'Unlimited staff', 'WhatsApp reminders', 'Priority support', 'Custom branding'], popular: false },
];

const testimonials = [
  { name: 'Priya S.', role: 'Beauty Academy Owner, Pune', text: 'Before CurveLead, I was losing 40% of leads because nobody followed up. Now every lead is tracked automatically.' },
  { name: 'Rahul M.', role: 'IT Training Institute, Mumbai', text: 'The fee management alone saved me 5 hours every month. The P&L reports help me make better decisions.' },
  { name: 'Sneha K.', role: 'Dance Academy, Bangalore', text: 'My staff attendance was a nightmare. Now check-in/out with auto half-day marking makes it effortless.' },
];

const faqs = [
  { q: 'How long is the free trial?', a: '14 days, no credit card required. Full access to all features.' },
  { q: 'Can I use it for any type of academy?', a: 'Yes! CurveLead works for beauty, IT, coaching, dance, fitness, vocational — any training academy.' },
  { q: 'Is my data secure?', a: 'Absolutely. We use encrypted databases, secure authentication, and your data is never shared.' },
  { q: 'Can my staff access the app?', a: 'Yes, you can create staff accounts with role-based access. Staff sees only what you allow.' },
  { q: 'Do you support installment payments?', a: 'Yes! You can set custom installment schedules with due dates and amounts per student.' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CL</span>
            </div>
            <span className="font-bold text-xl text-gray-900">CurveLead</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="#testimonials" className="text-sm text-gray-600 hover:text-gray-900">Reviews</a>
            <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900">FAQ</a>
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-brand-600">Sign In</button>
            <button onClick={() => navigate('/signup')} className="px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">Start Free Trial</button>
          </div>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2">
            {mobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden border-t bg-white p-4 space-y-3">
            <a href="#features" onClick={() => setMobileMenu(false)} className="block text-gray-600 py-2">Features</a>
            <a href="#pricing" onClick={() => setMobileMenu(false)} className="block text-gray-600 py-2">Pricing</a>
            <a href="#testimonials" onClick={() => setMobileMenu(false)} className="block text-gray-600 py-2">Reviews</a>
            <button onClick={() => { setMobileMenu(false); navigate('/login'); }} className="block w-full text-left text-brand-600 font-medium py-2">Sign In</button>
            <button onClick={() => { setMobileMenu(false); navigate('/signup'); }} className="w-full px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold">Start Free Trial</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm font-medium mb-6">
            <Zap size={14} /> 14-day free trial — No credit card needed
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
            Manage your academy
            <br /><span className="text-brand-600">like a pro.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Leads, students, fees, staff, expenses — everything in one place.
            Stop losing leads. Stop chasing payments. Start growing.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => navigate('/signup')}
              className="w-full sm:w-auto px-8 py-3.5 bg-brand-600 text-white rounded-xl text-base font-semibold hover:bg-brand-700 shadow-lg shadow-brand-200 flex items-center justify-center gap-2">
              Start Free Trial <ArrowRight size={18} />
            </button>
            <a href="#features" className="w-full sm:w-auto px-8 py-3.5 bg-gray-100 text-gray-700 rounded-xl text-base font-medium hover:bg-gray-200 text-center">
              See Features
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400">Trusted by 50+ academies across India</p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-brand-600 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 px-4">
          {[
            { n: '50+', l: 'Academies' }, { n: '5,000+', l: 'Leads Tracked' },
            { n: '2,000+', l: 'Students Managed' }, { n: '₹2Cr+', l: 'Fees Collected' },
          ].map(s => (
            <div key={s.l} className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-white">{s.n}</p>
              <p className="text-sm text-brand-200 mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Everything you need to run your academy</h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">From first inquiry to final certificate — CurveLead handles it all.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition">
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mb-4">
                  <f.icon size={24} className="text-brand-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-14">Get started in 3 minutes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Sign Up', desc: 'Create your academy account. No credit card needed.' },
              { step: '2', title: 'Add Your Data', desc: 'Import leads, courses, and staff. We help you set up.' },
              { step: '3', title: 'Start Growing', desc: 'Track leads, collect fees, manage staff — all from one dashboard.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 bg-brand-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto">{s.step}</div>
                <h3 className="mt-4 font-semibold text-lg text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Simple, transparent pricing</h2>
            <p className="mt-4 text-gray-500">Start free. Upgrade when you're ready.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {plans.map(p => (
              <div key={p.name} className={`rounded-2xl p-6 border-2 ${p.popular ? 'border-brand-600 bg-white shadow-xl relative' : 'border-gray-200 bg-white'}`}>
                {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-600 text-white text-xs font-bold rounded-full">MOST POPULAR</div>}
                <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">₹{p.price}</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate('/signup')}
                  className={`mt-8 w-full py-3 rounded-xl text-sm font-semibold ${p.popular ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  Start Free Trial
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-14">What academy owners say</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex gap-1 mb-3">{[1,2,3,4,5].map(s => <Star key={s} size={16} className="text-amber-400 fill-amber-400" />)}</div>
                <p className="text-sm text-gray-600 leading-relaxed">"{t.text}"</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="font-semibold text-sm text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span className="font-medium text-gray-900 text-sm">{f.q}</span>
                  <ChevronDown size={18} className={`text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-4 text-sm text-gray-500">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto bg-brand-600 rounded-3xl p-10 sm:p-14 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to grow your academy?</h2>
          <p className="mt-4 text-brand-200 text-lg">Start your 14-day free trial. No credit card required.</p>
          <button onClick={() => navigate('/signup')}
            className="mt-8 px-10 py-4 bg-white text-brand-700 rounded-xl text-base font-bold hover:bg-brand-50 shadow-lg flex items-center gap-2 mx-auto">
            Get Started Free <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CL</span>
              </div>
              <span className="font-bold text-lg text-white">CurveLead</span>
            </div>
            <p className="text-sm">Academy Management Platform. Built for training institutes that want to grow.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Product</h4>
            <div className="space-y-2 text-sm">
              <a href="#features" className="block hover:text-white">Features</a>
              <a href="#pricing" className="block hover:text-white">Pricing</a>
              <a href="#faq" className="block hover:text-white">FAQ</a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Contact</h4>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2"><Mail size={14} /> support@curvelead.in</p>
              <p className="flex items-center gap-2"><Phone size={14} /> +91 7875914818</p>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-xs">
          <p>© 2026 CurveLead by Adi Enterprises. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
