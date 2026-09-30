import { useEffect, useState } from "react";
import { featureAPI, staffAPI, integrationsAPI } from "../services/api";
import { formatDateTime } from "../utils/dateTime";
const input = "border rounded-lg px-3 py-2 w-full text-sm";
export default function FeatureSettings({
  developer = false,
  assignment = false,
}) {
  const [config, setConfig] = useState(null),
    [staff, setStaff] = useState([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const [logs, setLogs] = useState([]),
    [hooks, setHooks] = useState([]),
    [url, setUrl] = useState(""),
    [secret, setSecret] = useState(""),
    [key, setKey] = useState("");
  const load = async () => {
    try {
      const { data } = await featureAPI.config();
      setConfig(data.config);
      if (assignment) setStaff((await staffAPI.getAll()).data.staff || []);
      if (developer) {
        setHooks((await featureAPI.webhooks()).data.webhooks);
        setLogs((await featureAPI.deliveries()).data.deliveries);
      } else setLogs((await featureAPI.capiEvents()).data.events);
    } catch (e) {
      setError(e.response?.data?.error || "Unable to load settings.");
    }
  };
  useEffect(() => {
    load();
  }, [developer, assignment]);
  const change = (k, v) => setConfig((c) => ({ ...c, [k]: v }));
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await featureAPI.saveConfig(config);
      setNotice("Saved");
    } catch (e) {
      setError(e.response?.data?.error || "Save failed.");
    } finally {
      setBusy(false);
    }
  };
  if (!config)
    return (
      <div>
        {error || "Loading settings…"}
        {error && <button onClick={load}>Retry</button>}
      </div>
    );
  const list = (key, fields, empty) => (
    <div className="space-y-2">
      {(config[key] || []).map((r, i) => (
        <div key={i} className="border rounded-xl p-3 space-y-2">
          {fields.map(([field, label, options]) => (
            <label className="block text-xs" key={field}>
              {label}
              {options ? (
                <select
                  className={input}
                  value={r[field] || ""}
                  onChange={(e) =>
                    change(
                      key,
                      config[key].map((v, j) =>
                        j === i ? { ...v, [field]: e.target.value } : v,
                      ),
                    )
                  }
                >
                  {options.map((x) => (
                    <option key={x} value={x}>
                      {x.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={input}
                  value={r[field] || ""}
                  onChange={(e) =>
                    change(
                      key,
                      config[key].map((v, j) =>
                        j === i ? { ...v, [field]: e.target.value } : v,
                      ),
                    )
                  }
                />
              )}
            </label>
          ))}
          <button
            className="text-red-600 text-sm"
            onClick={() =>
              change(
                key,
                config[key].filter((_, j) => j !== i),
              )
            }
          >
            Remove
          </button>
        </div>
      ))}
      <button
        className="text-brand-600 text-sm"
        onClick={() => change(key, [...(config[key] || []), empty])}
      >
        + Add {key === "canned_replies" ? "reply" : "rule"}
      </button>
    </div>
  );
  return (
    <div className="space-y-5">
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {assignment ? (
        <label className="block">
          Fallback assignee
          <select
            className={input}
            value={config.assignment_fallback_id || ""}
            onChange={(e) =>
              change("assignment_fallback_id", e.target.value || null)
            }
          >
            <option value="">Leave unassigned</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      ) : developer ? (
        <>
          <h2 className="font-bold text-lg">Developer</h2>
          <p className="text-sm">
            API keys and webhook secrets appear once. Save them securely before
            leaving this tab.
          </p>
          <button
            disabled={busy}
            className={input}
            onClick={async () => {
              setBusy(true);
              try {
                const { data } = await integrationsAPI.generateApiKey();
                setKey(data.api_key);
              } catch {
                setError("Could not generate key.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Generate / regenerate API key
          </button>
          {key && <code className="block break-all select-all">{key}</code>}
          <h3 className="font-semibold">Outgoing webhooks</h3>
          <p className="text-sm">
            Sends lead.created, lead.stage_changed and lead.won. Verify
            X-CurveLead-Signature with HMAC-SHA256 over timestamp + “.” + the
            raw body. Deduplicate using the delivery ID.
          </p>
          <input
            aria-label="Webhook URL"
            className={input}
            placeholder="https://example.com/webhook"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const { data } = await featureAPI.createWebhook({
                  url,
                  events: ["lead.created", "lead.stage_changed", "lead.won"],
                });
                setSecret(data.webhook.secret);
                setUrl("");
                await load();
              } catch (e) {
                setError(e.response?.data?.error || "Failed to add webhook.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Add webhook
          </button>
          {secret && (
            <code className="block break-all select-all">
              Signing secret: {secret}
            </code>
          )}
          {hooks.map((h) => (
            <div key={h.id} className="border p-3 rounded-lg break-all">
              {h.url} · {h.active ? "Active" : "Disabled"}
              {h.active && (
                <button
                  className="ml-3 text-red-600"
                  onClick={async () => {
                    try {
                      await featureAPI.disableWebhook(h.id);
                      await load();
                    } catch {
                      setError("Disable failed.");
                    }
                  }}
                >
                  Disable
                </button>
              )}
            </div>
          ))}
        </>
      ) : (
        <>
          <h2 className="font-bold text-lg">Messaging & integrations</h2>
          <label className="block text-sm">
            Alert after hours without leads
            <input
              className={input}
              type="number"
              min="1"
              max="720"
              value={config.integration_alert_hours}
              onChange={(e) =>
                change("integration_alert_hours", Number(e.target.value))
              }
            />
          </label>
          <label className="block text-sm">
            Verified WhatsApp messaging limit (unique recipients / 24 hours)
            <input
              className={input}
              type="number"
              min="1"
              value={config.whatsapp_messaging_limit || ""}
              onChange={(e) =>
                change("whatsapp_messaging_limit", Number(e.target.value))
              }
            />
          </label>
          <p className="text-xs text-gray-500">
            Use the limit shown in WhatsApp Manager. Broadcasts remain blocked
            until this is set; Meta may impose additional limits.
          </p>
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={config.meta_capi_enabled}
              onChange={(e) => change("meta_capi_enabled", e.target.checked)}
            />
            Send qualified / won conversions to Meta
          </label>
          {["meta_qualified_event", "meta_won_event"].map((k) => (
            <label className="block text-sm" key={k}>
              {k === "meta_won_event" ? "Won event" : "Qualified event"}
              <input
                className={input}
                value={config[k]}
                onChange={(e) => change(k, e.target.value)}
              />
            </label>
          ))}
          <p className="text-xs">
            Configure dataset and access token in Integrations. Custom pipeline
            mappings remain available under Pipeline.
          </p>
          <h3 className="font-semibold">
            Inbound replies — first matching rule wins
          </h3>
          <p className="text-xs">
            Text replies require an open 24-hour session. Templates must be
            approved, body-only templates without variables. Outside-hours rules
            use WhatsApp business hours.
          </p>
          {list(
            "inbound_reply_rules",
            [
              [
                "trigger",
                "When",
                ["keyword", "outside_hours", "first_message"],
              ],
              ["keyword", "Keyword"],
              ["type", "Reply type", ["text", "template"]],
              ["value", "Text or approved template name"],
              ["language", "Template language"],
            ],
            {
              trigger: "keyword",
              keyword: "",
              type: "text",
              value: "",
              language: "en_US",
            },
          )}
          <h3 className="font-semibold">Canned replies</h3>
          {list(
            "canned_replies",
            [
              ["name", "Shortcut name"],
              ["text", "Reply"],
            ],
            { name: "", text: "" },
          )}
        </>
      )}
      {!developer && (
        <button
          disabled={busy}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg"
          onClick={save}
        >
          {busy ? "Saving…" : "Save settings"}
        </button>
      )}
      {!assignment && (
        <>
          <h3 className="font-semibold">
            {developer ? "Delivery log" : "CAPI event log"}
          </h3>
          {!logs.length ? (
            <p className="text-sm text-gray-500">No events yet.</p>
          ) : (
            logs.map((l) => (
              <div key={l.id} className="border-b py-2 text-sm">
                {l.event || l.event_name} · {l.status} ·{" "}
                {formatDateTime(l.created_at)}
                {l.error && <p className="text-red-600">{l.error}</p>}
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
