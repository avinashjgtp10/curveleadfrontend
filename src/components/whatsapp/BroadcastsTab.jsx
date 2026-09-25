import { useState } from 'react';
import { Link } from 'react-router-dom';
import { whatsappAPI } from '../../services/api';
import { useToast } from '../ui/Toast';
import { Card, DaysSelect, Empty, ErrorBox, Loading, fmtDateTime, pct, useLoad } from './hubUi';

const STATUS_STYLE = {
  pending: 'bg-blue-100 text-blue-700', sending: 'bg-amber-100 text-amber-700', sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-500',
};

const BroadcastsTab = () => {
  const toast = useToast();
  const scheduled = useLoad(() => whatsappAPI.hubScheduled());
  const cancel = async (id) => {
    try { await whatsappAPI.hubCancelScheduled(id); toast.success('Broadcast cancelled.'); scheduled.reload(); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed to cancel'); }
  };
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
      {scheduled.data?.needs_migration && (
        <ErrorBox>
          Scheduling isn't set up in the database yet. Run <code className="bg-amber-100 px-1 rounded">backend/models/migration_scheduled_broadcasts.sql</code>, then refresh.
        </ErrorBox>
      )}
      {scheduled.data?.scheduled?.length > 0 && (
        <Card title="Scheduled">
          <div className="space-y-2">
            {scheduled.data.scheduled.map(b => (
              <div key={b.id} className="flex items-center justify-between gap-3 text-sm border-b last:border-0 pb-2 last:pb-0">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{b.template_name} <span className="text-gray-400 font-normal">· {b.lead_count} lead{b.lead_count === 1 ? '' : 's'}</span></p>
                  <p className="text-xs text-gray-400">
                    {fmtDateTime(b.scheduled_at)}{b.created_by_name ? ` · ${b.created_by_name}` : ''}
                    {b.status === 'sent' ? ` · ${b.sent_count} sent, ${b.failed_count} failed` : ''}
                    {b.status === 'failed' && b.error ? ` · ${b.error}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${STATUS_STYLE[b.status] || ''}`}>{b.status}</span>
                  {b.status === 'pending' && <button onClick={() => cancel(b.id)} className="text-xs text-red-500 hover:underline">Cancel</button>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card title="Sent">
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
