import fs from 'node:fs/promises';

const data = JSON.parse(await fs.readFile(new URL('../frontend/public/data/restaurants.json', import.meta.url), 'utf8'));
if (!Array.isArray(data) || data.length === 0) throw new Error('restaurants.json is empty or invalid');

const ids = new Set();
for (const restaurant of data) {
  if (!restaurant.id || !restaurant.name || !restaurant.latitude || !restaurant.longitude) throw new Error(`Invalid restaurant: ${restaurant?.name ?? 'unknown'}`);
  if (ids.has(restaurant.id)) throw new Error(`Duplicate restaurant id: ${restaurant.id}`);
  ids.add(restaurant.id);
  for (const meal of restaurant.todayMenu?.meals ?? []) {
    if (!meal.name || !['BASIC', 'SPECIAL', 'OTHER'].includes(meal.tier)) throw new Error(`Invalid meal tier in ${restaurant.name}: ${meal.name}`);
  }
}
console.log(`Validated ${data.length} restaurants and their menu tiers.`);
