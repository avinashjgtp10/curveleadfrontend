import { useState } from 'react';
import { X, CheckCircle2, Circle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { MOCK_LEAD_DETAIL_EXTRA } from '../mockData';

const TABS = ['Overview', 'Messages', 'History', 'Bookings'];

const LeadDetailPanel = ({ lead, onClose }) => {
  const [tab, setTab] = useState('Overview');
  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md h-full bg-white shadow-xl overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Lead Details</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        <div className="px-5 py-4 flex items-center gap-3 border-b">
          <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
            {lead.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{lead.name}</p>
            <p className="text-xs text-gray-500">{lead.phone}</p>
          </div>
          <StatusBadge status={lead.status} />
        </div>

        <div className="flex px-5 border-b gap-5 text-sm font-medium">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-3 border-b-2 -mb-px ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'Overview' ? (
          <div className="p-5 space-y-5">
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Lead Information</h4>
              <dl className="space-y-2 text-sm">
                {[
                  ['Name', lead.name],
                  ['Phone', lead.phone],
                  ['Email', lead.email || '—'],
                  ['Service Interested', lead.service],
                  ['Status', lead.status],
                  ['Source', MOCK_LEAD_DETAIL_EXTRA.source],
                  ['Automation', MOCK_LEAD_DETAIL_EXTRA.automation],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <dt className="text-gray-500">{k}</dt>
                    <dd className="font-medium text-gray-800">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Automation Progress</h4>
              <div className="space-y-3">
                {MOCK_LEAD_DETAIL_EXTRA.progress.map(step => (
                  <div key={step.label} className="flex items-start gap-2.5">
                    {step.done
                      ? <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      : <Circle size={16} className="text-gray-300 mt-0.5 shrink-0" />}
                    <div>
                      <p className={`text-sm font-medium ${step.done ? 'text-gray-800' : 'text-gray-400'}`}>{step.label}</p>
                      <p className="text-xs text-gray-400">{step.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
                Send Message
              </button>
              <button className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50">
                View Conversation
              </button>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-gray-400">No {tab.toLowerCase()} yet.</div>
        )}
      </div>
    </div>
  );
};

export default LeadDetailPanel;
