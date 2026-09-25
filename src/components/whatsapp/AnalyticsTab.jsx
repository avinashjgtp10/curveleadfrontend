import { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { whatsappAPI } from '../../services/api';
import { Card, DaysSelect, Empty, ErrorBox, Loading, Stat, fmtDuration, useLoad } from './hubUi';

const AnalyticsTab = () => {
  const [days, setDays] = useState(30);
  const { data, error, loading } = useLoad(() => whatsappAPI.hubAnalytics(days), [days]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox>{error}</ErrorBox>;
  const t = data.totals;

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><DaysSelect value={days} onChange={setDays} /></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Messages sent" value={t.sent} sub={`${t.automated} automated · ${t.ai_replies} by AI`} />
        <Stat label="Delivered" value={`${t.delivery_rate}%`} sub={`${t.delivered} of ${t.sent}`} tone="text-emerald-600" />
        <Stat label="Read" value={`${t.read_rate}%`} sub={`${t.read} read`} tone="text-blue-600" />
        <Stat label="Failed" value={t.failed} tone={t.failed ? 'text-red-500' : 'text-gray-900'} />
        <Stat label="Messages received" value={t.received} />
        <Stat label="Leads who replied" value={t.leads_replied} />
        <Stat label="Median reply time" value={fmtDuration(data.median_response_seconds)} sub="to an inbound message" />
      </div>

      <Card title="Messages per day">
        {data.daily.length === 0 ? <Empty>No messages in this period.</Empty> : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.daily.map(d => ({ ...d, day: String(d.day).slice(5, 10) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sent" name="Sent" stroke="#16a34a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="received" name="Received" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card title="Template performance">
        {data.templates.length === 0 ? <Empty>No template messages sent in this period.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-500 border-b">
                <th className="py-2 pr-3">Template</th><th className="pr-3">Sent</th><th className="pr-3">Delivered</th>
                <th className="pr-3">Read</th><th className="pr-3">Failed</th><th>Replied (3 days)</th>
              </tr></thead>
              <tbody>
                {data.templates.map(r => (
                  <tr key={r.template_name} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium text-gray-800">{r.template_name}</td>
                    <td className="pr-3">{r.sent}</td><td className="pr-3">{r.delivered}</td>
                    <td className="pr-3">{r.read}</td>
                    <td className={`pr-3 ${r.failed ? 'text-red-500' : ''}`}>{r.failed}</td>
                    <td>{r.replied} <span className="text-xs text-gray-400">({r.reply_rate}%)</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AnalyticsTab;
