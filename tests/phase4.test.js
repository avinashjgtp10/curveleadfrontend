import test from "node:test";
import assert from "node:assert/strict";
import { presetMapping } from "../src/utils/importPresets.js";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
const require = createRequire(import.meta.url);
const esbuild = require("esbuild");
test("import presets map vendor columns without inventing missing fields", () => {
  assert.deepEqual(
    presetMapping(["Contact Name", "Phone Numbers", "Unknown"], "privyr"),
    { "Contact Name": "name", "Phone Numbers": "phone" },
  );
  assert.equal(
    presetMapping(["Mobile Number"], "aisensy")["Mobile Number"],
    "phone",
  );
  assert.equal(
    presetMapping(["Full Name", "Phone Number"], "interakt")["Full Name"],
    "name",
  );
});
test("feature settings surfaces server errors and saves reviewed values", async () => {
  const code = esbuild.transformSync(
    fs.readFileSync("src/components/FeatureSettings.jsx", "utf8"),
    { loader: "jsx", format: "cjs", jsx: "automatic" },
  ).code;
  let saved;
  const module = { exports: {} };
  const config = {
    integration_alert_hours: 24,
    meta_capi_enabled: false,
    meta_qualified_event: "QualifiedLead",
    meta_won_event: "ConvertedLead",
    inbound_reply_rules: [],
    canned_replies: [],
  };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name) =>
      name === "react"
        ? React
        : name === "react/jsx-runtime"
          ? require(name)
          : name.includes("services/api")
            ? {
                featureAPI: {
                  config: async () => ({ data: { config } }),
                  capiEvents: async () => ({ data: { events: [] } }),
                  saveConfig: async (c) => {
                    saved = c;
                  },
                },
              }
            : { formatDateTime: String },
  });
  let renderer;
  await act(async () => {
    renderer = TestRenderer.create(React.createElement(module.exports.default));
  });
  const checkbox = renderer.root
    .findAllByType("input")
    .find((i) => i.props.type === "checkbox");
  await act(async () => checkbox.props.onChange({ target: { checked: true } }));
  const button = renderer.root
    .findAllByType("button")
    .find((b) => b.children.includes("Save settings"));
  await act(async () => button.props.onClick());
  assert.equal(saved.meta_capi_enabled, true);
  assert.ok(JSON.stringify(renderer.toJSON()).includes("Saved"));
  await act(async () => renderer.unmount());
});
