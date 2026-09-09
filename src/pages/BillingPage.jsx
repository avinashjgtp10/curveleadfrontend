import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, CreditCard, DollarSign, Loader2, ShieldCheck, Users, Zap } from 'lucide-react';
import { paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const planCopy = {
  Free: {
    description: 'For testing the basic sales workflow.',
    features: ['20 leads', '1 user', 'Pipeline basics', 'Email support'],
    gradient: 'from-gray-400 to-gray-500',
  },
  Starter: {
    description: 'For small teams starting with Meta and WhatsApp follow-up.',
    features: ['100 leads', '1 user', 'Meta Ads capture', 'WhatsApp inbox'],
    gradient: 'from-cyan-500 to-blue-600',
  },
  Growth: {
    description: 'For active sales teams that need AI and reporting.',
    features: ['1000 leads', '5 users', 'AI scoring', 'Campaign ROI', 'Reports'],
    popular: true,
    gradient: 'from-brand-500 to-indigo-600',
  },
  Pro: {
    description: 'For larger teams that need custom onboarding and limits.',
    features: ['Unlimited leads', 'Unlimited users', 'Priority support', 'Advanced setup help'],
    gradient: 'from-amber-500 to-orange-600',
  },
};

// Static fallback so the plan grid still renders a complete preview when the
// billing API is unreachable (e.g. running the frontend standalone).
const FALLBACK_PLANS = [
  { id: 'free', name: 'Free', max_users: 1, checkoutEnabled: false, prices: { monthly: { amount: 0, currency: 'USD' }, yearly: { amount: 0, currency: 'USD' } } },
  { id: 'starter', name: 'Starter', max_users: 1, checkoutEnabled: false, prices: { monthly: { amount: 2900, currency: 'USD' }, yearly: { amount: 29000, currency: 'USD' } } },
  { id: 'growth', name: 'Growth', max_users: 5, checkoutEnabled: false, prices: { monthly: { amount: 7900, currency: 'USD' }, yearly: { amount: 79000, currency: 'USD' } } },
  { id: 'pro', name: 'Pro', max_users: -1, checkoutEnabled: false, prices: { monthly: { amount: 19900, currency: 'USD' }, yearly: { amount: 199000, currency: 'USD' } } },
];

const statusBadgeStyles = {
  trial: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
};

const billingPeriods = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

const formatMaxUsers = (maxUsers) => {
  if (maxUsers == null) return '—';
  if (maxUsers < 0) return 'Unlimited users';
  return `${maxUsers} user${maxUsers === 1 ? '' : 's'}`;
};

const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve(true);

  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => reject(new Error('Unable to load Razorpay checkout.'));
  document.body.appendChild(script);
});

const formatPrice = (amount, currency = 'USD') => {
  if (!amount) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
};

