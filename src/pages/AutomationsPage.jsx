import { Link } from "react-router-dom";
import { useOverview } from "../components/workspace/Overview";
import PageLoader from "../components/ui/PageLoader";
import StatusBadge from "../components/ui/StatusBadge";
import { useAuth } from "../context/AuthContext";
// [id, title, where to configure, what it does]
export const AUTOMATIONS = [
  ["sources", "Lead sources", "/integrations", "New leads arrive automatically from Meta, Google Ads, your website or the API."],
  ["assignment", "Assignment rules", "/settings?tab=assignment", "New leads go to the right person by source, campaign or round-robin."],
  ["dedupe", "Dedupe", "/settings?tab=business", "Repeat enquiries from the same number join the existing lead."],
  ["responder", "Auto-responder", "/integrations", "A WhatsApp welcome message the moment a new lead arrives."],
  ["sequences", "Sequences", "/lead-automation", "Scripted WhatsApp and email follow-ups for matching leads."],
  ["inbound", "Inbound auto-reply", "/whatsapp?tab=ai", "Replies to customer messages: AI auto-reply or keyword rules."],
  ["bulk", "Bulk campaigns", "/whatsapp?tab=broadcasts", "Approved-template broadcasts to opted-in lists."],
  ["capi", "Conversions API", "/integrations", "Tells Meta which leads qualified or became customers, so ads find more like them."],
  ["webhooks", "Webhooks", "/settings?tab=developer", "Sends lead events to your other systems."],
  ["reviews", "GMB review request", "/gmb", "Asks won customers for a Google review on WhatsApp."],
];
export default function AutomationsPage() {
  const { data, isPending, isError, refetch } = useOverview();
  const { user } = useAuth();
  const admin = ["admin", "super_admin"].includes(user?.role);
  if (isPending) return <PageLoader />;
  if (isError)
    return (
      <button className="btn-primary" onClick={() => refetch()}>
        Retry loading automations
      </button>
    );
  return (
    <div className="space-y-5">
      <p className="text-gray-500">
        Manage your workspace automations in one place.
      </p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {AUTOMATIONS.map(([id, title, to, desc]) => (
          <section
            key={id}
            className="bg-white border rounded-xl p-5 space-y-4"
          >
            <div>
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-gray-500">{desc}</p>
            </div>
            {(() => {
              // true = working, false = off, a string = switched on but not working yet.
              const v = data.automations[id];
              return v === "not_set_up"
                ? <StatusBadge status="warning" label="On, but not set up" reason="Switched on, but required details are missing." />
                : v ? <StatusBadge status="working" label={id === "bulk" ? "Campaigns created" : "Working"} />
                : <StatusBadge status="not_set_up" />;
            })()}
            {admin || id === "sequences" ? (
              <Link className="inline-block btn-primary" to={to}>
                Configure <span className="sr-only">{title}</span>
              </Link>
            ) : (
              <p className="text-xs text-gray-500">
                Ask an administrator to configure.
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
