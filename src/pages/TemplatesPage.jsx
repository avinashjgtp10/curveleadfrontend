import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { whatsappAPI } from '../services/api';
import TemplateCreateForm from '../components/whatsapp/TemplateCreateForm';
import {
  AlertCircle, ArrowLeft, FileText, Film, Image as ImageIcon, Megaphone, Plus, RotateCcw,
  Search, ShieldCheck, Sparkles, Wrench,
} from 'lucide-react';

const STATUS_TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'REJECTED', label: 'Rejected' },
];

const STATUS_STYLE = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  REJECTED: 'bg-red-100 text-red-700',
  PAUSED: 'bg-gray-100 text-gray-600',
  DISABLED: 'bg-gray-100 text-gray-600',
};
const STATUS_DOT = {
  APPROVED: 'bg-green-500',
  PENDING: 'bg-amber-500',
  REJECTED: 'bg-red-500',
};

const CATEGORY_STYLE = {
  MARKETING: { icon: Megaphone, iconWrap: 'bg-purple-50 text-purple-600', tag: 'text-purple-500' },
  UTILITY: { icon: Wrench, iconWrap: 'bg-blue-50 text-blue-600', tag: 'text-blue-500' },
  AUTHENTICATION: { icon: ShieldCheck, iconWrap: 'bg-amber-50 text-amber-600', tag: 'text-amber-500' },
};

const MEDIA_ICON = { IMAGE: ImageIcon, VIDEO: Film, DOCUMENT: FileText };

const getComponent = (tmpl, type) => tmpl.components?.find(c => c.type === type);

const TemplateCard = ({ t }) => {
  const cat = CATEGORY_STYLE[t.category] || CATEGORY_STYLE.UTILITY;
  const CatIcon = cat.icon;
  const MediaIcon = t.media_type && MEDIA_ICON[t.media_type];
  const body = getComponent(t, 'BODY')?.text;
  const headerText = getComponent(t, 'HEADER')?.format === 'TEXT' ? getComponent(t, 'HEADER')?.text : null;
  const footer = getComponent(t, 'FOOTER')?.text;
  const buttons = getComponent(t, 'BUTTONS')?.buttons || [];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cat.iconWrap}`}>
          <CatIcon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-gray-900 truncate" title={t.name}>{t.name}</p>
          <div className="flex items-center flex-wrap gap-2 mt-1">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_STYLE[t.status] || 'bg-gray-100 text-gray-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[t.status] || 'bg-gray-400'}`} />
              {t.status}
            </span>
            <span className={`text-[10px] font-semibold uppercase tracking-wide ${cat.tag}`}>{t.category}</span>
            <span className="text-[10px] text-gray-400 uppercase">{t.language}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-3 text-xs text-gray-700 space-y-1.5">
        {MediaIcon && (
          <p className="flex items-center gap-1 text-gray-500"><MediaIcon size={12} /> {t.media_type.toLowerCase()} header</p>
        )}
        {headerText && <p className="font-semibold">{headerText}</p>}
        <p className="whitespace-pre-wrap">{body}</p>
        {footer && <p className="text-[11px] text-gray-400">{footer}</p>}
      </div>

      {buttons.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {buttons.map((b, i) => (
            <span key={i} className="text-[11px] px-2 py-1 rounded-lg border border-brand-200 text-brand-700 bg-brand-50">
              {b.text}{b.type === 'URL' ? ' ↗' : ''}
            </span>
          ))}
        </div>
      )}

      {t.status === 'PENDING' && <p className="text-[11px] text-amber-600">Awaiting Meta's review, usually a few hours.</p>}
      {t.status === 'REJECTED' && (
        <p className="text-[11px] text-red-600">
          Rejected by Meta{t.rejected_reason && t.rejected_reason !== 'NONE' ? ` (${t.rejected_reason.replace(/_/g, ' ').toLowerCase()})` : ''}.
          Edit and resubmit under a new name.
        </p>
      )}
    </div>
  );
};

const TemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await whatsappAPI.getBroadcastTemplates();
      setTemplates(data.templates || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load templates.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c = { ALL: templates.length, APPROVED: 0, PENDING: 0, REJECTED: 0 };
    templates.forEach(t => { if (c[t.status] !== undefined) c[t.status]++; });
    return c;
  }, [templates]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter(t =>
      (status === 'ALL' || t.status === status) &&
      (!q || t.name.toLowerCase().includes(q) || (getComponent(t, 'BODY')?.text || '').toLowerCase().includes(q))
    );
  }, [templates, status, search]);

  if (creating) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <button onClick={() => setCreating(false)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={14} /> Back to templates
        </button>
        <div className="bg-white rounded-2xl border p-5">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-violet-600" /> Create template
          </h2>
          <TemplateCreateForm
            onCancel={() => setCreating(false)}
            onCreated={() => { setCreating(false); load(); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-500">
          WhatsApp message templates, their Meta approval status, and AI-assisted creation.
        </p>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="px-3 py-2 border rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50">
            <RotateCcw size={14} className={loading ? 'animate-spin' : ''} /> Refresh status
          </button>
          <button onClick={() => setCreating(true)}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 flex items-center gap-2">
            <Plus size={16} /> Create template
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center bg-white rounded-xl border border-gray-200 divide-x divide-gray-200 overflow-hidden">
          {STATUS_TABS.map(tab => (
            <button key={tab.id} onClick={() => setStatus(tab.id)}
              className={`px-3.5 py-2 text-sm font-medium ${status === tab.id ? 'text-gray-900 font-semibold bg-gray-50' : 'text-gray-500 hover:bg-gray-50'}`}>
              {tab.label} <span className="text-xs text-gray-400">{counts[tab.id]}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
            className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
        </div>
      </div>

      {loading && templates.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Loading templates...</div>
      ) : error ? (
        <div className="text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>
            {error}{' '}
            <Link to="/integrations" className="underline font-medium">Go to Integrations</Link>
          </span>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border">
          <FileText size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500 mb-3">No templates yet. Describe what you need and let AI draft it.</p>
          <button onClick={() => setCreating(true)}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 inline-flex items-center gap-2">
            <Sparkles size={14} /> Create with AI
          </button>
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">No templates match this filter.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map(t => <TemplateCard key={`${t.name}-${t.language}`} t={t} />)}
        </div>
      )}
    </div>
  );
};

export default TemplatesPage;
