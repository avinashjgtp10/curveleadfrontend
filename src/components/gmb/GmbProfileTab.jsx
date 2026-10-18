import { useEffect, useState } from 'react';
import { CheckCircle, Circle, HelpCircle, ExternalLink } from 'lucide-react';
import { gmbAPI } from '../../services/api';
import { Card, Loading } from '../whatsapp/hubUi';
import { bandOf, checklist, googleProblem, addressText } from '../../utils/gmbProfile';

const ICON = { ok: <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />, todo: <Circle size={16} className="text-red-500 shrink-0 mt-0.5" />, unknown: <HelpCircle size={16} className="text-gray-400 shrink-0 mt-0.5" /> };

const GmbProfileTab = () => {
  const [state, setState] = useState({ loading: true, locations: null, problem: null });
  const load = () => {
    setState((s) => ({ ...s, loading: true }));
    gmbAPI.profiles()
      .then(({ data }) => setState({ loading: false, locations: data.ok === false ? null : data.locations, problem: googleProblem(data) }))
      .catch((e) => setState({ loading: false, locations: null, problem: googleProblem(null, e) }));
  };
  useEffect(load, []);

  if (state.loading && !state.locations) return <Loading />;
  if (state.problem) return <Card><p className="text-sm text-gray-700">{state.problem.message}</p><button onClick={load} className="mt-3 text-sm text-brand-700 font-semibold">Try again</button></Card>;
  if (!state.locations.length) return <Card><p className="text-sm text-gray-600">No business locations found for this Google account.</p></Card>;

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">Read-only. CurveLead never edits your Google listing. The score is a completeness checklist built from what Google documents for local results. It is not your ranking, and Google does not publish that.</p>
      {state.locations.map((l) => {
        const band = bandOf(l.health); const rows = checklist(l.health); const d = l.details || {};
        return (
          <Card key={l.id} title={l.name}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="text-xs text-gray-500">{addressText(d.address) || l.address || 'No address'}</p>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${band.tone}`}>{l.health.score == null ? band.label : `${l.health.score}/100 · ${band.label}`}</span>
            </div>
            <ul className="space-y-2">
              {rows.map((r) => (
                <li key={r.id} className="flex gap-2 text-sm">{ICON[r.status]}<div><span className="font-medium">{r.label}</span><p className="text-xs text-gray-500">{r.text}</p></div></li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-4 mt-3 text-xs">
              {d.maps_url && <a href={d.maps_url} target="_blank" rel="noreferrer" className="text-brand-700 inline-flex items-center gap-1">View on Google Maps <ExternalLink size={12} /></a>}
              {d.review_url && <a href={d.review_url} target="_blank" rel="noreferrer" className="text-brand-700 inline-flex items-center gap-1">Your review link <ExternalLink size={12} /></a>}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default GmbProfileTab;
