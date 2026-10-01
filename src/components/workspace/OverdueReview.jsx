import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { followupAPI } from "../../services/api";
import { dateTimeInputToUTC, formatDateTime } from "../../utils/dateTime";
import { useConfirmDialog } from "../ui/ConfirmDialog";
const COLLAPSED_KEY = "curvelead.overdueReview.collapsed";
export default function OverdueReview({ onChanged }) {
  const [rows, setRows] = useState([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [dates, setDates] = useState({}),
    [total, setTotal] = useState(0),
    [collapsed, setCollapsed] = useState(() => {
      try {
        return localStorage.getItem(COLLAPSED_KEY) === "1";
      } catch {
        return false;
      }
    });
  const confirm = useConfirmDialog();
  async function load() {
    try {
      const { data } = await followupAPI.getAll({ status: "stale", limit: 10 });
      setRows(data.followups || []);
      setTotal(data.pagination?.total ?? (data.followups || []).length);
    } catch {
      setError("Could not load overdue reviews.");
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function act(row, action) {
    if (
      action === "lost" &&
      !(await confirm({
        title: `Mark ${row.lead_name} lost?`,
        confirmText: "Mark lost",
      }))
    )
      return;
    setBusy(true);
    setError("");
    try {
      if (action === "reschedule")
        await followupAPI.update(row.id, {
          next_followup_at: dateTimeInputToUTC(dates[row.id]),
        });
      else await followupAPI.review(row.id, { action });
      await load();
      onChanged?.();
    } catch (e) {
      setError(
        e.response?.data?.error || "Could not update follow-up. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  function toggle() {
    setCollapsed((prev) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, prev ? "0" : "1");
      } catch {
        /* not persisted */
      }
      return !prev;
    });
  }
  if (!rows.length && !error) return null;
  return (
    <section className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <h2 className="font-semibold">
          Review follow-ups over 7 days overdue{" "}
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-200 text-amber-900">
            {total}
          </span>
        </h2>
        <span className="flex items-center gap-1 text-xs font-medium text-amber-800 shrink-0">
          {collapsed ? "Show" : "Hide"}
          <ChevronDown
            size={14}
            className={`transition-transform ${collapsed ? "-rotate-90" : ""}`}
          />
        </span>
      </button>
      {!collapsed && (
        <>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}{" "}
              <button onClick={load} className="underline">
                Retry
              </button>
            </p>
          )}
          <div className="max-h-80 overflow-y-auto pr-1 space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center gap-2 border-t border-amber-200 pt-3 text-sm"
              >
                <div className="grow">
                  <strong>{row.lead_name}</strong>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(row.next_followup_at)}
                  </p>
                </div>
                <input
                  aria-label={`Reschedule ${row.lead_name}`}
                  type="datetime-local"
                  className="border rounded p-1 max-w-full"
                  value={dates[row.id] || ""}
                  onChange={(e) =>
                    setDates({ ...dates, [row.id]: e.target.value })
                  }
                />
                <button
                  disabled={busy || !dates[row.id]}
                  className="btn-primary disabled:opacity-50"
                  onClick={() => act(row, "reschedule")}
                >
                  Reschedule
                </button>
                <button
                  disabled={busy}
                  onClick={() => act(row, "lost")}
                  className="text-red-700 underline"
                >
                  Mark lost
                </button>
                <button
                  disabled={busy}
                  onClick={() => act(row, "dismiss")}
                  className="underline"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {total > rows.length &&
              `Showing the oldest ${rows.length} of ${total}; more appear as you clear these. `}
            Dismiss keeps the appointment in history and removes it from active
            reminders.
          </p>
        </>
      )}
    </section>
  );
}
