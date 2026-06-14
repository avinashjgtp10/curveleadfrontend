import { useState, useEffect } from 'react';
import { integrationsAPI } from '../services/api';
import { Copy, Check, RefreshCw, Trash2, Key, AlertCircle, CheckCircle, ArrowLeft, Zap, Globe, BarChart2, ChevronRight, Lock } from 'lucide-react';

// ── Shared helpers ─────────────────────────────────────────────────────────

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 shrink-0" title="Copy">
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
};

const CodeBlock = ({ code }) => (
  <div className="relative bg-gray-900 rounded-xl p-4 text-xs text-green-400 font-mono overflow-x-auto">
    <pre className="whitespace-pre-wrap break-all">{code}</pre>
    <div className="absolute top-2 right-2"><CopyButton text={code} /></div>
  </div>
);

const UrlRow = ({ label, url }) => (
  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
    <span className="text-xs text-gray-500 shrink-0">{label}:</span>
    <span className="text-xs font-mono text-gray-700 flex-1 truncate">{url}</span>
    <CopyButton text={url} />
  </div>
);

// ── Integration definitions ────────────────────────────────────────────────

const INTEGRATIONS = [
  // ── Live integrations
  {
    id: 'meta',
    label: 'Facebook / Instagram',
    description: 'Capture leads from Facebook & Instagram Lead Ads automatically.',
    emoji: '📘',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    category: 'Ads',
    live: true,
    isConfigured: s => s.meta_configured,
  },
  {
    id: 'google',
    label: 'Google Ads',
    description: 'Capture leads from Google Lead Form Assets in real-time.',
    emoji: '🟢',
    bg: 'bg-green-50',
    border: 'border-green-100',
    category: 'Ads',
    live: true,
    isConfigured: s => s.google_configured,
  },
  {
    id: 'api',
    label: 'REST API',
    description: 'Push leads from any system — IndiaMART, JustDial, your backend, Zapier.',
    emoji: '🔑',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    category: 'Developer',
    live: true,
    isConfigured: s => !!s.api_key,
  },
  {
    id: 'website',
    label: 'Website Embed Form',
    description: 'Embed a lead capture form on any website in minutes.',
    emoji: '🌐',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    category: 'Website',
    live: true,
    isConfigured: s => !!s.api_key,
  },
  // ── Coming soon
  {
    id: null,
    label: 'WhatsApp',
    description: 'Auto-create leads from WhatsApp conversations.',
    emoji: '💬',
    bg: 'bg-green-50',
    border: 'border-green-100',
    category: 'Messaging',
    live: false,
  },
  {
    id: null,
    label: 'LinkedIn Ads',
    description: 'Receive leads from LinkedIn Lead Generation ads.',
    emoji: '🔷',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
    category: 'Ads',
    live: false,
  },
  {
    id: null,
    label: 'Google Forms',
    description: 'Receive new leads from Google Forms responses.',
    emoji: '📋',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    category: 'Forms',
    live: false,
  },
  {
    id: null,
    label: 'JotForm',
    description: 'Receive leads from JotForm form submissions.',
    emoji: '📝',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    category: 'Forms',
    live: false,
  },
  {
    id: null,
    label: 'WordPress',
    description: 'Capture leads from WordPress contact forms via plugin.',
    emoji: '🔵',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    category: 'Website',
    live: false,
  },
  {
    id: null,
    label: 'Wix',
    description: 'Receive leads from your Wix website forms.',
    emoji: '⬛',
    bg: 'bg-gray-50',
    border: 'border-gray-100',
    category: 'Website',
    live: false,
  },
  {
    id: null,
    label: 'IndiaMART',
    description: 'Auto-import leads from IndiaMART buyer enquiries.',
    emoji: '🇮🇳',
    bg: 'bg-yellow-50',
    border: 'border-yellow-100',
    category: 'Marketplace',
    live: false,
  },
  {
    id: null,
    label: 'JustDial',
    description: 'Auto-import leads from JustDial enquiries.',
    emoji: '📞',
    bg: 'bg-red-50',
    border: 'border-red-100',
    category: 'Marketplace',
    live: false,
  },
  {
    id: null,
    label: 'Zapier',
    description: 'Connect any app to CurveLead using Zapier webhooks.',
    emoji: '⚡',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    category: 'Automation',
    live: false,
  },
  {
    id: null,
    label: 'Pabbly Connect',
    description: 'Automate lead flow from 1000+ apps via Pabbly Connect.',
    emoji: '🔗',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    category: 'Automation',
    live: false,
  },
  {
    id: null,
    label: 'TikTok Ads',
    description: 'Receive leads from TikTok Lead Generation campaigns.',
    emoji: '🎵',
    bg: 'bg-gray-50',
    border: 'border-gray-100',
    category: 'Ads',
    live: false,
  },
  {
    id: null,
    label: 'ClickFunnels',
    description: 'Receive leads from ClickFunnels funnels automatically.',
    emoji: '🔻',
    bg: 'bg-red-50',
    border: 'border-red-100',
    category: 'Website',
    live: false,
  },
];

