import type { Diet, Meal } from '@turku-lunch/shared';

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&auml;/gi, 'ä')
    .replace(/&ouml;/gi, 'ö')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&euro;/gi, '€')
    .replace(/&#\d+;/g, ' ');
}

export function htmlToText(html: string) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<\/(p|div|li|h\d|section|article|tr)>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

const dietCodes: Record<string, Diet> = {
  G: 'GLUTEN_FREE',
  L: 'LACTOSE_FREE',
  M: 'DAIRY_FREE',
  VEG: 'VEGAN',
};

function parseDiets(line: string): Diet[] {
  const upper = line.toUpperCase();
  const found = new Set<Diet>();
  for (const [code, diet] of Object.entries(dietCodes)) {
    if (new RegExp(`(^|[, (])${code}($|[, )])`, 'i').test(upper)) found.add(diet);
  }
  if (found.has('VEGAN')) found.add('VEGETARIAN');
  return [...found];
}

function isNoise(line: string) {
  return /^(Lounas|Lunch|Tilaa ruokalista|Tulosta|Rajaa|Näytä vain|Gluteeniton|Laktoositon|Maidoton|Vegaani|Allergeeneja|Osoite|Aukioloajat|Ota yhteyttä|Puh\.|Sähköposti)/i.test(line)
    || /^\(?[A-Z*, ]{1,30}\)?$/.test(line);
}

function dateLabel(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  return `${day}.${month}.${year}`;
}

function priceLine(line: string) {
  return /\d+[,.]\d{1,2}\s*(?:€)?\s*\/\s*\d+[,.]\d{1,2}/.test(line);
}

function prices(line: string) {
  return [...line.matchAll(/\d+[,.]\d{1,2}/g)].map((match) => Number(match[0].replace(',', '.')));
}

function categoryCanSetMealPrice(category: string) {
  return !/JÄLKIRUOKA|DESSERT|SALAATTIASEMA|WEIGH|100\s*G|AAMIAINEN|BREAKFAST/i.test(category);
}

function isPremiumCategory(category: string) {
  return /DELI|DELUXE|ERIKOIS|BISTRO|PREMIUM|BRUNCH|FUSION|GRILLI|GRILL/i.test(category);
}

export function parseUnicaText(text: string, date: string): { meals: Meal[]; studentPrice: number | null; premiumPrice: number | null } {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const label = dateLabel(date);
  const start = lines.findIndex((line) => line.includes(label));
  if (start < 0) return { meals: [], studentPrice: null, premiumPrice: null };

  const section: string[] = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (/\b\d{1,2}\.\d{1,2}\.\d{4}\b/.test(line) && !line.includes(label)) break;
    if (/^Huomioithan|^\(G\)|^Ravintola |^Tyylikäs |^Tervetuloa/i.test(line)) break;
    section.push(line);
  }

  const meals: Meal[] = [];
  let category = 'LOUNAS';
  let currentPrice: number | null = null;
  let studentPrice: number | null = null;
  let premiumPrice: number | null = null;

  for (const line of section) {
    if (/Lounas tarjolla|Lunch served/i.test(line)) continue;

    if (priceLine(line)) {
      const parsedPrices = prices(line);
      currentPrice = parsedPrices[0] ?? null;
      if (currentPrice != null && categoryCanSetMealPrice(category)) {
        if (studentPrice == null || currentPrice < studentPrice) studentPrice = currentPrice;
        if (isPremiumCategory(category) && (premiumPrice == null || currentPrice < premiumPrice)) premiumPrice = currentPrice;
      }
      continue;
    }

    const upper = line.toUpperCase();
    if (
      (upper === line && line.length < 80 && !isNoise(line))
      || (/LOUNAS|LUNCH|BISTRO|DELI|TOAST|KEITTO|SOUP|SALAATTI|SALAD|BRUNCH|JÄLKIRUOKA|DESSERT/i.test(line) && line.length < 90)
    ) {
      category = line;
      currentPrice = null;
      continue;
    }

    if (isNoise(line) || line.length < 3 || /^\d+[,.]\d+/.test(line)) continue;

    if (/^[A-Z*, ()]+$/.test(line)) {
      const last = meals.at(-1);
      if (last) last.diets = [...new Set([...last.diets, ...parseDiets(line)])];
      continue;
    }

    const diets = parseDiets(line);
    const clean = line
      .replace(/\s*\([^)]*(?:G|L|M|Veg|VS|A)[^)]*\)\s*$/i, '')
      .replace(/^\*\s*/, '')
      .trim();

    if (clean && !/^(G|L|M|Veg|VS|A)(,\s*(G|L|M|Veg|VS|A))*$/i.test(clean)) {
      meals.push({
        name: clean,
        category,
        studentPrice: categoryCanSetMealPrice(category) ? currentPrice : null,
        diets,
        allergens: [],
      });
    }
  }

  return { meals: meals.slice(0, 40), studentPrice, premiumPrice };
}

export function parseUnicaHtml(html: string, date: string) {
  return parseUnicaText(htmlToText(html), date);
}
