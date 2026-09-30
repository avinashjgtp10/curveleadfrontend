import { useEffect, useState } from "react";
import { featureAPI } from "../services/api";
import { formatDateTime } from "../utils/dateTime";
export default function BroadcastReports() {
  const [rows, setRows] = useState([]),
    [error, setError] = useState("");
  const load = () =>
    featureAPI
      .broadcasts()
      .then(({ data }) => setRows(data.broadcasts))
      .catch(() => setError("Could not load campaign reports."));
  useEffect(() => {
    load();
  }, []);
  return (
    <div className="bg-white border rounded-xl p-4 mt-4">
      <h2 className="font-semibold">Campaign delivery reports</h2>
      <button className="text-sm text-brand-600" onClick={load}>
        Refresh reports
      </button>
      {error && <p role="alert">{error}</p>}
      {rows.length ? (
        <div className="overflow-auto">
          <table className="text-sm w-full">
            <thead>
              <tr>
                {[
                  "Template",
                  "Sent",
                  "Delivered",
                  "Read",
                  "Replied",
                  "Failed",
                  "Created",
                ].map((x) => (
                  <th className="p-2 text-left" key={x}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  {[
                    r.template_name.replace(/_+/g, " "),
                    r.sent,
                    r.delivered,
                    r.read,
                    r.replied,
                    r.failed,
                    formatDateTime(r.created_at),
                  ].map((v, i) => (
                    <td className="p-2" key={i}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Send or schedule an approved template from filtered Leads to see
          delivery results here.
        </p>
      )}
    </div>
  );
}