const CATEGORIES = ['All', 'Ads', 'Website', 'Forms', 'Marketplace', 'Automation', 'Messaging', 'Developer'];

// ── Config panels ──────────────────────────────────────────────────────────

const MetaConfig = ({ settings, form, setForm, saving, handleSave }) => (
  <div className="space-y-5">
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${settings.meta_configured ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
      {settings.meta_configured ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {settings.meta_configured ? 'Meta integration is active.' : 'Not configured — enter your Page ID and Access Token below.'}
    </div>
    <div className="bg-white rounded-2xl border p-5 space-y-4">
      <div>
        <h2 className="font-semibold mb-1">Step 1 — Add Webhook URL in Meta Business Suite</h2>
        <p className="text-xs text-gray-500 mb-3">Go to Meta Business Suite → Leads Access → CRM Integration → paste this URL:</p>
        <UrlRow label="Webhook URL" url={settings.webhook_url} />
      </div>
      <div>
        <h2 className="font-semibold mb-1">Step 2 — Configure Credentials</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Facebook Page ID</label>
            <input value={form.meta_page_id} onChange={e => setForm({ ...form, meta_page_id: e.target.value })}
              placeholder="e.g. 123456789012345"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Page Access Token</label>
            <input value={form.meta_page_access_token} onChange={e => setForm({ ...form, meta_page_access_token: e.target.value })}
              onFocus={e => { if (e.target.value.startsWith('•')) setForm(f => ({ ...f, meta_page_access_token: '' })); }}
              type="password" placeholder="EAAxxxx…"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
            <p className="text-[10px] text-gray-400 mt-1">Get this from Meta for Developers → Your App → Page Access Token.</p>
          </div>
        </div>
      </div>
      <button onClick={handleSave} disabled={saving}
        className="w-full py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
        {saving ? 'Saving…' : 'Save Meta Settings'}
      </button>
    </div>
    <div className="bg-white rounded-2xl border p-5">
      <h2 className="font-semibold mb-2">How it works</h2>
      <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
        <li>Someone fills your Facebook / Instagram Lead Ad form.</li>
        <li>Meta sends the lead data to your webhook URL instantly.</li>
        <li>CurveLead creates the lead automatically with source = <code className="bg-gray-100 px-1 rounded">meta_ads</code>.</li>
        <li>Duplicate phone numbers are skipped automatically.</li>
      </ol>
    </div>
  </div>
);

const WebsiteConfig = ({ settings, embedScript, handleLoadEmbed }) => (
  <div className="space-y-5">
    <div className="bg-white rounded-2xl border p-5 space-y-4">
      <div>
        <h2 className="font-semibold mb-1">Embed a lead form on your website</h2>
        <p className="text-xs text-gray-500">Paste the snippet below anywhere on your website. Leads appear in CurveLead instantly with source = <code className="bg-gray-100 px-1 rounded">website</code>.</p>
      </div>
      {!embedScript ? (
        <button onClick={handleLoadEmbed}
          className="w-full py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700">
          Generate Embed Code
        </button>
      ) : (
        <>
          <CodeBlock code={embedScript} />
          <button onClick={handleLoadEmbed} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600">
            <RefreshCw size={12} /> Regenerate
          </button>
        </>
      )}
      <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700 space-y-1">
        <p className="font-semibold">Requirements</p>
        <p>• An API key must be generated (REST API tab) before you can get an embed code.</p>
        <p>• Works on any website — WordPress, Webflow, raw HTML, etc.</p>
        <p>• Duplicate phone numbers are rejected silently.</p>
      </div>
    </div>
  </div>
);

const ApiKeyConfig = ({ settings, newKeyValue, handleGenerateKey, handleRevokeKey }) => (
  <div className="space-y-5">
    <div className="bg-white rounded-2xl border p-5 space-y-4">
      <div>
        <h2 className="font-semibold mb-1">REST API Key</h2>
        <p className="text-xs text-gray-500">Use this key to push leads from IndiaMART, JustDial, Zapier, your own backend, or any external system.</p>
      </div>
      {newKeyValue && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-green-700 mb-2">⚠ Copy this key now — it won't be shown again.</p>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-green-300">
            <code className="text-xs font-mono flex-1 break-all text-gray-800">{newKeyValue}</code>
            <CopyButton text={newKeyValue} />
          </div>
        </div>
      )}
      {settings.api_key ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <Key size={14} className="text-gray-400 shrink-0" />
            <code className="text-xs font-mono flex-1 text-gray-500">{settings.api_key}</code>
            <span className="text-[10px] text-green-600 font-medium">Active</span>
          </div>
          {settings.api_key_created_at && (
            <p className="text-[10px] text-gray-400">Created {new Date(settings.api_key_created_at).toLocaleString('en-IN')}</p>
          )}
          <div className="flex gap-2">
            <button onClick={handleGenerateKey}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              <RefreshCw size={14} /> Rotate Key
            </button>
            <button onClick={handleRevokeKey}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-red-200 rounded-xl text-sm text-red-500 hover:bg-red-50">
              <Trash2 size={14} /> Revoke
            </button>
          </div>
        </div>
      ) : (
        <button onClick={handleGenerateKey}
          className="w-full py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700">
          Generate API Key
        </button>
      )}
    </div>
    <div className="bg-white rounded-2xl border p-5 space-y-3">
      <h2 className="font-semibold">API Endpoint</h2>
      <UrlRow label="POST" url={settings.api_ingest_url} />
      <p className="text-xs font-semibold text-gray-600 mt-2">Request headers:</p>
      <CodeBlock code={`x-api-key: YOUR_API_KEY\nContent-Type: application/json`} />
      <p className="text-xs font-semibold text-gray-600">Request body:</p>
      <CodeBlock code={`{\n  "name": "Rahul Sharma",\n  "phone": "9876543210",\n  "email": "rahul@example.com",\n  "source": "indiamart",\n  "source_detail": "Product inquiry"\n}`} />
      <p className="text-xs font-semibold text-gray-600">Response:</p>
      <CodeBlock code={`{ "message": "Lead created.", "id": "uuid" }`} />
    </div>
  </div>
);

