import { Link } from "react-router-dom";
import { useOverview } from "../components/workspace/Overview";
import PageLoader from "../components/ui/PageLoader";
import { useAuth } from "../context/AuthContext";
export const AUTOMATIONS = [
  ["sources", "Lead sources", "/integrations"],
  ["assignment", "Assignment rules", "/settings?tab=assignment"],
  ["dedupe", "Dedupe", "/settings?tab=business"],
  ["responder", "Auto-responder", "/integrations"],
  ["sequences", "Sequences", "/lead-automation"],
  ["inbound", "Inbound auto-reply", "/settings?tab=messaging"],
  ["bulk", "Bulk campaigns", "/whatsapp?tab=broadcasts"],
  ["capi", "Conversions API", "/settings?tab=developer"],
  ["webhooks", "Webhooks", "/settings?tab=developer"],
  ["reviews", "GMB review request", "/gmb"],
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
        {AUTOMATIONS.map(([id, title, to]) => (
          <section
            key={id}
            className="bg-white border rounded-xl p-5 space-y-4"
          >
            <h2 className="font-semibold">{title}</h2>
            <p
              className={`text-sm ${data.automations[id] ? "text-green-700" : "text-gray-500"}`}
            >
              {data.automations[id]
                ? id === "bulk"
                  ? "Campaigns created"
                  : "Enabled"
                : "Not configured"}
            </p>
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
