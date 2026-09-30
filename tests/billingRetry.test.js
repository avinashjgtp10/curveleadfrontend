import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { transformSync } from 'esbuild';
import { createElement } from 'react';

test('billing exposes a retry after a failed plans request and recovers', async () => {
  const state = []; let cursor = 0; const effects = []; let firstRender = true; let requests = 0;
  const react = { createElement, useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = value; }]; }, useMemo: fn => fn(), useEffect(fn) { if (firstRender) effects.push(fn); } };
  const api = { getPlans: async () => { requests++; if (requests === 1) throw new Error('offline'); return { data: { plans: [] } }; } };
  const module = { exports: {} };
  const code = transformSync(readFileSync(new URL('../src/pages/BillingPage.jsx', import.meta.url), 'utf8'), { loader: 'jsx', format: 'cjs', jsx: 'automatic' }).code;
  vm.runInNewContext(code, { module, exports: module.exports, require(name) {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => createElement(type, props), jsxs: (type, props) => createElement(type, props) };
    if (name.includes('services/api')) return { paymentAPI: api };
    if (name.includes('AuthContext')) return { useAuth: () => ({ user: {}, tenant: {}, refreshProfile() {} }) };
    if (name === 'lucide-react') return new Proxy({}, { get: () => 'span' });
    throw new Error(name);
  } });
  function render() { cursor = 0; const tree = module.exports.default(); firstRender = false; return tree; }
  function findRetry(node) {
    if (!node || typeof node !== 'object') return null;
    if (node.type === 'button' && node.props.children === 'Retry loading plans') return node;
    return [node.props?.children].flat(Infinity).map(findRetry).find(Boolean);
  }
  render(); effects.forEach(fn => fn()); await new Promise(resolve => setImmediate(resolve));
  const retry = findRetry(render()); assert.ok(retry, 'retry must be visible');
  await retry.props.onClick(); assert.equal(requests, 2); assert.equal(findRetry(render()), undefined);
});
