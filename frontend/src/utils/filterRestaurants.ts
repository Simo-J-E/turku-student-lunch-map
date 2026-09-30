import type { Restaurant, RestaurantFilters } from '@turku-lunch/shared';

function textFor(r: Restaurant) {
  return [r.name, r.address, r.area, r.campus, r.chain, ...(r.todayMenu?.meals.map((m) => m.name) ?? [])]
    .filter(Boolean).join(' ').toLocaleLowerCase('fi');
}

function minutesNowHelsinki(){ const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Helsinki',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date()); const h=Number(parts.find(p=>p.type==='hour')?.value??0); const m=Number(parts.find(p=>p.type==='minute')?.value??0); return h*60+m; }
function parseMinutes(v:string){ const [h,m='0']=v.replace('.',':').split(':'); return Number(h)*60+Number(m); }
function lunchOpenNow(r:Restaurant){ const value=r.lunchHours||r.openingHours||''; const now=minutesNowHelsinki(); const ranges=[...value.matchAll(/(\d{1,2}(?:[.:]\d{2})?)\s*[-–]\s*(\d{1,2}(?:[.:]\d{2})?)/g)]; if(!ranges.length) return true; return ranges.some(x=>now>=parseMinutes(x[1]!)&&now<=parseMinutes(x[2]!)); }

export function filterRestaurants(restaurants: Restaurant[], f: RestaurantFilters) {
  const query = f.query.trim().toLocaleLowerCase('fi');
  return restaurants
    .filter((r) => r.active)
    .filter((r) => !query || textFor(r).includes(query))
    .filter((r) => !f.studentDiscountOnly || r.studentDiscountAvailable)
    .filter((r) => !f.premiumOnly || r.premiumStudentPrice != null)
    .filter((r) => f.maxPrice == null || (r.studentPrice != null && r.studentPrice <= f.maxPrice))
    .filter((r) => !f.vegan || r.todayMenu?.meals.some((m) => m.diets.includes('VEGAN')) || r.veganAvailable)
    .filter((r) => !f.vegetarian || r.todayMenu?.meals.some((m) => m.diets.includes('VEGETARIAN') || m.diets.includes('VEGAN')) || r.vegetarianAvailable)
    .filter((r) => !f.glutenFree || r.todayMenu?.meals.some((m) => m.diets.includes('GLUTEN_FREE')) || r.glutenFreeAvailable)
    .filter((r) => !f.openNow || lunchOpenNow(r))
    .filter((r) => !f.area || r.area === f.area)
    .filter((r) => !f.campus || r.campus === f.campus)
    .filter((r) => !f.chain || r.chain === f.chain)
    .sort((a, b) => f.sort === 'price'
      ? (a.studentPrice ?? 999) - (b.studentPrice ?? 999)
      : f.sort === 'distance'
        ? (a.distanceKm ?? 999) - (b.distanceKm ?? 999)
        : a.name.localeCompare(b.name, 'fi'));
}
