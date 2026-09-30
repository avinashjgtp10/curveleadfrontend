export function metricLeadLink(metrics, extra = {}) {
  const p = new URLSearchParams({
    metric: "created",
    from: metrics?.from || "",
    to: metrics?.to || "",
    include_all_stages: "1",
    ...extra,
  });
  return "/leads?" + p;
}
export const activityLeadLink = (activity) =>
  "/leads?" + new URLSearchParams({ activity, include_all_stages: "1" });
