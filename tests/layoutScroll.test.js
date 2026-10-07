import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { stageBadgeClass } from '../src/utils/stageStyles.js';

const require = createRequire(import.meta.url);
test('route navigation resets the main scroll container while filter changes preserve it', async () => {
  const location = { pathname: '/dashboard', search: '' };
  const scrollContainer = { scrollTop: 420 };
  const code = require('esbuild').transformSync(readFileSync(new URL('../src/components/layout/Layout.jsx', import.meta.url), 'utf8'), { loader: 'jsx', format: 'cjs', jsx: 'automatic' }).code;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require(name) {
    if (name === 'react') return React;
    if (name === 'react/jsx-runtime') return require(name);
    if (name === 'react-router-dom') return { useLocation: () => location, Outlet: () => null };
    if (name.includes('pageTitles')) return { pageTitle: path => path.slice(1) };
    return { __esModule: true, default: () => null };
  } });
  let renderer;
  await act(async () => { renderer = create(React.createElement(module.exports.default), { createNodeMock: element => element.type === 'main' ? scrollContainer : null }); });
  assert.equal(scrollContainer.scrollTop, 0);
  scrollContainer.scrollTop = 420;
  location.pathname = '/leads';
  await act(async () => renderer.update(React.createElement(module.exports.default)));
  assert.equal(scrollContainer.scrollTop, 0);
  scrollContainer.scrollTop = 180;
  location.search = '?stage=won';
  await act(async () => renderer.update(React.createElement(module.exports.default)));
  assert.equal(scrollContainer.scrollTop, 180);
  await act(async () => renderer.unmount());
});

test('stage badges support case differences and configured stage prefixes', () => {
  assert.equal(stageBadgeClass('Won'), stageBadgeClass('won'));
  assert.equal(stageBadgeClass('Follow-up'), stageBadgeClass('follow'));
  assert.match(stageBadgeClass('Unqualified'), /bg-red-100/);
  assert.match(stageBadgeClass('Custom stage'), /bg-gray-100/);
});
