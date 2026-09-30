import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const home = await fs.readFile('frontend/src/pages/HomePage.tsx', 'utf8');
const map = await fs.readFile('frontend/src/components/MapView.tsx', 'utf8');
const card = await fs.readFile('frontend/src/components/RestaurantCard.tsx', 'utf8');
const updater = await fs.readFile('scripts/update-data.mjs', 'utf8');
const seeds = await fs.readFile('data/restaurants.json', 'utf8');

test('map selection uses the existing sidebar instead of a popup', () => {
  assert.equal(map.includes('bindPopup'), false);
  assert.equal(home.includes('SelectedRestaurantPanel'), false);
  assert.equal(home.includes("setMobileView('list')"), true);
  assert.equal(home.includes('data-restaurant-id'), true);
  assert.equal(card.includes('data-restaurant-id={restaurant.id}'), true);
});

test('selected sidebar card expands the full menu and distinguishes meal tiers', () => {
  assert.equal(card.includes('restaurant-expanded-menu'), true);
  assert.equal(card.includes('Peruslounas'), true);
  assert.equal(card.includes('Erikoisannos / deluxe'), true);
});

test('data updater does not scrape opiskelijalounas.app', () => {
  assert.equal(updater.includes('opiskelijalounas.app'), false);
  assert.equal(seeds.includes('opiskelijalounas.app'), false);
});

test('accessibility and privacy essentials are present', async () => {
  const css = await fs.readFile('frontend/src/index.css', 'utf8');
  assert.equal(home.includes('skip-link'), true);
  assert.equal(home.includes('aria-live="polite"'), true);
  assert.equal(css.includes(':focus-visible'), true);
  assert.equal(css.includes('prefers-reduced-motion'), true);
  assert.equal(home.includes('Ei analytiikkaa, mainosseurantaa tai evästeitä.'), true);
});
