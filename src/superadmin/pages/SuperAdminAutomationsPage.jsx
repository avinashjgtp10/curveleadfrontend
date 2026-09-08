import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const TEMPLATES = [
  {
    title: 'Initial Message (Immediately)',
    body: 'Hi {name} 👋\nWelcome to Curved! Please select a service:\n1. Haircut\n2. Facial\n3. Spa',
  },
  {
    title: 'Follow-up Message (1 Hour)',
    body: 'Hey 👋 Need help booking?\nWe are here to help!',
  },
  {
    title: 'Follow-up Message (24 Hours)',
    body: 'Slots are filling fast! 🔥\nBook your appointment now\nhttps://curved.com/book/[slug]',
  },
];

const SuperAdminAutomationsPage = () => {
  const [oneHour, setOneHour] = useState(true);
  const [twentyFourHour, setTwentyFourHour] = useState(true);
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard?.writeText('https://curved.com/book/[slug]').catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Automation Settings</h1>
        <p className="text-sm text-gray-500">Configure WhatsApp messages, follow-ups and triggers.</p>
      </div>

      <div className="bg-white rounded-2xl p-5 border">
        <h3 className="font-semibold text-gray-900 mb-4">WhatsApp Message Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEMPLATES.map(t => (
            <div key={t.title} className="border rounded-xl p-4 flex flex-col">
              <p className="text-sm font-semibold text-gray-800 mb-2">{t.title}</p>
              <p className="text-xs text-gray-500 whitespace-pre-line flex-1">{t.body}</p>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 py-1.5 rounded-lg border text-xs font-medium text-gray-600 hover:bg-gray-50">Edit</button>
                <button className="flex-1 py-1.5 rounded-lg border text-xs font-medium text-gray-600 hover:bg-gray-50">Preview</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 border">
          <h3 className="font-semibold text-gray-900 mb-4">Follow-up Schedule</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
              <span>
                <span className="block text-sm font-medium text-gray-800">1 Hour Reminder</span>
                <span className="block text-[11px] text-gray-400">1 hour after no reply</span>
              </span>
              <button type="button" onClick={() => setOneHour(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${oneHour ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${oneHour ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </button>
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
              <span>
                <span className="block text-sm font-medium text-gray-800">24 Hour Reminder</span>
                <span className="block text-[11px] text-gray-400">24 hours after no reply</span>
              </span>
              <button type="button" onClick={() => setTwentyFourHour(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${twentyFourHour ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${twentyFourHour ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </button>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border space-y-4">
          <h3 className="font-semibold text-gray-900">Webhook & Integration</h3>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-800">WhatsApp Cloud API</p>
              <p className="text-[11px] text-gray-400">Phone Number: +91 98765 43210</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">Connected</span>
          </div>
          <button className="w-full py-2 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50">Configure</button>

          <div>
            <p className="text-sm font-medium text-gray-800 mb-1">Booking Link</p>
            <div className="flex gap-2">
              <input readOnly value="https://curved.com/book/[slug]"
                className="flex-1 px-3 py-2 border rounded-lg text-xs text-gray-500 bg-gray-50" />
              <button onClick={copyLink}
                className="px-3 py-2 rounded-lg border text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1">
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminAutomationsPage;
