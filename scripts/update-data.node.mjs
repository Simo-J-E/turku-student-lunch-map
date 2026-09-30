import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyMealTier, resolveMenuUrl, supportsAutomaticMenu, toStaticRestaurant } from './update-data.mjs';

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


test('classifies basic, special and non-meal prices using Kela pricing config', () => {
  assert.equal(classifyMealTier({ category: 'LOUNAS', studentPrice: 3.10 }), 'BASIC');
  assert.equal(classifyMealTier({ category: 'BISTRO', studentPrice: 5.80 }), 'SPECIAL');
  assert.equal(classifyMealTier({ category: 'JÄLKIRUOKA', studentPrice: 1.50 }), 'OTHER');
  assert.equal(classifyMealTier({ category: 'LOUNAS', studentPrice: 12.90 }), 'OTHER');
});

test('static restaurant stores meal tiers in the single frontend data format', () => {
  const seed = {
    name: 'Testi', slug: 'testi', address: 'Testikatu 1', latitude: 60, longitude: 22,
    city: 'Turku', websiteUrl: 'https://example.test', menuUrl: 'https://example.test/menu',
    studentPrice: 3.1,
  };
  const menu = {
    restaurantId: 1, date: '2026-09-30', sourceUrl: 'https://example.test/menu', fetchedAt: '2026-09-30T06:00:00.000Z',
    meals: [
      { name: 'Perusruoka', category: 'LOUNAS', studentPrice: 3.1, diets: [], allergens: [] },
      { name: 'Deluxe', category: 'BISTRO', studentPrice: 5.8, diets: [], allergens: [] },
    ],
  };
  const result = toStaticRestaurant(seed, 0, '2026-09-30T06:00:00.000Z', menu, { studentPrice: 3.1, premiumPrice: 5.8 });
  assert.equal(result.todayMenu.meals[0].tier, 'BASIC');
  assert.equal(result.todayMenu.meals[1].tier, 'SPECIAL');
  assert.equal(result.premiumStudentPrice, 5.8);
});
