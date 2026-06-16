import { useState } from 'react';
import { Mail, MessageSquare, CheckCircle } from 'lucide-react';
import PublicPageLayout from '../components/layout/PublicPageLayout';

const ContactUsPage = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.message.trim()) e.message = 'Please write a message.';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const subject = encodeURIComponent(`CurveLead Contact: ${form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone || 'Not provided'}\n\nMessage:\n${form.message}`
    );
    window.location.href = `mailto:support@curvelead.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <PublicPageLayout>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-14">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 mb-2">Get in touch</p>
          <h1 className="text-4xl font-extrabold text-gray-950">Contact Us</h1>
          <p className="mt-4 text-gray-600 leading-7 max-w-xl">
            Contact us for support, onboarding, billing, or data and privacy requests. We&rsquo;re here to help you get the most out of CurveLead.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
              <p className="text-lg font-bold text-gray-950">Curve Lead</p>
              <p className="mt-1 text-sm text-gray-500">Lead management platform for businesses running Meta Ads.</p>
              <div className="mt-5 space-y-3">
                <a href="mailto:support@curvelead.com" className="flex items-center gap-3 text-sm text-gray-700 hover:text-brand-600 transition-colors">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Mail size={17} />
                  </span>
                  support@curvelead.com
                </a>
                <div className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <MessageSquare size={17} />
                  </span>
                  <span>
                    We typically respond within <strong>1 business day</strong>.
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <p className="text-sm font-semibold text-gray-950 mb-3">Common reasons to reach out</p>
              <ul className="space-y-2 text-sm text-gray-600">
                {[
                  'Help with Meta / Facebook integration',
                  'Account setup or onboarding',
                  'Billing or subscription changes',
                  'Data access or deletion request',
                  'Technical support or bug reports',
                  'Feature requests or feedback',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle size={48} className="text-green-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-950">Message sent!</h2>
                <p className="mt-2 text-gray-600 max-w-xs">
                  Your email client should have opened with your message. We&rsquo;ll get back to you at <strong>{form.email}</strong>.
                </p>
                <button
                  onClick={() => { setForm({ name: '', email: '', phone: '', message: '' }); setSubmitted(false); }}
                  className="mt-6 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-950 mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-950 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@company.com"
                      className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-950 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Phone <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-950 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Describe what you need help with..."
                      className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-950 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none ${errors.message ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {errors.message && <p className="mt-1.5 text-xs text-red-600">{errors.message}</p>}
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  >
                    Send Message
                  </button>

                  <p className="text-xs text-center text-gray-400">
                    Your message will open in your default email client. Or email us directly at{' '}
                    <a href="mailto:support@curvelead.com" className="text-brand-600 hover:underline">support@curvelead.com</a>.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
};

export default ContactUsPage;
