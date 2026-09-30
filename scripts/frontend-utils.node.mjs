import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function loadTypeScript() {
  try {
    return await import('typescript');
  } catch {
    const globalPath = path.resolve(path.dirname(process.execPath), '../lib/node_modules/typescript/lib/typescript.js');
    return import(pathToFileURL(globalPath).href);
  }
}

const tsModule = await loadTypeScript();
const ts = tsModule.default ?? tsModule;

async function loadPureTsModule(file) {
  const source = await fs.readFile(file, 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      strict: true,
    },
    reportDiagnostics: true,
    fileName: file,
  });
  const errors = (result.diagnostics ?? []).filter((item) => item.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n')).join('\n'));
  const module = { exports: {} };
  const context = vm.createContext({ module, exports: module.exports, console, Intl, Date, Math, Set, Map, Number, String, Boolean, RegExp, Object, Array });
  new vm.Script(result.outputText, { filename: file }).runInContext(context);
  return module.exports;
}

const filterModule = await loadPureTsModule('frontend/src/utils/filterRestaurants.ts');
const distanceModule = await loadPureTsModule('frontend/src/utils/distance.ts');

const defaultFilters = {
  query: '', maxPrice: null, studentDiscountOnly: true, premiumOnly: false, menuAvailable: false,
  vegan: false, vegetarian: false, glutenFree: false, openNow: false, area: '', campus: '', chain: '', sort: 'name',
};

const base = {
  id: 1, name: 'Test', slug: 'test', address: 'Turku', latitude: 60, longitude: 22, city: 'Turku', websiteUrl: 'x', menuUrl: 'x',
  studentDiscountAvailable: true, studentMealType: 'KELA_SUBSIDIZED', studentPrice: 3.1, premiumStudentPrice: null, normalPrice: null,
  currency: 'EUR', vegetarianAvailable: false, veganAvailable: false, glutenFreeAvailable: false, sourceUrl: 'x', priceSourceUrl: 'x',
  active: true, updatedAt: '2026-09-30T06:00:00.000Z', todayMenu: null,
};

test('frontend max-price filter uses <= and keeps only matching restaurants', () => {
  const result = filterModule.filterRestaurants([base, { ...base, id: 2, studentPrice: 5 }], { ...defaultFilters, maxPrice: 4 });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 1);
});

test('frontend menu search finds a meal name', () => {
  const withMenu = { ...base, id: 2, todayMenu: { restaurantId: 2, date: '2026-09-30', sourceUrl: 'x', fetchedAt: 'x', meals: [{ name: 'Kana curry', category: 'Lounas', diets: [], allergens: [] }] } };
  const result = filterModule.filterRestaurants([base, withMenu], { ...defaultFilters, query: 'kana' });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 2);
});

test('frontend vegan filter uses current menu diet metadata', () => {
  const vegan = { ...base, id: 2, todayMenu: { restaurantId: 2, date: '2026-09-30', sourceUrl: 'x', fetchedAt: 'x', meals: [{ name: 'Kasviscurry', category: 'Lounas', diets: ['VEGAN', 'VEGETARIAN'], allergens: [] }] } };
  const result = filterModule.filterRestaurants([base, vegan], { ...defaultFilters, vegan: true });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 2);
});

test('frontend lunch-open logic respects weekdays', () => {
  const restaurant = { ...base, lunchHours: 'ma-pe 10.30-14.00, la 11-13' };
  assert.equal(filterModule.lunchOpenAt(restaurant, new Date('2026-09-30T09:00:00Z')), true);
  assert.equal(filterModule.lunchOpenAt(restaurant, new Date('2026-10-04T09:00:00Z')), false);
});

test('distance utility returns zero for same point', () => {
  assert.equal(distanceModule.distanceKm(60.45, 22.27, 60.45, 22.27), 0);
});
