import type { Restaurant, RestaurantFilters } from '@turku-lunch/shared';

function textFor(r: Restaurant) {
  return [r.name, r.address, r.area, r.campus, r.chain, ...(r.todayMenu?.meals.map((meal) => meal.name) ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('fi');
}

function helsinkiClock(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone:'Europe/Helsinki',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false,
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  const weekday = (parts.find((part) => part.type === 'weekday')?.value ?? '').toLowerCase();
  const dayMap: Record<string, number> = { mon:1,tue:2,wed:3,thu:4,fri:5,sat:6,sun:7 };
  return { minutes:hour * 60 + minute, day:dayMap[weekday] ?? 0 };
}

function parseMinutes(value: string) {
  const [hour = '0', minute = '0'] = value.replace('.',':').split(':');
  return Number(hour) * 60 + Number(minute);
}

const dayNumber: Record<string, number> = { ma:1,ti:2,ke:3,to:4,pe:5,la:6,su:7 };

function segmentAppliesToday(segment: string, day: number) {
  const match = segment.toLowerCase().match(/\b(ma|ti|ke|to|pe|la|su)(?:\s*[-–]\s*(ma|ti|ke|to|pe|la|su))?\b/);
  if (!match) return true;
  const start = dayNumber[match[1] ?? ''] ?? 0;
  const end = dayNumber[match[2] ?? match[1] ?? ''] ?? start;
  return start <= end ? day >= start && day <= end : day >= start || day <= end;
}

export function lunchOpenAt(r: Restaurant, date = new Date()) {
  const value = r.lunchHours || r.openingHours || '';
  const { minutes, day } = helsinkiClock(date);
  if (!day) return false;

  const hasDayLabels = (schedule: string) => /\b(ma|ti|ke|to|pe|la|su)\b/i.test(schedule);
  if (r.lunchHours && !hasDayLabels(r.lunchHours) && r.openingHours && hasDayLabels(r.openingHours)) {
    const openToday = r.openingHours.split(/[,;]+/).some((segment) => segmentAppliesToday(segment.trim(), day));
    if (!openToday) return false;
  }

  const segments = value.split(/[,;]+/).map((segment) => segment.trim()).filter(Boolean);
  for (const segment of segments) {
    if (!segmentAppliesToday(segment, day)) continue;
    const ranges = [...segment.matchAll(/(\d{1,2}(?:[.:]\d{2})?)\s*[-–]\s*(\d{1,2}(?:[.:]\d{2})?)/g)];
    if (ranges.some((range) => minutes >= parseMinutes(range[1] ?? '') && minutes <= parseMinutes(range[2] ?? ''))) return true;
  }

  // Some data sources provide only a time range without weekday labels.
  if (!/\b(ma|ti|ke|to|pe|la|su)\b/i.test(value)) {
    const ranges = [...value.matchAll(/(\d{1,2}(?:[.:]\d{2})?)\s*[-–]\s*(\d{1,2}(?:[.:]\d{2})?)/g)];
    return ranges.some((range) => minutes >= parseMinutes(range[1] ?? '') && minutes <= parseMinutes(range[2] ?? ''));
  }
  return false;
}

export function lunchOpenNow(r: Restaurant) {
  return lunchOpenAt(r, new Date());
}

export function filterRestaurants(restaurants: Restaurant[], filters: RestaurantFilters) {
  const query = filters.query.trim().toLocaleLowerCase('fi');
  return restaurants
    .filter((restaurant) => restaurant.active)
    .filter((restaurant) => !query || textFor(restaurant).includes(query))
    .filter((restaurant) => !filters.studentDiscountOnly || restaurant.studentDiscountAvailable)
    .filter((restaurant) => !filters.premiumOnly || restaurant.premiumStudentPrice != null)
    .filter((restaurant) => !filters.menuAvailable || Boolean(restaurant.todayMenu?.meals.length))
    .filter((restaurant) => filters.maxPrice == null || (restaurant.studentPrice != null && restaurant.studentPrice <= filters.maxPrice))
    .filter((restaurant) => !filters.vegan || restaurant.todayMenu?.meals.some((meal) => meal.diets.includes('VEGAN')) || restaurant.veganAvailable)
    .filter((restaurant) => !filters.vegetarian || restaurant.todayMenu?.meals.some((meal) => meal.diets.includes('VEGETARIAN') || meal.diets.includes('VEGAN')) || restaurant.vegetarianAvailable)
    .filter((restaurant) => !filters.glutenFree || restaurant.todayMenu?.meals.some((meal) => meal.diets.includes('GLUTEN_FREE')) || restaurant.glutenFreeAvailable)
    .filter((restaurant) => !filters.openNow || lunchOpenNow(restaurant))
    .filter((restaurant) => !filters.area || restaurant.area === filters.area)
    .filter((restaurant) => !filters.campus || restaurant.campus === filters.campus)
    .filter((restaurant) => !filters.chain || restaurant.chain === filters.chain)
    .sort((a, b) => filters.sort === 'price'
      ? (a.studentPrice ?? 999) - (b.studentPrice ?? 999)
      : filters.sort === 'distance'
        ? (a.distanceKm ?? 999) - (b.distanceKm ?? 999)
        : a.name.localeCompare(b.name, 'fi'));
}
