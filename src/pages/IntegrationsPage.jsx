import { useState, useEffect, useCallback } from 'react';
import { integrationsAPI, aiCallingAPI } from '../services/api';
import { Copy, Check, RefreshCw, Trash2, Key, AlertCircle, CheckCircle, ArrowLeft, Zap, Globe, BarChart2, ChevronRight, Lock, LogIn, Users, RotateCcw } from 'lucide-react';

const FB_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '1551778202757963';
const FB_LOGIN_CONFIG_ID = import.meta.env.VITE_FACEBOOK_LOGIN_CONFIG_ID || '4416725028596340';

const loadFbSdk = () =>
  new Promise((resolve) => {
    if (window.FB) return resolve(window.FB);
    window.fbAsyncInit = () => {
      window.FB.init({ appId: FB_APP_ID, version: 'v25.0', xfbml: false, cookie: true });
      resolve(window.FB);
    };
    const s = document.createElement('script');
    s.src = 'https://connect.facebook.net/en_US/sdk.js';
    s.async = true;
    document.head.appendChild(s);
  });

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
  {
    id: 'ai_calling',
    label: 'AI Calling Agent',
    description: 'Have an AI voice agent call leads automatically — pick a voice and persona.',
    emoji: '🤖',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    category: 'Calling',
    live: true,
    isConfigured: s => s.voice_ai_configured,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp Business API',
    description: 'Auto-send appointment & demo confirmations to leads via WhatsApp.',
    emoji: '💬',
    bg: 'bg-green-50',
    border: 'border-green-100',
    category: 'Messaging',
    live: true,
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

const CATEGORIES = ['All', 'Ads', 'Website', 'Forms', 'Marketplace', 'Automation', 'Messaging', 'Calling', 'Developer'];

// ── Config panels ──────────────────────────────────────────────────────────

const MetaConfig = ({ settings, onRefresh }) => {
  const [pages, setPages] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [fbReady, setFbReady] = useState(false);

  // Load SDK on mount so FB.login() can be called synchronously on click
  useEffect(() => {
    loadFbSdk().then(() => setFbReady(true)).catch(console.error);
  }, []);

  const handleFbLogin = useCallback(() => {
    if (!window.FB) return alert('Facebook SDK not loaded yet. Please wait a moment and try again.');
    setConnecting(true);
    window.FB.login((authResp) => {
      if (authResp.status !== 'connected') { setConnecting(false); return; }
      integrationsAPI.facebookAuth(authResp.authResponse.accessToken)
        .then(({ data }) => { setPages(data.pages); setConnecting(false); })
        .catch(e => { alert(e.response?.data?.error || 'Facebook auth failed.'); setConnecting(false); });
    }, { config_id: FB_LOGIN_CONFIG_ID });
  }, []);

  const handleSelectPage = async (page) => {
    try {
      await integrationsAPI.facebookConnectPage({ page_id: page.id, page_access_token: page.access_token, page_name: page.name });
      setPages(null);
      onRefresh();
    } catch (e) { alert(e.response?.data?.error || 'Failed to connect page.'); }
  };

  const handleSync = async () => {
    setSyncing(true); setSyncResult(null);
    try {
      const { data } = await integrationsAPI.facebookSyncLeads();
      setSyncResult(data.message);
    } catch (e) { setSyncResult(e.response?.data?.error || 'Sync failed.'); }
    finally { setSyncing(false); }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Facebook page? Real-time webhook will also stop.')) return;
    setDisconnecting(true);
    try {
      await integrationsAPI.updateSettings({ meta_page_id: '', meta_page_access_token: '' });
      onRefresh();
    } catch { alert('Failed to disconnect.'); }
    finally { setDisconnecting(false); }
  };

  // Page selector view
  if (pages) return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-blue-500" />
          <h2 className="font-semibold">Select a Facebook Page</h2>
        </div>
        {pages.length === 0 && <p className="text-sm text-gray-500">No pages found. Make sure you manage at least one Facebook Page.</p>}
        <div className="space-y-2">
          {pages.map(page => (
            <button key={page.id} onClick={() => handleSelectPage(page)}
              className="w-full flex items-center justify-between px-4 py-3 border rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-colors text-left">
              <div>
                <p className="text-sm font-semibold text-gray-800">{page.name}</p>
                <p className="text-xs text-gray-400">ID: {page.id}</p>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          ))}
        </div>
        <button onClick={() => setPages(null)} className="text-xs text-gray-400 hover:text-gray-600">← Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Connection status */}
      {settings.meta_configured ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-500" />
            <div>
              <p className="text-sm font-semibold text-green-800">Connected</p>
              <p className="text-xs text-green-600">{settings.meta_page_name || `Page ID: ${settings.meta_page_id}`}</p>
            </div>
          </div>
          <button onClick={handleDisconnect} disabled={disconnecting}
            className="text-xs text-red-500 hover:text-red-700 font-medium">
            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-500" />
          <p className="text-sm text-amber-700">Not connected — click the button below to log in with Facebook.</p>
        </div>
      )}

      {/* Login / reconnect button */}
      <div className="bg-white rounded-2xl border p-5 space-y-4">
        <button onClick={handleFbLogin} disabled={connecting}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#1877F2] text-white rounded-xl text-sm font-semibold hover:bg-[#166FE5] disabled:opacity-60 transition-colors">
          <LogIn size={16} />
          {connecting ? 'Opening Facebook…' : settings.meta_configured ? 'Reconnect with Facebook' : 'Login with Facebook'}
        </button>
        <p className="text-[11px] text-center text-gray-400">
          We'll ask for permission to access your Lead Ads. Your Facebook password is never shared with us.
        </p>
      </div>

      {/* Sync leads */}
      {settings.meta_configured && (
        <div className="bg-white rounded-2xl border p-5 space-y-3">
          <h2 className="font-semibold">Sync Past Leads</h2>
          <p className="text-xs text-gray-500">Import all existing leads from your connected Facebook page. New leads come in automatically via webhook.</p>
          {syncResult && (
            <div className="flex items-start gap-2 bg-blue-50 rounded-xl px-3 py-2">
              <CheckCircle size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">{syncResult}</p>
            </div>
          )}
          <button onClick={handleSync} disabled={syncing}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
            <RotateCcw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing leads…' : 'Sync Leads Now'}
          </button>
        </div>
      )}

      {/* Webhook info */}
      <div className="bg-white rounded-2xl border p-5 space-y-3">
        <h2 className="font-semibold">Real-time Webhook</h2>
        <p className="text-xs text-gray-500">For instant lead delivery, also add this webhook URL in Meta Business Suite → Leads Access → CRM Integration:</p>
        <UrlRow label="Webhook URL" url={settings.webhook_url} />
      </div>
    </div>
  );
};

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

