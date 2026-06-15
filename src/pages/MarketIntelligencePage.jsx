import { useState } from 'react';
import { aiAPI } from '../services/api';
import {
  Globe, TrendingUp, Users, AlertTriangle, Lightbulb,
  CheckCircle, Target, Sparkles, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Sub-components ───────────────────────────────────────────────────────────

const Badge = ({ label, color }) => {
  const cls = {
    Leader:     'bg-emerald-100 text-emerald-700',
    Challenger: 'bg-blue-100 text-blue-700',
    Niche:      'bg-violet-100 text-violet-700',
    High:       'bg-red-100 text-red-600',
    Medium:     'bg-amber-100 text-amber-700',
    Emerging:   'bg-teal-100 text-teal-700',
    Growing:    'bg-blue-100 text-blue-700',
    Mature:     'bg-gray-100 text-gray-600',
    Declining:  'bg-red-100 text-red-500',
  }[label] || 'bg-gray-100 text-gray-600';
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
};

const CompetitorCard = ({ c }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-bold text-gray-600">
            {c.name?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">{c.name}</p>
            <p className="text-xs text-gray-400">{c.origin}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge label={c.market_position} />
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t bg-gray-50/50 space-y-3 pt-3">
          {c.differentiator && (
            <p className="text-xs text-gray-600 italic">"{c.differentiator}"</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1.5">Strengths</p>
              <ul className="space-y-1">
                {(c.strengths || []).map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />{s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1.5">Weaknesses</p>
              <ul className="space-y-1">
                {(c.weaknesses || []).map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />{w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  'CRM & Sales Software', 'Real Estate', 'EdTech', 'FinTech', 'HealthTech',
  'E-Commerce', 'Marketing Agency', 'SaaS / B2B Software', 'Retail',
  'Manufacturing', 'Logistics & Supply Chain', 'HR & Recruitment',
  'Legal Services', 'Consulting', 'Other',
];

const GEOGRAPHIES = ['India', 'South Asia', 'Southeast Asia', 'Global', 'USA & North America', 'Europe', 'Middle East', 'Africa'];

const MarketIntelligencePage = () => {
  const [form, setForm] = useState({
    business_name: '',
    industry: '',
    product_service: '',
    target_geography: 'India',
    customer_type: 'SMBs',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAnalyze = async () => {
    if (!form.industry || !form.product_service) {
      setError('Please fill in Industry and Product/Service.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const { data } = await aiAPI.marketAnalysis(form);
      setResult(data.analysis);
    } catch (e) {
      setError(e.response?.data?.error || 'AI analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const mo = result?.market_overview;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Globe size={20} className="text-indigo-600" /> Market Intelligence
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">AI-powered competitor & market analysis for your business</p>
        </div>
        {result && (
          <button onClick={() => setResult(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border rounded-lg hover:bg-gray-50">
            <RefreshCw size={13} /> New Analysis
          </button>
        )}
      </div>

      {/* Input Form */}
      {!result && (
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-500" /> Tell us about your business
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Business Name</label>
              <input
                value={form.business_name}
                onChange={e => set('business_name', e.target.value)}
                placeholder="e.g. CurveLead"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Industry <span className="text-red-400">*</span></label>
              <select
                value={form.industry}
                onChange={e => set('industry', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none bg-white">
                <option value="">Select industry...</option>
                {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Product / Service <span className="text-red-400">*</span></label>
              <input
                value={form.product_service}
                onChange={e => set('product_service', e.target.value)}
                placeholder="e.g. Lead management CRM for small businesses with AI scoring and WhatsApp integration"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Target Geography</label>
              <select
                value={form.target_geography}
                onChange={e => set('target_geography', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none bg-white">
                {GEOGRAPHIES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Target Customers</label>
              <select
                value={form.customer_type}
                onChange={e => set('customer_type', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none bg-white">
                {['SMBs', 'Enterprises', 'Startups', 'Individuals / Consumers', 'SMBs and Enterprises'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button onClick={handleAnalyze} disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
            {loading
              ? <><RefreshCw size={16} className="animate-spin" /> Analyzing market... (may take 15–30 sec)</>
              : <><Sparkles size={16} /> Generate Market Analysis</>}
          </button>

          <p className="text-[11px] text-gray-400 text-center">
            Powered by Groq AI (Llama 3.1 70B) · Based on training data, not real-time research
          </p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-5">

          {/* Market Overview */}
          <div className="bg-white rounded-2xl border p-6">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-blue-500" /> Market Overview
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{mo?.summary}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Market Size', value: mo?.estimated_size || '—' },
                { label: 'Growth Rate', value: mo?.growth_rate || '—' },
                { label: 'Geography', value: form.target_geography },
                { label: 'Stage', value: mo?.maturity || '—', badge: true },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{s.label}</p>
                  {s.badge
                    ? <div className="mt-1.5 flex justify-center"><Badge label={s.value} /></div>
                    : <p className="text-sm font-bold text-gray-800 mt-1">{s.value}</p>}
                </div>
              ))}
            </div>
            {mo?.key_trends?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Key Market Trends</p>
                <div className="flex flex-wrap gap-2">
                  {mo.key_trends.map((t, i) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ICP */}
          {result.ideal_customer_profile && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex gap-3">
              <Target size={18} className="text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1">Ideal Customer Profile</p>
                <p className="text-sm text-indigo-800">{result.ideal_customer_profile}</p>
              </div>
            </div>
          )}

          {/* Competitors */}
          <div className="bg-white rounded-2xl border p-6">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <Users size={16} className="text-violet-500" /> Top Competitors Worldwide
            </h3>
            <p className="text-xs text-gray-400 mb-4">Click a competitor to expand strengths & weaknesses</p>
            <div className="space-y-2">
              {(result.top_competitors || []).map((c, i) => (
                <CompetitorCard key={i} c={c} />
              ))}
            </div>
          </div>

          {/* Opportunities & Threats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Lightbulb size={16} className="text-amber-500" /> Opportunities
              </h3>
              <div className="space-y-3">
                {(result.opportunities || []).map((o, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <CheckCircle size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{o.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{o.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-red-500" /> Threats
              </h3>
              <div className="space-y-3">
                {(result.threats || []).map((t, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                    <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{t.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-2xl border p-6">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-indigo-500" /> Strategic Recommendations
            </h3>
            <div className="space-y-3">
              {(result.recommendations || []).map((r, i) => (
                <div key={i} className="flex gap-4 p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-800">{r.action}</p>
                      <Badge label={r.priority} />
                    </div>
                    <p className="text-xs text-gray-500">{r.rationale}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-gray-400 text-center pb-2">
            AI-generated analysis based on training data · Not real-time market data · Use as a starting point for research
          </p>
        </div>
      )}
    </div>
  );
};

export default MarketIntelligencePage;
