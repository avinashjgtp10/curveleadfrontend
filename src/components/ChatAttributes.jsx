import { useEffect, useState } from "react";
import { featureAPI } from "../services/api";
export default function ChatAttributes({ lead, onSave }) {
  const [rows, setRows] = useState([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setRows(Object.entries(lead.custom_fields || {}));
    setError("");
  }, [lead.lead_id]);
  return (
    <div className="my-4 space-y-2">
      <h3 className="text-sm font-semibold">Custom attributes</h3>
      {rows.map(([key, value], i) => (
        <div key={i} className="flex gap-1">
          <input
            aria-label="Attribute name"
            className="border rounded p-1 min-w-0 w-1/2 text-xs"
            value={key}
            onChange={(e) =>
              setRows((r) =>
                r.map((v, j) => (j === i ? [e.target.value, v[1]] : v)),
              )
            }
          />
          <input
            aria-label="Attribute value"
            className="border rounded p-1 min-w-0 w-1/2 text-xs"
            value={String(value)}
            onChange={(e) =>
              setRows((r) =>
                r.map((v, j) => (j === i ? [v[0], e.target.value] : v)),
              )
            }
          />
          <button
            aria-label="Remove attribute"
            onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </div>
      ))}
      <button
        className="text-xs text-brand-600"
        onClick={() => setRows((r) => [...r, ["", ""]])}
      >
        + Attribute
      </button>
      <button
        disabled={busy}
        className="text-xs ml-3"
        onClick={async () => {
          setBusy(true);
          try {
            const { data } = await featureAPI.attributes(lead.lead_id, {
              custom_fields: Object.fromEntries(rows.filter(([k]) => k.trim())),
            });
            onSave(data);
          } catch (e) {
            setError(e.response?.data?.error || "Save failed.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Save attributes
      </button>
      {error && (
        <p role="alert" className="text-red-600 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
