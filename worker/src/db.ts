import type { Diet, Menu, Restaurant, StudentMealType } from '@turku-lunch/shared';
import { VERIFIED_RESTAURANTS } from './data/verifiedRestaurants';
import type { Env } from './services/menu';

interface RestaurantRow { id:number; name:string; slug:string; address:string; latitude:number; longitude:number; city:string; area:string|null; campus:string|null; chain:string|null; website_url:string; menu_url:string; student_discount_available:number; student_meal_type:string; student_price:number|null; premium_student_price:number|null; normal_price:number|null; currency:string; opening_hours:string|null; lunch_hours:string|null; vegetarian_available:number; vegan_available:number; gluten_free_available:number; source_url:string; price_source_url:string; active:number; updated_at:string; price_last_checked_at:string|null }
interface MenuRow { id:number; restaurant_id:number; date:string; source_url:string; fetched_at:string; source_updated_at:string|null }
interface MealRow { id:number; name:string; category:string; student_price:number|null; diets_json:string; allergens_json:string }

function parseStringArray<T extends string>(value: string): T[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string') ? parsed as T[] : [];
  } catch {
    return [];
  }
}

export async function ensureSeeded(env: Env) {
  for (const r of VERIFIED_RESTAURANTS) {
    const now = new Date().toISOString();
    await env.DB.prepare(`
      INSERT INTO restaurants (
        name,slug,address,latitude,longitude,city,area,campus,chain,website_url,menu_url,
        student_discount_available,student_meal_type,student_price,premium_student_price,currency,
        opening_hours,lunch_hours,vegetarian_available,vegan_available,gluten_free_available,
        source_url,price_source_url,active,updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(slug) DO UPDATE SET
        name=excluded.name,address=excluded.address,latitude=excluded.latitude,longitude=excluded.longitude,
        city=excluded.city,area=excluded.area,campus=excluded.campus,chain=excluded.chain,
        website_url=excluded.website_url,menu_url=excluded.menu_url,
        student_price=COALESCE(restaurants.student_price,excluded.student_price),
        premium_student_price=COALESCE(restaurants.premium_student_price,excluded.premium_student_price),
        opening_hours=excluded.opening_hours,lunch_hours=excluded.lunch_hours,
        vegetarian_available=excluded.vegetarian_available,vegan_available=excluded.vegan_available,gluten_free_available=excluded.gluten_free_available,
        source_url=excluded.source_url,price_source_url=excluded.price_source_url
    `).bind(
      r.name,r.slug,r.address,r.latitude,r.longitude,r.city,r.area,r.campus,r.chain,r.websiteUrl,r.menuUrl,
      1,'KELA_SUBSIDIZED',r.studentPrice ?? null,r.premiumStudentPrice ?? null,'EUR',
      r.openingHours,r.lunchHours,0,0,0,r.websiteUrl,r.priceSourceUrl ?? r.websiteUrl,1,now,
    ).run();
  }
}

function mapRestaurant(row: RestaurantRow): Restaurant {
  return {
    id:row.id,name:row.name,slug:row.slug,address:row.address,latitude:row.latitude,longitude:row.longitude,
    city:row.city,area:row.area,campus:row.campus,chain:row.chain,websiteUrl:row.website_url,menuUrl:row.menu_url,
    studentDiscountAvailable:Boolean(row.student_discount_available),studentMealType:row.student_meal_type as StudentMealType,
    studentPrice:row.student_price,premiumStudentPrice:row.premium_student_price,normalPrice:row.normal_price,
    currency:row.currency,openingHours:row.opening_hours,lunchHours:row.lunch_hours,
    vegetarianAvailable:Boolean(row.vegetarian_available),veganAvailable:Boolean(row.vegan_available),
    glutenFreeAvailable:Boolean(row.gluten_free_available),sourceUrl:row.source_url,priceSourceUrl:row.price_source_url,
    active:Boolean(row.active),updatedAt:row.updated_at,priceLastCheckedAt:row.price_last_checked_at,todayMenu:null,
  };
}

export async function getRestaurants(env: Env, city = 'Turku') {
  const res = await env.DB.prepare('SELECT * FROM restaurants WHERE city=? ORDER BY name').bind(city).all<RestaurantRow>();
  return Promise.all(res.results.map(async (row) => {
    const restaurant = mapRestaurant(row);
    restaurant.todayMenu = await getMenu(env, restaurant.id);
    return restaurant;
  }));
}

export async function getRestaurant(env: Env, slug: string) {
  const row = await env.DB.prepare('SELECT * FROM restaurants WHERE slug=? LIMIT 1').bind(slug).first<RestaurantRow>();
  if (!row) return null;
  const restaurant = mapRestaurant(row);
  restaurant.todayMenu = await getMenu(env, restaurant.id);
  return restaurant;
}

export async function getMenu(
  env: Env,
  restaurantId: number,
  date = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Helsinki',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),
): Promise<Menu | null> {
  const row = await env.DB.prepare(
    'SELECT * FROM menus WHERE restaurant_id=? AND date=? ORDER BY fetched_at DESC LIMIT 1',
  ).bind(restaurantId,date).first<MenuRow>();
  if (!row) return null;
  const meals = await env.DB.prepare('SELECT * FROM meals WHERE menu_id=? ORDER BY id').bind(row.id).all<MealRow>();
  return {
    id:row.id,restaurantId:row.restaurant_id,date:row.date,sourceUrl:row.source_url,fetchedAt:row.fetched_at,
    sourceUpdatedAt:row.source_updated_at,
    meals:meals.results.map((meal) => ({
      id:meal.id,name:meal.name,category:meal.category,studentPrice:meal.student_price,
      diets:parseStringArray<Diet>(meal.diets_json),allergens:parseStringArray<string>(meal.allergens_json),
    })),
  };
}

export async function patchRestaurant(env: Env, id: number, patch: Record<string, unknown>) {
  const allowed: Record<string,string> = {
    active:'active',studentPrice:'student_price',premiumStudentPrice:'premium_student_price',menuUrl:'menu_url',
    websiteUrl:'website_url',openingHours:'opening_hours',lunchHours:'lunch_hours',
  };
  const entries = Object.entries(patch).filter(([key]) => allowed[key]);
  if (!entries.length) throw new Error('No editable fields');
  const sets = entries.map(([key]) => `${allowed[key]}=?`).join(',');
  const values = entries.map(([key,value]) => key === 'active' ? (value ? 1 : 0) : value);
  await env.DB.prepare(`UPDATE restaurants SET ${sets}, updated_at=? WHERE id=?`)
    .bind(...values,new Date().toISOString(),id).run();
  const row = await env.DB.prepare('SELECT * FROM restaurants WHERE id=?').bind(id).first<RestaurantRow>();
  return row ? mapRestaurant(row) : null;
}