const BillingPage = () => {
  const { user, tenant, refreshProfile } = useAuth();
  const [plans, setPlans] = useState([]);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  const subscriptionStatus = tenant?.subscription_status || tenant?.subscriptionStatus || 'trial';
  const currentPlanName = useMemo(() => {
    if (subscriptionStatus === 'trial') return 'Free';
    return tenant?.plan_name || tenant?.planName || '';
  }, [subscriptionStatus, tenant]);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const { data } = await paymentAPI.getPlans();
        setPlans(data.plans?.length ? data.plans : FALLBACK_PLANS);
        setRazorpayKeyId(data.razorpayKeyId || '');
        setIsPreview(!data.plans?.length);
      } catch (err) {
        setPlans(FALLBACK_PLANS);
        setIsPreview(true);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  const handleCheckout = async (planName) => {
    setError('');
    setMessage('');
    setProcessingPlan(planName);

    try {
      await loadRazorpay();

      const { data } = await paymentAPI.createOrder(planName, billingPeriod);
      const options = {
        key: data.razorpayKeyId || razorpayKeyId,
        amount: data.amount,
        currency: data.currency,
        name: 'CurveLead',
        description: data.plan?.description || `${planName} subscription`,
        order_id: data.orderId,
        prefill: {
          name: data.prefill?.name || user?.name || '',
          email: data.prefill?.email || user?.email || '',
        },
        notes: {
          plan_name: planName,
          billing_period: billingPeriod,
          tenant_id: tenant?.id,
        },
        theme: { color: '#4f46e5' },
        handler: async (response) => {
          try {
            const verifyResult = await paymentAPI.verify({
              ...response,
              planName,
              billingPeriod,
            });
            await refreshProfile();
            window.dispatchEvent(new CustomEvent('payment-success'));
            setMessage(verifyResult.data?.message || 'Payment successful. Your plan is active.');
          } catch (err) {
            setError(err.response?.data?.error || 'Payment captured, but verification failed. Contact support with your payment ID.');
          } finally {
            setProcessingPlan('');
          }
        },
        modal: {
          ondismiss: () => setProcessingPlan(''),
        },
      };

      const checkout = new window.Razorpay(options);
      checkout.on('payment.failed', (response) => {
        setError(response.error?.description || 'Payment failed. Please try again.');
        setProcessingPlan('');
      });
      checkout.open();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unable to start checkout.');
      setProcessingPlan('');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-brand-600" size={28} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-800 p-5 sm:p-6 shadow-sm mb-6">
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute right-16 bottom-[-2.5rem] w-24 h-24 rounded-full bg-white/10" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/70">Billing</p>
            <h1 className="mt-1 text-2xl font-bold text-white">Choose your CurveLead plan</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
              Upgrade securely with Razorpay. Your workspace limits update after payment verification.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-lg bg-white/15 backdrop-blur-sm p-1">
              {billingPeriods.map((period) => (
                <button
                  key={period.id}
                  onClick={() => setBillingPeriod(period.id)}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${billingPeriod === period.id ? 'bg-white text-brand-700 shadow-sm' : 'text-white/80 hover:text-white'}`}
                >
                  {period.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/15 backdrop-blur-sm px-3 py-1.5">
              <p className="text-xs font-medium text-white/80">Status</p>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadgeStyles[subscriptionStatus] || 'bg-white/20 text-white'}`}>
                {subscriptionStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle size={17} /> {message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isPreview && !error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <ShieldCheck size={16} className="shrink-0" /> Showing preview pricing — connect the billing service to enable live checkout.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const copy = planCopy[plan.name] || {};
          const isCurrentPlan = currentPlanName === plan.name;
          const isProcessing = processingPlan === plan.name;
          const selectedPrice = plan.prices?.[billingPeriod];
          const amount = selectedPrice?.amount ?? plan.amount;
          const currency = selectedPrice?.currency ?? plan.currency;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow ${copy.popular ? 'border-brand-300 ring-1 ring-brand-100' : 'border-gray-200'}`}
            >
              {copy.popular && (
                <div className="absolute -top-3 left-4 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                  Popular
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-950">{plan.name}</h2>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-gray-500">{copy.description}</p>
                </div>
                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${copy.gradient || 'from-gray-400 to-gray-500'} text-white shadow-sm`}>
                  {plan.name === 'Growth' ? <Zap size={16} /> : <CreditCard size={16} />}
                </div>
              </div>

              <div className="mt-5 flex items-end gap-1">
                <span className="text-3xl font-extrabold text-gray-950">{formatPrice(amount, currency)}</span>
                {amount > 0 && <span className="pb-1 text-sm text-gray-500">/{billingPeriod === 'yearly' ? 'yr' : 'mo'}</span>}
              </div>
              {billingPeriod === 'yearly' && selectedPrice && (
                <p className="mt-2 text-xs font-semibold text-green-700">Two months free</p>
              )}

              <div className="mt-5 space-y-3">
                {(copy.features || []).map((feature) => (
                  <div key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="mt-0.5 shrink-0 text-green-600" size={16} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                <Users size={14} />
                <span>{formatMaxUsers(plan.max_users)}</span>
              </div>

              {plan.checkoutEnabled ? (
                <button
                  onClick={() => handleCheckout(plan.name)}
                  disabled={isProcessing || isCurrentPlan}
                  className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold ${
                    copy.popular
                      ? 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300'
                      : 'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300'
                  } disabled:cursor-not-allowed`}
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <DollarSign size={16} />}
                  {isCurrentPlan ? 'Current Plan' : 'Pay Securely'}
                </button>
              ) : (
                <button
                  onClick={() => window.location.href = 'mailto:support@curvelead.com?subject=CurveLead%20Pro%20plan'}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-200"
                >
                  <ShieldCheck size={16} />
                  {plan.name === 'Pro' ? 'Contact Sales' : 'Included'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-950">Secure payments</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Payments are processed through Razorpay and verified before the upgraded plan is activated for your workspace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
