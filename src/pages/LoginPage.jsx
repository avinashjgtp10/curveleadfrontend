import { useEffect, useRef, useState } from 'react';
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

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const loadGoogleScript = () => new Promise((resolve, reject) => {
  if (window.google?.accounts?.id) return resolve();
  const existing = document.querySelector('script[data-gsi]');
  if (existing) {
    existing.addEventListener('load', resolve);
    existing.addEventListener('error', reject);
    return;
  }
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true;
  s.defer = true;
  s.dataset.gsi = '1';
  s.onload = resolve;
  s.onerror = reject;
  document.head.appendChild(s);
});

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, verifyOtp, googleLogin } = useAuth();
  const googleBtnRef = useRef(null);
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
    setError('');

    // Trim stray whitespace from copy/paste or autofill — a leading/trailing
    // space silently turns a correct password into a rejected one.
    const email = form.email.trim();
    const password = form.password.trim();

    setLoading(true);
    try {
      const data = await login({ email, password });
      navigate(data.user?.role === 'super_admin' ? '/super-admin/dashboard' : '/dashboard');
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

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;
    let cancelled = false;
    loadGoogleScript().then(() => {
      if (cancelled || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setLoading(true);
          setError('');
          try {
            const data = await googleLogin(credential);
            navigate(data.user?.role === 'super_admin' ? '/super-admin/dashboard' : '/dashboard');
          } catch (err) {
            setError(err.response?.data?.error || 'Google sign-in failed.');
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', width: googleBtnRef.current.offsetWidth || 360,
      });
    }).catch(() => setError('Could not load Google sign-in.'));
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-gray-950">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-brand-600 px-10 py-10 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(167,243,208,0.28),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.22),transparent_24%)]" />
          <div className="relative mb-10">
            <button onClick={() => navigate('/')}>
              <BrandLogo variant="white" className="auth-logo" />
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
                <BrandLogo className="auth-logo" />
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-200/70 sm:p-8">
              <div>
                <p className="text-sm font-bold uppercase text-brand-600">Welcome back</p>
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
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
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

              <div className="mt-5">
                <div className="mb-4 flex items-center gap-3 text-xs font-bold uppercase text-gray-400">
                  <span className="h-px flex-1 bg-gray-200" />or<span className="h-px flex-1 bg-gray-200" />
                </div>
                {GOOGLE_CLIENT_ID ? (
                  <div ref={googleBtnRef} className="flex w-full justify-center" />
                ) : (
                  <button
                    type="button"
                    onClick={() => setError('Google sign-in is not configured yet. Set VITE_GOOGLE_CLIENT_ID and restart the app.')}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/>
                      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C1 16.4 0 20.1 0 24s1 7.6 2.6 10.8l7.9-6.1z"/>
                      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
                    </svg>
                    Continue with Google
                  </button>
                )}
              </div>

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
