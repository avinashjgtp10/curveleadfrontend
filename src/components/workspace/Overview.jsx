import { QueryClient, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";
import { featureAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
export const ONBOARDING_STEPS = [
  ["meta", "Connect Meta", "/integrations"],
  ["whatsapp", "Connect WhatsApp", "/integrations"],
  ["assignment", "Set assignment rules", "/settings?tab=assignment"],
  ["import", "Import leads", "/leads"],
  ["sequence", "Create first sequence", "/lead-automation"],
  ["team", "Invite team", "/staff"],
];
const overviewClient = new QueryClient();
export function useOverview() {
  const { user, tenant } = useAuth();
  return useQuery(
    {
      queryKey: ["workspace-overview", tenant?.id, user?.id],
      queryFn: async () => (await featureAPI.overview()).data,
      staleTime: 60000,
      enabled: !!user,
    },
    overviewClient,
  );
}
export function WhatsAppStatus() {
  const { data, isPending, isError } = useOverview();
  const wa = data?.whatsapp;
  return (
    <div className="text-[11px] leading-4 text-gray-500 max-w-52" role="status">
      {isPending ? (
        "WhatsApp: checking…"
      ) : isError ? (
        <Link to="/integrations">WhatsApp status unavailable</Link>
      ) : (
        <>
          <span className="font-medium">WhatsApp: {wa?.status}</span>
          <br />
          {wa?.limit == null ? (
            <Link to="/settings?tab=messaging">
              Tier unavailable · Check setup
            </Link>
          ) : (
            <>
              Tier{" "}
              {wa.limit === Number.MAX_SAFE_INTEGER
                ? "Unlimited"
                : wa.limit.toLocaleString()}{" "}
              · {wa.remaining.toLocaleString()} remaining / 24h
            </>
          )}
        </>
      )}
    </div>
  );
}
export function OnboardingChecklist() {
  const { user } = useAuth();
  const { data, isError, refetch } = useOverview();
  const cache = overviewClient;
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!["admin", "super_admin"].includes(user?.role)) return null;
  if (isError)
    return (
      <button className="text-sm text-brand-600" onClick={() => refetch()}>
        Retry setup checklist
      </button>
    );
  if (!data || data.onboarding.dismissed) return null;
  const completed = data.onboarding.completed;
  async function save(body) {
    setBusy(true);
    setError("");
    try {
      await featureAPI.onboarding(body);
      await cache.invalidateQueries({ queryKey: ["workspace-overview"] });
    } catch {
      setError("Could not save progress. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="bg-white border rounded-2xl p-4"
      aria-label="Workspace setup"
    >
      <div className="flex justify-between gap-3">
        <h2 className="font-semibold">
          Get started · {completed.length}/6 complete
        </h2>
        {completed.length === 6 && (
          <button
            disabled={busy}
            onClick={() => save({ dismissed: true })}
            className="text-sm text-brand-600"
          >
            Dismiss checklist
          </button>
        )}
      </div>
      <progress
        aria-label="Setup progress"
        max="6"
        value={completed.length}
        className="w-full h-2 my-3 accent-green-600"
      />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {ONBOARDING_STEPS.map(([id, label, to]) => (
          <div key={id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              aria-label={`Mark ${label} complete`}
              checked={completed.includes(id)}
              disabled={busy || completed.includes(id)}
              onChange={() => save({ step: id })}
            />
            <Link
              to={to}
              className={
                completed.includes(id)
                  ? "text-gray-500"
                  : "text-brand-700 underline"
              }
            >
              {label}
            </Link>
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-red-600 text-sm mt-2">
          {error}
        </p>
      )}
    </section>
  );
}
