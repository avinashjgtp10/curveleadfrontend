import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, BarChart3, CheckCircle, Eye, EyeOff, Globe2, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import BrandLogo from '../components/ui/BrandLogo';

const loginHighlights = [
  { icon: Globe2, title: 'Global lead capture', text: 'Track enquiries from ads, website forms, WhatsApp, referrals, and manual uploads.' },
  { icon: MessageCircle, title: 'Fast follow-ups', text: 'Keep calls, WhatsApp conversations, notes, and reminders tied to every lead.' },
  { icon: BarChart3, title: 'Source visibility', text: 'See which campaigns, salespeople, and lead sources are moving revenue.' },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, verifyOtp } = useAuth();
  const [mode, setMode] = useState('password');
  const [form, setForm] = useState({ email: '', password: '', otp: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
    setNotice('');
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login({ email: form.email, password: form.password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!form.email) {
      setError('Enter your email to receive an OTP.');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');
    try {
      await authAPI.requestOtp(form.email);
      setOtpSent(true);
      setNotice('OTP sent to your email.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    if (!otpSent) {
      await handleRequestOtp();
      return;
    }

    setLoading(true);
    setError('');
    try {
      await verifyOtp({ email: form.email, otp: form.otp });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-gray-950">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-brand-600 px-10 py-10 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(167,243,208,0.28),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.22),transparent_24%)]" />
          <div className="relative">
            <button onClick={() => navigate('/')} className="rounded-2xl bg-white/95 p-3 shadow-lg">
              <BrandLogo className="h-12" />
            </button>
          </div>

          <div className="relative my-auto max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold">
              <Sparkles size={16} /> Built for worldwide lead teams
            </div>
            <h1 className="text-4xl font-extrabold leading-tight xl:text-5xl">
              Capture every lead source, then follow up faster.
            </h1>
            <p className="mt-5 text-base leading-7 text-white/85">
              CurveLead gives growing teams one workspace for leads, WhatsApp conversations, quotations, campaigns, staff activity, and reporting.
            </p>

            <div className="mt-8 space-y-4">
              {loginHighlights.map(item => (
                <div key={item.title} className="flex gap-3 rounded-xl bg-white/10 p-4 backdrop-blur">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="font-bold">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-white/80">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-md">
            <div className="mb-7 flex justify-center lg:hidden">
              <button onClick={() => navigate('/')}>
                <BrandLogo className="h-14" />
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-200/70 sm:p-8">
              <div>
                <p className="text-sm font-bold uppercase text-cyan-600">Welcome back</p>
                <h2 className="mt-1 text-3xl font-extrabold">Sign in to CurveLead</h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Use your password or request a one-time email code.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => { setMode('password'); setError(''); setNotice(''); }}
                  className={`rounded-lg py-2.5 text-sm font-bold transition ${mode === 'password' ? 'bg-white text-gray-950 shadow-sm ring-1 ring-brand-500' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('otp'); setError(''); setNotice(''); }}
                  className={`rounded-lg py-2.5 text-sm font-bold transition ${mode === 'otp' ? 'bg-white text-gray-950 shadow-sm ring-1 ring-brand-500' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  Email OTP
                </button>
              </div>

              {error && <div className="mt-4 border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}
              {notice && <div className="mt-4 border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{notice}</div>}

              <form onSubmit={mode === 'password' ? handlePasswordLogin : handleOtpLogin} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => updateForm('email', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="you@company.com"
                  />
                </div>

                {mode === 'password' ? (
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="block text-sm font-bold text-gray-700">Password</label>
                      <Link to="/forgot-password" className="text-xs font-bold text-brand-600 hover:text-brand-700">Forgot password?</Link>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={form.password}
                        onChange={e => updateForm('password', e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="Enter your password"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="block text-sm font-bold text-gray-700">One-time code</label>
                      <button type="button" onClick={handleRequestOtp} disabled={loading || !form.email}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700 disabled:text-gray-300">
                        {otpSent ? 'Resend OTP' : 'Send OTP'}
                      </button>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.otp}
                      onChange={e => updateForm('otp', e.target.value)}
                      required={otpSent}
                      disabled={!otpSent}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-lg font-extrabold tracking-[0.35em] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-100 disabled:text-gray-400"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 font-extrabold text-white shadow-lg shadow-brand-100 hover:bg-brand-700 disabled:opacity-50">
                  {loading ? 'Please wait...' : mode === 'password' ? 'Sign In' : otpSent ? 'Verify & Sign In' : 'Send Email OTP'}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>

              <div className="mt-6 flex items-start gap-2 border-t pt-5 text-sm text-gray-500">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-500" />
                <p>Your workspace data stays protected with secure session access.</p>
              </div>

              <p className="mt-6 text-center text-sm text-gray-500">
                Don't have an account? <Link to="/signup" className="font-bold text-brand-600">Sign up free</Link>
              </p>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-gray-500">
              <CheckCircle size={15} className="text-emerald-500" />
              Multi-source lead CRM for global sales teams
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
