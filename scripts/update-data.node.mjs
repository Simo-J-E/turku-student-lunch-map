import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveMenuUrl, supportsAutomaticMenu, toStaticRestaurant } from './update-data.mjs';

test('resolves Sodexo date placeholder', () => {
  assert.equal(resolveMenuUrl('https://example.test/{date}', '2026-09-30'), 'https://example.test/2026-09-30');
});

test('detects supported static-build menu sources', () => {
  assert.equal(supportsAutomaticMenu({ menuUrl: 'https://www.unica.fi/ravintolat/test/' }), true);
  assert.equal(supportsAutomaticMenu({ menuUrl: 'https://example.test/menu' }), false);
});

test('creates complete frontend restaurant without backend fields missing', () => {
  const seed = {
    name: 'Testi', slug: 'testi', address: 'Testikatu 1', latitude: 60, longitude: 22,
    city: 'Turku', websiteUrl: 'https://example.test', menuUrl: 'https://example.test/menu',
    studentPrice: 3.1,
  };
  const result = toStaticRestaurant(seed, 0, '2026-09-30T06:00:00.000Z');
  assert.equal(result.id, 1);
  assert.equal(result.studentDiscountAvailable, true);
  assert.equal(result.studentPrice, 3.1);
  assert.equal(result.active, true);
  assert.equal(result.todayMenu, null);
});
