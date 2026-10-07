import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { featureAPI } from "../services/api";
export default function IntegrationHealthBanner() {
  const [items, setItems] = useState([]);
  const [dismissed, setDismissed] = useState(null);
  useEffect(() => {
    let active = true;
    const load = () =>
      featureAPI
        .health()
        .then(({ data }) => {
          if (active) setItems(data.integrations || []);
        })
        .catch(() => {});
    load();
    const timer = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  const issues = items.filter((i) => ["disconnected", "stale"].includes(i.state));
  // A changed provider/state resurfaces the banner so a new problem stays visible.
  const signature = issues.map(i => `${i.provider}:${i.state}`).sort().join('|');
  if (!issues.length || dismissed === signature) return null;
  const providers = { facebook: "Facebook", google_ads: "Google Ads", whatsapp: "WhatsApp" };
  return (
    <div role="alert" className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-sm">
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{issues.length} integration{issues.length === 1 ? '' : 's'} need{issues.length === 1 ? 's' : ''} attention</p>
        <details className="mt-1">
          <summary className="cursor-pointer">View details</summary>
          <ul className="mt-2 space-y-1">
            {issues.map(i => <li key={i.provider}>{providers[i.provider] || i.provider}: {i.state === 'disconnected' ? 'disconnected — leads are not syncing.' : 'has not received leads within your alert threshold.'}</li>)}
          </ul>
        </details>
        <Link className="inline-block mt-1 underline font-semibold" to="/integrations">Check integrations</Link>
      </div>
      <button type="button" aria-label="Dismiss integration alerts" onClick={() => setDismissed(signature)} className="px-2 py-1 rounded hover:bg-amber-100">×</button>
    </div>
  );
}
