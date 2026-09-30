import type { Diet, Meal } from '@turku-lunch/shared';
import { htmlToText } from './unica';

const restaurantHeadings: Record<string, string[]> = {
  'Kårkafé Arken': ['Arken'],
  'Kårkafé Astra': ['Astra'],
  'Kårkafé Aurum': ['Aurum'],
  'Kårkafé Kåren': ['Kåren'],
};

const allBlockHeadings = ['Arken', 'Astra', 'Astra Solsidan', 'Aurum', 'Aurum Bistro', 'Kåren', 'Juomat'];

function parseStudentPrices(lines: string[]) {
  const prices = new Map<number, { label: string; price: number }>();
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index]?.match(/^([1-6])\s+(.+)$/);
    if (!heading) continue;
    const category = Number(heading[1]);
    const label = heading[2]?.trim() ?? '';
    const studentLine = lines.slice(index + 1, index + 5).find((line) => /^Opiskelijat\s+\d+[,.]\d{1,2}/i.test(line));
    const priceMatch = studentLine?.match(/(\d+[,.]\d{1,2})/);
    if (priceMatch?.[1]) prices.set(category, { label, price: Number(priceMatch[1].replace(',', '.')) });
  }
  return prices;
}

function parseDiets(value: string): Diet[] {
  const source = value.toUpperCase();
  const diets = new Set<Diet>();
  if (/\bVGN\b|VEGAANINEN/.test(source)) {
    diets.add('VEGAN');
    diets.add('VEGETARIAN');
  } else if (/\bV\b|VEGETAARINEN/.test(source)) {
    diets.add('VEGETARIAN');
  }
  if (/\bG\b|GLUTEENITON/.test(source)) diets.add('GLUTEN_FREE');
  if (/\bL\b|LAKTOOSITON/.test(source)) diets.add('LACTOSE_FREE');
  if (/\bM\b|MAIDOTON/.test(source)) diets.add('DAIRY_FREE');
  return [...diets];
}

function restaurantSection(lines: string[], restaurantName: string) {
  const candidates = restaurantHeadings[restaurantName] ?? [];
  const start = lines.findIndex((line) => candidates.includes(line));
  if (start < 0) return [];
  const section: string[] = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (allBlockHeadings.includes(line)) break;
    section.push(line);
  }
  return section;
}

export function parseKarkafeText(text: string, restaurantName: string) {
  const lines = text.split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const prices = parseStudentPrices(lines);
  const eligibleCategoryNumbers = new Set(
    [...prices.entries()]
      .filter(([, value]) => /Normaali lounas|Erikoislounas|Bowl/i.test(value.label))
      .map(([category]) => category),
  );
  const section = restaurantSection(lines, restaurantName);
  const meals: Meal[] = [];

  for (let index = 0; index < section.length; index += 1) {
    const line = section[index]!;
    if (/^(MA|TI|KE|TO|PE|LA|SU)\b/i.test(line) || /^Viikon lista$/i.test(line) || /^100g sisältää:/i.test(line)) continue;
    const categoryMatch = line.match(/(?:\*\s*)?([1-6])(?:\s|$)/);
    if (!categoryMatch?.[1]) continue;
    const categoryNumber = Number(categoryMatch[1]);
    if (!eligibleCategoryNumbers.has(categoryNumber)) continue;
    const categoryInfo = prices.get(categoryNumber);
    if (!categoryInfo) continue;

    const markerIndex = categoryMatch.index ?? line.length;
    const name = line.slice(0, markerIndex).replace(/\*\s*$/, '').trim();
    if (!name || /^Opiskelijat|^Jatko-opiskelijat|^Henkilökunta|^Muut/i.test(name)) continue;

    const next = section[index + 1] ?? '';
    const dietText = `${line} ${/100g sisältää:/i.test(next) ? '' : next}`;
    meals.push({
      name,
      category: categoryInfo.label,
      studentPrice: categoryInfo.price,
      diets: parseDiets(dietText),
      allergens: [],
    });
  }

  const normal = [...prices.values()].find((value) => /Normaali lounas/i.test(value.label))?.price ?? null;
  const premiumCandidates = [...prices.values()]
    .filter((value) => /Erikoislounas|Bowl/i.test(value.label))
    .map((value) => value.price)
    .sort((a, b) => a - b);

  return {
    meals: meals.slice(0, 30),
    studentPrice: normal,
    premiumPrice: premiumCandidates[0] ?? null,
  };
}

export function parseKarkafeHtml(html: string, restaurantName: string) {
  return parseKarkafeText(htmlToText(html), restaurantName);
}
