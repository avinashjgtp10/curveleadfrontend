import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import BrandLogo from '../components/ui/BrandLogo';

const businessTypes = [
  { id: 'lead_management', icon: '🎯', name: 'Lead Management', desc: 'Agencies, freelancers, sales' },
  { id: 'real_estate', icon: '🏠', name: 'Real Estate', desc: 'Agents, brokers' },
  { id: 'salon', icon: '💇', name: 'Salon / Spa', desc: 'Beauty businesses' },
  { id: 'gym', icon: '💪', name: 'Gym / Fitness', desc: 'Studios, trainers' },
  { id: 'clinic', icon: '🏥', name: 'Clinic / Doctor', desc: 'Medical practices' },
  { id: 'other', icon: '✨', name: 'Other', desc: 'Any lead-based business' },
];

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    businessType: '', businessName: '', name: '', email: '', phone: '', password: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const updateField = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(er => ({ ...er, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!form.businessName.trim()) errors.businessName = 'Business name is required';
    if (!form.name.trim()) errors.name = 'Your name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address';
    if (form.phone.trim() && form.phone.replace(/\D/g, '').length < 3) errors.phone = 'Enter a valid phone number (at least 3 digits)';
    if (!form.password) errors.password = 'Password is required';
    else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters';
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setLoading(true);
    setError('');
    try {
      await signup(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex cursor-pointer rounded-2xl bg-white px-6 py-3 shadow-sm" onClick={() => navigate('/')}>
            <BrandLogo className="w-40 h-auto" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
            {step > 1 ? <CheckCircle size={16} /> : '1'}
          </div>
          <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-brand-600' : 'bg-gray-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-400'}`}>2</div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border p-6 sm:p-8">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold">Welcome! Let's get started.</h2>
              <p className="text-gray-500 text-sm mt-1">What type of business are you running?</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                {businessTypes.map(b => (
                  <button key={b.id} type="button" onClick={() => setForm({ ...form, businessType: b.id })}
                    className={`text-left p-4 rounded-xl border-2 transition ${form.businessType === b.id ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{b.icon}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{b.name}</p>
                        <p className="text-xs text-gray-500">{b.desc}</p>
                      </div>
                      {form.businessType === b.id && <CheckCircle size={18} className="text-brand-600 shrink-0" />}
                    </div>
                  </button>
                ))}
              </div>

              <button onClick={() => setStep(2)} disabled={!form.businessType}
                className="mt-6 w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                Continue <ArrowRight size={18} />
              </button>
            </>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="flex items-center gap-2 mb-2">
                <button type="button" onClick={() => setStep(1)} className="p-1.5 hover:bg-gray-100 rounded-lg"><ArrowLeft size={18} /></button>
                <h2 className="text-2xl font-bold">Create your account</h2>
              </div>
              <p className="text-gray-500 text-sm">14-day free trial. No credit card.</p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.businessName}
                    onChange={e => updateField('businessName', e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 ${fieldErrors.businessName ? 'border-red-500' : 'border-gray-300'}`} />
                  {fieldErrors.businessName && <p className="text-xs text-red-500 mt-1">{fieldErrors.businessName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name}
                    onChange={e => updateField('name', e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'}`} />
                  {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input type="email" value={form.email}
                    onChange={e => updateField('email', e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'}`} />
                  {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={form.phone}
                    onChange={e => updateField('phone', e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'}`} />
                  {fieldErrors.phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={form.password}
                      onChange={e => updateField('password', e.target.value)}
                      className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 [&::-ms-reveal]:hidden ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'}`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="mt-6 w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? 'Creating...' : 'Create Account'} {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account? <Link to="/login" className="text-brand-600 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
