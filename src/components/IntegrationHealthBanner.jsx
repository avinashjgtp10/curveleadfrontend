import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { featureAPI } from "../services/api";
export default function IntegrationHealthBanner() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let active = true;
    const load = () =>
      featureAPI
        .health()
        .then(({ data }) => {
          if (active) setItems(data.integrations);
        })
        .catch(() => {});
    load();
    const timer = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  return items
    .filter((i) => ["disconnected", "stale"].includes(i.state))
    .map((i) => (
      <div
        role="alert"
        key={i.provider}
        className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl mb-3 text-sm"
      >
        {
          {
            facebook: "Facebook",
            google_ads: "Google Ads",
            whatsapp: "WhatsApp",
          }[i.provider]
        }{" "}
        {i.state === "disconnected"
          ? "disconnected — leads are not syncing."
          : "has not received leads within your alert threshold."}{" "}
        <Link className="underline font-semibold" to="/integrations">
          Reconnect / check integration
        </Link>
      </div>
    ));
}
