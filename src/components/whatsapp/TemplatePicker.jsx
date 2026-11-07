import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, AlertTriangle } from 'lucide-react';
import { normalizeTemplate, isSystemTemplate, groupTemplates, searchTemplates, fillSamples, marketingWarning, CATEGORY_LABEL } from '../../utils/templatePicker';

const BADGE = { MARKETING: 'bg-purple-100 text-purple-700', UTILITY: 'bg-sky-100 text-sky-700', AUTHENTICATION: 'bg-gray-100 text-gray-600' };
export const CategoryBadge = ({ category }) => (
  <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold ${BADGE[category] || BADGE.MARKETING}`}>{CATEGORY_LABEL[category] || 'Marketing'}</span>
);

// Shared WhatsApp template picker: grouped by purpose, search, Marketing/Utility badges, test and system templates hidden by default,
// a live preview with sample values, and a warning when a Marketing template is used for something every lead should get.
//   identity 'name' -> value/onChange use the template name; 'name_language' -> "name::language" (sequences keep the language)
//   purpose  'welcome' | 'confirmation' | 'reminder' | 'followup' | 'broadcast' | 'any'
//   optIn    { opted_in, total } to show how many leads can receive a Marketing template
export default function TemplatePicker({
  id, label, templates, value, onChange, identity = 'name', purpose = 'any', samples = ['Priya', 'Your business', 'Fri 3 Oct, 11:00 AM', 'https://example.com'],
  optIn, filter, emptyLabel = 'No template', includeUnapproved = false, disabled = false, helper, loading = false,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const root = useRef(null);
  const uid = id || `tpl-${label?.replace(/\W+/g, '-').toLowerCase()}`;

  const all = useMemo(() => (templates || []).map(normalizeTemplate).filter((t) => (includeUnapproved || t.status === 'APPROVED') && (!filter || filter(t))), [templates, includeUnapproved, filter]);
  const idOf = (t) => (identity === 'name' ? t.name : t.key);
  const selected = all.find((t) => idOf(t) === value) || (identity === 'name' ? all.find((t) => t.name.toLowerCase() === String(value || '').trim().toLowerCase()) : null);
  const approved = all.filter((t) => t.status === 'APPROVED');
  const notApproved = all.filter((t) => t.status !== 'APPROVED');
  const hidden = approved.filter((t) => isSystemTemplate(t.name) && t !== selected);
  const visible = searchTemplates(showHidden || q ? approved : approved.filter((t) => !isSystemTemplate(t.name) || t === selected), q);
  const groups = groupTemplates(visible, purpose);
  const warning = marketingWarning({ template: selected, purpose, optIn });

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (root.current && !root.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const choose = (t) => { onChange(t ? idOf(t) : '', t ? t.raw : null); setOpen(false); setQ(''); };

  return (
    <div ref={root} className="relative">
      {label && <label htmlFor={uid} className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}
      <button id={uid} type="button" disabled={disabled} onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}
        className="w-full px-3 py-2 border rounded-lg text-sm bg-white flex items-center justify-between gap-2 text-left disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
        <span className="flex items-center gap-2 min-w-0">
          {loading && !selected ? <span className="text-gray-400">Loading templates…</span> : selected ? (
            <><CategoryBadge category={selected.category} /><span className="truncate font-medium">{selected.name}</span><span className="text-xs text-gray-400 shrink-0">{selected.language}</span></>
          ) : value ? <span className="truncate">{value}</span> : <span className="text-gray-500">{emptyLabel}</span>}
        </span>
        <ChevronDown size={14} className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border rounded-lg shadow-lg">
          <div className="p-2 border-b relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates…" aria-label="Search templates"
              className="w-full pl-8 pr-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          <div role="listbox" aria-label="Templates" className="max-h-64 overflow-y-auto py-1">
            <button type="button" role="option" aria-selected={!value} onClick={() => choose(null)} className="w-full text-left px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">{emptyLabel}</button>
            {groups.map((g) => (
              <div key={g.id}>
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{g.label}</p>
                {g.items.map((t) => (
                  <button key={t.key} type="button" role="option" aria-selected={t === selected} onClick={() => choose(t)}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-brand-50 flex items-center gap-2 ${t === selected ? 'bg-brand-50' : ''}`}>
                    <CategoryBadge category={t.category} /><span className="truncate">{t.name}</span><span className="ml-auto text-[11px] text-gray-400 shrink-0">{t.language}</span>
                  </button>
                ))}
              </div>
            ))}
            {groups.length === 0 && <p className="px-3 py-4 text-sm text-gray-500 text-center">{q ? 'No templates match your search.' : 'No approved templates yet.'}</p>}
            {notApproved.length > 0 && !q && (
              <div>
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Not approved yet (can’t be used)</p>
                {notApproved.map((t) => (
                  <p key={t.key} className="px-3 py-1 text-sm text-gray-400 flex items-center gap-2"><span className="truncate">{t.name}</span><span className="ml-auto text-[11px] shrink-0">{String(t.status).toLowerCase().replace(/_/g, ' ')}</span></p>
                ))}
              </div>
            )}
          </div>
          {hidden.length > 0 && !q && (
            <button type="button" onClick={() => setShowHidden((v) => !v)} className="w-full text-left px-3 py-2 text-xs text-brand-700 border-t hover:bg-gray-50">
              {showHidden ? 'Hide' : 'Show'} {hidden.length} test or system template{hidden.length === 1 ? '' : 's'}
            </button>
          )}
        </div>
      )}

      {helper && <p className="text-[11px] text-gray-500 mt-1">{helper}</p>}
      {selected?.unsupported && <p className="text-[11px] text-amber-700 mt-1">{selected.unsupported}</p>}
      {warning && (
        <p role="alert" className="mt-2 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex gap-2">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" /><span>{warning.text}</span>
        </p>
      )}
      {selected?.body && (
        <div className="mt-2" aria-label="Message preview">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Preview</p>
          <p className="text-xs text-gray-700 whitespace-pre-wrap bg-[#e7fbe0] border border-green-100 rounded-lg px-3 py-2">{fillSamples(selected.body, samples)}</p>
        </div>
      )}
    </div>
  );
}