const WhatsAppConfig = ({ settings, onRefresh }) => {
  const isConfigured = !!(settings.whatsapp_configured || settings.whatsapp_phone_number_id);
  const [form, setForm] = useState({
    whatsapp_phone_number_id: settings.whatsapp_phone_number_id || '',
    whatsapp_access_token: isConfigured ? '••••••••' : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.whatsapp_phone_number_id) return setError('Phone Number ID is required');
    if (!form.whatsapp_access_token) return setError('Access Token is required');
    setError('');
    setSaving(true);
    try {
      await integrationsAPI.updateSettings(form);
      await onRefresh();
      alert('WhatsApp settings saved.');
    } catch (e) { setError(e.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect WhatsApp Business API?')) return;
    await integrationsAPI.updateSettings({ whatsapp_phone_number_id: '', whatsapp_access_token: '' });
    await onRefresh();
  };

  return (
    <div className="space-y-5">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${isConfigured ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
        {isConfigured ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
        {isConfigured ? 'WhatsApp Business API connected — appointment messages will auto-send.' : 'Not configured — paste your Meta WhatsApp API credentials below.'}
      </div>

      <div className="bg-white rounded-2xl border p-5 space-y-4">
        <div>
          <h2 className="font-semibold mb-1">Step 1 — Get credentials from Meta</h2>
          <p className="text-xs text-gray-500">Go to <strong>Meta Developer Console → Your App → WhatsApp → API Setup</strong>. Copy the <em>Phone Number ID</em> and generate a <em>Permanent Access Token</em>.</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number ID</label>
          <input value={form.whatsapp_phone_number_id}
            onChange={e => setForm(f => ({ ...f, whatsapp_phone_number_id: e.target.value }))}
            placeholder="e.g. 123456789012345"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Permanent Access Token</label>
          <input value={form.whatsapp_access_token}
            onChange={e => setForm(f => ({ ...f, whatsapp_access_token: e.target.value }))}
            onFocus={e => { if (e.target.value.startsWith('•')) setForm(f => ({ ...f, whatsapp_access_token: '' })); }}
            type="password" placeholder="EAAxxxxxxxxxx…"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save WhatsApp Settings'}
          </button>
          {isConfigured && (
            <button onClick={handleDisconnect} className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm hover:bg-red-50">
              Disconnect
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-5">
        <h2 className="font-semibold mb-2">What happens automatically</h2>
        <ul className="text-xs text-gray-500 space-y-1.5 list-disc list-inside">
          <li>When an agent books a <strong>Demo</strong> with a lead → WhatsApp confirmation sent instantly</li>
          <li>When a <strong>Visit / Appointment</strong> is scheduled → WhatsApp reminder sent to lead</li>
          <li>Message includes date, time, and meeting link (if provided)</li>
          <li>Messages appear in the lead's WhatsApp conversation thread in CurveLead</li>
        </ul>
      </div>
    </div>
  );
};

const emptyAgentForm = () => ({
  name: '', voice_provider: '', voice_id: '', voice_name: '',
  language: 'en', system_prompt: '', first_message: '', is_default: false,
});

const AiCallingConfig = ({ settings, onRefresh }) => {
  const [form, setForm] = useState({
    voice_ai_api_key: settings.voice_ai_configured ? '••••••••' : '',
    voice_ai_phone_number_id: settings.voice_ai_phone_number_id || '',
  });
  const [saving, setSaving] = useState(false);
  const [agents, setAgents] = useState([]);
  const [voices, setVoices] = useState([]);
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [agentForm, setAgentForm] = useState(emptyAgentForm());

  useEffect(() => {
    aiCallingAPI.getAgents().then(({ data }) => setAgents(data.agents || [])).catch(() => {});
    aiCallingAPI.getVoices().then(({ data }) => setVoices(data.voices || [])).catch(() => {});
  }, []);

  const reloadAgents = () => aiCallingAPI.getAgents().then(({ data }) => setAgents(data.agents || [])).catch(() => {});

  const handleSave = async () => {
    setSaving(true);
    try { await aiCallingAPI.updateSettings(form); await onRefresh(); alert('AI Calling settings saved.'); }
    catch { alert('Failed to save.'); }
    finally { setSaving(false); }
  };

  const openNewAgent = () => { setEditingAgent(null); setAgentForm(emptyAgentForm()); setShowAgentForm(true); };
  const openEditAgent = (a) => { setEditingAgent(a); setAgentForm({ ...emptyAgentForm(), ...a }); setShowAgentForm(true); };

  const handleVoiceChange = (key) => {
    const v = voices.find(v => v.id === key);
    if (!v) return;
    setAgentForm(f => ({ ...f, voice_provider: v.provider, voice_id: v.voiceId, voice_name: v.name }));
  };

  const handleSaveAgent = async () => {
    if (!agentForm.name || !agentForm.voice_id || !agentForm.system_prompt) {
      return alert('Name, voice and system prompt are required.');
    }
    try {
      if (editingAgent) await aiCallingAPI.updateAgent(editingAgent.id, agentForm);
      else await aiCallingAPI.createAgent(agentForm);
      setShowAgentForm(false);
      reloadAgents();
    } catch (e) { alert(e.response?.data?.error || 'Failed to save agent.'); }
  };

  const handleDeleteAgent = async (id) => {
    if (!window.confirm('Delete this AI agent persona?')) return;
    await aiCallingAPI.deleteAgent(id).catch(() => {});
    reloadAgents();
  };

  return (
    <div className="space-y-5">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${settings.voice_ai_configured ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
        {settings.voice_ai_configured ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
        {settings.voice_ai_configured ? 'AI Calling is active.' : 'Not configured — add your Vapi API key and phone number below.'}
      </div>

      <div className="bg-white rounded-2xl border p-5 space-y-4">
        <div>
          <h2 className="font-semibold mb-1">Connect Vapi</h2>
          <p className="text-xs text-gray-500">
            Get an API key and a phone number from your{' '}
            <a href="https://vapi.ai" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">Vapi dashboard</a>, then paste them here.
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
          <input value={form.voice_ai_api_key} onChange={e => setForm({ ...form, voice_ai_api_key: e.target.value })}
            onFocus={e => { if (e.target.value.startsWith('•')) setForm(f => ({ ...f, voice_ai_api_key: '' })); }}
            type="password" placeholder="vapi_..."
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number ID</label>
          <input value={form.voice_ai_phone_number_id} onChange={e => setForm({ ...form, voice_ai_phone_number_id: e.target.value })}
            placeholder="The phone number resource ID from Vapi"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
        </div>
        <button onClick={handleSave} disabled={saving}
          className="w-full py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save AI Calling Settings'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border p-5 space-y-3">
        <h2 className="font-semibold">Call Status Webhook</h2>
        <p className="text-xs text-gray-500">Add this as a Server URL in your Vapi assistant/account settings so call status, transcripts and recordings flow back into CurveLead:</p>
        <UrlRow label="Webhook URL" url={settings.voice_ai_webhook_url} />
      </div>

      <div className="bg-white rounded-2xl border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Agent Personas</h2>
          <button onClick={openNewAgent} className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700">+ New Agent</button>
        </div>

        {agents.length === 0 ? (
          <p className="text-xs text-gray-500">No agent personas yet. Create one so staff can call leads with it.</p>
        ) : (
          <div className="space-y-2">
            {agents.map(a => (
              <div key={a.id} className="flex items-center justify-between border rounded-xl px-3 py-2">
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    {a.name}
                    {a.is_default && <span className="text-[10px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-full">Default</span>}
                  </p>
                  <p className="text-xs text-gray-400">{a.voice_name || a.voice_id} · {a.language}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditAgent(a)} className="text-xs text-gray-500 hover:text-brand-600">Edit</button>
                  <button onClick={() => handleDeleteAgent(a.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAgentForm && (
          <div className="border-2 border-dashed rounded-xl p-4 bg-gray-50 space-y-3">
            <input value={agentForm.name} onChange={e => setAgentForm({ ...agentForm, name: e.target.value })}
              placeholder="Agent name (e.g. Demo Booking Agent)" className="w-full px-3 py-2 border rounded-lg text-sm" />
            <select value={agentForm.voice_id ? voices.find(v => v.voiceId === agentForm.voice_id)?.id || '' : ''}
              onChange={e => handleVoiceChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
              <option value="">Select a voice</option>
              {voices.map(v => <option key={v.id} value={v.id}>{v.name} ({v.language}, {v.gender})</option>)}
            </select>
            <textarea value={agentForm.system_prompt} onChange={e => setAgentForm({ ...agentForm, system_prompt: e.target.value })}
              placeholder="System prompt — describe the agent's goal, tone and script" rows={4}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input value={agentForm.first_message} onChange={e => setAgentForm({ ...agentForm, first_message: e.target.value })}
              placeholder="Opening line (optional)" className="w-full px-3 py-2 border rounded-lg text-sm" />
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input type="checkbox" checked={agentForm.is_default} onChange={e => setAgentForm({ ...agentForm, is_default: e.target.checked })} />
              Make this the default agent
            </label>
            <div className="flex gap-2">
              <button onClick={handleSaveAgent} className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
                {editingAgent ? 'Save Changes' : 'Create Agent'}
              </button>
              <button onClick={() => setShowAgentForm(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-500">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────

const IntegrationsPage = () => {
  const [selected, setSelected] = useState(null);
  const [category, setCategory] = useState('All');
  const [settings, setSettings] = useState({
    meta_configured: false, google_configured: false, whatsapp_configured: false,
    api_key: null, api_key_created_at: null,
    webhook_url: '', api_ingest_url: '', google_webhook_url: '',
    meta_page_id: '', meta_page_access_token: '', google_webhook_secret: '',
    whatsapp_phone_number_id: '', whatsapp_access_token: '',
    voice_ai_configured: false, voice_ai_phone_number_id: '',
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
      const [{ data }, aiCalling] = await Promise.all([
        integrationsAPI.getSettings(),
        aiCallingAPI.getSettings().catch(() => ({ data: {} })),
      ]);
      const merged = { ...data, ...aiCalling.data };
      setSettings(merged);
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

        {selected === 'meta' && <MetaConfig settings={settings} onRefresh={load} />}
        {selected === 'website' && <WebsiteConfig settings={settings} embedScript={embedScript} handleLoadEmbed={handleLoadEmbed} />}
        {selected === 'api' && <ApiKeyConfig settings={settings} newKeyValue={newKeyValue} handleGenerateKey={handleGenerateKey} handleRevokeKey={handleRevokeKey} />}
        {selected === 'google' && <GoogleConfig settings={settings} form={form} setForm={setForm} saving={saving} handleSave={handleSave} />}
        {selected === 'whatsapp' && <WhatsAppConfig settings={settings} onRefresh={load} />}
        {selected === 'ai_calling' && <AiCallingConfig settings={settings} onRefresh={load} />}
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
