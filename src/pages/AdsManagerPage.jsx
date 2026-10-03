import { useSearchParams } from 'react-router-dom';
import { ClipboardList, Megaphone, TrendingUp } from 'lucide-react';
import CampaignsPage from './CampaignsPage';
import AdsPage from './AdsPage';
import LeadFormsTab from './LeadFormsTab';

// Ads Manager: the CRM's campaigns (every lead source), the Meta ad drill-down and the
// Facebook lead forms in one place.
const TABS = [
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone, Component: CampaignsPage },
  { id: 'meta', label: 'Meta Ads', icon: TrendingUp, Component: AdsPage },
  { id: 'forms', label: 'Lead Forms', icon: ClipboardList, Component: LeadFormsTab },
];

const AdsManagerPage = () => {
  const [params, setParams] = useSearchParams();
  const tab = TABS.find(t => t.id === params.get('tab')) || TABS[0];
  const Active = tab.Component;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="inline-flex max-w-full overflow-x-auto bg-white rounded-xl border border-gray-200 p-1 gap-1 shadow-sm">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setParams(t.id === TABS[0].id ? {} : { tab: t.id })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab.id === t.id ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>
      <Active key={tab.id} />
    </div>
  );
};

export default AdsManagerPage;
