import type { Menu, Restaurant } from '@turku-lunch/shared';
import { parseKarkafeHtml } from '../parsers/karkafe';
import { parseOperatorPriceHtml } from '../parsers/operatorPages';
import { parseSodexoJson } from '../parsers/sodexo';
import { parseUnicaHtml } from '../parsers/unica';

export interface Env { DB: D1Database; ADMIN_SECRET?: string; ALLOWED_ORIGIN?: string }

export function helsinkiDate(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Helsinki', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

export function supportsMenuRefresh(restaurant: Restaurant) {
  const url = restaurant.menuUrl;
  return url.includes('unica.fi/')
    || url.includes('sodexo.fi/ruokalistat/output/daily_json/')
    || url.includes('juvenes.fi/')
    || url.includes('karkafeerna.fi/');
}

function isoWeekAndDay(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  const current = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  const weekday = current.getUTCDay() || 7;
  const thursday = new Date(current);
  thursday.setUTCDate(current.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, day: weekday, year: thursday.getUTCFullYear() };
}

function resolvedMenuUrl(template: string, date: string) {
  const replaced = template.replace('{date}', date);
  if (!replaced.includes('karkafeerna.fi/')) return replaced;
  const { week, day, year } = isoWeekAndDay(date);
  const url = new URL(replaced);
  url.searchParams.set('day', String(day));
  url.searchParams.set('week', String(week).padStart(2, '0'));
  url.searchParams.set('year', String(year));
  return url.toString();
}

async function fetchParsedMenu(r: Restaurant, date: string) {
  const url = resolvedMenuUrl(r.menuUrl, date);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TurkuStudentLunchMap/1.1 (+public student lunch map)',
      'Accept-Language': 'fi-FI,fi;q=0.9',
      Accept: url.includes('daily_json') ? 'application/json' : 'text/html,application/xhtml+xml',
    },
  });
  if (!response.ok) throw new Error(`Menu source ${response.status}`);

  if (url.includes('sodexo.fi/ruokalistat/output/daily_json/')) {
    return { parsed: parseSodexoJson(await response.json()), sourceUrl: url };
  }

  const html = await response.text();
  if (url.includes('unica.fi/')) return { parsed: parseUnicaHtml(html, date), sourceUrl: url };
  if (url.includes('karkafeerna.fi/')) return { parsed: parseKarkafeHtml(html, r.name), sourceUrl: url };
  return { parsed: parseOperatorPriceHtml(html, url), sourceUrl: url };
}

export async function refreshRestaurantMenu(env: Env, r: Restaurant, date = helsinkiDate()): Promise<Menu> {
  if (!supportsMenuRefresh(r)) throw new Error('Automatic menu refresh is not supported for this source');

  const { parsed, sourceUrl } = await fetchParsedMenu(r, date);
  const fetchedAt = new Date().toISOString();

  await env.DB.prepare('DELETE FROM meals WHERE menu_id IN (SELECT id FROM menus WHERE restaurant_id=? AND date=?)')
    .bind(r.id, date).run();
  await env.DB.prepare('DELETE FROM menus WHERE restaurant_id=? AND date=?').bind(r.id, date).run();

  const menuResult = await env.DB.prepare(
    'INSERT INTO menus (restaurant_id,date,source_url,fetched_at) VALUES (?,?,?,?) RETURNING id',
  ).bind(r.id, date, sourceUrl, fetchedAt).first<{ id: number }>();
  if (!menuResult) throw new Error('Failed to create menu cache row');

  for (const meal of parsed.meals) {
    await env.DB.prepare(
      'INSERT INTO meals (menu_id,name,category,student_price,diets_json,allergens_json) VALUES (?,?,?,?,?,?)',
    ).bind(
      menuResult.id,
      meal.name,
      meal.category,
      meal.studentPrice ?? null,
      JSON.stringify(meal.diets),
      JSON.stringify(meal.allergens),
    ).run();
  }

  await env.DB.prepare(
    'UPDATE restaurants SET student_price=COALESCE(?,student_price), premium_student_price=COALESCE(?,premium_student_price), price_last_checked_at=?, updated_at=? WHERE id=?',
  ).bind(parsed.studentPrice, parsed.premiumPrice, fetchedAt, fetchedAt, r.id).run();

  return {
    restaurantId: r.id,
    date,
    sourceUrl,
    fetchedAt,
    meals: parsed.meals,
    id: menuResult.id,
  };
}
