import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseUnicaHtml } from './parsers/unica.mjs';
import { parseSodexoJson } from './parsers/sodexo.mjs';
import { parseKarkafeHtml } from './parsers/karkafe.mjs';
import { parseJuvenesHtml } from './parsers/juvenes.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INPUT = path.join(ROOT, 'data', 'restaurants.json');
const OUTPUT = path.join(ROOT, 'frontend', 'public', 'data', 'restaurants.json');
const OFFLINE = process.argv.includes('--offline');

export function helsinkiDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Helsinki',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function isoWeekAndDay(date) {
  const [year, month, day] = date.split('-').map(Number);
  const current = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  const weekday = current.getUTCDay() || 7;
  const thursday = new Date(current);
  thursday.setUTCDate(current.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, day: weekday, year: thursday.getUTCFullYear() };
}

export function resolveMenuUrl(template, date) {
  const replaced = template.replace('{date}', date);
  if (!replaced.includes('karkafeerna.fi/')) return replaced;
  const { week, day, year } = isoWeekAndDay(date);
  const url = new URL(replaced);
  url.searchParams.set('day', String(day));
  url.searchParams.set('week', String(week).padStart(2, '0'));
  url.searchParams.set('year', String(year));
  return url.toString();
}

export function supportsAutomaticMenu(restaurant) {
  const url = restaurant.menuUrl ?? '';
  return url.includes('unica.fi/')
    || url.includes('sodexo.fi/ruokalistat/output/daily_json/')
    || url.includes('karkafeerna.fi/')
    || url.includes('juvenes.fi/');
}

function availabilityFromMeals(meals, diet) {
  return meals.some((meal) => meal.diets.includes(diet));
}

export function toStaticRestaurant(seed, index, generatedAt, menu = null, parsed = null) {
  const meals = menu?.meals ?? [];
  return {
    id: index + 1,
    name: seed.name,
    slug: seed.slug,
    address: seed.address,
    latitude: seed.latitude,
    longitude: seed.longitude,
    city: seed.city,
    area: seed.area ?? null,
    campus: seed.campus ?? null,
    chain: seed.chain ?? null,
    websiteUrl: seed.websiteUrl,
    menuUrl: seed.menuUrl,
    studentDiscountAvailable: true,
    studentMealType: 'KELA_SUBSIDIZED',
    studentPrice: parsed?.studentPrice ?? seed.studentPrice ?? null,
    premiumStudentPrice: parsed?.premiumPrice ?? seed.premiumStudentPrice ?? null,
    normalPrice: null,
    currency: 'EUR',
    openingHours: seed.openingHours ?? null,
    lunchHours: seed.lunchHours ?? null,
    vegetarianAvailable: seed.vegetarianAvailable === true || availabilityFromMeals(meals, 'VEGETARIAN'),
    veganAvailable: seed.veganAvailable === true || availabilityFromMeals(meals, 'VEGAN'),
    glutenFreeAvailable: seed.glutenFreeAvailable === true || availabilityFromMeals(meals, 'GLUTEN_FREE'),
    sourceUrl: seed.websiteUrl,
    priceSourceUrl: seed.priceSourceUrl ?? seed.websiteUrl,
    active: true,
    updatedAt: generatedAt,
    priceLastCheckedAt: parsed?.studentPrice != null || parsed?.premiumPrice != null ? generatedAt : null,
    todayMenu: menu,
  };
}

async function fetchMenu(seed, date) {
  const sourceUrl = resolveMenuUrl(seed.menuUrl, date);
  const response = await fetch(sourceUrl, {
    signal: AbortSignal.timeout(20000),
    headers: {
      'User-Agent': 'TurkuStudentLunchMap/2.0 (+https://github.com/Simo-J-E/turku-student-lunch-map)',
      'Accept-Language': 'fi-FI,fi;q=0.9,en;q=0.5',
      Accept: sourceUrl.includes('daily_json') ? 'application/json' : 'text/html,application/xhtml+xml',
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

  if (sourceUrl.includes('sodexo.fi/ruokalistat/output/daily_json/')) {
    return { parsed: parseSodexoJson(await response.json()), sourceUrl };
  }

  const html = await response.text();
  if (sourceUrl.includes('unica.fi/')) return { parsed: parseUnicaHtml(html, date), sourceUrl };
  if (sourceUrl.includes('karkafeerna.fi/')) return { parsed: parseKarkafeHtml(html, seed.name), sourceUrl };
  if (sourceUrl.includes('juvenes.fi/')) return { parsed: parseJuvenesHtml(html), sourceUrl };
  return { parsed: { meals: [], studentPrice: null, premiumPrice: null }, sourceUrl };
}

async function main() {
  const seeds = JSON.parse(await fs.readFile(INPUT, 'utf8'));
  const date = helsinkiDate();
  const generatedAt = new Date().toISOString();
  const restaurants = [];
  let refreshed = 0;
  let failed = 0;

  for (const [index, seed] of seeds.entries()) {
    let menu = null;
    let parsed = null;

    if (!OFFLINE && supportsAutomaticMenu(seed)) {
      try {
        const result = await fetchMenu(seed, date);
        parsed = result.parsed;
        menu = {
          restaurantId: index + 1,
          date,
          sourceUrl: result.sourceUrl,
          fetchedAt: generatedAt,
          meals: result.parsed.meals,
        };
        refreshed += 1;
        console.log(`✓ ${seed.name}: ${result.parsed.meals.length} ruokaa`);
      } catch (error) {
        failed += 1;
        console.warn(`! ${seed.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    restaurants.push(toStaticRestaurant(seed, index, generatedAt, menu, parsed));
  }

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, `${JSON.stringify(restaurants, null, 2)}\n`);
  console.log(`\nKirjoitettu ${restaurants.length} ravintolaa -> ${path.relative(ROOT, OUTPUT)}`);
  if (!OFFLINE) console.log(`Päivitetty: ${refreshed}, epäonnistui: ${failed}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
