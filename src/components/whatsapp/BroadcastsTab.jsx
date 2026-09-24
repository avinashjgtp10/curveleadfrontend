import { useState } from 'react';
import { Link } from 'react-router-dom';
import { whatsappAPI } from '../../services/api';
import { Card, DaysSelect, Empty, ErrorBox, Loading, fmtDateTime, pct, useLoad } from './hubUi';

const BroadcastsTab = () => {
  const [days, setDays] = useState(90);
  const { data, error, loading } = useLoad(() => whatsappAPI.hubBroadcasts(days), [days]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox>{error}</ErrorBox>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-500">
          Every template broadcast sent from CurveLead. To send a new one, select leads in{' '}
          <Link to="/leads" className="text-brand-600 underline">Leads</Link> and choose WhatsApp Broadcast.
        </p>
        <DaysSelect value={days} onChange={setDays} />
      </div>
      <Card>
        {data.broadcasts.length === 0 ? <Empty>No broadcasts in this period.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-500 border-b">
                <th className="py-2 pr-3">Sent</th><th className="pr-3">Template</th><th className="pr-3">By</th>
                <th className="pr-3">Leads</th><th className="pr-3">Delivered</th><th className="pr-3">Read</th>
                <th className="pr-3">Failed</th><th>Replied</th>
              </tr></thead>
              <tbody>
                {data.broadcasts.map((b, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-3 whitespace-nowrap text-gray-500">{fmtDateTime(b.sent_at)}</td>
                    <td className="pr-3 font-medium text-gray-800">{b.template_name}</td>
                    <td className="pr-3 text-gray-500">{b.sent_by_name || '—'}</td>
                    <td className="pr-3">{b.total}</td>
                    <td className="pr-3">{b.delivered} <span className="text-xs text-gray-400">({pct(b.delivered, b.total)})</span></td>
                    <td className="pr-3">{b.read} <span className="text-xs text-gray-400">({pct(b.read, b.total)})</span></td>
                    <td className={`pr-3 ${b.failed ? 'text-red-500' : ''}`}>{b.failed}</td>
                    <td>{b.replied} <span className="text-xs text-gray-400">({pct(b.replied, b.total)})</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[11px] text-gray-400 mt-3">Sends of the same template by the same person within the same hour are shown as one broadcast.</p>
      </Card>
    </div>
  );
};

export default BroadcastsTab;
