import type { Diet, Meal } from '@turku-lunch/shared';

type SodexoCourse = {
  title_fi?: string;
  title_en?: string;
  category?: string | null;
  dietcodes?: string;
  properties?: string;
  dietcodeImages?: string[];
  price?: string;
  additionalDietInfo?: {
    allergens_fi?: string;
    allergens?: string;
  };
};

type SodexoResponse = {
  courses?: Record<string, SodexoCourse> | SodexoCourse[];
};

function parsePriceValues(value = '') {
  return [...value.matchAll(/\d+[,.]\d{1,2}/g)].map((match) => Number(match[0].replace(',', '.')));
}

function parseDiets(value = ''): Diet[] {
  const source = value.toUpperCase();
  const diets = new Set<Diet>();
  if (/(^|[,\s])G($|[,\s])/.test(source)) diets.add('GLUTEN_FREE');
  if (/(^|[,\s])L($|[,\s])/.test(source)) diets.add('LACTOSE_FREE');
  if (/(^|[,\s])M($|[,\s])/.test(source)) diets.add('DAIRY_FREE');
  if (/VEG|VEGAANI|VEGAN/.test(source)) {
    diets.add('VEGAN');
    diets.add('VEGETARIAN');
  }
  return [...diets];
}

function isMealPriceCategory(category = '') {
  return !/DESSERT|JÄLKIRUOKA|BREAKFAST|AAMIAINEN|WEIGH|KG|100\s*G/i.test(category);
}

export function parseSodexoJson(data: unknown): { meals: Meal[]; studentPrice: number | null; premiumPrice: number | null } {
  if (!data || typeof data !== 'object') return { meals: [], studentPrice: null, premiumPrice: null };

  const response = data as SodexoResponse;
  const courses = Array.isArray(response.courses)
    ? response.courses
    : Object.values(response.courses ?? {});

  const meals: Meal[] = [];
  const eligiblePrices = new Set<number>();

  for (const course of courses) {
    const name = course.title_fi?.trim() || course.title_en?.trim();
    if (!name) continue;

    const category = course.category?.trim() || 'LOUNAS';
    const values = parsePriceValues(course.price);
    const first = values[0] ?? null;
    const eligiblePrice = first != null && first <= 7.5 && isMealPriceCategory(category) ? first : null;
    if (eligiblePrice != null) eligiblePrices.add(eligiblePrice);

    const dietSource = [course.dietcodes ?? '', course.properties ?? '', category, name, ...(course.dietcodeImages ?? [])].join(',');
    const allergens = (course.additionalDietInfo?.allergens_fi ?? course.additionalDietInfo?.allergens ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    meals.push({
      name,
      category,
      studentPrice: eligiblePrice,
      diets: parseDiets(dietSource),
      allergens,
    });
  }

  const sortedPrices = [...eligiblePrices].sort((a, b) => a - b);
  const studentPrice = sortedPrices[0] ?? null;
  const premiumPrice = sortedPrices.find((price) => studentPrice != null && price > studentPrice + 0.01) ?? null;

  return { meals, studentPrice, premiumPrice };
}