const GoogleConfig = ({ settings, form, setForm, saving, handleSave }) => (
  <div className="space-y-5">
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${settings.google_configured ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
      {settings.google_configured ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {settings.google_configured ? 'Google Ads integration is active.' : 'Not configured — set a webhook secret below.'}
    </div>
    <div className="bg-white rounded-2xl border p-5 space-y-4">
      <div>
        <h2 className="font-semibold mb-1">Step 1 — Configure Webhook in Google Ads</h2>
        <p className="text-xs text-gray-500 mb-3">In Google Ads → Lead Form Assets → Webhook → paste this URL and your secret key:</p>
        <UrlRow label="Webhook URL" url={settings.google_webhook_url} />
      </div>
      <div>
        <h2 className="font-semibold mb-1">Step 2 — Set Webhook Secret</h2>
        <p className="text-xs text-gray-500 mb-3">Create any secret string. Enter it in both Google Ads and here to verify webhook requests.</p>
        <label className="block text-xs font-medium text-gray-600 mb-1">Webhook Secret Key</label>
        <input value={form.google_webhook_secret} onChange={e => setForm({ ...form, google_webhook_secret: e.target.value })}
          onFocus={e => { if (e.target.value.startsWith('•')) setForm(f => ({ ...f, google_webhook_secret: '' })); }}
          type="password" placeholder="e.g. my-secret-key-123"
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
      </div>
      <button onClick={handleSave} disabled={saving}
        className="w-full py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
        {saving ? 'Saving…' : 'Save Google Settings'}
      </button>
    </div>
    <div className="bg-white rounded-2xl border p-5">
      <h2 className="font-semibold mb-2">How it works</h2>
      <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
        <li>Someone submits your Google Lead Form Asset ad.</li>
        <li>Google sends the lead data to your webhook URL in real-time.</li>
        <li>CurveLead matches the secret key and creates the lead with source = <code className="bg-gray-100 px-1 rounded">google_ads</code>.</li>
        <li>Captured fields: Full Name, Phone Number, Email.</li>
      </ol>
    </div>
  </div>
);

// ── Main page ──────────────────────────────────────────────────────────────

const IntegrationsPage = () => {
  const [selected, setSelected] = useState(null);
  const [category, setCategory] = useState('All');
  const [settings, setSettings] = useState({
    meta_configured: false, google_configured: false,
    api_key: null, api_key_created_at: null,
    webhook_url: '', api_ingest_url: '', google_webhook_url: '',
    meta_page_id: '', meta_page_access_token: '', google_webhook_secret: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState(null);
  const [embedScript, setEmbedScript] = useState('');
  const [form, setForm] = useState({ meta_page_id: '', meta_page_access_token: '', google_webhook_secret: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await integrationsAPI.getSettings();
      setSettings(data);
      setForm({
        meta_page_id: data.meta_page_id || '',
        meta_page_access_token: data.meta_configured ? '••••••••' : '',
        google_webhook_secret: data.google_configured ? '••••••••' : '',
      });
    } catch (e) {
      console.error('integrations settings:', e.message);
      // silently fall back to defaults — gallery still shows, errors surface on configure
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try { await integrationsAPI.updateSettings(form); await load(); alert('Settings saved.'); }
    catch { alert('Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleGenerateKey = async () => {
    if (!window.confirm('Generate a new API key? Any existing key will be replaced.')) return;
    try { const { data } = await integrationsAPI.generateApiKey(); setNewKeyValue(data.api_key); load(); }
    catch { alert('Failed to generate key.'); }
  };

  const handleRevokeKey = async () => {
    if (!window.confirm('Revoke the API key? All integrations using it will stop working.')) return;
    try { await integrationsAPI.revokeApiKey(); setNewKeyValue(null); load(); }
    catch { alert('Failed.'); }
  };

  const handleLoadEmbed = async () => {
    try { const { data } = await integrationsAPI.getEmbedScript(); setEmbedScript(data.script); }
    catch (e) { alert(e.response?.data?.error || 'Generate an API key first.'); }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading integrations…</div>;

  // ── Detail view ──────────────────────────────────────────────────────────
  if (selected) {
    const integration = INTEGRATIONS.find(i => i.id === selected);
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${integration.bg}`}>
            {integration.emoji}
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{integration.label}</h1>
            <p className="text-xs text-gray-500">{integration.description}</p>
          </div>
        </div>

        {selected === 'meta' && <MetaConfig settings={settings} form={form} setForm={setForm} saving={saving} handleSave={handleSave} />}
        {selected === 'website' && <WebsiteConfig settings={settings} embedScript={embedScript} handleLoadEmbed={handleLoadEmbed} />}
        {selected === 'api' && <ApiKeyConfig settings={settings} newKeyValue={newKeyValue} handleGenerateKey={handleGenerateKey} handleRevokeKey={handleRevokeKey} />}
        {selected === 'google' && <GoogleConfig settings={settings} form={form} setForm={setForm} saving={saving} handleSave={handleSave} />}
      </div>
    );
  }

  // ── Gallery view ─────────────────────────────────────────────────────────
  const visible = category === 'All' ? INTEGRATIONS : INTEGRATIONS.filter(i => i.category === category);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500 mt-1">Connect your favourite lead sources to automatically capture leads into CurveLead.</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === c ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((integration, idx) => {
          const configured = integration.live && integration.isConfigured?.(settings);
          const isLive = integration.live;

          return (
            <button key={integration.id ?? idx}
              onClick={() => isLive && setSelected(integration.id)}
              disabled={!isLive}
              className={`text-left rounded-2xl border p-4 flex flex-col gap-3 transition-all ${integration.border}
                ${isLive ? 'bg-white hover:shadow-md cursor-pointer group' : 'bg-gray-50 cursor-default opacity-70'}`}>
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${integration.bg}`}>
                  {integration.emoji}
                </div>
                {isLive ? (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${configured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {configured ? '● Connected' : '○ Available'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                    <Lock size={9} /> Coming soon
                  </span>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">{integration.label}</h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{integration.description}</p>
              </div>

              {isLive && (
                <div className="flex items-center gap-1 text-xs text-brand-600 font-medium group-hover:gap-2 transition-all">
                  {configured ? 'Manage' : 'Set up'} <ChevronRight size={13} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default IntegrationsPage;
