import { useState } from 'react';
import { Link } from 'react-router-dom';
import { whatsappAPI } from '../../services/api';
import { Card, DaysSelect, Empty, ErrorBox, Loading, Stat, fmtDateTime, useLoad } from './hubUi';

const ClickToWhatsAppTab = () => {
  const [days, setDays] = useState(30);
  const { data, error, loading } = useLoad(() => whatsappAPI.hubCtwa(days), [days]);
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox>{error}</ErrorBox>;
  const { summary } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-500">Leads who started a chat by clicking a Click-to-WhatsApp ad.</p>
        <DaysSelect value={days} onChange={setDays} />
      </div>

      {summary.unattributed > 0 && (
        <ErrorBox>
          {summary.unattributed} lead{summary.unattributed > 1 ? 's' : ''} came from an ad but couldn't be matched to a campaign.
          Connect your ad account in <Link to="/integrations" className="underline font-medium">Integrations</Link> so ads are matched automatically.
        </ErrorBox>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Stat label="CTWA leads" value={summary.total} />
        <Stat label="Today" value={summary.today} />
        <Stat label="Not attributed" value={summary.unattributed} tone={summary.unattributed ? 'text-amber-600' : 'text-gray-900'} />
      </div>

      <Card title="By campaign">
        {data.campaigns.length === 0 ? <Empty>No Click-to-WhatsApp leads in this period.</Empty> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500 border-b">
              <th className="py-2 pr-3">Campaign</th><th className="pr-3">Leads</th><th className="pr-3">Hot</th>
              <th className="pr-3">Won</th><th className="pr-3">Spend</th><th>Cost / lead</th>
            </tr></thead>
            <tbody>
              {data.campaigns.map((c, i) => (
                <tr key={c.campaign_id || i} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium text-gray-800">
                    {c.campaign_id ? <Link to={`/campaigns/${c.campaign_id}`} className="hover:underline">{c.campaign_name}</Link> : c.campaign_name}
                  </td>
                  <td className="pr-3">{c.leads}</td><td className="pr-3">{c.hot}</td><td className="pr-3">{c.won}</td>
                  <td className="pr-3">{c.spend ? `₹${Math.round(c.spend).toLocaleString('en-IN')}` : '—'}</td>
                  <td>{c.cost_per_lead ? `₹${c.cost_per_lead}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Latest leads">
        {data.recent.length === 0 ? <Empty>Nothing yet.</Empty> : data.recent.map(l => (
          <div key={l.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-0 text-sm">
            <div className="min-w-0">
              <Link to={`/leads/${l.id}`} className="font-medium text-gray-800 hover:underline">{l.name}</Link>
              <p className="text-xs text-gray-400 truncate">{l.campaign_name || 'No campaign'}{l.source_detail ? ` · ${l.source_detail}` : ''}</p>
            </div>
            <span className="text-xs text-gray-400 shrink-0">{fmtDateTime(l.created_at)}</span>
          </div>
        ))}
      </Card>
    </div>
  );
};

export default ClickToWhatsAppTab;
