import { useState, useEffect } from 'react';
import { integrationsAPI } from '../services/api';
import { Copy, Check, RefreshCw, Trash2, ExternalLink, Zap, Globe, Key, BarChart2, AlertCircle, CheckCircle } from 'lucide-react';

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
    <div className="absolute top-2 right-2">
      <CopyButton text={code} />
    </div>
  </div>
);

const UrlRow = ({ label, url }) => (
  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
    <span className="text-xs text-gray-500 shrink-0">{label}:</span>
    <span className="text-xs font-mono text-gray-700 flex-1 truncate">{url}</span>
    <CopyButton text={url} />
  </div>
);

const TABS = [
  { id: 'meta', label: 'Meta / Facebook', icon: Zap },
  { id: 'website', label: 'Website Embed', icon: Globe },
  { id: 'api', label: 'REST API Key', icon: Key },
  { id: 'google', label: 'Google Ads', icon: BarChart2 },
];

const IntegrationsPage = () => {
  const [tab, setTab] = useState('meta');
  const [settings, setSettings] = useState({
    meta_configured: false, google_configured: false,
    api_key: null, api_key_created_at: null,
    webhook_url: '', api_ingest_url: '', google_webhook_url: '',
    meta_page_id: '', meta_page_access_token: '', google_webhook_secret: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState(null);
  const [embedScript, setEmbedScript] = useState('');
  const [form, setForm] = useState({ meta_page_id: '', meta_page_access_token: '', google_webhook_secret: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await integrationsAPI.getSettings();
      setSettings(data);
      setForm({
        meta_page_id: data.meta_page_id || '',
        meta_page_access_token: data.meta_configured ? '••••••••' : '',
        google_webhook_secret: data.google_configured ? '••••••••' : '',
      });
    } catch (e) {
      console.error(e);
      setError('Integrations API not available. Deploy the latest backend to use this feature.');
    }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await integrationsAPI.updateSettings(form);
      load();
      alert('Settings saved.');
    } catch { alert('Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleGenerateKey = async () => {
    if (!window.confirm('Generate a new API key? Any existing key will be replaced.')) return;
    try {
      const { data } = await integrationsAPI.generateApiKey();
      setNewKeyValue(data.api_key);
      load();
    } catch { alert('Failed to generate key.'); }
  };

  const handleRevokeKey = async () => {
    if (!window.confirm('Revoke the API key? All integrations using it will stop working.')) return;
    try {
      await integrationsAPI.revokeApiKey();
      setNewKeyValue(null);
      load();
    } catch { alert('Failed.'); }
  };

  const handleLoadEmbed = async () => {
    try {
      const { data } = await integrationsAPI.getEmbedScript();
      setEmbedScript(data.script);
    } catch (e) { alert(e.response?.data?.error || 'Failed. Generate an API key first.'); }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading integrations…</div>;
  if (error) return (
    <div className="max-w-xl mx-auto p-8 text-center">
      <AlertCircle size={40} className="text-amber-400 mx-auto mb-3" />
      <p className="text-gray-600 text-sm">{error}</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lead Source Integrations</h1>
        <p className="text-sm text-gray-500 mt-1">Connect external sources to automatically capture leads into CurveLead.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${tab === t.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── META ── */}
      {tab === 'meta' && (
        <div className="space-y-5">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${settings.meta_configured ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            {settings.meta_configured ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {settings.meta_configured ? 'Meta integration is active.' : 'Not configured — enter your Page ID and Access Token below.'}
          </div>

          <div className="bg-white rounded-2xl border p-5 space-y-4">
            <h2 className="font-semibold">Step 1 — Add Webhook URL in Meta Business Suite</h2>
            <p className="text-xs text-gray-500">Go to Meta Business Suite → Leads Access → CRM Integration → paste this URL:</p>
            <UrlRow label="Webhook URL" url={settings.webhook_url} />

            <h2 className="font-semibold mt-2">Step 2 — Configure Credentials</h2>
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
      )}

      {/* ── WEBSITE EMBED ── */}
      {tab === 'website' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border p-5 space-y-4">
            <h2 className="font-semibold">Embed a lead form on your website</h2>
            <p className="text-xs text-gray-500">Paste the snippet below anywhere on your website. Leads submitted through the form will appear in CurveLead instantly with source = <code className="bg-gray-100 px-1 rounded">website</code>.</p>

            {!embedScript ? (
              <button onClick={handleLoadEmbed}
                className="w-full py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700">
                Generate Embed Code
              </button>
            ) : (
              <>
                <CodeBlock code={embedScript} />
                <button onClick={handleLoadEmbed}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600">
                  <RefreshCw size={12} /> Regenerate
                </button>
              </>
            )}

            <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700 space-y-1">
              <p className="font-semibold">Requirements</p>
              <p>• An API key must be generated (REST API Key tab) before you can get an embed code.</p>
              <p>• The form works on any website — WordPress, Webflow, raw HTML, etc.</p>
              <p>• Duplicate phone numbers are rejected silently.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── REST API KEY ── */}
      {tab === 'api' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border p-5 space-y-4">
            <h2 className="font-semibold">REST API Key</h2>
            <p className="text-xs text-gray-500">Use this key to send leads from any external system — IndiaMART, JustDial, your own backend, Zapier, etc.</p>

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
                  <span className="text-[10px] text-gray-400">Active</span>
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
      )}

      {/* ── GOOGLE ADS ── */}
      {tab === 'google' && (
        <div className="space-y-5">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${settings.google_configured ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            {settings.google_configured ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {settings.google_configured ? 'Google Ads integration is active.' : 'Not configured — set a webhook secret below.'}
          </div>

          <div className="bg-white rounded-2xl border p-5 space-y-4">
            <h2 className="font-semibold">Step 1 — Configure Webhook in Google Ads</h2>
            <p className="text-xs text-gray-500">In Google Ads → Lead Form Extension → Webhook → paste this URL and your secret key:</p>
            <UrlRow label="Webhook URL" url={settings.google_webhook_url} />

            <h2 className="font-semibold mt-2">Step 2 — Set Webhook Secret</h2>
            <p className="text-xs text-gray-500">Create any secret string and enter it in both Google Ads and here. Google sends it as <code className="bg-gray-100 px-1 rounded">google_key</code> to verify requests.</p>
            <div>
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
              <li>Someone submits your Google Lead Form Extension ad.</li>
              <li>Google sends the lead data to your webhook URL in real-time.</li>
              <li>CurveLead matches the secret key and creates the lead with source = <code className="bg-gray-100 px-1 rounded">google_ads</code>.</li>
              <li>Captured fields: Full Name, Phone Number, Email.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsPage;
