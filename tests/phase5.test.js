import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { transformSync } from "esbuild";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import { create, act } from "react-test-renderer";
import {
  pageTitle,
  documentTitle,
  PAGE_TITLES,
} from "../src/utils/pageTitles.js";
import {
  brochureCounts,
  brochureCategory,
  brochureMatches,
} from "../src/pages/brochureFilter.constants.js";
import { groupNotifications } from "../src/utils/notifications.js";
import {
  metricLeadLink,
  activityLeadLink,
} from "../src/utils/dashboardLinks.js";
import { appointmentStatus } from "../src/utils/dateTime.js";
function component(file, deps = {}) {
  const module = { exports: {} };
  vm.runInNewContext(
    transformSync(
      readFileSync(new URL("../src/" + file, import.meta.url), "utf8"),
      { loader: "jsx", format: "cjs", jsx: "automatic" },
    ).code,
    {
      module,
      exports: module.exports,
      console,
      Date,
      Map,
      Set,
      setInterval: () => 0,
      clearInterval() {},
      window: {},
      document: { addEventListener() {}, removeEventListener() {} },
      require: (n) =>
        deps[n] ||
        {
          react: React,
          "react/jsx-runtime": jsx,
          "lucide-react": new Proxy({}, { get: () => "i" }),
        }[n] || { __esModule: true, default: () => null },
    },
  );
  return module.exports.default;
}
test("every route has a header and document title, with nested route boundaries", () => {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    assert.equal(pageTitle(path + "/123"), title);
    assert.equal(documentTitle(path), title + " · CurveLead");
  }
  assert.equal(pageTitle("/leads-fake"), "CurveLead");
  assert.equal(documentTitle("/"), "CurveLead");
});
test("brochure tab counts use the same normalized category and search/stat filters as cards", () => {
  const rows = [
    { name: "One", category: "Product", views: 1 },
    { name: "Two", category: " products ", views: 2 },
    { name: "Three", category: "PRODUCTS", views: 0 },
    { name: "Four", category: null },
  ];
  for (const search of ["", "o"])
    for (const stat of ["", "viewed", "shared"]) {
      const counts = brochureCounts(rows, search, stat);
      for (const key of ["", "products", "general"])
        assert.equal(
          counts[key] || 0,
          rows.filter(
            (b) =>
              (!key || brochureCategory(b.category) === key) &&
              brochureMatches(b, search, stat),
          ).length,
        );
    }
  assert.equal(brochureCounts(rows).products, 3);
});
test("metric links preserve exact UTC exclusive range and include hidden stages", () => {
  const p = new URL(
    metricLeadLink(
      { from: "2026-08-31T18:30:00Z", to: "2026-09-30T18:30:00Z" },
      { metric: "won" },
    ),
    "http://test",
  ).searchParams;
  assert.equal(p.get("from"), "2026-08-31T18:30:00Z");
  assert.equal(p.get("metric"), "won");
  assert.equal(p.get("include_all_stages"), "1");
  assert.match(activityLeadLink("ai_replies"), /activity=ai_replies/);
});
test("dismissed and terminal followups do not become red; rescheduled active ones remain actionable", () => {
  assert.equal(
    appointmentStatus({
      dismissed_at: "2026-01-02",
      next_followup_at: "2020-01-01",
    }),
    "dismissed",
  );
  assert.equal(
    appointmentStatus({ actionable: false, next_followup_at: "2020-01-01" }),
    "dismissed",
  );
  assert.equal(
    appointmentStatus({ actionable: true, next_followup_at: "2099-01-01" }),
    "upcoming",
  );
});
test("notification opening groups by type, marks only visible IDs and refreshes exact unread count", async () => {
  const rows = [
    { id: "a", type: "new_lead", title: "Lead A", is_read: false },
    { id: "b", type: "whatsapp", title: "Reply", is_read: false },
    { id: "c", type: "new_lead", title: "Lead C", is_read: true },
  ];
  assert.equal(groupNotifications(rows)[0][1].length, 2);
  const marked = [];
  let unread = 137;
  const Bell = component("components/layout/NotificationBell.jsx", {
    "../../utils/dateTime": {
      parseTimestamp: () => null,
      formatDateTime: () => "",
    },
    "../../utils/notifications": { groupNotifications },
    "react-router-dom": { useNavigate: () => () => {} },
    "../../services/api": {
      authAPI: { getPreferences: async () => ({ data: { preferences: {} } }) },
      notificationsAPI: {
        getAll: async () => ({
          data: { notifications: rows, unreadCount: unread },
        }),
        markVisible: async (ids) => {
          marked.push(...ids);
          unread = 135;
        },
        getCount: async () => ({ data: { count: unread } }),
        markAllRead: async () => {
          unread = 0;
        },
      },
    },
  });
  let r;
  await act(async () => {
    r = create(React.createElement(Bell));
  });
  assert.ok(r.root.findByProps({ "aria-label": "Notifications, 137 unread" }));
  await act(async () =>
    r.root
      .findByProps({ "aria-label": "Notifications, 137 unread" })
      .props.onClick(),
  );
  assert.deepEqual([...marked], ["a", "b"]);
  assert.ok(r.root.findByProps({ "aria-label": "Notifications, 135 unread" }));
  assert.equal(r.root.findAllByType("section").length, 2);
  await act(async () => r.unmount());
});
test("skeleton announces loading and empty state provides an action", () => {
  const Loader = component("components/ui/PageLoader.jsx");
  const r = create(React.createElement(Loader, { message: "Loading leads" }));
  assert.equal(
    r.root.findByProps({ role: "status" }).props["aria-label"],
    "Loading leads",
  );
  r.unmount();
  const Empty = component("components/ui/EmptyState.jsx", {
    "react-router-dom": { Link: "a" },
  });
  const e = create(
    React.createElement(Empty, {
      message: "No leads",
      to: "/leads",
      actionLabel: "Add lead",
    }),
  );
  assert.equal(e.root.findByType("a").props.to, "/leads");
  e.unmount();
});
test("appointments include rows beyond 500 and propagate page failures", async () => {
  const { allAppointmentPages } = await import(
    "../src/utils/appointmentPages.js"
  );
  const calls = [];
  const rows = await allAppointmentPages(async (p) => {
    calls.push(p.page);
    return {
      data: {
        followups: Array.from({ length: p.page === 1 ? 500 : 1 }, (_, i) => ({
          id: p.page + "-" + i,
        })),
        pagination: { pages: 2 },
      },
    };
  });
  assert.equal(rows.length, 501);
  assert.deepEqual(calls, [1, 2]);
  await assert.rejects(
    () =>
      allAppointmentPages(async (p) => {
        if (p.page === 2) throw new Error("offline");
        return { data: { pagination: { pages: 2 } } };
      }),
    /offline/,
  );
});
test("grouped sidebar includes each supported route once and preserves staff roles", async () => {
  const { SIDEBAR_GROUPS, SIDEBAR_NAV_ITEMS } = await import(
    "../src/components/layout/sidebar.constants.js"
  );
  assert.deepEqual(
    SIDEBAR_GROUPS.map((g) => g.label),
    ["Sell", "Engage", "Grow", "Setup"],
  );
  const paths = SIDEBAR_GROUPS.flatMap((g) => g.paths);
  assert.equal(paths.length, new Set(paths).size);
  assert.ok(paths.includes("/automations"));
  assert.ok(!paths.includes("/market-intelligence"));
  for (const path of paths)
    assert.ok(SIDEBAR_NAV_ITEMS.find((i) => i.path === path));
  assert.ok(
    SIDEBAR_NAV_ITEMS.find((i) => i.path === "/leads").roles.includes("staff"),
  );
});
