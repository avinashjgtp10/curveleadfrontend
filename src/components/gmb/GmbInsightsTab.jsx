import { useEffect, useState } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { gmbAPI } from '../../services/api';
import { Card, Loading } from '../whatsapp/hubUi';
import { googleProblem, DAY_OPTIONS, pctText, numberText } from '../../utils/gmbProfile';

const Stat = ({ label, value, sub }) => (
  <div className="bg-white border rounded-2xl p-4"><p className="text-xs text-gray-500">{label}</p><p className="text-xl font-bold mt-0.5">{value}</p>{sub && <p className="text-[11px] text-gray-400">{sub}</p>}</div>
);

const GmbInsightsTab = () => {
  const [locations, setLocations] = useState(null);
  const [location, setLocation] = useState('');
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gmbAPI.profiles()
      .then(({ data: r }) => { if (r.ok === false) { setProblem(googleProblem(r)); setLoading(false); } else { setLocations(r.locations); setLocation((r.locations[0] || {}).id || ''); if (!r.locations.length) setLoading(false); } })
      .catch((e) => { setProblem(googleProblem(null, e)); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!location) return;
    setLoading(true); setProblem(null);
    gmbAPI.insights({ location, days })
      .then(({ data: r }) => { if (r.ok === false) { setData(null); setProblem(googleProblem(r)); } else setData(r); })
      .catch((e) => { setData(null); setProblem(googleProblem(null, e)); })
      .finally(() => setLoading(false));
  }, [location, days]);

  if (loading && !data && !problem) return <Loading />;
  if (locations && !locations.length) return <Card><p className="text-sm text-gray-600">No business locations found for this Google account.</p></Card>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <p className="text-xs text-gray-500 max-w-xl">{data ? data.note : 'How people find and use your Google listing.'}</p>
        <div className="flex gap-2">
          {locations && locations.length > 1 && (
            <select aria-label="Location" value={location} onChange={(e) => setLocation(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm bg-white">
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          )}
          <select aria-label="Period" value={days} onChange={(e) => setDays(Number(e.target.value))} className="px-3 py-1.5 border rounded-lg text-sm bg-white">
            {DAY_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      {problem && <Card><p className="text-sm text-gray-700">{problem.message}</p></Card>}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Times your listing was shown" value={numberText(data.views.total)} sub={`${numberText(data.views.maps)} on Maps · ${numberText(data.views.search)} in Search`} />
            <Stat label="Calls" value={numberText(data.actions.calls)} />
            <Stat label="Website clicks" value={numberText(data.actions.website_clicks)} />
            <Stat label="Direction requests" value={numberText(data.actions.directions)} sub={`${pctText(data.action_rate_pct)} of views led to an action`} />
          </div>
          <Card title="Views and actions per day">
            {data.series.length === 0 ? <p className="text-sm text-gray-500 py-6 text-center">Google has no data for this period yet.</p> : (
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <ComposedChart data={data.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} width={40} />
                    <Tooltip /><Legend />
                    <Bar dataKey="views" name="Views" fill="#93c5fd" radius={[3, 3, 0, 0]} />
                    <Line dataKey="actions" name="Actions" stroke="#7c3aed" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="text-[11px] text-gray-400 mt-2">{data.from} to {data.to}. The most recent two days are left out because Google is still counting them.</p>
          </Card>
        </>
      )}
    </div>
  );
};

export default GmbInsightsTab;
